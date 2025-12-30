#!/bin/bash

# Local deployment script for dotca
# This script provides a local alternative to GitHub Actions workflows
# when CI/CD pipelines fail or for development/debugging purposes.

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
DRY_RUN=false
SKIP_VALIDATION=false
VERBOSE=false
BACKEND_TYPE="remote"  # Default to remote for safety

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

Deploy the dotca application locally to the specified environment.

ENVIRONMENT:
    staging     Deploy to staging environment
    production  Deploy to production environment

OPTIONS:
    -d, --dry-run           Show what would be executed without running commands
    -s, --skip-validation   Skip environment validation checks
    -v, --verbose           Enable verbose output
    -b, --backend TYPE      Terraform backend type: local or remote (default: remote)
    -h, --help             Show this help message

EXAMPLES:
    $SCRIPT_NAME staging                    # Deploy to staging (remote backend)
    $SCRIPT_NAME --backend local staging    # Deploy with local state
    $SCRIPT_NAME --dry-run production       # Dry run production deployment
    $SCRIPT_NAME -v staging                 # Deploy with verbose output

ENVIRONMENT SETUP:
    1. Create .env.local file with required environment variables
    2. Ensure SSH agent is running with your keys
    3. Run 'make validate' to check your setup
    4. Choose backend: 'remote' for shared state, 'local' for isolated development

