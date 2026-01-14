#!/usr/bin/env just --justfile
# Justfile for dotca local development and deployment
# Provides high-level commands for local development, Terraform and Ansible operations

# Default environment variables
ENVIRONMENT := env_var_or_default("ENVIRONMENT", "staging")
BACKEND := env_var_or_default("BACKEND", "remote")
DRY_RUN := env_var_or_default("DRY_RUN", "false")
VERBOSE := env_var_or_default("VERBOSE", "false")
FORCE := env_var_or_default("FORCE", "false")

# Colors for output
BLUE := "\\033[0;34m"
GREEN := "\\033[0;32m"
YELLOW := "\\033[1;33m"
RED := "\\033[0;31m"
NC := "\\033[0m" # No Color

# Scripts directory
SCRIPTS_DIR := "scripts"

# Default recipe
default: help

# Help target - Show this help message
help:
    @echo "dotca Local Development Commands"
    @echo "==============================="
    @echo
    @echo "{{BLUE}}Available recipes:{{NC}}"
    @just --list --justfile {{justfile()}}
    @echo
    @echo "{{BLUE}}Environment Variables:{{NC}}"
    @echo "  ENVIRONMENT    Target environment (staging|production) [default: {{ENVIRONMENT}}]"
    @echo "  BACKEND        Terraform backend type (local|remote) [default: {{BACKEND}}]"
    @echo "  DRY_RUN       Show what would happen without executing [default: {{DRY_RUN}}]"
    @echo "  VERBOSE        Enable verbose output [default: {{VERBOSE}}]"
    @echo "  FORCE          Skip confirmation prompts [default: {{FORCE}}]"
    @echo
    @echo "{{BLUE}}Examples:{{NC}}"
    @echo "  just setup                    # Initial environment setup"
    @echo "  just validate                 # Validate environment"
    @echo "  just deploy ENVIRONMENT=staging   # Deploy to staging (remote backend)"
    @echo "  just deploy ENVIRONMENT=staging BACKEND=local   # Deploy with local backend"
    @echo "  just deploy ENVIRONMENT=production # Deploy to production"
    @echo "  just destroy ENVIRONMENT=staging   # Destroy staging environment"
    @echo "  just status ENVIRONMENT=staging    # Check environment status"
    @echo "  just terraform-plan ENVIRONMENT=staging  # Plan terraform changes"
    @echo "  just terraform-apply ENVIRONMENT=staging BACKEND=local  # Apply with local backend"
    @echo
    @echo "{{BLUE}}Local Development:{{NC}}"
    @echo "  just dev-up                   # Start development environment"
    @echo "  just dev-down                 # Stop development environment"
    @echo "  just dev-logs                 # View development logs"
    @echo "  just dev-restart              # Restart development containers"
    @echo "  just dev-test                 # Run unit and E2E tests"
    @echo "  just dev-clean FORCE=true     # Clean development environment"

# Setup recipe - Initial environment configuration
setup: _check-setup-script
    @echo "{{BLUE}}Setting up local development environment...{{NC}}"
    {{SCRIPTS_DIR}}/setup-local-dev.sh {{ if VERBOSE == "true" { "--verbose" } else { "" } }} --skip-env-overwrite

# Validate recipe - Environment validation
validate: _check-env-file
    @echo "{{BLUE}}Validating environment...{{NC}}"
    @command -v terraform >/dev/null 2>&1 || (echo "{{RED}}Error: terraform not found{{NC}}" && exit 1)
    @command -v ansible >/dev/null 2>&1 || (echo "{{RED}}Error: ansible not found{{NC}}" && exit 1)
    @command -v doctl >/dev/null 2>&1 || (echo "{{RED}}Error: doctl not found{{NC}}" && exit 1)
    @command -v docker >/dev/null 2>&1 || (echo "{{RED}}Error: docker not found{{NC}}" && exit 1)
    @echo "{{GREEN}}✓ Required tools found{{NC}}"
    @# Load environment variables and validate
    @set -a && . {{invocation_directory()}}/.env.local && set +a && \
        if [ -z "$DO_TOKEN" ]; then \
            echo "{{RED}}Error: DO_TOKEN not set in .env.local{{NC}}" && exit 1; \
        fi && \
        if [ -z "$BREVO_API_KEY" ]; then \
            echo "{{RED}}Error: BREVO_API_KEY not set in .env.local{{NC}}" && exit 1; \
        fi && \
        if [ -z "$STRIPE_SECRET_KEY" ]; then \
            echo "{{RED}}Error: STRIPE_SECRET_KEY not set in .env.local{{NC}}" && exit 1; \
        fi && \
        if [ -z "$STRIPE_PUBLISHABLE_KEY" ]; then \
            echo "{{RED}}Error: STRIPE_PUBLISHABLE_KEY not set in .env.local{{NC}}" && exit 1; \
        fi && \
        echo "{{GREEN}}✓ Environment variables configured{{NC}}"
    @# Test SSH agent
    @ssh-add -l >/dev/null 2>&1 || echo "{{YELLOW}}⚠ SSH agent not running or no keys loaded{{NC}}"
    @ssh-add -l >/dev/null 2>&1 && echo "{{GREEN}}✓ SSH agent has keys{{NC}}"
    @# Test DigitalOcean access
    @set -a && . {{invocation_directory()}}/.env.local && set +a && \
        doctl account get >/dev/null 2>&1 || (echo "{{RED}}Error: Cannot access DigitalOcean API{{NC}}" && exit 1) && \
        echo "{{GREEN}}✓ DigitalOcean API access{{NC}}"
    @# Test DigitalOcean Spaces access
    @set -a && . {{invocation_directory()}}/.env.local && set +a && \
        aws s3 ls s3://bxtf --endpoint-url https://tor1.digitaloceanspaces.com >/dev/null 2>&1 || (echo "{{RED}}Error: Cannot access DigitalOcean Spaces{{NC}}" && exit 1) && \
        echo "{{GREEN}}✓ DigitalOcean Spaces access{{NC}}"
    @echo "{{GREEN}}✓ Environment validation passed!{{NC}}"

