# Ansible Deployment for dotca

This directory contains Ansible playbooks for deploying the dotca application to different environments.

## Deployment Environments

This project supports deployment to two environments:
- **Staging**: Used for testing and validation before production
- **Production**: Live production environment

### Prerequisites

1. Ansible installed on your local machine:
   ```
   pip install ansible
   ```

2. Environment variables configured for each environment:
   - `GIT_REPO_URL`: The Git repository URL for your project
   - `SSH_KEY_PATH`: Path to the SSH private key for accessing the droplet
   
   Note: `DROPLET_IP` is automatically obtained from Terraform outputs

### Deployment

To deploy to an environment:

```bash
# From the project root

# Deploy to staging
# Use GitHub Actions: Go to Actions → stg-deploy → Run workflow

# Deploy to production
# Use GitHub Actions: Go to Actions → prod-deploy → Run workflow
```

This will:
1. Load the environment variables from the respective `.env` file
2. Run the Ansible playbook to:
   - Update and install required packages
   - Set up Docker
   - Clone the repository from the appropriate branch
   - Pull and run the promoted Docker image
   - Configure the firewall

### Manual Execution

If you want to run the playbook manually:

```bash
# From project root
cd terraform
export DROPLET_IP=$(terraform output -raw droplet_ip)
cd ../ansible
export GIT_REPO_URL=your_repo_url
export SSH_KEY_PATH=path_to_your_ssh_key

# For staging
ansible-playbook staging-deploy.yml -v

# For production
ansible-playbook production-deploy.yml -v
```

## Inventory

The `inventory.yml` file is dynamically created by the deployment script and defines the servers to deploy to. It configures connection details derived from environment variables.

## Configuration

The `ansible.cfg` file contains Ansible configuration settings for the deployment.