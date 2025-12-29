#!/bin/bash

# Environment Configuration Validation Script
# Validates environment configuration files and GitHub environment setup
# Usage: ./scripts/validate-environment-config.sh [environment_name]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENTS_DIR="$PROJECT_ROOT/.github/workflows/environments"

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

# Validate YAML syntax
validate_yaml() {
    local file="$1"
    local filename=$(basename "$file")

    log_info "Validating YAML syntax for $filename..."

    if ! python3 -c "import yaml; yaml.safe_load(open('$file'))" 2>/dev/null; then
        log_error "Invalid YAML syntax in $filename"
        return 1
    fi

    log_success "YAML syntax is valid for $filename"
    return 0
}

# Validate required fields in environment config
validate_environment_config() {
    local file="$1"
    local env_name="$2"
    local errors=0

    log_info "Validating environment configuration for $env_name..."

    # Check required top-level fields
    local required_fields=("name" "url" "branches" "protection_rules" "variables" "secrets")
    for field in "${required_fields[@]}"; do
        if ! grep -q "^$field:" "$file"; then
            log_error "Missing required field: $field in $env_name environment"
            ((errors++))
        fi
    done

    # Validate protection rules
    if grep -q "protection_rules:" "$file"; then
        local required_protection_fields=("required_reviewers" "required_checks")
        for field in "${required_protection_fields[@]}"; do
            if ! grep -A 10 "protection_rules:" "$file" | grep -q "  $field:"; then
                log_error "Missing required protection rule: $field in $env_name environment"
                ((errors++))
            fi
        done
    fi

    # Validate production-specific requirements
    if [ "$env_name" = "production" ]; then
        log_info "Validating production-specific requirements..."

        # Check for strict security settings
        if ! grep -q "required_reviewers: 2" "$file"; then
            log_warning "Production environment should require 2 reviewers (currently has $(grep 'required_reviewers:' "$file" | awk '{print $2}' || echo 'unknown'))"
        fi

        # Check for wait timer
        if ! grep -q "wait_timer:" "$file"; then
            log_warning "Production environment should have a wait timer"
        fi
    fi

    if [ $errors -eq 0 ]; then
        log_success "Environment configuration validation passed for $env_name"
        return 0
    else
        log_error "Environment configuration validation failed for $env_name ($errors errors)"
        return 1
    fi
}

# Check if environment exists in GitHub (would need GitHub CLI)
check_github_environment() {
    local env_name="$1"

    log_info "Checking GitHub environment setup for $env_name..."

    # This would require GitHub CLI to be installed and authenticated
    # For now, we'll just check if the configuration file exists
    if [ -f "$ENVIRONMENTS_DIR/$env_name.yml" ]; then
        log_success "Environment configuration file exists for $env_name"
        return 0
    else
        log_error "Environment configuration file missing for $env_name"
        return 1
    fi
}

# Validate secrets configuration
validate_secrets_config() {
    local file="$1"
    local env_name="$2"

    log_info "Validating secrets configuration for $env_name..."

    # Extract secrets list
    local secrets_section=$(sed -n '/^secrets:/,/^[a-z]/p' "$file" | grep '^  - ' | sed 's/  - //')

    if [ -z "$secrets_section" ]; then
        log_error "No secrets defined for $env_name environment"
        return 1
    fi

    # Check for critical secrets
    local critical_secrets=("DO_TOKEN" "SSH_PRIVATE_KEY" "GITHUB_TOKEN")
    local missing_critical=()

    for secret in "${critical_secrets[@]}"; do
        if ! echo "$secrets_section" | grep -q "^$secret$"; then
            missing_critical+=("$secret")
        fi
    done

    if [ ${#missing_critical[@]} -gt 0 ]; then
        log_error "Missing critical secrets in $env_name: ${missing_critical[*]}"
        return 1
    fi

    log_success "Secrets configuration validated for $env_name"
    return 0
}

# Main validation function
validate_environment() {
    local env_name="$1"
    local config_file="$ENVIRONMENTS_DIR/$env_name.yml"

    log_info "Starting validation for environment: $env_name"

    # Check if config file exists
    if [ ! -f "$config_file" ]; then
        log_error "Environment configuration file not found: $config_file"
        return 1
    fi

    local validation_passed=true

    # Run all validation checks
    if ! validate_yaml "$config_file"; then
        validation_passed=false
    fi

    if ! validate_environment_config "$config_file" "$env_name"; then
        validation_passed=false
    fi

    if ! validate_secrets_config "$config_file" "$env_name"; then
        validation_passed=false
    fi

    if ! check_github_environment "$env_name"; then
        validation_passed=false
    fi

    if [ "$validation_passed" = true ]; then
        log_success "✅ All validations passed for $env_name environment"
        return 0
    else
        log_error "❌ Validation failed for $env_name environment"
        return 1
    fi
}

# Main script execution
main() {
    local target_env="$1"

    echo "🔍 Environment Configuration Validation"
    echo "======================================"

    # Validate all environments if no specific environment provided
    if [ -z "$target_env" ]; then
        log_info "No environment specified, validating all environments..."

        local all_passed=true
        local environments=("development" "staging" "production")

        for env in "${environments[@]}"; do
            if [ -f "$ENVIRONMENTS_DIR/$env.yml" ]; then
                if ! validate_environment "$env"; then
                    all_passed=false
                fi
                echo
            else
                log_warning "Environment configuration not found: $env.yml"
            fi
        done

        if [ "$all_passed" = true ]; then
            log_success "🎉 All environment validations completed successfully"
            exit 0
        else
            log_error "❌ Some environment validations failed"
            exit 1
        fi
    else
        # Validate specific environment
        if validate_environment "$target_env"; then
            log_success "🎉 Environment validation completed successfully for $target_env"
            exit 0
        else
            log_error "❌ Environment validation failed for $target_env"
            exit 1
        fi
    fi
}

# Run main function with provided arguments
main "$@"
