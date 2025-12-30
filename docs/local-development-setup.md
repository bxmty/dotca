# Local Development Setup Guide

This guide enables developers to run Terraform and Ansible deployments locally when GitHub Actions workflows fail, providing a backup execution path while maintaining environment parity with CI/CD.

## Prerequisites

### Required Tools

Install the following tools on your local development machine:

#### Terraform >= 1.5.0

```bash
# Download from https://www.terraform.io/downloads
# Or install via package manager:

# Ubuntu/Debian
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com jammy main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform

# macOS
brew tap hashicorp/tap
brew install hashicorp/tap/terraform

# Verify installation
terraform --version
```

#### Ansible

```bash
# Install Ansible
pip install ansible

# Install required Ansible collections
ansible-galaxy collection install community.general
ansible-galaxy collection install community.docker

# Verify installation
ansible --version
```

#### DigitalOcean CLI (doctl)

```bash
# Download and install doctl
# Linux
wget https://github.com/digitalocean/doctl/releases/download/v1.104.0/doctl-1.104.0-linux-amd64.tar.gz
tar xf doctl-1.104.0-linux-amd64.tar.gz
sudo mv doctl /usr/local/bin

# macOS
brew install doctl

# Authenticate
doctl auth init
doctl account get

# Verify installation
doctl version
```

#### Docker

```bash
# Install Docker Desktop or Docker Engine
# Follow instructions for your platform: https://docs.docker.com/get-docker/

# Verify installation
docker --version
docker run hello-world
```

#### SSH Agent Setup

```bash
# Ensure SSH agent is running
eval "$(ssh-agent -s)"

# Add your SSH key (replace with your key path)
ssh-add ~/.ssh/id_ed25519

# Verify SSH agent has keys
ssh-add -l
```

## Environment Variables Setup

### Required Environment Variables

Set these environment variables in your shell profile (`.bashrc`, `.zshrc`, etc.) or use a `.env` file:

```bash
# DigitalOcean API Access
export DO_TOKEN="your_digitalocean_api_token_here"

# SSH Configuration (uses SSH agent)
export SSH_KEY_FINGERPRINT="your_ssh_key_fingerprint_here"  # Optional: if multiple keys

# Application Secrets
export BREVO_API_KEY="your_brevo_api_key_here"
export STRIPE_SECRET_KEY="your_stripe_secret_key_here"
export STRIPE_PUBLISHABLE_KEY="your_stripe_publishable_key_here"
export GA_STAGING_ID="G-XXXXXXXXXX"  # Google Analytics staging
export GA_PRODUCTION_ID="G-XXXXXXXXXX"  # Google Analytics production

# Optional: Override defaults
export DOCKER_IMAGE="ghcr.io/yourusername/dotca:custom-tag"
export ANSIBLE_VAULT_PASSWORD="your_vault_password_if_using_encrypted_vars"
```

### Getting Your DigitalOcean Token

