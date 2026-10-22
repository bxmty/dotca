#!/usr/bin/env bash
# Usage: check-deploy-secrets.sh <environment>
#
# The deploy gate: checks the secrets .github/actions/deploy/action.yml passes
# to Terraform and Ansible (read from the environment) before anything is
# provisioned. This file is the one place each secret's tier is decided:
#
#   require          missing fails the deploy
#   warn_if_missing  missing only warns; the feature degrades on its own
#   delegate         a dedicated script holds a rule too specific for the above
#
# Every secret the app reads must be named here (scripts/check-secret-wiring.sh
# enforces it), so adding one forces a tier decision. Reports every missing
# secret before exiting 1. Never prints a value.
set -euo pipefail

environment="${1:-}"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
failed=0

report() {
    local level="$1" message="$2"
    if [[ "${GITHUB_ACTIONS:-}" == "true" ]]; then
        echo "::${level}::${message}" >&2
    else
        echo "${level^}: ${message}" >&2
    fi
}

require() {
    local name="$1" consequence="${2:-}"
    if [[ -z "${!name:-}" ]]; then
        report error "${name} environment variable is required${consequence:+; ${consequence}}"
        failed=1
    fi
}

warn_if_missing() {
    local name="$1" consequence="$2"
    if [[ -z "${!name:-}" ]]; then
        report warning "${name} is not set; ${consequence}"
    fi
}

delegate() {
    local _name="$1" script="$2"
    bash "$script_dir/$script" "$environment" || failed=1
}

require DO_TOKEN
require SSH_PRIVATE_KEY
require STRIPE_SECRET_KEY
require STRIPE_WEBHOOK_SECRET
require GA4_MP_API_SECRET
require RESEND_API_KEY
require RESEND_FROM_EMAIL
require WEBMASTER_EMAIL

# Without them the app reads Syncro as unreachable and website leads silently
# fall back to the webmaster email only (#572).
require SYNCRO_SUBDOMAIN "website leads would not reach Syncro"
require SYNCRO_API_KEY "website leads would not reach Syncro"

# Required for production only and length-checked; staging warns (#604).
delegate LEAD_MAGNET_SIGNING_SECRET check-lead-magnet-secret.sh

# /install answers 503 until the Free-tier Syncro installer link exists (#643).
warn_if_missing SYNCRO_FREE_INSTALLER_URL "/install will respond 503"

# The brief opt-in is best-effort and the Resend segment/topic may not exist
# yet (#598).
warn_if_missing RESEND_MONTHLY_BRIEF_SEGMENT_ID "brief opt-ins will skip Resend"
warn_if_missing RESEND_MONTHLY_BRIEF_TOPIC_ID "brief opt-ins will skip Resend"

# Opt-ins still subscribe without it, they just don't start the automation (#647).
warn_if_missing RESEND_OPTIN_EVENT "brief opt-ins will send no lead.opted_in event"

# Submissions still succeed without them, they just send no confirmation (#646).
warn_if_missing RESEND_TEMPLATE_CONTACT_CONFIRMATION "submissions will send no confirmation email"
warn_if_missing RESEND_TEMPLATE_ONBOARDING_CONFIRMATION "submissions will send no confirmation email"

exit "$failed"
