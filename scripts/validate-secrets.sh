#!/bin/bash

# Secret Validation Script for DotCA
# This script validates the format and basic integrity of secrets used in the project

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validation counters
PASSED=0
FAILED=0

validate_ssh_key() {
    local key_file="$1"
    local key_type="$2"

    if [[ ! -f "$key_file" ]]; then
        log_error "SSH $key_type key file not found: $key_file"
        ((FAILED++))
        return 1
    fi

    if ! ssh-keygen -lf "$key_file" > /dev/null 2>&1; then
        log_error "Invalid SSH $key_type key format: $key_file"
        ((FAILED++))
        return 1
    fi

    local key_info
    key_info=$(ssh-keygen -lf "$key_file")
    log_success "SSH $key_type key valid: $key_info"
    ((PASSED++))
    return 0
}

validate_stripe_key() {
    local key="$1"
    local key_type="$2"

    if [[ -z "$key" ]]; then
        log_error "Stripe $key_type key is empty"
        ((FAILED++))
        return 1
    fi

    # Check format: sk_test_... or sk_live_... for secret keys
    # pk_test_... or pk_live_... for publishable keys
    if [[ "$key_type" == "secret" ]]; then
        if [[ ! "$key" =~ ^sk_(test|live)_[A-Za-z0-9]{20,}$ ]]; then
            log_error "Invalid Stripe secret key format"
            ((FAILED++))
            return 1
        fi
    else
        if [[ ! "$key" =~ ^pk_(test|live)_[A-Za-z0-9]{20,}$ ]]; then
            log_error "Invalid Stripe publishable key format"
            ((FAILED++))
            return 1
        fi
    fi

    log_success "Stripe $key_type key format valid"
    ((PASSED++))
    return 0
}

validate_brevo_key() {
    local key="$1"

    if [[ -z "$key" ]]; then
        log_error "Brevo API key is empty"
        ((FAILED++))
        return 1
    fi

    # Brevo API keys are typically base64-like strings
    if [[ ! "$key" =~ ^[A-Za-z0-9_-]{20,}$ ]]; then
        log_error "Invalid Brevo API key format (should be base64-like string)"
        ((FAILED++))
        return 1
    fi

    log_success "Brevo API key format valid"
    ((PASSED++))
    return 0
}

validate_ga_id() {
    local ga_id="$1"
    local environment="$2"

    if [[ -z "$ga_id" ]]; then
        log_error "Google Analytics $environment ID is empty"
        ((FAILED++))
        return 1
    fi

    # GA4 format: G-XXXXXXXXXX
    if [[ ! "$ga_id" =~ ^G-[A-Z0-9]{10}$ ]]; then
        log_error "Invalid Google Analytics $environment ID format (should be G-XXXXXXXXXX)"
        ((FAILED++))
        return 1
    fi

    log_success "Google Analytics $environment ID format valid: $ga_id"
    ((PASSED++))
    return 0
}

validate_digitalocean_token() {
    local token="$1"

    if [[ -z "$token" ]]; then
        log_error "DigitalOcean token is empty"
        ((FAILED++))
        return 1
    fi

    # DO tokens are typically prefixed with 'dop_v1_'
    if [[ ! "$token" =~ ^dop_v1_[a-f0-9]{64}$ ]]; then
        log_error "Invalid DigitalOcean token format"
        ((FAILED++))
        return 1
    fi

    log_success "DigitalOcean token format valid"
    ((PASSED++))
    return 0
}

validate_spaces_credentials() {
    local access_id="$1"
    local secret_key="$2"

    if [[ -z "$access_id" ]]; then
        log_error "Spaces access ID is empty"
        ((FAILED++))
        return 1
    fi

    if [[ -z "$secret_key" ]]; then
        log_error "Spaces secret key is empty"
        ((FAILED++))
        return 1
    fi

    # Spaces access IDs are typically in format: DO00XXXXXXX...
    if [[ ! "$access_id" =~ ^DO00[A-Z0-9]{16,}$ ]]; then
        log_error "Invalid Spaces access ID format"
        ((FAILED++))
        return 1
    fi

    # Spaces secret keys are typically base64-like
    if [[ ! "$secret_key" =~ ^[A-Za-z0-9+/=]{20,}$ ]]; then
        log_error "Invalid Spaces secret key format"
        ((FAILED++))
        return 1
    fi

    log_success "Spaces credentials format valid"
    ((PASSED++))
    return 0
}

validate_ansible_vault() {
    local vault_file="$1"
    local vault_password="$2"

    if [[ ! -f "$vault_file" ]]; then
        log_error "Ansible vault file not found: $vault_file"
        ((FAILED++))
        return 1
    fi

    if [[ -z "$vault_password" ]]; then
        log_error "Ansible vault password is empty"
        ((FAILED++))
        return 1
    fi

    # Test if vault can be decrypted
    if ! ansible-vault view "$vault_file" --vault-password-file <(echo "$vault_password") > /dev/null 2>&1; then
        log_error "Cannot decrypt Ansible vault file with provided password"
        ((FAILED++))
        return 1
    fi

    log_success "Ansible vault file can be decrypted successfully"
    ((PASSED++))
    return 0
}

# Main validation logic
main() {
    log_info "🔍 Starting secret validation for DotCA project"
    log_info "=============================================="

    # SSH Keys
    log_info "Validating SSH keys..."
    validate_ssh_key "${SSH_PRIVATE_KEY_FILE:-~/.ssh/id_rsa}" "private"
    validate_ssh_key "${SSH_PUBLIC_KEY_FILE:-~/.ssh/id_rsa.pub}" "public"

    # Stripe Keys
    log_info "Validating Stripe keys..."
    validate_stripe_key "${STRIPE_SECRET_KEY:-}" "secret"
    validate_stripe_key "${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:-}" "publishable"

    # Brevo API Key
    log_info "Validating Brevo API key..."
    validate_brevo_key "${BREVO_API_KEY:-}"

    # Google Analytics IDs
    log_info "Validating Google Analytics IDs..."
    validate_ga_id "${NEXT_PUBLIC_PRODUCTION_GA_ID:-}" "production"
    validate_ga_id "${NEXT_PUBLIC_STAGING_GA_ID:-}" "staging"
    validate_ga_id "${NEXT_PUBLIC_DEV_GA_ID:-}" "development"

    # DigitalOcean Token
    log_info "Validating DigitalOcean token..."
    validate_digitalocean_token "${DO_TOKEN:-}"

    # Spaces Credentials
    log_info "Validating Spaces credentials..."
    validate_spaces_credentials "${SPACES_ACCESS_ID:-}" "${SPACES_SECRET_KEY:-}"

    # Ansible Vault
    log_info "Validating Ansible vault..."
    validate_ansible_vault "${ANSIBLE_VAULT_FILE:-ansible/vars/vault-vars.yml}" "${ANSIBLE_VAULT_PASSWORD:-}"

    # Summary
    log_info "=============================================="
    log_info "Validation Summary:"

    if [[ $PASSED -gt 0 ]]; then
        log_success "Passed: $PASSED validations"
    fi

    if [[ $FAILED -gt 0 ]]; then
        log_error "Failed: $FAILED validations"
        log_error "Secret validation FAILED. Please fix the issues above."
        exit 1
    else
        log_success "All secret validations PASSED! 🎉"
        exit 0
    fi
}

# Run main function
main "$@"
