#!/bin/bash

# Environment validation script for dotca local deployments
# Comprehensive validation of prerequisites, tools, and access permissions

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

# Validation status
VALIDATION_PASSED=true
ISSUES_FOUND=()

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

# Add issue to the list
add_issue() {
    local issue="$1"
    ISSUES_FOUND+=("$issue")
    VALIDATION_PASSED=false
}

# Print usage information
usage() {
    cat << EOF
Usage: $SCRIPT_NAME [OPTIONS]

Validate the local environment for dotca deployments.

OPTIONS:
    -v, --verbose           Enable verbose output
    -h, --help             Show this help message

VALIDATION CHECKS:
    • Required tools and versions (terraform, ansible, doctl, docker, ssh)
    • SSH agent and key accessibility
    • Environment variables from .env.local
    • DigitalOcean API access
    • DigitalOcean Spaces access for Terraform state
    • Project directory structure

For more information, see docs/local-development-setup.md
EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done
}

# Check if we're in the right directory
check_project_root() {
    log_info "Checking project directory structure..."

    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        add_issue "Not in project root directory. Please run from the dotca project root."
        return 1
    fi

    if [[ ! -d "$PROJECT_ROOT/terraform" ]]; then
        add_issue "terraform/ directory not found"
        return 1
    fi

    if [[ ! -d "$PROJECT_ROOT/ansible" ]]; then
        add_issue "ansible/ directory not found"
        return 1
    fi

    if [[ ! -d "$PROJECT_ROOT/scripts" ]]; then
        add_issue "scripts/ directory not found"
        return 1
    fi

    log_success "Project directory structure validated"
}

# Check required tools and versions
check_required_tools() {
    log_info "Checking required tools and versions..."

    # Define required tools with version checks
    declare -A tools=(
        ["terraform"]="Terraform >= 1.5.0"
        ["ansible"]="Ansible (any recent version)"
        ["doctl"]="DigitalOcean CLI (any recent version)"
        ["docker"]="Docker (any recent version)"
        ["ssh"]="OpenSSH client (any recent version)"
        ["git"]="Git (any recent version)"
        ["python3"]="Python 3 (any recent version)"
    )

    for tool in "${!tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            add_issue "Required tool '$tool' not found. Please install ${tools[$tool]}"
            continue
        fi

        case "$tool" in
            "terraform")
                local version
                version=$(terraform --version | head -n1 | sed 's/Terraform v//')
                if ! [[ "$version" =~ ^1\.[5-9]+\.[0-9]+ ]]; then
                    add_issue "Terraform version $version is too old. Need >= 1.5.0"
                else
                    log_success "Terraform $version ✓"
                fi
                ;;
            "ansible")
                local version
                version=$(ansible --version | head -n1 | sed 's/ansible //' | cut -d' ' -f1)
                log_success "Ansible $version ✓"
                ;;
            "doctl")
                local version
                version=$(doctl version | sed 's/doctl version //')
                log_success "doctl $version ✓"
                ;;
            "docker")
                local version
                version=$(docker --version | sed 's/Docker version //' | cut -d',' -f1)
                log_success "Docker $version ✓"
                ;;
            "ssh")
                log_success "OpenSSH client ✓"
                ;;
            "git")
                local version
                version=$(git --version | sed 's/git version //')
                log_success "Git $version ✓"
                ;;
            "python3")
                local version
                version=$(python3 --version | sed 's/Python //')
                log_success "Python $version ✓"
                ;;
        esac
    done
}

# Check SSH agent and keys
check_ssh_agent() {
    log_info "Checking SSH agent and key accessibility..."

    # Check if SSH agent is running
    if ! pgrep -u "$USER" ssh-agent > /dev/null; then
        add_issue "SSH agent not running. Start with: eval \"\$(ssh-agent -s)\""
        return 1
    fi

    log_success "SSH agent is running"

    # Check for loaded SSH keys
    if ! ssh-add -l &> /dev/null; then
        add_issue "No SSH keys loaded in agent. Add keys with: ssh-add ~/.ssh/your_private_key"
        return 1
    fi

    local key_count
    key_count=$(ssh-add -l 2>/dev/null | wc -l)
    log_success "$key_count SSH key(s) loaded in agent"

    # Test SSH key functionality
    log_info "Testing SSH key functionality..."
    if ! ssh-keygen -l -f ~/.ssh/id_ed25519.pub &> /dev/null 2>&1 && \
       ! ssh-keygen -l -f ~/.ssh/id_rsa.pub &> /dev/null 2>&1; then
        log_warning "Could not find standard SSH public keys (id_ed25519.pub or id_rsa.pub)"
        log_warning "Make sure your SSH public key is available for DigitalOcean import"
    else
        log_success "SSH key files found"
    fi
}

