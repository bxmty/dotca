#!/bin/bash
# Deployment script for different environments
# Check if environment argument is provided
if [ -z "$1" ]; then
  echo "Usage: ./deploy.sh <environment>"
  echo "Available environments: qa, staging, production"
  exit 1
fi
ENV=$1
ENV_FILE=".env.$ENV"
if [ "$ENV" == "qa" ]; then
  echo "Running qa deployment using Ansible..."
  
  # Create environment file from GitHub secrets if it doesn't exist
  if [ ! -f "$ENV_FILE" ]; then
    echo "Environment file $ENV_FILE not found, creating from GitHub secrets..."
    
    # Check if running in GitHub Actions context
    if [ -n "$GITHUB_ACTIONS" ]; then
      # Create .env.qa file from GitHub secrets
      cat > "$ENV_FILE" << EOF
# QA Environment Configuration
NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=qa
# Git and SSH Configuration
GIT_REPO_URL=${GIT_REPO_URL}
SSH_KEY_PATH=${SSH_KEY_PATH}
EOF
      echo "Created $ENV_FILE from GitHub secrets"
    else
      echo "Error: Not running in GitHub Actions and $ENV_FILE not found"
      exit 1
    fi
  fi
  
  # Load environment variables if the file exists
  if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
  fi
  
  # Set required environment variables for Ansible
  export GIT_REPO_URL=${GIT_REPO_URL:-"https://github.com/bxmty/dotCA.git"}
  export SSH_KEY_PATH=${SSH_KEY_PATH:-"~/.ssh/id_rsa"}
  
  # Use the DROPLET_IP from environment variable
  if [ -z "$DROPLET_IP" ]; then
    echo "Error: DROPLET_IP environment variable not set"
    exit 1
  fi
  
  echo "Using Droplet IP: $DROPLET_IP"
  
  # Update inventory.yml with the correct IP
  cat > ./ansible/inventory.yml << EOF
all:
  children:
    qa:
      hosts:
        qa_server:
          ansible_host: $DROPLET_IP
          ansible_user: root
          ansible_ssh_private_key_file: $SSH_KEY_PATH
      vars:
        qa_server_ip: $DROPLET_IP
EOF
  
  # Run Ansible playbook with the updated inventory
  cd ansible
  ansible-playbook -i inventory.yml qa-deploy.yml -v
  cd ..
else
  # For other environments
  if [ ! -f "$ENV_FILE" ]; then
    echo "Error: Environment file $ENV_FILE not found"
    exit 1
  fi
  echo "Deploying to $ENV environment..."
  set -a
  source "$ENV_FILE"
  set +a
  
  docker-compose build
  docker-compose up -d
fi
echo "$ENV deployment completed!"
