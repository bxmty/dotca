# DotCA Scripts Directory

This directory contains automation scripts for secret management, deployment validation, and security operations.

## Available Scripts

### Secret Management Scripts

#### `validate-secrets.sh`

Validates the format and basic integrity of all secrets used in the DotCA project.

**Usage:**

```bash
# Validate all secrets in current environment
./scripts/validate-secrets.sh

# Validate specific environment variables
STRIPE_SECRET_KEY=sk_test_... BREVO_API_KEY=... ./scripts/validate-secrets.sh
```

**Validates:**

- SSH key formats and accessibility
- Stripe API key formats (secret and publishable)
- Brevo API key format
- Google Analytics ID formats
- DigitalOcean token format
- Spaces credentials format
- Ansible vault decryption capability

#### `check-secret-formats.sh`

Checks secret formats and access permissions, providing warnings for potential issues.

**Usage:**

```bash
./scripts/check-secret-formats.sh
```

**Checks:**

- File permissions for sensitive files
- Environment variable format validation
- GitHub secret accessibility
- 1Password CLI access
- SSH agent availability
- General security audit

#### `emergency-secret-revocation.sh`

**🚨 EMERGENCY USE ONLY 🚨** Performs emergency revocation of potentially compromised secrets.

**Usage:**

```bash
# This script requires explicit confirmation
./scripts/emergency-secret-revocation.sh
```

**Actions:**

- Logs all secrets that need manual revocation
- Generates emergency SSH keys
- Creates incident reports
- Provides step-by-step recovery instructions

**Warning:** This script will cause service disruption and should only be used during security incidents.

## Environment Variables

Scripts expect these environment variables to be set for validation:

### Required for Validation

- `STRIPE_SECRET_KEY` - Stripe secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `BREVO_API_KEY` - Brevo API key
- `NEXT_PUBLIC_PRODUCTION_GA_ID` - Production Google Analytics ID
- `NEXT_PUBLIC_STAGING_GA_ID` - Staging Google Analytics ID
- `DO_TOKEN` - DigitalOcean API token
- `SPACES_ACCESS_ID` - DigitalOcean Spaces access ID
- `SPACES_SECRET_KEY` - DigitalOcean Spaces secret key
- `ANSIBLE_VAULT_PASSWORD` - Ansible vault password

### Optional File Paths

- `SSH_PRIVATE_KEY_FILE` - Path to SSH private key (default: ~/.ssh/id_rsa)
- `SSH_PUBLIC_KEY_FILE` - Path to SSH public key (default: ~/.ssh/id_rsa.pub)
- `ANSIBLE_VAULT_FILE` - Path to Ansible vault file (default: ansible/vars/vault-vars.yml)

## Exit Codes

- `0` - Success, all checks passed
- `1` - Failure, critical issues found
- `2` - Warning, non-critical issues found (for `check-secret-formats.sh`)

## Security Notes

- Scripts validate secret formats but do not expose actual secret values
- All logging avoids printing sensitive data
- Emergency scripts require explicit user confirmation
- Scripts can be run in CI/CD pipelines for automated validation

## Integration with CI/CD

Add these scripts to your GitHub Actions workflows:

```yaml
- name: Validate Secrets
  run: ./scripts/validate-secrets.sh

- name: Check Secret Formats
  run: ./scripts/check-secret-formats.sh
  continue-on-error: true # Warnings don't fail the build
```

## Related Documentation

- [Secrets Rotation Guide](../docs/SECRETS_ROTATION_GUIDE.md) - Comprehensive secret rotation procedures
- [SSH Key Management Guide](../docs/SSH_KEY_MANAGEMENT.md) - SSH key specific procedures
- [Environment Setup Guide](../docs/ENVIRONMENT_SETUP.md) - Environment variable configuration

## Contributing

When adding new scripts:

1. Include comprehensive error handling
2. Avoid logging sensitive information
3. Add clear usage documentation
4. Include validation for all inputs
5. Test in both local and CI environments

## Support

For issues with these scripts, contact the DevOps team or create an issue in the project repository.
