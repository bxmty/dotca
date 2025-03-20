# Ansible Deployment for dotCA

This directory contains Ansible playbooks for deploying the dotCA application to different environments.

## QA Deployment

The `qa-deploy.yml` playbook is used for setting up and deploying to the QA environment on Digital Ocean.

### Prerequisites

1. Ansible installed on your local machine:
   ```
   pip install ansible
   ```

2. Environment variables set in `.env.qa`:
   - `GIT_REPO_URL`: The Git repository URL for your project
   - `SSH_KEY_PATH`: Path to the SSH private key for accessing the droplet
   
   Note: `DROPLET_IP` is automatically obtained from Terraform outputs

### Deployment

To deploy to the QA environment:

```bash
# From the project root
./deploy.sh qa
```

This will:
1. Load the environment variables from `.env.qa`
2. Run the Ansible playbook to:
   - Update and install required packages
   - Set up Docker
   - Clone the repository
   - Build and run the Docker container
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
ansible-playbook qa-deploy.yml -v
```

## Inventory

The `inventory.yml` file defines the servers to deploy to. For the QA environment, it configures a single `qa-server` host with connection details derived from environment variables.

## Configuration

The `ansible.cfg` file contains Ansible configuration settings for the deployment.