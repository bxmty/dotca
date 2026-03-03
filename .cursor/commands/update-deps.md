# Dependency Update Process

Check for outdated dependencies and update them one by one, running tests after each update. All dependencies must be pinned to exact versions (no ranges or wildcards).

## Files to Update

### Ansible Galaxy

- `ansible/requirements.yml` — pin role versions

### Docker

- `Dockerfile` — pin the base image tag
- `Dockerfile.dev` — pin the base image tag
- `docker-compose.dev.yml` — pin any image tags

### GitHub Actions

- `.github/workflows/dependency-check.yml` — pin all action versions
- `.github/workflows/deploy.yml` — pin all action versions, including `actions/checkout`, `actions/setup-node`, `actions/upload-artifact`, `docker/*`, `dorny/paths-filter`, `hashicorp/setup-terraform`, and any Node.js version references
- `.github/workflows/deploy.yml.test.yml` — pin all action versions
- `.github/workflows/deployment-dashboard.yml` — pin all action versions
- `.github/workflows/deployment-metrics.yml` — pin all action versions
- `.github/workflows/image-cleanup.yml` — pin all action versions
- `.github/workflows/log-aggregation.yml` — pin all action versions

### npm

- `package.json` — pin all dependency versions (no `^` or `~`)

### Node Version Manager

- `.nvmrc` — pin the Node.js version

### Terraform

- `terraform/main.tf` — pin all provider versions to exact versions (convert any range constraints to exact pins)

## Process

1. For each file listed above, check for any outdated dependencies using the appropriate tooling (e.g., `npm outdated`, `terraform version`, GitHub Actions release pages).
2. Update dependencies one at a time.
3. After each update, run the relevant tests to confirm nothing is broken.
4. Ensure every dependency is pinned to an exact version — no ranges, no `>=`, no `~`, no `^`.