For more information, see docs/local-development-setup.md
EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -s|--skip-validation)
                SKIP_VALIDATION=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -b|--backend)
                if [[ $# -lt 2 ]]; then
                    log_error "Backend type not specified"
                    usage
                    exit 1
                fi
                BACKEND_TYPE="$2"
                shift 2
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

    # Validate backend type
    if [[ "$BACKEND_TYPE" != "local" && "$BACKEND_TYPE" != "remote" ]]; then
        log_error "Invalid backend type: $BACKEND_TYPE. Must be 'local' or 'remote'"
        exit 1
    fi
}

# Load environment variables from .env.local
load_env_vars() {
    local env_file="$PROJECT_ROOT/.env.local"

    if [[ ! -f "$env_file" ]]; then
        log_error ".env.local file not found in project root"
        log_error "Please create $env_file with required environment variables"
        log_error "See docs/local-development-setup.md for details"
        exit 1
    fi

    log_info "Loading environment variables from .env.local"
    set -a
    source "$env_file"
    set +a

    # Validate required environment variables
    local required_vars=("DO_TOKEN" "BREVO_API_KEY" "STRIPE_SECRET_KEY" "STRIPE_PUBLISHABLE_KEY")
    local missing_vars=()

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done

    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "Missing required environment variables: ${missing_vars[*]}"
        log_error "Please check your .env.local file"
        exit 1
    fi

    log_success "Environment variables loaded successfully"
}

# Validate environment and prerequisites
validate_environment() {
    if [[ "$SKIP_VALIDATION" == "true" ]]; then
        log_warning "Skipping environment validation (--skip-validation)"
        return 0
    fi

    log_info "Validating environment and prerequisites..."

    # Check if we're in the right directory
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log_error "Not in project root directory. Please run from the dotca project root."
        exit 1
    fi

    # Check required tools
    local required_tools=("terraform" "ansible" "doctl" "docker" "ssh")
    local missing_tools=()

    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done

    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_error "Please install missing tools. See docs/local-development-setup.md"
        exit 1
    fi

    # Check Terraform version
    local tf_version
    tf_version=$(terraform --version | head -n1 | sed 's/Terraform v//')
    # Extract major, minor, patch versions for proper comparison
    IFS='.' read -r major minor patch <<< "$tf_version"
    if [[ "$major" -lt 1 ]] || [[ "$major" -eq 1 && "$minor" -lt 5 ]]; then
        log_error "Terraform version $tf_version is too old. Need >= 1.5.0"
        exit 1
    fi

    # Check SSH agent
    if ! ssh-add -l &> /dev/null; then
        log_error "SSH agent not running or no keys loaded"
        log_error "Please start SSH agent and add your keys:"
        log_error "  eval \"\$(ssh-agent -s)\""
        log_error "  ssh-add ~/.ssh/your_private_key"
        exit 1
    fi

    # Check DigitalOcean access
    if ! doctl account get &> /dev/null; then
        log_error "Cannot access DigitalOcean API with provided token"
        log_error "Please check your DO_TOKEN in .env.local"
        exit 1
    fi

    # Check DigitalOcean Spaces access using AWS CLI (only for remote backend)
    if [[ "$BACKEND_TYPE" == "remote" ]]; then
        if ! aws s3 ls s3://bxtf --endpoint-url https://tor1.digitaloceanspaces.com &> /dev/null; then
            log_error "Cannot access DigitalOcean Spaces bucket 'bxtf'"
            log_error "Please ensure your AWS credentials are configured for Spaces access"
            log_error "For local development, use: --backend local"
            exit 1
        fi
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

# Configure Terraform backend
configure_backend() {
    # Determine which backend to enable and which to disable
    local backend_to_enable="$BACKEND_TYPE"
    local backend_to_disable
    if [[ "$BACKEND_TYPE" == "local" ]]; then
        backend_to_disable="remote"
    else
        backend_to_disable="local"
    fi

    local enable_file="$tf_dir/backend-${backend_to_enable}.tf"
    local disable_file="$tf_dir/backend-${backend_to_disable}.tf"

    # Enable the desired backend
    if [[ -f "${enable_file}.disabled" ]]; then
        mv "${enable_file}.disabled" "$enable_file"
        log_info "Enabled $backend_to_enable backend"
    elif [[ -f "$enable_file" ]]; then
        log_info "$backend_to_enable backend already active"
    else
        log_error "Backend file $enable_file not found"
        exit 1
    fi

    # Disable the other backend
    if [[ -f "$disable_file" ]]; then
        mv "$disable_file" "${disable_file}.disabled"
        log_info "Disabled $backend_to_disable backend"
    elif [[ -f "${disable_file}.disabled" ]]; then
        log_info "$backend_to_disable backend already disabled"
    fi

    log_info "Configured $BACKEND_TYPE backend"
}

# Check if backend configuration has changed
backend_changed() {
    local active_backend_file="$tf_dir/backend-${BACKEND_TYPE}.tf"
    local inactive_backend_file="$tf_dir/backend-${BACKEND_TYPE}.tf.disabled"

    # If the desired backend file doesn't exist (active or inactive), it needs to be configured
    if [[ ! -f "$active_backend_file" ]] && [[ ! -f "$inactive_backend_file" ]]; then
        return 0  # Backend file missing, needs configuration
    fi

    # If the desired backend is not active, it needs to be configured
    if [[ ! -f "$active_backend_file" ]]; then
        return 0  # Backend not active, needs configuration
    fi

    return 1  # Backend is already correctly configured
}

# Run Terraform operations
run_terraform() {
    local tf_dir="$PROJECT_ROOT/terraform"
    local tf_vars_file="$tf_dir/${ENVIRONMENT}.tfvars"

    log_info "Running Terraform operations for $ENVIRONMENT environment (backend: $BACKEND_TYPE)"

    # Change to terraform directory
    cd "$tf_dir"

    # Configure backend if needed
    configure_backend

    # Check if this is a backend switch
    local is_backend_switch=false
    local backend_marker_file=".current_backend"
    if [[ -f "$backend_marker_file" ]]; then
        local previous_backend=$(cat "$backend_marker_file")
        if [[ "$previous_backend" != "$BACKEND_TYPE" ]]; then
            is_backend_switch=true
            log_info "Backend switch detected: $previous_backend -> $BACKEND_TYPE"
        fi
    fi

    # Initialize Terraform (only if needed or backend changed or switched)
    if [[ ! -d ".terraform" ]] || backend_changed || $is_backend_switch; then
        log_info "Initializing Terraform with $BACKEND_TYPE backend..."
        execute "terraform init -reconfigure"
        # Update the backend marker
        echo "$BACKEND_TYPE" > "$backend_marker_file"
    fi

    # Create tfvars file if it doesn't exist
    if [[ ! -f "$tf_vars_file" ]]; then
        log_warning "Terraform variables file $tf_vars_file not found"
        log_warning "Using default values. You may want to create this file for custom configuration."
    fi

    # Plan the deployment
    log_info "Planning Terraform changes..."
    execute "terraform plan -var=\"environment=$ENVIRONMENT\" -out=tfplan"

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "Dry run mode - showing plan only"
        execute "terraform show tfplan"
        return 0
    fi

    # Ask for confirmation (unless dry run)
    if [[ -t 0 ]]; then  # Only ask if running interactively
        echo
        log_warning "About to apply Terraform changes to $ENVIRONMENT environment"
        read -p "Do you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Deployment cancelled by user"
            exit 0
        fi
    fi

    # Apply the changes
    log_info "Applying Terraform changes..."
    execute "terraform apply tfplan"

    # Get droplet IP for Ansible
    DROPLET_IP=$(terraform output -raw droplet_ip 2>/dev/null || echo "")
    if [[ -z "$DROPLET_IP" ]]; then
        log_error "Failed to get droplet IP from Terraform output"
        exit 1
    fi

    log_success "Terraform operations completed successfully"
    log_info "Droplet IP: $DROPLET_IP"

    # Return to project root
    cd "$PROJECT_ROOT"
}

# Run Ansible operations
run_ansible() {
    local ansible_dir="$PROJECT_ROOT/ansible"
    local playbook="${ENVIRONMENT}-deploy.yml"
    local inventory_file="$ansible_dir/inventory/local.ini"

    log_info "Running Ansible playbook for $ENVIRONMENT environment"

    # Change to ansible directory
    cd "$ansible_dir"

    # Generate local inventory if needed
    generate_local_inventory

    # Set Ansible environment variables
    export DROPLET_IP="$DROPLET_IP"
    export ENVIRONMENT="$ENVIRONMENT"
    export DOCKER_IMAGE="${DOCKER_IMAGE:-ghcr.io/bxmty/dotca:$ENVIRONMENT}"

    # Run the playbook
    log_info "Executing Ansible playbook: $playbook"
    execute "ansible-playbook -i \"$inventory_file\" \"$playbook\""

    log_success "Ansible deployment completed successfully"

    # Return to project root
    cd "$PROJECT_ROOT"
}

# Generate local inventory file for Ansible
generate_local_inventory() {
    local inventory_file="$ansible_dir/inventory/local.ini"

    log_info "Generating local Ansible inventory"

    cat > "$inventory_file" << EOF
[digitalocean]
dotca-$ENVIRONMENT ansible_host=$DROPLET_IP

[digitalocean:vars]
ansible_user=root
ansible_python_interpreter=/usr/bin/python3
ansible_ssh_common_args='-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null'
environment=$ENVIRONMENT
project_name=dotca-nextjs
app_dir=/app
docker_image=$DOCKER_IMAGE
public_ip=$DROPLET_IP
EOF

    if [[ "$ENVIRONMENT" == "staging" ]]; then
        cat >> "$inventory_file" << EOF
staging_domain=staging.boximity.ca
EOF
    else
        cat >> "$inventory_file" << EOF
nginx_server_name=boximity.ca
EOF
    fi

    log_success "Local inventory generated: $inventory_file"
}

# Main deployment function
deploy() {
    log_info "Starting local deployment to $ENVIRONMENT environment"
    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "DRY RUN MODE - No actual changes will be made"
    fi

    # Load environment variables
    load_env_vars

    # Validate environment
    validate_environment

    # Run Terraform
    run_terraform

    # Run Ansible (skip if dry run)
    if [[ "$DRY_RUN" == "false" ]]; then
        run_ansible
    else
        log_info "Skipping Ansible execution in dry-run mode"
    fi

    if [[ "$DRY_RUN" == "false" ]]; then
        log_success "Local deployment to $ENVIRONMENT completed successfully!"
        log_info "Application should be available at: http://$DROPLET_IP"
        if [[ "$ENVIRONMENT" == "staging" ]]; then
            log_info "Staging URL: https://staging.boximity.ca"
        else
            log_info "Production URL: https://boximity.ca"
        fi
    else
        log_success "Dry run completed successfully!"
    fi
}

# Main function
main() {
    parse_args "$@"
    deploy
}

# Run main function with all arguments
main "$@"