# Load and validate environment variables
check_environment_variables() {
    log_info "Checking environment variables..."

    local env_file="$PROJECT_ROOT/.env.local"

    # Check if .env.local exists
    if [[ ! -f "$env_file" ]]; then
        add_issue ".env.local file not found. Run 'make setup' to create it."
        return 1
    fi

    log_success ".env.local file found"

    # Load environment variables
    set -a
    source "$env_file"
    set +a

    # Required environment variables
    declare -A required_vars=(
        ["DO_TOKEN"]="DigitalOcean API token"
        ["BREVO_API_KEY"]="Brevo email service API key"
        ["STRIPE_SECRET_KEY"]="Stripe payment processing secret key"
        ["STRIPE_PUBLISHABLE_KEY"]="Stripe payment processing publishable key"
    )

    # Optional but recommended variables
    declare -A optional_vars=(
        ["GA_STAGING_ID"]="Google Analytics ID for staging"
        ["GA_PRODUCTION_ID"]="Google Analytics ID for production"
    )

    # Check required variables
    for var in "${!required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            add_issue "Required environment variable '$var' not set (${required_vars[$var]})"
        else
            # Basic format validation
            case "$var" in
                "DO_TOKEN")
                    if [[ ${#DO_TOKEN} -lt 64 ]]; then
                        add_issue "DO_TOKEN appears to be invalid (too short)"
                    else
                        log_success "DO_TOKEN ✓"
                    fi
                    ;;
                "BREVO_API_KEY")
                    if [[ ${#BREVO_API_KEY} -lt 20 ]]; then
                        add_issue "BREVO_API_KEY appears to be invalid (too short)"
                    else
                        log_success "BREVO_API_KEY ✓"
                    fi
                    ;;
                "STRIPE_SECRET_KEY")
                    if [[ ! "$STRIPE_SECRET_KEY" =~ ^sk_(test|live)_ ]]; then
                        add_issue "STRIPE_SECRET_KEY does not match expected format"
                    else
                        log_success "STRIPE_SECRET_KEY ✓"
                    fi
                    ;;
                "STRIPE_PUBLISHABLE_KEY")
                    if [[ ! "$STRIPE_PUBLISHABLE_KEY" =~ ^pk_(test|live)_ ]]; then
                        add_issue "STRIPE_PUBLISHABLE_KEY does not match expected format"
                    else
                        log_success "STRIPE_PUBLISHABLE_KEY ✓"
                    fi
                    ;;
            esac
        fi
    done

    # Check optional variables
    for var in "${!optional_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log_warning "Optional variable '$var' not set (${optional_vars[$var]})"
        else
            log_success "$var ✓"
        fi
    done
}

# Check DigitalOcean API access
check_digitalocean_api() {
    log_info "Checking DigitalOcean API access..."

    if [[ -z "${DO_TOKEN:-}" ]]; then
        add_issue "DO_TOKEN not available for API testing"
        return 1
    fi

    # Test API access
    if ! doctl account get &> /dev/null; then
        add_issue "Cannot access DigitalOcean API. Check your DO_TOKEN in .env.local"
        return 1
    fi

    log_success "DigitalOcean API access confirmed"

    # Get account information
    local account_info
    account_info=$(doctl account get --format Email,Status --no-header)
    log_info "Account: $account_info"

    # Check SSH keys in DigitalOcean
    local ssh_key_count
    ssh_key_count=$(doctl compute ssh-key list --format ID --no-header 2>/dev/null | wc -l)
    if [[ "$ssh_key_count" -eq 0 ]]; then
        log_warning "No SSH keys found in DigitalOcean account"
        log_warning "Import your SSH public key: doctl compute ssh-key create my-key --public-key \"\$(cat ~/.ssh/id_ed25519.pub)\""
    else
        log_success "$ssh_key_count SSH key(s) available in DigitalOcean"
    fi

    # Check available droplets
    local droplet_count
    droplet_count=$(doctl compute droplet list --format ID --no-header 2>/dev/null | wc -l)
    log_info "$droplet_count droplet(s) currently running"
}

# Check DigitalOcean Spaces access for Terraform state
check_digitalocean_spaces() {
    log_info "Checking DigitalOcean Spaces access for Terraform state..."

    if [[ -z "${DO_TOKEN:-}" ]]; then
        add_issue "DO_TOKEN not available for Spaces testing"
        return 1
    fi

    # Test Spaces access
    if ! doctl compute spaces list &> /dev/null; then
        add_issue "Cannot access DigitalOcean Spaces. Your DO_TOKEN may not have Spaces permissions."
        add_issue "Contact your DigitalOcean administrator to grant Spaces access."
        return 1
    fi

    log_success "DigitalOcean Spaces access confirmed"

    # Check if the terraform state bucket exists
    if ! doctl compute spaces list-objects bxtf --bucket bxtf &> /dev/null; then
        add_issue "Cannot access terraform state bucket 'bxtf'"
        add_issue "The bucket may not exist or you may not have access permissions."
        add_issue "Contact your administrator to create the bucket or grant access."
        return 1
    fi

    log_success "Terraform state bucket 'bxtf' is accessible"

    # Check for existing terraform state
    local state_objects
    state_objects=$(doctl compute spaces list-objects bxtf --bucket bxtf 2>/dev/null | grep -c "terraform.tfstate" || echo 0)
    if [[ "$state_objects" -gt 0 ]]; then
        log_info "Found $state_objects terraform state file(s) in bucket"
    else
        log_warning "No terraform state files found in bucket (this is normal for new setups)"
    fi
}

# Check Terraform initialization
check_terraform_setup() {
    log_info "Checking Terraform setup..."

    local tf_dir="$PROJECT_ROOT/terraform"

    if [[ ! -f "$tf_dir/main.tf" ]]; then
        add_issue "Terraform main.tf not found"
        return 1
    fi

    if [[ ! -f "$tf_dir/variables.tf" ]]; then
        add_issue "Terraform variables.tf not found"
        return 1
    fi

    if [[ ! -f "$tf_dir/outputs.tf" ]]; then
        add_issue "Terraform outputs.tf not found"
        return 1
    fi

    log_success "Terraform configuration files found"

    # Check if Terraform is initialized
    if [[ ! -d "$tf_dir/.terraform" ]]; then
        log_warning "Terraform not initialized. Run 'terraform init' in terraform/ directory"
        log_warning "Or run 'make terraform-init' to initialize"
    else
        log_success "Terraform workspace initialized"
    fi
}

# Check Ansible setup
check_ansible_setup() {
    log_info "Checking Ansible setup..."

    local ansible_dir="$PROJECT_ROOT/ansible"

    if [[ ! -f "$ansible_dir/ansible.cfg" ]]; then
        add_issue "Ansible ansible.cfg not found"
        return 1
    fi

    if [[ ! -f "$ansible_dir/inventory.ini" ]]; then
        add_issue "Ansible inventory.ini not found"
        return 1
    fi

    # Check for playbooks
    local playbook_count
    playbook_count=$(find "$ansible_dir" -name "*-deploy.yml" | wc -l)
    if [[ "$playbook_count" -eq 0 ]]; then
        add_issue "No Ansible deployment playbooks found"
        return 1
    fi

    log_success "$playbook_count Ansible deployment playbook(s) found"

    # Test Ansible configuration
    if ansible-config dump 2>/dev/null | grep -q "inventory"; then
        log_success "Ansible configuration is valid"
    else
        log_warning "Ansible configuration may have issues"
    fi
}

# Generate validation report
generate_report() {
    echo
    echo "========================================"
    echo "ENVIRONMENT VALIDATION REPORT"
    echo "========================================"

    if [[ "$VALIDATION_PASSED" == "true" ]]; then
        echo -e "${GREEN}✅ VALIDATION PASSED${NC}"
        echo "Your environment is ready for local deployments!"
        echo
        echo "Next steps:"
        echo "• Run 'make deploy ENVIRONMENT=staging' for staging deployment"
        echo "• Run 'make deploy ENVIRONMENT=production' for production deployment"
        echo "• Run 'make status ENVIRONMENT=staging' to check current status"
    else
        echo -e "${RED}❌ VALIDATION FAILED${NC}"
        echo "Found ${#ISSUES_FOUND[@]} issue(s) that need to be resolved:"
        echo

        for i in "${!ISSUES_FOUND[@]}"; do
            echo "$((i+1)). ${ISSUES_FOUND[$i]}"
        done

        echo
        echo "For help with these issues, see docs/local-development-setup.md"
        echo "You can also run 'make setup' to set up your environment."
    fi

    echo "========================================"
}

# Main validation function
validate_environment() {
    log_info "Starting comprehensive environment validation..."
    echo

    check_project_root
    echo

    check_required_tools
    echo

    check_ssh_agent
    echo

    check_environment_variables
    echo

    check_digitalocean_api
    echo

    check_digitalocean_spaces
    echo

    check_terraform_setup
    echo

    check_ansible_setup
    echo

    generate_report
}

# Main function
main() {
    parse_args "$@"
    validate_environment

    # Exit with appropriate code
    if [[ "$VALIDATION_PASSED" == "true" ]]; then
        exit 0
    else
        exit 1
    fi
}

# Run main function with all arguments
main "$@"
