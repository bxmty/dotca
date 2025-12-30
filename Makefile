# Makefile for dotca local development and deployment
# Provides high-level commands for local Terraform and Ansible operations

.PHONY: help setup validate deploy destroy status clean test

# Default target
.DEFAULT_GOAL := help

# Environment variables with defaults
ENVIRONMENT ?= staging
DRY_RUN ?= false
VERBOSE ?= false
FORCE ?= false

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Scripts directory
SCRIPTS_DIR := scripts

# Help target
help: ## Show this help message
	@echo "dotca Local Development Commands"
	@echo "==============================="
	@echo
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(BLUE)%-15s$(NC) %s\n", $$1, $$2}'
	@echo
	@echo "Environment Variables:"
	@echo "  ENVIRONMENT    Target environment (staging|production) [default: staging]"
	@echo "  DRY_RUN       Show what would happen without executing [default: false]"
	@echo "  VERBOSE        Enable verbose output [default: false]"
	@echo "  FORCE          Skip confirmation prompts [default: false]"
	@echo
	@echo "Examples:"
	@echo "  make setup                    # Initial environment setup"
	@echo "  make validate                 # Validate environment"
	@echo "  make deploy ENVIRONMENT=staging   # Deploy to staging"
	@echo "  make deploy ENVIRONMENT=production # Deploy to production"
	@echo "  make destroy ENVIRONMENT=staging   # Destroy staging environment"
	@echo "  make status ENVIRONMENT=staging    # Check environment status"

# Setup target - Initial environment configuration
setup: ## Set up local development environment
	@echo "$(BLUE)Setting up local development environment...$(NC)"
	@if [ ! -f "$(SCRIPTS_DIR)/setup-local-dev.sh" ]; then \
		echo "$(RED)Error: setup-local-dev.sh not found$(NC)"; \
		exit 1; \
	fi
	$(SCRIPTS_DIR)/setup-local-dev.sh $(if $(VERBOSE),--verbose)

# Validate target - Environment validation
validate: ## Validate local environment and prerequisites
	@echo "$(BLUE)Validating environment...$(NC)"
	@if [ ! -f ".env.local" ]; then \
		echo "$(RED)Error: .env.local not found. Run 'make setup' first.$(NC)"; \
		exit 1; \
	fi
	@# Check required tools
	@command -v terraform >/dev/null 2>&1 || { echo "$(RED)Error: terraform not found$(NC)"; exit 1; }
	@command -v ansible >/dev/null 2>&1 || { echo "$(RED)Error: ansible not found$(NC)"; exit 1; }
	@command -v doctl >/dev/null 2>&1 || { echo "$(RED)Error: doctl not found$(NC)"; exit 1; }
	@command -v docker >/dev/null 2>&1 || { echo "$(RED)Error: docker not found$(NC)"; exit 1; }
	@echo "$(GREEN)✓ Required tools found$(NC)"

	@# Load environment variables
	@set -a && source .env.local && set +a && \
		if [ -z "$$DO_TOKEN" ]; then \
			echo "$(RED)Error: DO_TOKEN not set in .env.local$(NC)"; \
			exit 1; \
		fi && \
		if [ -z "$$BREVO_API_KEY" ]; then \
			echo "$(RED)Error: BREVO_API_KEY not set in .env.local$(NC)"; \
			exit 1; \
		fi && \
		if [ -z "$$STRIPE_SECRET_KEY" ]; then \
			echo "$(RED)Error: STRIPE_SECRET_KEY not set in .env.local$(NC)"; \
			exit 1; \
		fi && \
		if [ -z "$$STRIPE_PUBLISHABLE_KEY" ]; then \
			echo "$(RED)Error: STRIPE_PUBLISHABLE_KEY not set in .env.local$(NC)"; \
			exit 1; \
		fi && \
		echo "$(GREEN)✓ Environment variables configured$(NC)"

	@# Test SSH agent
	@ssh-add -l >/dev/null 2>&1 || { echo "$(YELLOW)⚠ SSH agent not running or no keys loaded$(NC)"; }
	@ssh-add -l >/dev/null 2>&1 && echo "$(GREEN)✓ SSH agent has keys$(NC)"

	@# Test DigitalOcean access
	@set -a && source .env.local && set +a && \
		doctl account get >/dev/null 2>&1 || { echo "$(RED)Error: Cannot access DigitalOcean API$(NC)"; exit 1; } && \
		echo "$(GREEN)✓ DigitalOcean API access$(NC)"

	@# Test DigitalOcean Spaces access
	@set -a && source .env.local && set +a && \
		aws s3 ls s3://bxtf --endpoint-url https://tor1.digitaloceanspaces.com >/dev/null 2>&1 || { echo "$(RED)Error: Cannot access DigitalOcean Spaces$(NC)"; exit 1; } && \
		echo "$(GREEN)✓ DigitalOcean Spaces access$(NC)"

	@echo "$(GREEN)✓ Environment validation passed!$(NC)"