# Deploy recipe - Full deployment workflow
deploy: _check-deploy-script
    @echo "{{BLUE}}Deploying to {{ENVIRONMENT}} environment...{{NC}}"
    @if [ "{{DRY_RUN}}" = "true" ]; then \
        echo "{{YELLOW}}DRY RUN MODE - No actual changes will be made{{NC}}"; \
    fi
    {{SCRIPTS_DIR}}/local-deploy.sh {{ENVIRONMENT}} \
        {{ if BACKEND != "" { "--backend " + BACKEND } else { "" } }} \
        {{ if DRY_RUN == "true" { "--dry-run" } else { "" } }} \
        {{ if VERBOSE == "true" { "--verbose" } else { "" } }}

# Destroy recipe - Environment cleanup
destroy: _check-destroy-script _confirm-destroy
    @echo "{{RED}}DANGER: This will destroy the {{ENVIRONMENT}} environment!{{NC}}"
    {{SCRIPTS_DIR}}/local-destroy.sh {{ENVIRONMENT}} \
        {{ if DRY_RUN == "true" { "--dry-run" } else { "" } }} \
        {{ if VERBOSE == "true" { "--verbose" } else { "" } }} \
        {{ if FORCE == "true" { "--force" } else { "" } }}

# Status recipe - Check environment status
status:
    @echo "{{BLUE}}Checking {{ENVIRONMENT}} environment status...{{NC}}"
    @set -a && source .env.local 2>/dev/null && set +a && \
        echo "{{BLUE}}Local Environment:{{NC}}" && \
        if [ -f .env.local ]; then echo "  .env.local: {{GREEN}}✓ Found{{NC}}"; else echo "  .env.local: {{RED}}✗ Missing{{NC}}"; fi && \
        if [ -n "$DO_TOKEN" ]; then echo "  DO_TOKEN: {{GREEN}}✓ Set{{NC}}"; else echo "  DO_TOKEN: {{RED}}✗ Missing{{NC}}"; fi && \
        if ssh-add -l >/dev/null 2>&1; then echo "  SSH Agent: {{GREEN}}✓ Running{{NC}}"; else echo "  SSH Agent: {{RED}}✗ Not running{{NC}}"; fi && \
        echo && \
        echo "{{BLUE}}Remote Environment:{{NC}}" && \
        if [ -n "$DO_TOKEN" ]; then \
            if doctl account get >/dev/null 2>&1; then \
                echo "  DigitalOcean API: {{GREEN}}✓ Accessible{{NC}}"; \
                if aws s3 ls s3://bxtf --endpoint-url https://tor1.digitaloceanspaces.com >/dev/null 2>&1; then \
                    echo "  DigitalOcean Spaces: {{GREEN}}✓ Accessible{{NC}}"; \
                else \
                    echo "  DigitalOcean Spaces: {{RED}}✗ Not accessible{{NC}}"; \
                fi; \
                droplet_count=$(doctl compute droplet list --format ID --no-header 2>/dev/null | grep -c . || echo 0); \
                echo "  Active droplets: $droplet_count"; \
            else \
                echo "  DigitalOcean API: {{RED}}✗ Not accessible{{NC}}"; \
            fi; \
        else \
            echo "  DigitalOcean API: {{YELLOW}}⚠ Cannot test without DO_TOKEN{{NC}}"; \
        fi

