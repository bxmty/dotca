#!/bin/bash

# Local destroy script for dotca
# Safely destroys infrastructure created by local-deploy.sh

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SCRIPT_NAME="$(basename "$0")"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=""
FORCE=false
DRY_RUN=false
VERBOSE=false

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $*" >&2
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*" >&2
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $*" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*" >&2
}

# Print usage information
usage() {
    cat << EOF
Usage: $SCRIPT_NAME [OPTIONS] ENVIRONMENT

Destroy the dotca infrastructure for the specified environment.

ENVIRONMENT:
    staging     Destroy staging environment
    production  Destroy production environment

OPTIONS:
    -f, --force             Skip confirmation prompts
    -d, --dry-run           Show what would be destroyed without running commands
    -v, --verbose           Enable verbose output
    -h, --help             Show this help message

EXAMPLES:
    $SCRIPT_NAME staging                    # Destroy staging environment
    $SCRIPT_NAME --force production         # Force destroy production (dangerous!)
    $SCRIPT_NAME --dry-run staging          # Show what would be destroyed

WARNING:
    This script will permanently destroy infrastructure and data.
    Always backup important data before running this script.
    Production destruction requires explicit confirmation.

For more information, see docs/local-development-setup.md
EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -f|--force)
                FORCE=true
                shift
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            staging|production)
                ENVIRONMENT="$1"
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done

    # Validate environment argument
    if [[ -z "$ENVIRONMENT" ]]; then
        log_error "Environment not specified"
        usage
        exit 1
    fi

    if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
        log_error "Invalid environment: $ENVIRONMENT. Must be 'staging' or 'production'"
        exit 1
    fi
}

# Load environment variables from .env.local
load_env_vars() {
    local env_file="$PROJECT_ROOT/.env.local"

    if [[ ! -f "$env_file" ]]; then
        log_error ".env.local file not found in project root"
        exit 1
    fi

    log_info "Loading environment variables from .env.local"
    set -a
    source "$env_file"
    set +a

    # Validate required environment variables
    if [[ -z "${DO_TOKEN:-}" ]]; then
        log_error "DO_TOKEN not found in .env.local"
        exit 1
    fi

    # Set GIT_REPO_URL if not already set
    if [[ -z "${GIT_REPO_URL:-}" ]]; then
        GIT_REPO_URL=$(git remote get-url origin 2>/dev/null || echo "https://github.com/bxmty/dotca.git")
        export GIT_REPO_URL
        log_info "Set GIT_REPO_URL to: $GIT_REPO_URL"
    fi

    log_success "Environment variables loaded successfully"
}

# Validate environment and prerequisites
validate_environment() {
    log_info "Validating environment..."

    # Check if we're in the right directory
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log_error "Not in project root directory. Please run from the dotca project root."
        exit 1
    fi

    # Check required tools
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform not found. Please install Terraform."
        exit 1
    fi

    if ! command -v doctl &> /dev/null; then
        log_error "doctl not found. Please install DigitalOcean CLI."
        exit 1
    fi

    # Check DigitalOcean access
    if ! doctl account get &> /dev/null; then
        log_error "Cannot access DigitalOcean API with provided token"
        exit 1
    fi

    # Check if Terraform state exists
    local tf_dir="$PROJECT_ROOT/terraform"
    if [[ ! -d "$tf_dir/.terraform" ]]; then
        log_error "Terraform not initialized. Run deployment first or initialize manually."
        exit 1
    fi

    log_success "Environment validation passed"
}

# Execute command with optional dry-run
execute() {
    local cmd="$*"

    if [[ "$DRY_RUN" == "true" ]]; then
        echo "[DRY RUN] $cmd"
        return 0
    fi

    if [[ "$VERBOSE" == "true" ]]; then
        log_info "Executing: $cmd"
    fi

    eval "$cmd"
}

# Get current infrastructure state
get_infrastructure_state() {
    local tf_dir="$PROJECT_ROOT/terraform"
    local state_info=""

    cd "$tf_dir"

    # Try to get droplet information from Terraform state
    if command -v jq &> /dev/null && terraform state list 2>/dev/null | grep -q "digitalocean_droplet"; then
        local droplet_info
        droplet_info=$(terraform state show digitalocean_droplet.app_droplet 2>/dev/null || echo "")
        if [[ -n "$droplet_info" ]]; then
            local droplet_ip
            droplet_ip=$(echo "$droplet_info" | grep "ipv4_address" | sed 's/.*= //' | tr -d '"')
            local droplet_id
            droplet_id=$(echo "$droplet_info" | grep "id" | head -1 | sed 's/.*= //' | tr -d '"')
            local droplet_name
            droplet_name=$(echo "$droplet_info" | grep "name" | sed 's/.*= //' | tr -d '"')

            state_info="Droplet: $droplet_name (ID: $droplet_id, IP: $droplet_ip)"
        fi
    fi

    # Fallback to DigitalOcean API if Terraform state is not available
    if [[ -z "$state_info" ]]; then
        local droplets
        droplets=$(doctl compute droplet list --format Name,ID,PublicIPv4 --no-header 2>/dev/null | grep "dotca-$ENVIRONMENT" || echo "")
        if [[ -n "$droplets" ]]; then
            state_info="Found droplets via API: $droplets"
        fi
    fi

    cd "$PROJECT_ROOT"

    if [[ -n "$state_info" ]]; then
        log_info "Current infrastructure state: $state_info"
        echo "$state_info"
    else
        log_warning "Could not determine current infrastructure state"
        echo "Unknown state - proceed with caution"
    fi
}

