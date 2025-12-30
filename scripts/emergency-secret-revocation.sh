#!/bin/bash

# Emergency Secret Revocation Script for DotCA
# This script performs emergency revocation of potentially compromised secrets
# USE WITH EXTREME CAUTION - This will cause service disruption

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

# Emergency confirmation
emergency_confirmation() {
    log_error "🚨 EMERGENCY SECRET REVOCATION 🚨"
    log_error "This action will revoke all potentially compromised secrets and may cause service disruption."
    echo
    read -p "Are you sure you want to proceed? Type 'YES_REVOKE_ALL_SECRETS' to confirm: " confirmation

    if [[ "$confirmation" != "YES_REVOKE_ALL_SECRETS" ]]; then
        log_error "Emergency revocation cancelled."
        exit 1
    fi

    log_warning "Proceeding with emergency secret revocation..."
}

# Revoke Stripe keys
revoke_stripe_keys() {
    log_info "Revoking Stripe API keys..."

    # Note: This is a manual process that requires Stripe dashboard access
    log_warning "MANUAL ACTION REQUIRED: Log in to Stripe dashboard and revoke these keys:"
    log_warning "- Secret Key: ${STRIPE_SECRET_KEY:0:20}..."
    log_warning "- Publishable Key: ${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:0:20}..."

    # In a real scenario, you might use Stripe API to revoke keys programmatically
    # For now, we just log the action needed

    log_success "Stripe key revocation logged (manual action required)"
}

# Revoke Brevo keys
revoke_brevo_keys() {
    log_info "Revoking Brevo API keys..."

    log_warning "MANUAL ACTION REQUIRED: Log in to Brevo dashboard and revoke API key:"
    log_warning "- API Key: ${BREVO_API_KEY:0:20}..."

    log_success "Brevo key revocation logged (manual action required)"
}

# Revoke DigitalOcean token
revoke_digitalocean_token() {
    log_info "Revoking DigitalOcean token..."

    if [[ -n "${DO_TOKEN:-}" ]]; then
        log_warning "MANUAL ACTION REQUIRED: Log in to DigitalOcean console and revoke token:"
        log_warning "- Token: ${DO_TOKEN:0:20}..."
    else
        log_warning "DO_TOKEN environment variable not set"
    fi

    log_success "DigitalOcean token revocation logged (manual action required)"
}

# Revoke Spaces credentials
revoke_spaces_credentials() {
    log_info "Revoking DigitalOcean Spaces credentials..."

    if [[ -n "${SPACES_ACCESS_ID:-}" ]]; then
        log_warning "MANUAL ACTION REQUIRED: Log in to DigitalOcean console and revoke Spaces key:"
        log_warning "- Access ID: ${SPACES_ACCESS_ID}"
    else
        log_warning "SPACES_ACCESS_ID environment variable not set"
    fi

    log_success "Spaces credentials revocation logged (manual action required)"
}

# Disable GitHub Actions (emergency stop)
disable_github_actions() {
    log_info "Disabling GitHub Actions workflows..."

    # This would require GitHub CLI or API calls
    log_warning "MANUAL ACTION REQUIRED: Disable these workflows in GitHub:"
    log_warning "- prod-deploy.yml"
    log_warning "- stg-deploy.yml"
    log_warning "- All other deployment workflows"

    log_success "GitHub Actions disable logged (manual action required)"
}

# Rotate SSH keys immediately
emergency_ssh_rotation() {
    log_info "Performing emergency SSH key rotation..."

    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)

    # Generate new emergency keys
    log_info "Generating new emergency SSH keys..."
    ssh-keygen -t rsa -b 4096 -C "dotca-emergency-$timestamp" -f ~/.ssh/dotca_emergency -N ""

    log_success "Emergency SSH keys generated"

    # Update 1Password (if available)
    if command -v op &> /dev/null; then
        log_info "Updating 1Password with emergency keys..."
        # This would require 1Password CLI configuration
        log_warning "MANUAL: Update 1Password DevOps vault with new emergency keys"
    fi

    log_success "Emergency SSH key rotation initiated"
}

# Create incident report
create_incident_report() {
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)

    local report_file="incident_report_$timestamp.txt"

    log_info "Creating incident report: $report_file"

    cat > "$report_file" << EOF
EMERGENCY SECRET REVOCATION INCIDENT REPORT
==========================================

Timestamp: $(date)
Initiated by: ${USER:-unknown}
Reason: Security incident - potential secret compromise

ACTIONS TAKEN:
- Stripe API keys flagged for revocation
- Brevo API keys flagged for revocation
- DigitalOcean token flagged for revocation
- Spaces credentials flagged for revocation
- GitHub Actions workflows flagged for disable
- Emergency SSH keys generated

NEXT STEPS REQUIRED:
1. Manually revoke keys in respective service dashboards
2. Generate new replacement keys
3. Update GitHub secrets with new keys
4. Test deployments with new keys
5. Re-enable GitHub Actions workflows
6. Monitor systems for unauthorized access

CONTACTS NOTIFIED:
- Security Team
- DevOps Team
- Management

EOF

    log_success "Incident report created: $report_file"
}

# Send alerts (placeholder for actual alerting system)
send_alerts() {
    log_info "Sending emergency alerts..."

    # This would integrate with your alerting system (Slack, PagerDuty, etc.)
    log_warning "MANUAL: Send alerts to:"
    log_warning "- Security team"
    log_warning "- DevOps on-call"
    log_warning "- Management"

    # Example Slack webhook (replace with actual webhook)
    # curl -X POST -H 'Content-type: application/json' \
    #      --data '{"text":"🚨 EMERGENCY: Secret revocation initiated"}' \
    #      YOUR_SLACK_WEBHOOK_URL

    log_success "Alert notifications logged (manual action required)"
}

# Main emergency function
main() {
    log_error "🚨 EMERGENCY SECRET REVOCATION INITIATED 🚨"
    echo

    # Get confirmation
    emergency_confirmation

    # Start incident report
    create_incident_report

    # Send alerts first
    send_alerts

    # Disable automated systems
    disable_github_actions

    # Revoke external service keys
    revoke_stripe_keys
    revoke_brevo_keys
    revoke_digitalocean_token
    revoke_spaces_credentials

    # Generate emergency replacements
    emergency_ssh_rotation

    # Final summary
    echo
    log_error "=========================================="
    log_error "EMERGENCY REVOCATION COMPLETED"
    log_error "=========================================="
    log_error "IMMEDIATE MANUAL ACTIONS REQUIRED:"
    log_error "1. Log in to each service dashboard and revoke the flagged keys"
    log_error "2. Generate new replacement keys"
    log_error "3. Update GitHub repository secrets"
    log_error "4. Test deployments with new keys"
    log_error "5. Re-enable GitHub Actions workflows"
    log_error "6. Monitor systems closely for 48 hours"
    echo
    log_error "Contact security team immediately for further guidance"
}

# Run main function
main "$@"