# Clean recipe - Clean up local files
clean:
    @echo "{{BLUE}}Cleaning up local files...{{NC}}"
    @rm -f ansible/inventory/local.ini
    @rm -f terraform/tfplan
    @rm -f terraform/destroy-plan
    @find . -name "*.log" -type f -delete 2>/dev/null || true
    @docker system prune -f >/dev/null 2>&1 || true
    @echo "{{GREEN}}✓ Cleanup completed{{NC}}"

# Test recipe - Run validation tests
test: validate
    @echo "{{BLUE}}Running tests...{{NC}}"
    @echo "{{GREEN}}✓ All tests passed{{NC}}"

# Terraform recipes
terraform-init:
    @echo "{{BLUE}}Initializing Terraform with {{BACKEND}} backend...{{NC}}"
    @if [ "{{BACKEND}}" = "remote" ]; then \
        cd terraform && \
        if [ -f "backend-remote.tf.disabled" ]; then \
            mv backend-remote.tf.disabled backend-remote.tf; \
        fi && \
        if [ -f "backend-local.tf" ]; then \
            mv backend-local.tf backend-local.tf.disabled; \
        fi && \
        terraform init -reconfigure; \
    else \
        cd terraform && \
        if [ -f "backend-local.tf.disabled" ]; then \
            mv backend-local.tf.disabled backend-local.tf; \
        fi && \
        if [ -f "backend-remote.tf" ]; then \
            mv backend-remote.tf backend-remote.tf.disabled; \
        fi && \
        terraform init -reconfigure; \
    fi

terraform-plan:
    @echo "{{BLUE}}Planning Terraform changes for {{ENVIRONMENT}} (backend: {{BACKEND}})...{{NC}}"
    @if [ "{{BACKEND}}" = "remote" ]; then \
        cd terraform && \
        if [ -f "backend-remote.tf.disabled" ]; then \
            mv backend-remote.tf.disabled backend-remote.tf; \
        fi && \
        if [ -f "backend-local.tf" ]; then \
            mv backend-local.tf backend-local.tf.disabled; \
        fi; \
    fi && \
    cd terraform && terraform plan -var="environment={{ENVIRONMENT}}"

terraform-apply: _confirm-apply
    @echo "{{RED}}WARNING: This will modify infrastructure!{{NC}}"
    @if [ "{{BACKEND}}" = "remote" ]; then \
        cd terraform && \
        if [ -f "backend-remote.tf.disabled" ]; then \
            mv backend-remote.tf.disabled backend-remote.tf; \
        fi && \
        if [ -f "backend-local.tf" ]; then \
            mv backend-local.tf backend-local.tf.disabled; \
        fi; \
    fi && \
    cd terraform && terraform apply -var="environment={{ENVIRONMENT}}"

terraform-destroy: _confirm-terraform-destroy
    @echo "{{RED}}DANGER: This will destroy all infrastructure!{{NC}}"
    @if [ "{{BACKEND}}" = "remote" ]; then \
        cd terraform && \
        if [ -f "backend-remote.tf.disabled" ]; then \
            mv backend-remote.tf.disabled backend-remote.tf; \
        fi && \
        if [ -f "backend-local.tf" ]; then \
            mv backend-local.tf backend-local.tf.disabled; \
        fi; \
    fi && \
    cd terraform && terraform destroy -var="environment={{ENVIRONMENT}}"

# Ansible recipes
ansible-ping:
    @echo "{{BLUE}}Testing Ansible connectivity...{{NC}}"
    @if [ -f "ansible/inventory/local.ini" ]; then \
        cd ansible && ansible -i inventory/local.ini digitalocean -m ping; \
    else \
        echo "{{YELLOW}}No local inventory found. Run deployment first.{{NC}}"; \
    fi

ansible-syntax:
    @echo "{{BLUE}}Checking Ansible playbook syntax...{{NC}}"
    @cd ansible && \
        for playbook in *-deploy.yml; do \
            if [ -f "$playbook" ]; then \
                echo "Checking $playbook..."; \
                ansible-playbook --syntax-check "$playbook" || exit 1; \
            fi \
        done
    @echo "{{GREEN}}✓ Syntax check passed{{NC}}"

# Development Docker Compose recipes
dev-up: _check-docker-compose-dev
    @echo "{{BLUE}}Starting local development environment...{{NC}}"
    @docker-compose -f docker-compose.dev.yml up --build -d
    @echo "{{GREEN}}✓ Development environment started{{NC}}"
    @echo "{{BLUE}}Application available at: http://localhost:3000{{NC}}"

