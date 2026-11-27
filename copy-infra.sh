#!/usr/bin/env bash
set -euo pipefail

# Copies the reusable infra pieces (terraform, ansible, github actions/workflows,
# docker) from this repo into a new project directory, for parameterizing.
#
# Usage:
#   ./copy-infra.sh /path/to/new-project
#
# Run this from the ROOT of your existing dotca repo.

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <destination-project-dir>"
  exit 1
fi

SRC="$(pwd)"
DEST="$1"

if [[ ! -d "$SRC/terraform" ]] || [[ ! -d "$SRC/ansible" ]]; then
  echo "Error: run this from the root of the source repo (terraform/ and ansible/ not found here)."
  exit 1
fi

mkdir -p "$DEST"

echo "Copying from: $SRC"
echo "Copying to:   $DEST"
echo ""

# --- terraform ---
mkdir -p "$DEST/terraform"
rsync -av \
  --exclude 'tfplan' \
  --exclude '.terraform/' \
  --exclude '.terraform.lock.hcl' \
  --exclude 'backend-local.tf.disabled' \
  "$SRC/terraform/" "$DEST/terraform/"

# --- ansible ---
mkdir -p "$DEST/ansible"
rsync -av \
  --exclude 'inventory/' \
  "$SRC/ansible/" "$DEST/ansible/"

# --- github actions & workflows ---
mkdir -p "$DEST/.github/actions" "$DEST/.github/workflows/environments"
rsync -av "$SRC/.github/actions/" "$DEST/.github/actions/"
cp "$SRC/.github/workflows/deploy.yml" "$DEST/.github/workflows/deploy.yml"
rsync -av "$SRC/.github/workflows/environments/" "$DEST/.github/workflows/environments/"

# --- docker ---
cp "$SRC/Dockerfile" "$DEST/Dockerfile"
[[ -f "$SRC/Dockerfile.dev" ]] && cp "$SRC/Dockerfile.dev" "$DEST/Dockerfile.dev"
[[ -f "$SRC/.dockerignore" ]] && cp "$SRC/.dockerignore" "$DEST/.dockerignore"
[[ -f "$SRC/docker-compose.dev.yml" ]] && cp "$SRC/docker-compose.dev.yml" "$DEST/docker-compose.dev.yml"

# --- relevant scripts ---
mkdir -p "$DEST/scripts"
for f in check-secret-formats.sh emergency-secret-revocation.sh \
         local-deploy.sh local-destroy.sh setup-local-dev.sh \
         validate-environment-config.sh validate-environment.sh validate-secrets.sh; do
  [[ -f "$SRC/scripts/$f" ]] && cp "$SRC/scripts/$f" "$DEST/scripts/$f"
done

echo ""
echo "Done. Copied into $DEST"
echo ""
echo "Next: search for hardcoded values you need to rename, e.g.:"
echo "  grep -rl 'dotca\|boximity.ca\|bxmty' \"$DEST\""