# Deploy target - Full deployment workflow
deploy: ## Deploy to specified environment
	@echo "$(BLUE)Deploying to $(ENVIRONMENT) environment...$(NC)"
	@if [ ! -f "$(SCRIPTS_DIR)/local-deploy.sh" ]; then \
		echo "$(RED)Error: local-deploy.sh not found$(NC)"; \
		exit 1; \
	fi
	@if [ "$(DRY_RUN)" = "true" ]; then \
		echo "$(YELLOW)DRY RUN MODE - No actual changes will be made$(NC)"; \
	fi
	$(SCRIPTS_DIR)/local-deploy.sh $(ENVIRONMENT) \
		$(if $(filter true, $(DRY_RUN)),--dry-run) \
		$(if $(filter true, $(VERBOSE)),--verbose)

# Destroy target - Environment cleanup
destroy: ## Destroy specified environment (DANGER!)
	@echo "$(RED)DANGER: This will destroy the $(ENVIRONMENT) environment!$(NC)"
	@if [ "$(FORCE)" != "true" ]; then \
		read -p "Are you sure? Type 'yes' to continue: " confirm; \
		if [ "$$confirm" != "yes" ]; then \
			echo "$(YELLOW)Destruction cancelled$(NC)"; \
			exit 0; \
		fi \
	fi
	@if [ ! -f "$(SCRIPTS_DIR)/local-destroy.sh" ]; then \
		echo "$(RED)Error: local-destroy.sh not found$(NC)"; \
		exit 1; \
	fi
	$(SCRIPTS_DIR)/local-destroy.sh $(ENVIRONMENT) \
		$(if $(filter true, $(DRY_RUN)),--dry-run) \
		$(if $(filter true, $(VERBOSE)),--verbose) \
		$(if $(filter true, $(FORCE)),--force)

# Status target - Check environment status
status: ## Check status of specified environment
	@echo "$(BLUE)Checking $(ENVIRONMENT) environment status...$(NC)"
	@set -a && source .env.local 2>/dev/null && set +a && \
		echo "$(BLUE)Local Environment:$(NC)" && \
		echo "  .env.local: $(if [ -f .env.local ]; then echo "$(GREEN)✓ Found$(NC)"; else echo "$(RED)✗ Missing$(NC)"; fi)" && \
		echo "  DO_TOKEN: $(if [ -n "$$DO_TOKEN" ]; then echo "$(GREEN)✓ Set$(NC)"; else echo "$(RED)✗ Missing$(NC)"; fi)" && \
		echo "  SSH Agent: $(if ssh-add -l >/dev/null 2>&1; then echo "$(GREEN)✓ Running$(NC)"; else echo "$(RED)✗ Not running$(NC)"; fi)" && \
		echo && \
		echo "$(BLUE)Remote Environment:$(NC)" && \
		if [ -n "$$DO_TOKEN" ]; then \
			if doctl account get >/dev/null 2>&1; then \
				echo "  DigitalOcean API: $(GREEN)✓ Accessible$(NC)"; \
				if aws s3 ls s3://bxtf --endpoint-url https://tor1.digitaloceanspaces.com >/dev/null 2>&1; then \
					echo "  DigitalOcean Spaces: $(GREEN)✓ Accessible$(NC)"; \
				else \
					echo "  DigitalOcean Spaces: $(RED)✗ Not accessible$(NC)"; \
				fi; \
				droplet_count=$$(doctl compute droplet list --format ID --no-header 2>/dev/null | grep -c . || echo 0); \
				echo "  Active droplets: $$droplet_count"; \
			else \
				echo "  DigitalOcean API: $(RED)✗ Not accessible$(NC)"; \
			fi; \
		else \
			echo "  DigitalOcean API: $(YELLOW)⚠ Cannot test without DO_TOKEN$(NC)"; \
		fi