# Show cost estimation
show_cost_warning() {
    log_warning "COST WARNING:"
    log_warning "- This will destroy DigitalOcean resources that may incur charges"
    log_warning "- Destroyed resources: Droplets, firewalls, volumes"
    log_warning "- Make sure you have backed up any important data"

    # Try to estimate costs (rough estimate)
    log_info "Estimated monthly costs for destroyed resources:"
    log_info "- Droplet (s-1vcpu-2gb): ~\$6/month"
    log_info "- Any attached volumes: Additional costs"
    log_info "- Data transfer: Variable costs"
}

# Confirm destructive operation
confirm_destruction() {
    if [[ "$FORCE" == "true" ]]; then
        log_warning "Force mode enabled - skipping confirmation"
        return 0
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        return 0
    fi

    if [[ "$ENVIRONMENT" == "production" ]]; then
        log_error "DESTRUCTION OF PRODUCTION ENVIRONMENT REQUIRES MANUAL CONFIRMATION"
        log_error "This is extremely dangerous and will cause service outage"
        echo
        log_error "To destroy production, you must:"
        log_error "1. Have explicit approval from stakeholders"
        log_error "2. Backup all production data"
        log_error "3. Use the --force flag"
        log_error "4. Type the following confirmation phrase:"
        echo
        echo "I CONFIRM PRODUCTION DESTRUCTION"
        echo
        read -p "Type the confirmation phrase: " confirmation
        if [[ "$confirmation" != "I CONFIRM PRODUCTION DESTRUCTION" ]]; then
            log_error "Confirmation failed. Production destruction cancelled."
            exit 1
        fi
    fi

    echo
    log_warning "YOU ARE ABOUT TO DESTROY THE $ENVIRONMENT ENVIRONMENT"
    show_cost_warning
    echo

    local state_info
    state_info=$(get_infrastructure_state)

    echo
    log_warning "Resources to be destroyed:"
    echo "$state_info"
    echo

    if [[ -t 0 ]]; then  # Only ask if running interactively
        read -p "Are you absolutely sure you want to destroy $ENVIRONMENT? Type 'yes' to continue: " confirm
        if [[ "$confirm" != "yes" ]]; then
            log_info "Destruction cancelled by user"
            exit 0
        fi
    else
        log_warning "Non-interactive mode - proceeding with destruction"
    fi
}

# Run Terraform destroy
run_terraform_destroy() {
    local tf_dir="$PROJECT_ROOT/terraform"

    log_info "Running Terraform destroy for $ENVIRONMENT environment"

    # Change to terraform directory
    cd "$tf_dir"

    # Plan the destruction
    log_info "Planning Terraform destruction..."
    tf_vars="-var=\"environment=$ENVIRONMENT\""
    [[ -n "$DO_TOKEN" ]] && tf_vars="$tf_vars -var=\"do_token=$DO_TOKEN\""
    [[ -n "${GIT_REPO_URL:-}" ]] && tf_vars="$tf_vars -var=\"git_repo_url=$GIT_REPO_URL\""
    execute "terraform plan -destroy $tf_vars -out=destroy-plan"

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "Dry run mode - showing destruction plan only"
        execute "terraform show destroy-plan"
        return 0
    fi

    # Execute the destruction
    log_info "Executing Terraform destroy..."
    tf_vars="-var=\"environment=$ENVIRONMENT\""
    [[ -n "$DO_TOKEN" ]] && tf_vars="$tf_vars -var=\"do_token=$DO_TOKEN\""
    [[ -n "${GIT_REPO_URL:-}" ]] && tf_vars="$tf_vars -var=\"git_repo_url=$GIT_REPO_URL\""
    execute "terraform destroy $tf_vars -auto-approve"

    log_success "Terraform destroy completed successfully"

    # Return to project root
    cd "$PROJECT_ROOT"
}

# Cleanup local files
cleanup_local_files() {
    log_info "Cleaning up local files..."

    # Remove generated inventory files
    local inventory_file="$PROJECT_ROOT/ansible/inventory/local.ini"
    if [[ -f "$inventory_file" ]]; then
        execute "rm -f \"$inventory_file\""
        log_info "Removed local inventory file"
    fi

    # Clean up Terraform lock files (if any)
    local tf_dir="$PROJECT_ROOT/terraform"
    if [[ -f "$tf_dir/.terraform.lock.hcl" ]]; then
        log_info "Terraform lock file remains (this is normal)"
    fi
}

# Main destruction function
destroy() {
    log_info "Starting destruction of $ENVIRONMENT environment"
    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "DRY RUN MODE - No actual destruction will occur"
    fi

    # Load environment variables
    load_env_vars

    # Validate environment
    validate_environment

    # Show current state and get confirmation
    confirm_destruction

    # Run Terraform destroy
    run_terraform_destroy

    # Cleanup local files
    if [[ "$DRY_RUN" == "false" ]]; then
        cleanup_local_files
    fi

    if [[ "$DRY_RUN" == "false" ]]; then
        log_success "Environment $ENVIRONMENT destroyed successfully!"
        log_warning "Remember to:"
        log_warning "- Update DNS records if needed"
        log_warning "- Notify team members of the destruction"
        log_warning "- Review any monitoring alerts"
    else
        log_success "Dry run completed successfully!"
        log_info "No resources were actually destroyed"
    fi
}

# Main function
main() {
    parse_args "$@"
    destroy
}

# Run main function with all arguments
main "$@"
