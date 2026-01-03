# Secrets Rotation Guide

This guide provides comprehensive procedures for rotating all secrets used in the DotCA project, including SSH keys, API tokens, environment variables, and infrastructure credentials.

## Table of Contents

- [Overview](#overview)
- [Secret Types and Rotation Schedules](#secret-types-and-rotation-schedules)
- [SSH Key Rotation](#ssh-key-rotation)
- [GitHub Actions Secrets Rotation](#github-actions-secrets-rotation)
- [API Key Rotation](#api-key-rotation)
- [Environment Variables Rotation](#environment-variables-rotation)
- [Ansible Vault Rotation](#ansible-vault-rotation)
- [Infrastructure Credentials Rotation](#infrastructure-credentials-rotation)
- [Emergency Procedures](#emergency-procedures)
- [Validation and Testing](#validation-and-testing)
- [Monitoring and Auditing](#monitoring-and-auditing)

## Overview

The DotCA project uses multiple types of secrets across different systems. Proper rotation ensures security and compliance while maintaining system availability.

### Key Principles

- **Zero Downtime**: Rotation procedures minimize service disruption
- **Rollback Ready**: All rotations include rollback procedures
- **Audit Trail**: Document all rotation activities
- **Multi-Person Approval**: Critical secrets require secondary approval
- **Testing First**: Always test rotations in staging before production

### Rotation Schedules

| Secret Type          | Rotation Frequency | Risk Level | Lead Time Required |
| -------------------- | ------------------ | ---------- | ------------------ |
| SSH Keys             | 90 days            | High       | 1 week             |
| API Tokens           | 90 days            | High       | 2 weeks            |
| Database Credentials | 90 days            | Critical   | 1 month            |
| GitHub Tokens        | 90 days            | High       | 1 week             |
| Infrastructure Keys  | 90 days            | Critical   | 2 weeks            |

## Secret Types and Rotation Schedules

### 1. SSH Keys

- **Location**: GitHub Secrets, 1Password, DigitalOcean
- **Rotation**: Every 90 days or after security incidents
- **Impact**: Affects deployments and server access

### 2. GitHub Actions Secrets

- **Location**: Repository Settings > Secrets and variables > Actions
- **Types**: DO_TOKEN, SSH_PRIVATE_KEY, SPACES_ACCESS_ID, etc.
- **Rotation**: Every 90 days

### 3. API Keys and Tokens

- **Services**: Stripe, Brevo, Google Analytics, Umami
- **Rotation**: Every 90 days
- **Impact**: Affects payment processing, emails, analytics

### 4. Ansible Vault

- **Location**: `ansible/vars/vault-vars.yml`
- **Rotation**: Every 90 days or when team members change
- **Impact**: Affects deployment automation

### 5. Infrastructure Credentials

- **Services**: DigitalOcean, Terraform, Docker Registry
- **Rotation**: Every 90 days
- **Impact**: Affects infrastructure provisioning

## SSH Key Rotation

> **Note**: This section builds on the existing [SSH Key Management Guide](SSH_KEY_MANAGEMENT.md). Refer to that document for detailed SSH key procedures.

### Prerequisites

- 1Password CLI installed and configured
- Access to DevOps vault in 1Password
- DigitalOcean account access
- GitHub repository admin access

### Automated Rotation Process

```bash
# Generate new keys and update all systems
./scripts/rotate-ssh-keys.sh production

# Verify the rotation
./scripts/verify-ssh-access.sh production
```

### Manual Rotation Steps

#### 1. Generate New SSH Key Pair

```bash
# Generate new RSA 4096 key (recommended)
ssh-keygen -t rsa -b 4096 -C "dotca-production-$(date +%Y%m%d)" -f ~/.ssh/dotca_new

# For Ed25519 (more secure, but less compatible)
ssh-keygen -t ed25519 -C "dotca-production-$(date +%Y%m%d)" -f ~/.ssh/dotca_new
```

#### 2. Update 1Password

```bash
# Sign in to 1Password
op signin

# Update the production SSH key item
op item edit "DotCA-DigitalOcean-Production" \
  --vault "DevOps" \
  --field "private_key" < ~/.ssh/dotca_new \
  --field "public_key" < ~/.ssh/dotca_new.pub
```

#### 3. Update GitHub Secrets

1. Go to Repository Settings → Secrets and variables → Actions
2. Update `SSH_PRIVATE_KEY` with new private key content
3. Update `SSH_KEY_FINGERPRINT` with new key fingerprint:

```bash
ssh-keygen -lf ~/.ssh/dotca_new.pub
```

#### 4. Update DigitalOcean

1. Log in to DigitalOcean console
2. Go to Settings → Security → SSH Keys
3. Add the new public key
4. Note the new key's fingerprint for Terraform configuration updates

#### 5. Update Terraform Variables

```bash
# Update terraform.tfvars or environment variables
export TF_VAR_ssh_key_fingerprint="$(ssh-keygen -lf ~/.ssh/dotca_new.pub | awk '{print $2}')"
export TF_VAR_ssh_key_name="dotCA-Production-$(date +%Y%m%d)"
```

#### 6. Test Deployment

```bash
# Test deployment with new keys
gh workflow run deploy.yml -f promoted_image_tag=main

# Monitor deployment logs for SSH errors
gh run watch
```

#### 7. Clean Up Old Keys

After successful verification (minimum 24 hours):

```bash
# Remove old keys from DigitalOcean
# Remove old keys from 1Password (keep as backup for 30 days)
# Update documentation with new key information
```

## GitHub Actions Secrets Rotation

### Required Secrets

| Secret Name                          | Purpose                  | Rotation Impact |
| ------------------------------------ | ------------------------ | --------------- |
| `DO_TOKEN`                           | DigitalOcean API access  | High            |
| `SSH_PRIVATE_KEY`                    | Server deployment access | Critical        |
| `SSH_KEY_FINGERPRINT`                | Terraform validation     | Medium          |
| `SPACES_ACCESS_ID`                   | Object storage access    | Medium          |
| `SPACES_SECRET_KEY`                  | Object storage secret    | Medium          |
| `BREVO_API_KEY`                      | Email service            | Medium          |
| `STRIPE_SECRET_KEY`                  | Payment processing       | Critical        |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Payment forms            | Medium          |
| `NEXT_PUBLIC_PRODUCTION_GA_ID`       | Analytics                | Low             |
| `ANSIBLE_VAULT_PASSWORD`             | Deployment automation    | Critical        |

### Rotation Process

#### 1. Generate New Secrets

```bash
# DigitalOcean Token
# Go to DigitalOcean Console → API → Generate New Token
# Copy the new token

# Spaces Credentials
# Go to DigitalOcean Console → Spaces → API → Generate New Key
# Copy Access Key ID and Secret Key

# Ansible Vault Password
openssl rand -base64 32 > new_vault_password.txt
```

#### 2. Update GitHub Secrets

1. Go to Repository Settings → Secrets and variables → Actions
2. For each secret to rotate:

```bash
# Example: Update DO_TOKEN
gh secret set DO_TOKEN -R owner/repo --body "new_digitalocean_token"

# Update SPACES_ACCESS_ID
gh secret set SPACES_ACCESS_ID -R owner/repo --body "new_spaces_access_id"

# Update SPACES_SECRET_KEY
gh secret set SPACES_SECRET_KEY -R owner/repo --body "new_spaces_secret_key"
```

#### 3. Test Deployments

```bash
# Test staging deployment first
gh workflow run deploy.yml

# If successful, test production
gh workflow run deploy.yml -f promoted_image_tag=main
```

#### 4. Update Ansible Vault (if password changed)

```bash
# Re-encrypt vault with new password
ansible-vault rekey ansible/vars/vault-vars.yml
```

## API Key Rotation

### Stripe Keys

#### Prerequisites

- Stripe dashboard access
- Test the rotation in staging first

#### Process

1. **Create New API Keys**
   - Log in to Stripe Dashboard
   - Go to Developers → API keys
   - Create new secret and publishable keys
   - Label them with rotation date

2. **Update Environment Variables**

   ```bash
   # Update staging first
   export STRIPE_SECRET_KEY="sk_test_new_key_here"
   export NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_new_key_here"

   # Deploy to staging and test
   gh workflow run deploy.yml
   ```

3. **Update Production**

   ```bash
   # Update production secrets
   gh secret set STRIPE_SECRET_KEY -R owner/repo --body "sk_live_new_key_here"
   gh secret set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY -R owner/repo --body "pk_live_new_key_here"

   # Deploy to production
   gh workflow run deploy.yml -f promoted_image_tag=main
   ```

4. **Disable Old Keys**
   - Wait 7 days after successful deployment
   - Disable old keys in Stripe dashboard
   - Delete old keys after 30 days

### Brevo (Sendinblue) API Keys

1. **Generate New API Key**
   - Log in to Brevo dashboard
   - Go to SMTP & API → API Keys
   - Create new API key with appropriate permissions

2. **Update Secrets**

   ```bash
   # Update GitHub secret
   gh secret set BREVO_API_KEY -R owner/repo --body "new_brevo_api_key"

   # Test deployment
   gh workflow run deploy.yml -f promoted_image_tag=main
   ```

3. **Clean Up**
   - Delete old API key after verification

### Google Analytics

1. **Create New Property/Measurement ID**
   - Log in to Google Analytics
   - Create new GA4 property or measurement ID

2. **Update Environment**

   ```bash
   # Update the appropriate GA ID
   gh secret set NEXT_PUBLIC_PRODUCTION_GA_ID -R owner/repo --body "G-XXXXXXXXXX"
   ```

3. **Test Analytics**
   - Deploy and verify tracking works
   - Update any custom dashboards/reports

## Environment Variables Rotation

### Staging Environment

```bash
# Update staging environment variables
cp .env.staging .env.staging.backup
# Edit .env.staging with new values
# Deploy and test
```

### Production Environment

```bash
# Update via GitHub secrets (preferred method)
gh secret set ENVIRONMENT_VARIABLE_NAME -R owner/repo --body "new_value"

# Or update ansible vault variables
ansible-vault edit ansible/vars/vault-vars.yml
```

### Local Development

```bash
# Update .env.local
cp .env.local .env.local.backup
# Edit with new values
npm run dev
# Test locally
```

## Ansible Vault Rotation

### Prerequisites

- Ansible vault password access
- Access to `ansible/vars/vault-vars.yml`

### Process

1. **Generate New Vault Password**

   ```bash
   openssl rand -base64 32 > new_ansible_vault_password.txt
   chmod 600 new_ansible_vault_password.txt
   ```

2. **Re-encrypt Vault File**

   ```bash
   cd ansible/vars
   ansible-vault rekey vault-vars.yml
   # Enter old password, then new password
   ```

3. **Update GitHub Secret**

   ```bash
   gh secret set ANSIBLE_VAULT_PASSWORD -R owner/repo --body "$(cat new_ansible_vault_password.txt)"
   ```

4. **Test Deployment**

   ```bash
   # Test with new vault password
   gh workflow run deploy.yml -f promoted_image_tag=main
   ```

5. **Distribute New Password**
   - Share new password with authorized team members
   - Update password manager entries

## Infrastructure Credentials Rotation

### DigitalOcean Token

1. **Generate New Token**
   - Log in to DigitalOcean Console
   - API → Tokens/Keys → Generate New Token
   - Copy the token immediately

2. **Update Terraform**

   ```bash
   export TF_VAR_do_token="new_token_here"
   terraform plan  # Verify changes
   terraform apply # Apply if safe
   ```

3. **Update GitHub Secrets**

   ```bash
   gh secret set DO_TOKEN -R owner/repo --body "new_token_here"
   ```

4. **Test Infrastructure**
   ```bash
   # Test deployment with new token
   gh workflow run deploy.yml -f promoted_image_tag=main
   ```

### Docker Registry Credentials

1. **Generate New Token**
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate new token with `repo`, `write:packages`, `read:packages` scopes

2. **Update Secrets**
   ```bash
   gh secret set GHCR_TOKEN -R owner/repo --body "new_github_token"
   ```

## Emergency Procedures

### Security Incident Response

#### Immediate Actions (Within 1 Hour)

1. **Assess the Breach**
   - Identify compromised secrets
   - Determine exposure scope (staging/production/both)

2. **Contain the Breach**

   ```bash
   # Revoke compromised tokens immediately
   # This script revokes all potentially compromised secrets
   ./scripts/emergency-secret-revocation.sh
   ```

3. **Rotate Critical Secrets**

   ```bash
   # Rotate SSH keys
   ./scripts/emergency-ssh-rotation.sh

   # Rotate API keys
   ./scripts/emergency-api-key-rotation.sh
   ```

4. **Notify Team**
   - Alert security team and stakeholders
   - Document incident details

#### Recovery Actions (Within 4 Hours)

1. **Deploy Security Patches**

   ```bash
   # Emergency deployment with security fixes
   gh workflow run emergency-deploy.yml -f security_patch=true
   ```

2. **Monitor Systems**
   - Enable enhanced logging
   - Monitor for unauthorized access attempts

3. **Restore from Backups** (if needed)
   ```bash
   # Restore clean state if systems compromised
   ./scripts/emergency-restore.sh
   ```

### Rollback Procedures

#### SSH Key Rollback

```bash
# Restore previous SSH key from backup
op read "op://DevOps/DotCA-DigitalOcean-Production-Backup/private_key" > ~/.ssh/dotca_rollback

# Update GitHub secrets with backup key
gh secret set SSH_PRIVATE_KEY -R owner/repo --body "$(cat ~/.ssh/dotca_rollback)"

# Update key fingerprint
FINGERPRINT=$(ssh-keygen -lf ~/.ssh/dotca_rollback.pub | awk '{print $2}')
gh secret set SSH_KEY_FINGERPRINT -R owner/repo --body "$FINGERPRINT"
```

#### API Key Rollback

```bash
# Restore previous API keys from backup
gh secret set STRIPE_SECRET_KEY -R owner/repo --body "$BACKUP_STRIPE_KEY"
gh secret set BREVO_API_KEY -R owner/repo --body "$BACKUP_BREVO_KEY"

# Deploy with backup keys
gh workflow run deploy.yml -f rollback=true
```

## Validation and Testing

### Pre-Rotation Validation

```bash
# Run comprehensive validation
./scripts/validate-secrets.sh

# Check secret formats
./scripts/check-secret-formats.sh

# Verify secret permissions
./scripts/audit-secret-access.sh
```

### Post-Rotation Testing

#### Automated Testing

```bash
# Test all integrations
npm run test:integration

# Test deployment pipeline
gh workflow run integration-tests.yml

# Test production deployment
gh workflow run deploy.yml -f promoted_image_tag=main -f skip_user_tests=false
```

#### Manual Testing Checklist

- [ ] SSH access to production servers works
- [ ] Deployment pipeline completes successfully
- [ ] Payment processing works (Stripe)
- [ ] Email delivery works (Brevo)
- [ ] Analytics tracking works (GA/Umami)
- [ ] Application loads without errors
- [ ] Database connections work
- [ ] File storage access works

### Secret Validation Scripts

```bash
#!/bin/bash
# validate-secrets.sh

echo "🔍 Validating secret formats..."

# Check SSH key format
if ! ssh-keygen -lf ~/.ssh/dotca_new.pub > /dev/null 2>&1; then
  echo "❌ Invalid SSH public key format"
  exit 1
fi

# Check Stripe key format
if [[ ! $STRIPE_SECRET_KEY =~ ^sk_(test|live)_ ]]; then
  echo "❌ Invalid Stripe secret key format"
  exit 1
fi

# Check Brevo API key format (should be base64-like)
if [[ ! $BREVO_API_KEY =~ ^[A-Za-z0-9_-]{20,}$ ]]; then
  echo "❌ Invalid Brevo API key format"
  exit 1
fi

echo "✅ All secrets passed format validation"
```

## Monitoring and Auditing

### Audit Logging

All secret rotation activities are logged with:

- Timestamp
- User performing rotation
- Secret type rotated
- Environment affected
- Success/failure status
- Rollback information (if applicable)

### Monitoring Alerts

Set up alerts for:

- Failed rotation attempts
- Secret format validation failures
- Deployment failures after rotation
- Unauthorized access attempts
- Secret expiration warnings

### Compliance Reporting

Maintain records for:

- Rotation schedules and completion
- Security incident responses
- Access reviews
- Audit trail reviews

### Regular Audits

- **Monthly**: Review secret access logs
- **Quarterly**: Full security assessment
- **Annually**: Complete secret inventory review

## Quick Reference

### Emergency Contacts

- **Security Lead**: [security@company.com](mailto:security@company.com)
- **DevOps Lead**: [devops@company.com](mailto:devops@company.com)
- **On-call Engineer**: Check PagerDuty rotation

### Critical Timeframes

- **SSH Key Rotation**: Complete within 4 hours of compromise
- **API Key Rotation**: Complete within 2 hours of compromise
- **Full System Rotation**: Complete within 8 hours of major breach

### Backup Locations

- **1Password**: DevOps vault for all production secrets
- **GitHub**: Repository secrets (automatically backed up)
- **Offline**: Encrypted backups in secure location

---

**Last Updated**: $(date)
**Version**: 1.0
**Review Schedule**: Monthly
**Maintainer**: DevOps Team

---

## Appendices

### Appendix A: Secret Inventory

Complete list of all secrets used in the project with their locations and rotation schedules.

### Appendix B: Automated Scripts

Reference for all automation scripts used in rotation procedures.

### Appendix C: Troubleshooting

Common issues and their solutions during secret rotation.
