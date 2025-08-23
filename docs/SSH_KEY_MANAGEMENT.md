# SSH Key Management Guide

This document outlines the SSH key management strategy for the DotCA project, including 1Password integration and security best practices.

## Overview

The project uses SSH keys for:
- **CI/CD Deployments**: GitHub Actions connecting to DigitalOcean droplets
- **Local Development**: Manual deployments and server management
- **Infrastructure Provisioning**: Terraform managing server access

## Storage Strategy

### 1. GitHub Secrets (Production/CI/CD)
- **Purpose**: Automated deployments in GitHub Actions
- **Location**: Repository Settings > Secrets and variables > Actions
- **Keys Stored**:
  - `SSH_PRIVATE_KEY`: Private key for server access
  - `SSH_KEY_FINGERPRINT`: Key fingerprint for Terraform validation

### 2. 1Password (Development/Management)
- **Purpose**: Secure storage, local development, key rotation
- **Location**: DevOps vault in 1Password
- **Structure**:
  ```
  DevOps/
  ├── DotCA-DigitalOcean-Production
  ├── DotCA-DigitalOcean-Staging
  ├── DotCA-DigitalOcean-QA
  └── DotCA-GitHub-Deploy
  ```

## Setup Instructions

### 1. Install 1Password CLI

```bash
# Ubuntu/WSL2
curl -sSL https://downloads.1password.com/linux/keys/1password.asc | sudo gpg --dearmor --output /usr/share/keyrings/1password-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/1password-archive-keyring.gpg] https://downloads.1password.com/linux/debian/$(dpkg --print-architecture) stable main" | sudo tee /etc/apt/sources.list.d/1password.list
sudo apt update && sudo apt install 1password-cli

# Sign in
op account add --address your-account.1password.com --email your-email@example.com
op signin
```

### 2. Configure SSH Agent Integration

1. Enable 1Password SSH agent:
   - Open 1Password 8 desktop app
   - Settings > Developer > "Use the SSH agent"

2. Configure SSH client:
   ```bash
   # Add to ~/.ssh/config
   Host *
       IdentityAgent ~/.1password/agent.sock
   ```

### 3. Local Development Setup

```bash
# Setup local environment with 1Password integration
./scripts/setup-local-env.sh staging

# Source the generated environment
source .env.local

# Deploy locally
./deploy.sh staging
```

## Key Rotation Process

### Automated Key Rotation

```bash
# Generate new keys and update 1Password
./scripts/rotate-ssh-keys.sh production
```

### Manual Steps After Rotation

1. **Update GitHub Secrets**:
   - Go to repository Settings > Secrets and variables > Actions
   - Update `SSH_PRIVATE_KEY` with new private key
   - Update `SSH_KEY_FINGERPRINT` with new fingerprint

2. **Update DigitalOcean**:
   - Add new public key to DigitalOcean account
   - Update Terraform configurations if needed

3. **Test Deployments**:
   - Trigger test deployment to verify connectivity
   - Monitor deployment logs for SSH errors

4. **Clean Up**:
   - Remove old keys from DigitalOcean after successful verification
   - Update documentation with new key information

## Security Best Practices

### Key Requirements
- **Type**: RSA 4096-bit minimum (Ed25519 preferred for new keys)
- **Rotation**: Every 90 days or after security incidents
- **Access**: Limit to necessary personnel only
- **Passphrase**: Use for local development keys (optional for CI/CD)

### Access Control
- 1Password vault access restricted to DevOps team
- GitHub repository secrets access limited to administrators
- Regular audit of key usage and access logs

### Monitoring
- Monitor failed SSH authentication attempts
- Alert on unexpected key usage patterns
- Regular review of active keys in DigitalOcean

## Environment-Specific Keys

### Production
- **Usage**: Production deployments only
- **Access**: Senior developers and DevOps lead
- **Rotation**: Monthly or immediately after incidents

### Staging
- **Usage**: Staging deployments and testing
- **Access**: Development team
- **Rotation**: Every 60 days

### QA
- **Usage**: QA environment testing
- **Access**: QA team and developers
- **Rotation**: Every 90 days

## Troubleshooting

### Common Issues

1. **SSH Key Fingerprint Mismatch**:
   ```bash
   # Recalculate fingerprint
   ssh-keygen -lf ~/.ssh/id_rsa
   # Update GitHub secrets with correct fingerprint
   ```

2. **Permission Denied**:
   ```bash
   # Check key permissions
   chmod 600 ~/.ssh/id_rsa
   # Verify key is added to DigitalOcean
   ```

3. **1Password CLI Authentication**:
   ```bash
   # Re-authenticate
   op signin
   # Check account status
   op account list
   ```

### Emergency Access

If 1Password is unavailable:
1. Use emergency SSH keys stored in secure offline location
2. Generate temporary keys for immediate access
3. Follow emergency key rotation procedure

## Scripts Reference

- `scripts/setup-local-env.sh`: Local development environment setup
- `scripts/rotate-ssh-keys.sh`: Automated key rotation
- `deploy.sh`: Main deployment script (handles SSH key setup)

## Compliance Notes

- SSH keys are encrypted at rest in both GitHub and 1Password
- Access logs are maintained for audit purposes
- Key rotation follows company security policy
- All keys use strong cryptographic standards

---

**Last Updated**: $(date)
**Maintainer**: DevOps Team
**Review Schedule**: Monthly
