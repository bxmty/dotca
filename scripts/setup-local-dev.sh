#!/bin/bash

# Local development setup script for dotca
# Sets up the local development environment with required tools and configurations

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
VERBOSE=false
SKIP_DEPS=false

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
Usage: $SCRIPT_NAME [OPTIONS]

Set up the local development environment for dotca deployments.

OPTIONS:
    -v, --verbose           Enable verbose output
    -s, --skip-deps         Skip dependency installation checks
    -h, --help             Show this help message

EXAMPLES:
    $SCRIPT_NAME                    # Setup with default options
    $SCRIPT_NAME --verbose          # Setup with verbose output
    $SCRIPT_NAME --skip-deps        # Skip dependency checks

This script will:
1. Check and install required dependencies
2. Set up SSH agent and key configuration
3. Create .env.local template
4. Validate DigitalOcean access
5. Test Terraform and Ansible connectivity

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
            -s|--skip-deps)
                SKIP_DEPS=true
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
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log_error "Not in project root directory. Please run from the dotca project root."
        exit 1
    fi
    log_success "Project root validated"
}

# Check and install required tools
check_dependencies() {
    if [[ "$SKIP_DEPS" == "true" ]]; then
        log_warning "Skipping dependency checks (--skip-deps)"
        return 0
    fi

    log_info "Checking required dependencies..."

    # Define required tools with installation commands
    declare -A tools=(
        ["terraform"]="Terraform (https://www.terraform.io/downloads)"
        ["ansible"]="Ansible (pip install ansible)"
        ["doctl"]="DigitalOcean CLI (https://docs.digitalocean.com/reference/doctl/how-to/install/)"
        ["docker"]="Docker (https://docs.docker.com/get-docker/)"
        ["ssh"]="OpenSSH client (usually pre-installed)"
        ["git"]="Git (https://git-scm.com/downloads)"
    )

    local missing_tools=()

    for tool in "${!tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
            log_warning "Missing: $tool - ${tools[$tool]}"
        else
            log_success "Found: $tool"
        fi
    done

    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_error "Please install the missing tools and run this script again."
        log_error "See docs/local-development-setup.md for detailed installation instructions."
        exit 1
    fi

    # Check Terraform version
    local tf_version
    tf_version=$(terraform --version | head -n1 | sed 's/Terraform v//')
    if [[ "$VERBOSE" == "true" ]]; then
        log_info "Terraform version: $tf_version"
    fi
    if ! [[ "$tf_version" =~ ^1\.[5-9]+\.[0-9]+ ]]; then
        log_error "Terraform version $tf_version is too old. Need >= 1.5.0"
        exit 1
    fi

    log_success "All dependencies satisfied"
}

# Setup SSH agent and keys
setup_ssh() {
    log_info "Setting up SSH agent and keys..."

    # Check if SSH agent is running
    if ! pgrep -u "$USER" ssh-agent > /dev/null; then
        log_info "Starting SSH agent..."
        eval "$(ssh-agent -s)"
        log_success "SSH agent started"
    else
        log_success "SSH agent already running"
    fi

    # Check for SSH keys
    local ssh_keys
    ssh_keys=$(find ~/.ssh -name "id_*" -type f ! -name "*.pub" 2>/dev/null | wc -l)

    if [[ "$ssh_keys" -eq 0 ]]; then
        log_warning "No SSH private keys found in ~/.ssh/"
        log_warning "You will need to:"
        log_warning "1. Generate an SSH key: ssh-keygen -t ed25519 -C 'your-email@example.com'"
        log_warning "2. Add it to DigitalOcean: doctl compute ssh-key create my-key --public-key \"\$(cat ~/.ssh/id_ed25519.pub)\""
        log_warning "3. Add it to SSH agent: ssh-add ~/.ssh/id_ed25519"
    else
        log_info "Found $ssh_keys SSH private key(s)"

        # Try to add keys to agent
        if ssh-add -l &> /dev/null; then
            log_success "SSH keys already loaded in agent"
        else
            log_info "Attempting to add SSH keys to agent..."
            ssh-add ~/.ssh/id_* 2>/dev/null || true

            if ssh-add -l &> /dev/null; then
                log_success "SSH keys added to agent"
            else
                log_warning "Could not add SSH keys to agent automatically"
                log_warning "You may need to run: ssh-add ~/.ssh/your_private_key"
            fi
        fi
    fi

    log_success "SSH setup completed"
}

# Create .env.local template
create_env_template() {
    local env_file="$PROJECT_ROOT/.env.local"

    if [[ -f "$env_file" ]]; then
        log_info ".env.local already exists"
        read -p "Overwrite existing .env.local? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Keeping existing .env.local"
            return 0
        fi
    fi

    log_info "Creating .env.local template..."

    cat > "$env_file" << 'EOF'
# DigitalOcean API Access
# Get your token from: https://cloud.digitalocean.com/account/api/tokens
DO_TOKEN=your_digitalocean_api_token_here

# SSH Configuration (uses SSH agent)
# Optional: specify if you have multiple SSH keys
SSH_KEY_FINGERPRINT=

# Application Secrets
# Get from your secret management system
BREVO_API_KEY=your_brevo_api_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
GA_STAGING_ID=G-XXXXXXXXXX
GA_PRODUCTION_ID=G-XXXXXXXXXX

# Optional: Override defaults
# DOCKER_IMAGE=ghcr.io/yourusername/dotca:custom-tag
# ANSIBLE_VAULT_PASSWORD=your_vault_password_if_using_encrypted_vars
EOF

    log_success "Created .env.local template"
    log_warning "IMPORTANT: Edit .env.local with your actual values before deploying!"
    log_info "Required: DO_TOKEN, BREVO_API_KEY, STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY"
}

