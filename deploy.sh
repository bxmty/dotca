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

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: Environment file $ENV_FILE not found"
  exit 1
fi

echo "Deploying to $ENV environment..."

# Load environment variables
set -a
source "$ENV_FILE"
set +a

if [ "$ENV" == "qa" ]; then
  echo "Running qa deployment using Ansible..."
  
  # Set required environment variables for Ansible
  export GIT_REPO_URL=${GIT_REPO_URL:-"https://github.com/your-org/dotCA.git"}
  export SSH_KEY_PATH=${SSH_KEY_PATH:-"~/.ssh/id_rsa"}
  export DROPLET_IP=${DROPLET_IP}
  
  # Check if DROPLET_IP is set
  if [ -z "$DROPLET_IP" ]; then
    echo "Error: DROPLET_IP environment variable must be set in $ENV_FILE"
    exit 1
  fi
  
  # Run Ansible playbook for qa deployment
  cd ansible
  ansible-playbook qa-deploy.yml -v
  cd ..
else
  # Build and deploy using docker-compose for other environments
  docker-compose build
  docker-compose up -d
fi

echo "$ENV deployment completed!"