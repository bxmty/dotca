#!/bin/bash

# Script to select Terraform backend configuration
# Usage: ./select-backend.sh [local|remote]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_FILE="$SCRIPT_DIR/backend.tf"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

usage() {
    cat << EOF
Usage: $0 [local|remote]

Select Terraform backend configuration for state management.

BACKENDS:
    local    Use local terraform.tfstate file (default for development)
    remote   Use remote S3 backend (DigitalOcean Spaces) for shared state

EXAMPLES:
    $0 local     # Switch to local state
    $0 remote    # Switch to remote S3 state

WARNING:
    Switching backends requires reinitializing Terraform.
    Local state files should not be committed to version control.
EOF
}

select_backend() {
    local backend_type="$1"
    local active_backend_file="$SCRIPT_DIR/backend-${backend_type}.tf"

    # Determine which backend to disable
    local other_backend_type
    if [[ "$backend_type" == "local" ]]; then
        other_backend_type="remote"
    else
        other_backend_type="local"
    fi

    local other_backend_file="$SCRIPT_DIR/backend-${other_backend_type}.tf"

    case "$backend_type" in
        local)
            log_info "Selecting local backend configuration..."
            ;;
        remote)
            log_info "Selecting remote S3 backend configuration..."
            ;;
        *)
            log_error "Invalid backend type: $backend_type"
            usage
            exit 1
            ;;
    esac

    # Enable the desired backend by ensuring it has .tf extension
    if [[ -f "${active_backend_file}.disabled" ]]; then
        mv "${active_backend_file}.disabled" "$active_backend_file"
        log_info "Enabled $backend_type backend"
    elif [[ -f "$active_backend_file" ]]; then
        log_info "$backend_type backend already active"
    else
        log_error "Backend file $active_backend_file not found"
        exit 1
    fi

    # Disable the other backend by renaming it to .disabled
    if [[ -f "$other_backend_file" ]]; then
        mv "$other_backend_file" "${other_backend_file}.disabled"
        log_info "Disabled $other_backend_type backend"
    fi

    log_success "$backend_type backend configured"

    case "$backend_type" in
        local)
            log_warning "Remember to run 'terraform init -reconfigure' to reinitialize with local backend"
            ;;
        remote)
            log_warning "Remember to run 'terraform init -reconfigure' to reinitialize with remote backend"
            log_warning "Ensure AWS credentials are configured for DigitalOcean Spaces access"
            ;;
    esac
}

# Main function
main() {
    if [[ $# -ne 1 ]] || [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
        usage
        exit 0
    fi

    local backend_type="$1"

    # Validate backend type
    if [[ "$backend_type" != "local" && "$backend_type" != "remote" ]]; then
        log_error "Invalid backend type: $backend_type"
        usage
        exit 1
    fi

    # Check if backend files exist (active or disabled)
    if [[ ! -f "$SCRIPT_DIR/backend-local.tf" ]] && [[ ! -f "$SCRIPT_DIR/backend-local.tf.disabled" ]]; then
        log_error "backend-local.tf not found"
        exit 1
    fi

    if [[ ! -f "$SCRIPT_DIR/backend-remote.tf" ]] && [[ ! -f "$SCRIPT_DIR/backend-remote.tf.disabled" ]]; then
        log_error "backend-remote.tf not found"
        exit 1
    fi

    select_backend "$backend_type"

    log_info "Backend selection complete. Run 'terraform init' to apply changes."
}

main "$@"