# Test DigitalOcean access
test_digitalocean_access() {
    log_info "Testing DigitalOcean API access..."

    # Load environment variables if .env.local exists
    local env_file="$PROJECT_ROOT/.env.local"
    if [[ -f "$env_file" ]]; then
        set -a
        source "$env_file"
        set +a
    fi

    if [[ -z "${DO_TOKEN:-}" ]]; then
        log_warning "DO_TOKEN not set in .env.local - skipping DigitalOcean tests"
        return 0
    fi

    # Test API access
    if ! doctl account get &> /dev/null; then
        log_error "Cannot access DigitalOcean API with provided DO_TOKEN"
        log_error "Please check your token in .env.local"
        return 1
    fi
    log_success "DigitalOcean API access confirmed"

    # Test Spaces access
    if ! doctl compute spaces list-objects bxtf --bucket bxtf &> /dev/null; then
        log_error "Cannot access DigitalOcean Spaces bucket 'bxtf'"
        log_error "Your DO_TOKEN may not have Spaces access permissions"
        log_error "Contact your administrator to grant Spaces access"
        return 1
    fi
    log_success "DigitalOcean Spaces access confirmed"

    # Check SSH keys
    local ssh_keys
    ssh_keys=$(doctl compute ssh-key list --format Name,Fingerprint --no-header 2>/dev/null | wc -l)
    log_info "Found $ssh_keys SSH key(s) in DigitalOcean account"

    if [[ "$ssh_keys" -eq 0 ]]; then
        log_warning "No SSH keys found in DigitalOcean account"
        log_warning "You will need to add your SSH public key:"
        log_warning "doctl compute ssh-key create my-key --public-key \"\$(cat ~/.ssh/id_ed25519.pub)\""
    fi

    log_success "DigitalOcean access tests completed"
}

# Test Terraform and Ansible connectivity
test_infrastructure_tools() {
    log_info "Testing infrastructure tools..."

    # Test Terraform
    if command -v terraform &> /dev/null; then
        local tf_version
        tf_version=$(terraform --version | head -n1 | sed 's/Terraform v//')
        log_success "Terraform $tf_version ready"
    fi

    # Test Ansible
    if command -v ansible &> /dev/null; then
        local ansible_version
        ansible_version=$(ansible --version | head -n1 | sed 's/ansible //' | cut -d' ' -f1)
        log_success "Ansible $ansible_version ready"
    fi

    # Test doctl
    if command -v doctl &> /dev/null; then
        local doctl_version
        doctl_version=$(doctl version | sed 's/doctl version //')
        log_success "doctl $doctl_version ready"
    fi

    log_success "Infrastructure tools tests completed"
}

# Create local Ansible configuration
setup_ansible_config() {
    local ansible_config="$PROJECT_ROOT/ansible/ansible-local.cfg"

    log_info "Setting up local Ansible configuration..."

    cat > "$ansible_config" << EOF
[defaults]
inventory = inventory/local.ini
host_key_checking = False
stdout_callback = ansible.builtin.default
result_format = yaml
deprecation_warnings = False
remote_user = root
timeout = 60
forks = 20
fact_caching = jsonfile
fact_caching_connection = /tmp/ansible_facts_cache
fact_caching_timeout = 7200

# SECURITY: Disable logging to prevent secrets from being written to disk
# log_path = ./ansible.log

# SECURITY: Prevent sensitive data from appearing in logs
display_args_to_stdout = False
display_skipped_hosts = False
error_on_undefined_vars = True
hide_sensitive_log = True

[ssh_connection]
pipelining = True
control_path = /tmp/ansible-ssh-%h-%p-%r
ssh_args = -o ControlMaster=auto -o ControlPersist=60s -o ForwardAgent=yes
transfer_method = piped

# SECURITY: Disable SSH command logging
log_ssh_args = False
EOF

    log_success "Created local Ansible configuration: ansible-local.cfg"
    log_info "This config uses SSH agent for authentication"
}

# Print summary and next steps
print_summary() {
    echo
    log_success "Local development setup completed!"
    echo
    log_info "Next steps:"
    echo "1. Edit .env.local with your actual values"
    echo "2. Run 'make validate' to test your setup"
    echo "3. Try a deployment: 'make deploy ENVIRONMENT=staging DRY_RUN=true'"
    echo
    log_info "Available commands:"
    echo "- make setup     : Run this setup script"
    echo "- make validate  : Validate environment"
    echo "- make deploy    : Deploy to environment"
    echo "- make destroy   : Destroy environment"
    echo "- make help      : Show all available commands"
    echo
    log_info "Documentation: docs/local-development-setup.md"
}

# Main setup function
setup() {
    log_info "Starting local development environment setup..."

    check_project_root
    check_dependencies
    setup_ssh
    create_env_template
    test_digitalocean_access
    test_infrastructure_tools
    setup_ansible_config
    print_summary

    log_success "Setup completed successfully!"
}

# Main function
main() {
    parse_args "$@"
    setup
}

# Run main function with all arguments
main "$@"