dev-down: _check-docker-compose-dev
    @echo "{{BLUE}}Stopping local development environment...{{NC}}"
    @docker-compose -f docker-compose.dev.yml down
    @echo "{{GREEN}}✓ Development environment stopped{{NC}}"

dev-build: _check-docker-compose-dev
    @echo "{{BLUE}}Building development Docker images...{{NC}}"
    @docker-compose -f docker-compose.dev.yml build
    @echo "{{GREEN}}✓ Development images built{{NC}}"

dev-logs:
    @echo "{{BLUE}}Showing development environment logs...{{NC}}"
    @docker-compose -f docker-compose.dev.yml logs -f

dev-restart:
    @echo "{{BLUE}}Restarting development environment...{{NC}}"
    @docker-compose -f docker-compose.dev.yml restart
    @echo "{{GREEN}}✓ Development environment restarted{{NC}}"

dev-clean: _confirm-dev-clean
    @echo "{{RED}}WARNING: This will remove all development containers, volumes, and images{{NC}}"
    @echo "{{BLUE}}Cleaning up development environment...{{NC}}"
    @docker-compose -f docker-compose.dev.yml down -v --rmi all
    @docker system prune -f
    @echo "{{GREEN}}✓ Development environment cleaned{{NC}}"

dev-test: _check-docker-compose-dev
    @echo "{{BLUE}}Running unit tests (Jest)...{{NC}}"
    @if command -v npm >/dev/null 2>&1; then \
        npm test; \
    else \
        echo "{{RED}}Error: npm not found{{NC}}" && exit 1; \
    fi
    @echo "{{GREEN}}✓ Unit tests completed{{NC}}"
    @echo
    @echo "{{BLUE}}Running E2E tests (Playwright)...{{NC}}"
    @if docker-compose -f docker-compose.dev.yml ps | grep -q "web"; then \
        if command -v npx >/dev/null 2>&1; then \
            npx playwright test; \
        else \
            echo "{{RED}}Error: npx not found{{NC}}" && exit 1; \
        fi; \
    else \
        echo "{{YELLOW}}⚠ Development environment not running. Start with 'just dev-up' first.{{NC}}" && exit 1; \
    fi
    @echo "{{GREEN}}✓ E2E tests completed{{NC}}"

dev-status:
    @echo "{{BLUE}}Development environment status:{{NC}}"
    @docker-compose -f docker-compose.dev.yml ps

# Private helper recipes
_check-setup-script:
    @if [ ! -f "{{SCRIPTS_DIR}}/setup-local-dev.sh" ]; then \
        echo "{{RED}}Error: setup-local-dev.sh not found{{NC}}" && exit 1; \
    fi

_check-deploy-script:
    @if [ ! -f "{{SCRIPTS_DIR}}/local-deploy.sh" ]; then \
        echo "{{RED}}Error: local-deploy.sh not found{{NC}}" && exit 1; \
    fi

_check-destroy-script:
    @if [ ! -f "{{SCRIPTS_DIR}}/local-destroy.sh" ]; then \
        echo "{{RED}}Error: local-destroy.sh not found{{NC}}" && exit 1; \
    fi

_check-env-file:
    @if [ ! -f ".env.local" ]; then \
        echo "{{RED}}Error: .env.local not found. Run 'just setup' first.{{NC}}" && exit 1; \
    fi

_check-docker-compose-dev:
    @if [ ! -f "docker-compose.dev.yml" ]; then \
        echo "{{RED}}Error: docker-compose.dev.yml not found{{NC}}" && exit 1; \
    fi

_confirm-destroy:
    @if [ "{{FORCE}}" != "true" ]; then \
        read -p "Are you sure? Type 'yes' to continue: " confirm; \
        if [ "$confirm" != "yes" ]; then \
            echo "{{YELLOW}}Destruction cancelled{{NC}}" && exit 0; \
        fi \
    fi

_confirm-apply:
    @read -p "Are you sure? (y/N): " confirm; \
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then \
        echo "{{YELLOW}}Cancelled{{NC}}" && exit 1; \
    fi

_confirm-terraform-destroy:
    @read -p "Are you absolutely sure? Type 'DESTROY' to continue: " confirm; \
    if [ "$confirm" != "DESTROY" ]; then \
        echo "{{YELLOW}}Cancelled{{NC}}" && exit 1; \
    fi

_confirm-dev-clean:
    @if [ "{{FORCE}}" != "true" ]; then \
        read -p "Are you sure? Type 'yes' to continue: " confirm; \
        if [ "$confirm" != "yes" ]; then \
            echo "{{YELLOW}}Cleanup cancelled{{NC}}" && exit 0; \
        fi \
    fi
