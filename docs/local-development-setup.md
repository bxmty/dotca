# Local Development Setup Guide

This guide provides step-by-step instructions for setting up your local development environment for the DotCA project.

## Prerequisites

Before you begin, ensure you have the following tools installed:

- **Docker & Docker Compose** - For containerized development
- **Node.js 18+** - For local development without Docker
- **Terraform 1.5+** - For infrastructure management
- **Ansible** - For configuration management
- **Git** - Version control
- **doctl** - DigitalOcean CLI (for infrastructure operations)
- **OpenSSH Client** - For server access

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd dotca
```

### 2. Run Setup Script

The project includes an automated setup script that configures your environment:

```bash
make setup
```

This script will:

- Check and verify all required dependencies
- Set up SSH agent and key configuration
- Create `.env.local` template with required environment variables
- Validate DigitalOcean API access
- Test Terraform and Ansible connectivity
- Create local Ansible configuration

### 3. Configure Environment Variables

Edit `.env.local` with your actual values:

```bash
# DigitalOcean API Access
DO_TOKEN=your_digitalocean_api_token_here

# SSH Configuration
SSH_KEY_FINGERPRINT=your_ssh_key_fingerprint

# Application Secrets
BREVO_API_KEY=your_brevo_api_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
GA_STAGING_ID=G-XXXXXXXXXX
GA_PRODUCTION_ID=G-XXXXXXXXXX
```

### 4. Validate Your Setup

```bash
make validate
```

This will verify:

- All required tools are installed
- Environment variables are configured
- SSH agent is running with keys
- DigitalOcean API access is working
- DigitalOcean Spaces access is configured

## Development Workflows

### Docker-Based Development (Recommended)

The easiest way to develop locally is using Docker Compose:

```bash
# Start development environment
make dev-up

# View logs
make dev-logs

# Stop development environment
make dev-down

# Restart containers
make dev-restart

# Clean up everything (containers, volumes, images)
make dev-clean FORCE=true
```

The application will be available at [http://localhost:3000](http://localhost:3000) and will auto-reload as you edit files.

### Manual Development (Without Docker)

If you prefer to run without Docker:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Testing

### Unit Tests (Jest)

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### End-to-End Tests (Playwright)

```bash
# Start development environment first
make dev-up

# Run E2E tests
npm run test:e2e

# Run E2E tests in debug mode
npm run test:e2e:debug

# Run E2E tests with UI
npm run test:e2e:ui
```

### Run All Tests

```bash
make dev-test
```

This runs both unit tests and E2E tests.

## Code Quality

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npm run typecheck
```

### Pre-commit Hooks

Install pre-commit hooks to automatically run checks before commits:

```bash
npm run pre-commit:install
```

## Infrastructure Development

### Terraform Operations

```bash
# Plan infrastructure changes
make terraform-plan ENVIRONMENT=staging

# Apply infrastructure changes (with local backend)
make terraform-apply ENVIRONMENT=staging BACKEND=local

# Destroy infrastructure
make terraform-destroy ENVIRONMENT=staging
```

### Ansible Operations

```bash
# Test connectivity to hosts
make ansible-ping ENVIRONMENT=staging

# Check playbook syntax
make ansible-syntax
```

### Full Deployment

```bash
# Deploy to staging (dry run)
make deploy ENVIRONMENT=staging DRY_RUN=true

# Deploy to staging
make deploy ENVIRONMENT=staging

# Check deployment status
make status ENVIRONMENT=staging

# Destroy environment
make destroy ENVIRONMENT=staging
```

## Troubleshooting

### SSH Agent Issues

If SSH agent is not running or keys are not loaded:

```bash
# Start SSH agent
eval "$(ssh-agent -s)"

# Add your SSH key
ssh-add ~/.ssh/id_ed25519

# Verify keys are loaded
ssh-add -l
```

### DigitalOcean API Access Issues

If you're having trouble accessing DigitalOcean:

1. Verify your token is correct in `.env.local`
2. Test API access:
   ```bash
   doctl account get
   ```
3. Verify Spaces access:
   ```bash
   aws s3 ls s3://bxtf --endpoint-url https://tor1.digitaloceanspaces.com
   ```

### Docker Issues

If Docker containers won't start:

```bash
# Check container status
docker-compose -f docker-compose.dev.yml ps

# View logs
docker-compose -f docker-compose.dev.yml logs

# Rebuild containers
docker-compose -f docker-compose.dev.yml up --build
```

### Environment Variable Issues

If environment variables aren't being loaded:

1. Ensure `.env.local` exists in the project root
2. Verify variables are set correctly
3. Run `make validate` to check configuration

## Project Structure

```
dotca/
├── src/                    # Next.js application source
├── e2e/                    # End-to-end tests (Playwright)
├── docker-compose.dev.yml  # Local development environment
├── terraform/             # Infrastructure as code
├── ansible/               # Configuration management
├── scripts/               # Development and deployment scripts
│   ├── setup-local-dev.sh # Setup script
│   ├── local-deploy.sh    # Deployment script
│   └── local-destroy.sh   # Destruction script
├── docs/                  # Documentation
└── Makefile               # Development and deployment commands
```

## Available Make Commands

Run `make help` to see all available commands:

- **Setup**: `make setup` - Initial environment setup
- **Validation**: `make validate` - Validate environment
- **Development**: `make dev-up`, `make dev-down`, `make dev-logs`, `make dev-test`
- **Deployment**: `make deploy ENVIRONMENT=staging`
- **Infrastructure**: `make terraform-plan`, `make ansible-ping`
- **Cleanup**: `make clean`, `make dev-clean`

## Next Steps

1. **Read the main README**: See [README.md](../README.md) for project overview
2. **Review CI/CD Documentation**: See [docs/cicd/README.md](./cicd/README.md) for deployment workflows
3. **Check Security Guides**: See [docs/ssh-key-management.md](./ssh-key-management.md) and [docs/secrets-rotation-guide.md](./secrets-rotation-guide.md)
4. **Explore the Codebase**: Start with `src/` for application code

## Getting Help

- **Documentation Issues**: Update files directly and create PRs
- **Technical Questions**: Check workflow comments and code documentation
- **Setup Problems**: Review this guide and run `make validate` for diagnostics

---

**Last Updated**: Documentation reflects current implementation. Please update when making changes.
