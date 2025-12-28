#!/bin/bash

# Secret Format and Access Check Script for DotCA
# This script checks secret formats and access permissions

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
CHECKS_PASSED=0
CHECKS_FAILED=0
WARNINGS=0

check_file_permissions() {
    local file="$1"
    local expected_perms="$2"
    local description="$3"

    if [[ ! -f "$file" ]]; then
        log_error "$description file not found: $file"
        ((CHECKS_FAILED++))
        return 1
    fi

    local actual_perms
    actual_perms=$(stat -c "%a" "$file" 2>/dev/null || stat -f "%A" "$file" 2>/dev/null || echo "unknown")

    if [[ "$actual_perms" != "$expected_perms" ]]; then
        log_warning "$description file permissions incorrect: $actual_perms (expected: $expected_perms)"
        ((WARNINGS++))
    else
        log_success "$description file permissions correct: $actual_perms"
        ((CHECKS_PASSED++))
    fi
}

check_env_var_format() {
    local var_name="$1"
    local var_value="$2"
    local expected_pattern="$3"
    local description="$4"

    if [[ -z "$var_value" ]]; then
        log_error "$description environment variable $var_name is empty"
        ((CHECKS_FAILED++))
        return 1
    fi

    if [[ ! "$var_value" =~ $expected_pattern ]]; then
        log_error "$description format invalid for $var_name"
        ((CHECKS_FAILED++))
        return 1
    fi

    log_success "$description format valid for $var_name"
    ((CHECKS_PASSED++))
    return 0
}

check_github_secret_access() {
    local secret_name="$1"
    local description="$2"

    # This is a basic check - in reality you'd need GitHub API access
    log_info "Checking GitHub secret access for $secret_name..."

    if [[ -z "${!secret_name:-}" ]]; then
        log_warning "$description secret $secret_name not accessible in current environment"
        ((WARNINGS++))
    else
        log_success "$description secret $secret_name is accessible"
        ((CHECKS_PASSED++))
    fi
}

check_1password_access() {
    log_info "Checking 1Password CLI access..."

    if ! command -v op &> /dev/null; then
        log_error "1Password CLI not installed"
        ((CHECKS_FAILED++))
        return 1
    fi

    if ! op account list > /dev/null 2>&1; then
        log_error "1Password CLI not signed in"
        ((CHECKS_FAILED++))
        return 1
    fi

    log_success "1Password CLI access verified"
    ((CHECKS_PASSED++))
    return 0
}

audit_secret_access() {
    log_info "Auditing secret access permissions..."

    # Check if running as appropriate user
    if [[ "$EUID" -eq 0 ]]; then
        log_warning "Script running as root - this may not be appropriate for secret access"
        ((WARNINGS++))
    fi

    # Check if in CI environment
    if [[ -n "${CI:-}" ]] || [[ -n "${GITHUB_ACTIONS:-}" ]]; then
        log_info "Running in CI environment - secrets should be available via GitHub secrets"
    else
        log_info "Running in local environment - checking local secret access"
    fi

    # Check SSH agent
    if [[ -z "${SSH_AUTH_SOCK:-}" ]]; then
        log_warning "SSH agent not available - SSH keys may not be accessible"
        ((WARNINGS++))
    else
        log_success "SSH agent is available"
        ((CHECKS_PASSED++))
    fi

    ((CHECKS_PASSED++))
}

main() {
    log_info "🔍 Starting secret format and access check for DotCA project"
    log_info "==========================================================="

    # File permission checks
    log_info "Checking file permissions..."
    check_file_permissions "${SSH_PRIVATE_KEY_FILE:-~/.ssh/id_rsa}" "600" "SSH private key"
    check_file_permissions "${SSH_PUBLIC_KEY_FILE:-~/.ssh/id_rsa.pub}" "644" "SSH public key"
    check_file_permissions "ansible/vars/vault-vars.yml" "600" "Ansible vault"

    # Environment variable format checks
    log_info "Checking environment variable formats..."

    # Stripe keys
    check_env_var_format "STRIPE_SECRET_KEY" "${STRIPE_SECRET_KEY:-}" '^sk_(test|live)_[A-Za-z0-9]{20,}$' "Stripe secret key"
    check_env_var_format "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:-}" '^pk_(test|live)_[A-Za-z0-9]{20,}$' "Stripe publishable key"

    # Brevo key
    check_env_var_format "BREVO_API_KEY" "${BREVO_API_KEY:-}" '^[A-Za-z0-9_-]{20,}$' "Brevo API key"

    # Google Analytics IDs
    check_env_var_format "NEXT_PUBLIC_PRODUCTION_GA_ID" "${NEXT_PUBLIC_PRODUCTION_GA_ID:-}" '^G-[A-Z0-9]{10}$' "Production GA ID"
    check_env_var_format "NEXT_PUBLIC_STAGING_GA_ID" "${NEXT_PUBLIC_STAGING_GA_ID:-}" '^G-[A-Z0-9]{10}$' "Staging GA ID"

    # DigitalOcean token
    check_env_var_format "DO_TOKEN" "${DO_TOKEN:-}" '^dop_v1_[a-f0-9]{64}$' "DigitalOcean token"

    # Spaces credentials
    check_env_var_format "SPACES_ACCESS_ID" "${SPACES_ACCESS_ID:-}" '^DO00[A-Z0-9]{16,}$' "Spaces access ID"
    check_env_var_format "SPACES_SECRET_KEY" "${SPACES_SECRET_KEY:-}" '^[A-Za-z0-9+/=]{20,}$' "Spaces secret key"

    # GitHub secret access checks (these will mostly be warnings in local environment)
    log_info "Checking GitHub secret access..."
    check_github_secret_access "DO_TOKEN" "DigitalOcean"
    check_github_secret_access "SSH_PRIVATE_KEY" "SSH private key"
    check_github_secret_access "STRIPE_SECRET_KEY" "Stripe secret"
    check_github_secret_access "BREVO_API_KEY" "Brevo API"
    check_github_secret_access "ANSIBLE_VAULT_PASSWORD" "Ansible vault"

    # 1Password access
    log_info "Checking 1Password access..."
    check_1password_access

    # General audit
    audit_secret_access

    # Summary
    log_info "==========================================================="
    log_info "Secret Format and Access Check Summary:"
    echo

    if [[ $CHECKS_PASSED -gt 0 ]]; then
        log_success "Passed: $CHECKS_PASSED checks"
    fi

    if [[ $WARNINGS -gt 0 ]]; then
        log_warning "Warnings: $WARNINGS (review recommended)"
    fi

    if [[ $CHECKS_FAILED -gt 0 ]]; then
        log_error "Failed: $CHECKS_FAILED checks"
        log_error "Some secrets have format or access issues. Please review the output above."
        exit 1
    else
        if [[ $WARNINGS -gt 0 ]]; then
            log_warning "All critical checks passed, but review warnings above."
            exit 0
        else
            log_success "All secret format and access checks PASSED! ✅"
            exit 0
        fi
    fi
}

# Run main function
main "$@"