1. Go to [DigitalOcean Dashboard](https://cloud.digitalocean.com/account/api/tokens)
2. Generate a new Personal Access Token with read/write permissions
3. Copy the token and set it as `DO_TOKEN`

### Getting SSH Key Fingerprint

```bash
# If you have multiple SSH keys, get the fingerprint
ssh-keygen -l -E md5 -f ~/.ssh/your_key_file

# Or use doctl to list your keys
doctl compute ssh-key list
```

## SSH Key Management

### SSH Agent Integration

The local setup uses your system's SSH agent for authentication, providing seamless integration with your existing SSH key management:

```bash
# Check SSH agent status
ssh-add -l

# Add key if not present
ssh-add ~/.ssh/your_private_key

# Test connection to a droplet (replace IP)
ssh -o StrictHostKeyChecking=no root@YOUR_DROPLET_IP "echo 'SSH connection successful'"
```

### DigitalOcean SSH Key Association

Ensure your SSH public key is associated with your DigitalOcean account:

```bash
# Import your public key to DigitalOcean
doctl compute ssh-key create my-local-key --public-key "$(cat ~/.ssh/id_ed25519.pub)"

# List your SSH keys
doctl compute ssh-key list

# Note the fingerprint for use in Terraform variables
```

### SSH Key Security Best Practices

- Use Ed25519 keys (more secure than RSA)
- Protect private keys with strong passphrases
- Never commit private keys to version control
- Regularly rotate SSH keys
- Use SSH agent forwarding when needed

## Architecture Overview

### Component Architecture

```mermaid
graph TB
    subgraph "Developer Workstation"
        DEV[Developer Machine]
        SSH_AGENT[SSH Agent]
        TERRAFORM[Terraform CLI]
        ANSIBLE[Ansible CLI]
        DOCKER[Docker CLI]
    end

    subgraph "Local Execution Path"
        TERRAFORM --> TF_INIT[terraform init]
        TF_INIT --> TF_PLAN[terraform plan]
        TF_PLAN --> TF_APPLY[terraform apply]

        TF_APPLY --> ANSIBLE_RUN[ansible-playbook]
        ANSIBLE_RUN --> DOCKER_COMPOSE[docker-compose up]
    end

    subgraph "CI/CD Execution Path"
        GHACTIONS[GitHub Actions]
        GHACTIONS --> TF_ACTION[Terraform Action]
        GHACTIONS --> ANSIBLE_ACTION[Ansible Action]
        TF_ACTION --> ANSIBLE_ACTION
    end

    subgraph "Infrastructure"
        DO[DigitalOcean]
        DROPLET[Droplet Instance]
        REGISTRY[GHCR Registry]
    end

    DEV --> DO
    SSH_AGENT --> DROPLET
    DOCKER_COMPOSE --> REGISTRY
    TF_APPLY --> DROPLET
    DO --> DROPLET

    style DEV fill:#e1f5fe
    style TERRAFORM fill:#f3e5f5
    style ANSIBLE fill:#e8f5e8
    style GHACTIONS fill:#fff3e0
```

### Deployment Flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Local as Local Scripts
    participant TF as Terraform
    participant Ansible as Ansible
    participant DO as DigitalOcean
    participant Registry as GHCR

    Dev->>Local: make deploy ENVIRONMENT=staging
    Local->>Local: Validate environment & prerequisites

    Local->>TF: terraform init
    TF->>DO: Connect to remote state
    TF->>TF: terraform plan
    Dev->>TF: Review plan (optional)
    TF->>TF: terraform apply

    TF->>DO: Provision/Update infrastructure
    TF->>Local: Return droplet IP

    Local->>Ansible: ansible-playbook staging-deploy.yml
    Ansible->>DO: Connect via SSH agent
    Ansible->>Registry: docker login & pull images
    Ansible->>DO: Configure services & deploy

    Ansible->>Local: Deployment complete
    Local->>Dev: Success confirmation
```

## Local vs CI/CD Execution Differences

### Environment Parity

| Aspect                 | Local Execution       | CI/CD Execution    | Notes                                 |
| ---------------------- | --------------------- | ------------------ | ------------------------------------- |
| **Terraform Version**  | User-installed        | Pinned in workflow | Ensure local version >= 1.5.0         |
| **Ansible Version**    | User-installed        | Pinned in workflow | Compatible versions required          |
| **SSH Authentication** | SSH Agent             | Private key file   | Local uses agent, CI/CD uses secrets  |
| **Remote State**       | Same S3 backend       | Same S3 backend    | Shared state management               |
| **Secrets Management** | Environment variables | GitHub Secrets     | Same secret values, different access  |
| **Docker Registry**    | User authentication   | GITHUB_TOKEN       | Same registry, different auth methods |
| **Network Access**     | Developer network     | GitHub runners     | Firewall rules may differ             |

### Key Differences to Note

1. **SSH Authentication Method**:
   - Local: Uses SSH agent with developer's keys
   - CI/CD: Uses private key from GitHub secrets

2. **Registry Authentication**:
   - Local: Requires personal access token
   - CI/CD: Uses GITHUB_TOKEN automatically

3. **Network Restrictions**:
   - Local: May be behind corporate firewalls
   - CI/CD: GitHub runners have different network access

4. **Resource Limits**:
   - Local: Limited by developer machine
   - CI/CD: Consistent runner specifications

## Quick Start Workflow

### Initial Setup

```bash
# 1. Clone and setup project
git clone <repository-url>
cd dotca

# 2. Install prerequisites (see above)

# 3. Setup environment variables
cp .env.example .env.local  # If exists, or set manually
# Edit .env.local with your values

# 4. Setup SSH agent
ssh-add ~/.ssh/your_private_key

# 5. Validate setup
make validate

# 6. Test deployment (dry-run first)
make deploy ENVIRONMENT=staging DRY_RUN=true
```

### Common Operations

```bash
# Full deployment to staging
make deploy ENVIRONMENT=staging

# Deploy to production (with confirmation)
make deploy ENVIRONMENT=production

# Check environment status
make status ENVIRONMENT=staging

# Destroy environment (with confirmation)
make destroy ENVIRONMENT=staging

# Get help
make help
```

## Troubleshooting

### Common Issues and Solutions

#### SSH Connection Issues

**Error**: `Permission denied (publickey)`

```bash
# Check SSH agent has keys
ssh-add -l

# Add key if missing
ssh-add ~/.ssh/your_private_key

# Test connection manually
ssh -o StrictHostKeyChecking=no root@DROPLET_IP "echo 'Connection test'"

# Check SSH key fingerprint matches DigitalOcean
doctl compute ssh-key list
```

**Error**: `SSH agent not running`

```bash
# Start SSH agent
eval "$(ssh-agent -s)"

# Add your key
ssh-add ~/.ssh/your_private_key
```

#### Terraform Issues

**Error**: `Error acquiring the state lock`

```bash
# Check if another process is running Terraform
# Wait for CI/CD workflows to complete
# Force unlock if necessary (dangerous!)
terraform force-unlock LOCK_ID
```

**Error**: `DigitalOcean token not valid`

```bash
# Check token is set
echo $DO_TOKEN | head -c 10  # Should show start of token

# Test token with doctl
doctl account get

# Regenerate token if needed
# https://cloud.digitalocean.com/account/api/tokens
```

#### Ansible Issues

**Error**: `Failed to connect to the host via ssh`

```bash
# Check droplet IP is correct
ping DROPLET_IP

# Test SSH connection manually
ssh root@DROPLET_IP

# Check firewall rules
doctl compute firewall list
```

**Error**: `Docker login failed`

```bash
# Check GITHUB_TOKEN is set
echo $GITHUB_TOKEN | wc -c  # Should be > 0

# Test manual login
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Check token permissions
# https://github.com/settings/tokens
```

#### Docker Issues

**Error**: `Image not found`

```bash
# Check image exists in registry
docker search ghcr.io/yourusername/dotca

# Pull manually
docker pull ghcr.io/yourusername/dotca:staging

# Check registry permissions
```

### Debugging Commands

```bash
# Check all prerequisites
make validate

# Test Terraform connectivity
cd terraform && terraform init && terraform plan

# Test Ansible connectivity
ansible -i ansible/inventory/inventory.ini digitalocean -m ping

# Check Docker registry access
docker login ghcr.io
docker pull ghcr.io/yourusername/dotca:staging

# Test SSH connection
ssh -v root@DROPLET_IP

# Check DigitalOcean API access
doctl account get
doctl compute droplet list
```

### Getting Help

1. Check this documentation first
2. Review error messages carefully
3. Test components individually (Terraform → Ansible → Docker)
4. Compare with successful CI/CD runs
5. Check GitHub Issues for similar problems
6. Contact DevOps team for infrastructure issues

## Security Considerations

### Local Execution Security

- Never commit secrets to version control
- Use strong passphrases for SSH keys
- Regularly rotate API tokens and SSH keys
- Be cautious with `terraform destroy` operations
- Use environment-specific secrets appropriately

### Network Security

- Understand firewall rules before deployment
- Be aware of your network's restrictions
- Use VPN if required for corporate networks
- Monitor resource usage and costs

### Best Practices

- Always test with `DRY_RUN=true` first
- Review Terraform plans before applying
- Keep local and CI/CD environments in sync
- Document any local changes for team knowledge
- Use version control for infrastructure changes

## Related Documentation

- [GitHub Actions Workflow Documentation](../.github/workflows/README.md)
- [Ansible Playbook Documentation](../ansible/README.md)
- [Terraform Infrastructure Documentation](../terraform/README.md)
- [Secrets Management Guide](../docs/SECRETS_ROTATION_GUIDE.md)
- [SSH Key Management Guide](../docs/SSH_KEY_MANAGEMENT.md)

---

**Last Updated**: December 2025
**Version**: 1.0
**Authors**: DevOps Team
