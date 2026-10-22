#!/usr/bin/env bash
# Usage: check-secret-wiring.sh [repo_root]
#
# Catches a secret wired into some deploy files but not others. A runtime secret
# travels GitHub secret -> deploy.yml (Deploy step env) -> deploy action
# (Ansible inventory) -> both playbooks' vars -> docker-compose template, and a
# missed hop only shows up as an empty value on the droplet. Checks:
#
#   1. Every name in environments/<env>.yml `secrets:` is read by deploy.yml.
#   2. Every name the deploy action writes to the inventory as NAME=${NAME:-}
#      is passed by the Deploy step, read by both playbooks and listed in both
#      environment files; if the app reads it (process.env in src/), it is also
#      in the compose template and has a tier in check-deploy-secrets.sh.
#   3. Every name check-deploy-secrets.sh checks is passed by the Deploy step.
#
# How to add a secret: .github/workflows/environments/README.md, "Adding a
# Secret". Exits 1 listing every problem. Run by pre-commit and CI.
set -euo pipefail

root="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$root"

workflow=.github/workflows/deploy.yml
action=.github/actions/deploy/action.yml
gate=scripts/check-deploy-secrets.sh
compose=ansible/templates/docker-compose.yml.j2
environments=(staging production)
problems=0

problem() {
    echo "✗ $1" >&2
    problems=$((problems + 1))
}

# Names listed under `secrets:` in an environment file.
listed_secrets() {
    sed -n '/^secrets:/,/^[a-z]/p' ".github/workflows/environments/$1.yml" |
        sed -nE 's/^  - ([A-Z0-9_]+).*/\1/p'
}

# The env block of the step that runs the deploy action.
deploy_step_env() {
    awk '
        /uses: \.\/\.github\/actions\/deploy/ { on = 1; next }
        on && /^ {0,6}[^ ]/ { exit }
        on { print }
    ' "$workflow"
}

# Names the deploy action writes to the inventory under their own name.
inventory_names() {
    sed -nE 's/^ +([A-Z0-9_]+)=\$\{([A-Z0-9_]+):-\}$/\1 \2/p' "$action" |
        awk '$1 == $2 { print $1 }'
}

# Names check-deploy-secrets.sh gives a tier.
gated_names() {
    sed -nE 's/^(require|warn_if_missing|delegate) ([A-Z0-9_]+).*/\2/p' "$gate"
}

is_passed_by_deploy_step() {
    grep -Eq "^ +$1: \\$\{\{ secrets\.$1 \}\}" <<<"$step_env"
}

# process.env.NAME, or the name as a string literal (readRequiredEnv(["NAME"])).
is_read_by_app() {
    grep -rEq --exclude-dir=tests --exclude='*.test.*' \
        "process\.env\.$1([^A-Z0-9_]|$)|[\"'\`]$1[\"'\`]" src
}

step_env="$(deploy_step_env)"
gated="$(gated_names)"

for env in "${environments[@]}"; do
    for name in $(listed_secrets "$env"); do
        grep -Eq "secrets\.$name([^A-Z0-9_]|$)" "$workflow" ||
            problem "$name: listed in environments/$env.yml but $workflow never reads secrets.$name"
    done
done

for name in $(inventory_names); do
    is_passed_by_deploy_step "$name" ||
        problem "$name: written to the inventory by $action but not passed by the Deploy step in $workflow"
    for env in "${environments[@]}"; do
        grep -Eq "\{\{ $name \| default\(" "ansible/$env-deploy.yml" ||
            problem "$name: in the inventory but ansible/$env-deploy.yml never reads it"
        listed_secrets "$env" | grep -qx "$name" ||
            problem "$name: in the inventory but missing from environments/$env.yml secrets"
    done
    if is_read_by_app "$name"; then
        grep -Eq "^ +- $name=" "$compose" ||
            problem "$name: read by the app but not passed to the container in $compose"
        grep -qx "$name" <<<"$gated" ||
            problem "$name: read by the app but has no tier in $gate"
    fi
done

for name in $gated; do
    is_passed_by_deploy_step "$name" ||
        problem "$name: checked by $gate but not passed by the Deploy step in $workflow"
done

if ((problems > 0)); then
    echo "$problems secret wiring problem(s). See .github/workflows/environments/README.md, \"Adding a Secret\"." >&2
    exit 1
fi