# Clean target - Clean up local files
clean: ## Clean up generated files and caches
	@echo "$(BLUE)Cleaning up local files...$(NC)"
	@rm -f ansible/inventory/local.ini
	@rm -f terraform/tfplan
	@rm -f terraform/destroy-plan
	@find . -name "*.log" -type f -delete 2>/dev/null || true
	@docker system prune -f >/dev/null 2>&1 || true
	@echo "$(GREEN)✓ Cleanup completed$(NC)"

# Test target - Run validation tests
test: ## Run tests and validations
	@echo "$(BLUE)Running tests...$(NC)"
	@make validate
	@echo "$(GREEN)✓ All tests passed$(NC)"

# Terraform-specific targets
terraform-init: ## Initialize Terraform
	@echo "$(BLUE)Initializing Terraform...$(NC)"
	cd terraform && terraform init

terraform-plan: ## Show Terraform plan for current environment
	@echo "$(BLUE)Planning Terraform changes for $(ENVIRONMENT)...$(NC)"
	cd terraform && terraform plan -var="environment=$(ENVIRONMENT)"

terraform-apply: ## Apply Terraform changes (USE WITH CAUTION)
	@echo "$(RED)WARNING: This will modify infrastructure!$(NC)"
	@read -p "Are you sure? (y/N): " confirm; \
		if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
			cd terraform && terraform apply -var="environment=$(ENVIRONMENT)"; \
		else \
			echo "$(YELLOW)Cancelled$(NC)"; \
		fi

terraform-destroy: ## Destroy Terraform-managed infrastructure (DANGER!)
	@echo "$(RED)DANGER: This will destroy all infrastructure!$(NC)"
	@read -p "Are you absolutely sure? Type 'DESTROY' to continue: " confirm; \
		if [ "$$confirm" = "DESTROY" ]; then \
			cd terraform && terraform destroy -var="environment=$(ENVIRONMENT)"; \
		else \
			echo "$(YELLOW)Cancelled$(NC)"; \
		fi

# Ansible-specific targets
ansible-ping: ## Test Ansible connectivity to hosts
	@echo "$(BLUE)Testing Ansible connectivity...$(NC)"
	@if [ -f "ansible/inventory/local.ini" ]; then \
		cd ansible && ansible -i inventory/local.ini digitalocean -m ping; \
	else \
		echo "$(YELLOW)No local inventory found. Run deployment first.$(NC)"; \
	fi

ansible-syntax: ## Check Ansible playbook syntax
	@echo "$(BLUE)Checking Ansible playbook syntax...$(NC)"
	@cd ansible && \
		for playbook in *-deploy.yml; do \
			if [ -f "$$playbook" ]; then \
				echo "Checking $$playbook..."; \
				ansible-playbook --syntax-check "$$playbook" || exit 1; \
			fi \
		done
	@echo "$(GREEN)✓ Syntax check passed$(NC)"
