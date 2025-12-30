# Environment Configurations

This directory contains environment-specific configuration files for the CI/CD pipeline. These configurations define how deployments behave in different environments (development, staging, production).

## File Structure

```
.github/workflows/environments/
├── README.md                    # This documentation
├── development.yml             # Development environment config
├── staging.yml                 # Staging environment config
└── production.yml              # Production environment config
```

## Configuration Files

### Environment Configuration Schema

Each environment configuration file contains the following sections:

#### Basic Information

```yaml
name: environment_name # Environment identifier
url: https://environment.url # Public URL for the environment
branches: [branch1, branch2] # Branches that can deploy to this environment
```

#### Protection Rules

```yaml
protection_rules:
  required_reviewers: 1 # Number of required approvals
  required_checks: # Status checks that must pass
    - build
    - test
  restrict_pushes: true # Restrict who can push to environment branches
  wait_timer: 10 # Minutes to wait before deployment (optional)
```

#### Environment Variables

```yaml
variables:
  ENVIRONMENT: production # Environment name
  APP_URL: https://app.url # Application URL
  DEBUG: false # Debug mode flag
  # ... other environment variables
```

#### Secrets

```yaml
secrets:
  - DO_TOKEN # Required secrets for this environment
  - SSH_PRIVATE_KEY
  - GITHUB_TOKEN
  # ... other required secrets
```

#### Deployment Configuration

```yaml
deployment:
  terraform_workspace: prod # Terraform workspace name
  ansible_playbook: deploy.yml # Ansible playbook to run
  health_check_endpoint: /health # Health check endpoint
  enable_e2e_tests: false # Whether to run E2E tests
  rollback_enabled: true # Whether rollback is available
```

#### Monitoring & Security

```yaml
monitoring:
  enable_health_checks: true
  alert_on_failure: true
  notification_channels: ["slack", "github"]

security:
  enable_https_redirect: true
  enable_rate_limiting: true
  rate_limit_requests_per_hour: 10000
```

## Environment Details

### Development Environment

- **Purpose**: Build validation and development testing
- **Branch**: `renovations`
- **Deployments**: Build-only (no actual deployment)
- **Security**: Minimal restrictions for rapid development
- **Testing**: Unit tests only

### Staging Environment

- **Purpose**: Integration testing and UAT
- **Branch**: `staging`
- **Deployments**: Full deployment with comprehensive testing
- **Security**: Moderate restrictions with reviewer requirements
- **Testing**: Unit, integration, and E2E tests

### Production Environment

- **Purpose**: Live production environment
- **Branch**: `main`
- **Deployments**: Full deployment with minimal testing to avoid load
- **Security**: Maximum restrictions with multiple reviewers and wait timers
- **Testing**: Unit, integration, and smoke tests only

## GitHub Environment Setup

For each environment configuration file, you need to create a corresponding GitHub Environment:

### Creating GitHub Environments

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Environments**
3. Click **New environment**
4. Use the environment name from the config file (development, staging, production)
5. Configure:
   - **Environment secrets**: Add all secrets listed in the config
   - **Environment variables**: Add all variables listed in the config
   - **Protection rules**: Configure based on the protection_rules section
   - **Deployment branches**: Restrict to branches listed in the config

### Required Secrets

#### Infrastructure Secrets (All Environments)

- `DO_TOKEN`: DigitalOcean API token
- `SSH_PRIVATE_KEY`: Private SSH key for server access
- `SSH_KEY_FINGERPRINT`: SSH key fingerprint
- `SPACES_ACCESS_ID`: DigitalOcean Spaces access key
- `SPACES_SECRET_KEY`: DigitalOcean Spaces secret key

#### Application Secrets

- `BREVO_API_KEY`: Email service API key
- `STRIPE_SECRET_KEY`: Stripe payment processing secret key
- `ANSIBLE_VAULT_PASSWORD`: Password for Ansible vault decryption
- `GITHUB_TOKEN`: GitHub API token (automatically provided)

#### Environment-Specific Secrets

- `UMAMI_DB_PASSWORD`: Umami analytics database password
- `UMAMI_APP_SECRET`: Umami application secret
- `UMAMI_ADMIN_PASSWORD`: Umami admin password

## Validation

Use the validation script to ensure your environment configurations are correct:

```bash
# Validate all environments
./scripts/validate-environment-config.sh

# Validate specific environment
./scripts/validate-environment-config.sh staging
```

The validation script checks:

- YAML syntax correctness
- Required fields presence
- Protection rules configuration
- Secrets configuration
- GitHub environment setup

## Deployment Flow

1. **Branch Push**: Code is pushed to a branch (renovations, staging, or main)
2. **Environment Detection**: Workflow detects target environment based on branch
3. **Configuration Loading**: Environment-specific config is loaded
4. **Validation**: Configuration and secrets are validated
5. **Deployment**: Application is deployed using environment-specific settings
6. **Testing**: Environment-appropriate tests are executed
7. **Monitoring**: Health checks and monitoring are configured

## Security Considerations

### Production Environment

- Requires 2 reviewers for deployments
- 10-minute wait timer before deployment
- Strict branch protection rules
- Comprehensive security scanning
- Minimal test execution to reduce load

### Staging Environment

- Requires 1 reviewer for deployments
- Moderate security restrictions
- Full test suite execution
- Used for comprehensive validation

### Development Environment

- No reviewer requirements
- Relaxed security for rapid iteration
- Build validation only
- No production impact

## Troubleshooting

### Common Issues

1. **Missing Secrets**: Ensure all required secrets are set in GitHub Environment
2. **Invalid YAML**: Run validation script to check configuration syntax
3. **Protection Rule Failures**: Verify branch protection rules match configuration
4. **Deployment Failures**: Check environment-specific variables and secrets

### Validation Script Output

The validation script provides detailed feedback:

- ✅ **SUCCESS**: Configuration is valid
- ⚠️ **WARNING**: Configuration may work but could be improved
- ❌ **ERROR**: Configuration has critical issues that prevent deployment

### Logs and Debugging

- Check GitHub Actions logs for detailed deployment information
- Use the validation script for configuration issues
- Review environment protection rules if deployments are blocked
- Verify secret values if authentication fails

## Maintenance

### Updating Configurations

1. Edit the appropriate `.yml` file
2. Run validation script to ensure correctness
3. Update corresponding GitHub Environment settings
4. Test deployment in staging environment first
5. Deploy to production with appropriate review process

### Adding New Environments

1. Create new `.yml` configuration file
2. Add environment name to validation script
3. Create corresponding GitHub Environment
4. Update workflow to recognize new environment
5. Test thoroughly before production use

## Related Files

- `../deploy.yml`: Main deployment workflow
- `../deploy.yml.test.yml`: Workflow testing
- `../../scripts/validate-environment-config.sh`: Configuration validation
- `../../../docs/ci-cd-architecture.md`: Architecture documentation
