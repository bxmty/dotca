#!/usr/bin/env bash
# Usage: check-lead-magnet-secret.sh <environment>
#
# Checks LEAD_MAGNET_SIGNING_SECRET (read from the environment) before a deploy.
# Without it every lead-magnet download link answers 503, so production must
# never ship without it, but staging and local deploys only warn (#604). The
# 32-character minimum matches src/lib/lead-magnet-token.ts.
#
# Shared by .github/actions/deploy/action.yml, `just validate` and
# scripts/local-deploy.sh. Exits 1 only for production. Never prints the value.
set -euo pipefail

environment="${1:-}"
min_length=32
secret="${LEAD_MAGNET_SIGNING_SECRET:-}"

if [[ ${#secret} -ge $min_length ]]; then
    exit 0
fi

problem="LEAD_MAGNET_SIGNING_SECRET is not set or shorter than ${min_length} characters (generate one with: openssl rand -hex 32)"

report() {
    local level="$1" message="$2"
    if [[ "${GITHUB_ACTIONS:-}" == "true" ]]; then
        echo "::${level}::${message}" >&2
    else
        echo "${level^}: ${message}" >&2
    fi
}

if [[ "$environment" == "production" ]]; then
    report error "$problem; production must not deploy without it"
    exit 1
fi

report warning "$problem; lead-magnet downloads on ${environment:-this environment} will respond 503"
