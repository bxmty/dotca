#!/usr/bin/env bash
# Usage: check-sdr-link-secret.sh <environment>
#
# Checks SDR_LINK_SIGNING_SECRET (read from the environment) before a deploy.
# Without it the discovery-call console 404s for every SDR. Staging and
# production must not deploy without it; anything else only warns. The
# 32-character minimum matches src/lib/signed-link-token.ts.
#
# Shared by .github/actions/deploy/action.yml, `just validate` and
# scripts/local-deploy.sh. Never prints the value.
set -euo pipefail

environment="${1:-}"
min_length=32
secret="${SDR_LINK_SIGNING_SECRET:-}"

if [[ ${#secret} -ge $min_length ]]; then
    exit 0
fi

problem="SDR_LINK_SIGNING_SECRET is not set or shorter than ${min_length} characters (generate one with: openssl rand -hex 32)"

report() {
    local level="$1" message="$2"
    if [[ "${GITHUB_ACTIONS:-}" == "true" ]]; then
        echo "::${level}::${message}" >&2
    else
        echo "${level^}: ${message}" >&2
    fi
}

if [[ "$environment" == "production" || "$environment" == "staging" ]]; then
    report error "$problem; $environment must not deploy without it"
    exit 1
fi

report warning "$problem; the SDR call console on ${environment:-this environment} will respond 404"
