#!/bin/bash
# Deployment script for different environments
# Check if environment argument is provided
if [ -z "$1" ]; then
  echo "Usage: ./deploy.sh <environment>"
  echo "Available environments: qa, staging, production"
  exit 1
fi
ENV=$1
# Convert 'main' to 'production' for consistency in environment naming
if [ "$ENV" == "main" ]; then
  ENV="production"
  echo "Using 'main' branch as 'production' environment"
fi
ENV_FILE=".env.$ENV"

# Function to handle Ansible-based deployments (for QA, Staging, and Production)
function deploy_with_ansible() {
  local env=$1
  local ansible_playbook="$env-deploy.yml"
  
  echo "Running $env deployment using Ansible..."
  
  # Create environment file from GitHub secrets if it doesn't exist
  if [ ! -f "$ENV_FILE" ]; then
    echo "Environment file $ENV_FILE not found, creating from GitHub secrets..."
    
    # Check if running in GitHub Actions context
    if [ -n "$GITHUB_ACTIONS" ]; then
      # Create environment file from GitHub secrets with environment-specific variables
      if [ "$env" == "production" ]; then
        cat > "$ENV_FILE" << EOF
# $env Environment Configuration
NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=$env
# Git and SSH Configuration
GIT_REPO_URL=${GIT_REPO_URL}
SSH_KEY_PATH=${SSH_KEY_PATH}
GA_ID=${GA_PRODUCTION_ID}
EOF
      else
        cat > "$ENV_FILE" << EOF
# $env Environment Configuration
NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=$env
# Git and SSH Configuration
GIT_REPO_URL=${GIT_REPO_URL}
SSH_KEY_PATH=${SSH_KEY_PATH}
GA_ID=${GA_STAGING_ID}
EOF
      fi
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
  export GIT_REPO_URL=${GIT_REPO_URL:-"https://github.com/bxmty/dotca.git"}
  export SSH_KEY_PATH=${SSH_KEY_PATH:-"~/.ssh/do_key"}
  
  # Use the DROPLET_IP from environment variable
  if [ -z "$DROPLET_IP" ]; then
    echo "Error: DROPLET_IP environment variable not set"
    exit 1
  fi
  
  echo "Using Droplet IP: $DROPLET_IP"
  
  # Check if SSH key exists and has correct permissions
  if [ ! -f "$SSH_KEY_PATH" ]; then
    echo "Warning: SSH key file $SSH_KEY_PATH does not exist"
    # If running in CI/CD, we may need to create the key from a secret
    if [ -n "$SSH_PRIVATE_KEY" ] && [ -n "$GITHUB_ACTIONS" ]; then
      echo "Creating SSH key file from GITHUB_ACTIONS secret..."
      mkdir -p $(dirname "$SSH_KEY_PATH")
      echo "$SSH_PRIVATE_KEY" > "$SSH_KEY_PATH"
      chmod 600 "$SSH_KEY_PATH"
    else
      echo "Error: SSH key file $SSH_KEY_PATH not found and no SSH_PRIVATE_KEY provided"
      exit 1
    fi
  else
    # Ensure correct permissions
    chmod 600 "$SSH_KEY_PATH"
    echo "SSH key file $SSH_KEY_PATH found and permissions set to 600"
  fi
  
  # Update inventory.yml with the correct IP
  cat > ./ansible/inventory.yml << EOF
all:
  children:
    digitalocean:
      hosts:
        ${env}_server:
          ansible_host: $DROPLET_IP
          ansible_user: root
          ansible_ssh_private_key_file: $SSH_KEY_PATH
          ansible_connection: ssh
          ansible_ssh_common_args: '-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null'
      vars:
        ${env}_server_ip: $DROPLET_IP
        ansible_python_interpreter: /usr/bin/python3
EOF
  
  # Run Ansible playbook with the updated inventory
  cd ansible
  echo "Running Ansible with inventory:"
  cat inventory.yml
  echo "Using SSH key: $SSH_KEY_PATH"
  
  # Setup environment variables for Ansible
  export ANSIBLE_HOST_KEY_CHECKING=False
  export ANSIBLE_PYTHON_INTERPRETER=auto_silent
  export ANSIBLE_STDOUT_CALLBACK=yaml
  export ANSIBLE_TIMEOUT=60
  
  # Test connection first
  ansible -i inventory.yml digitalocean -m ping -v
  
  # Set environment-specific environment variables for Ansible
  if [ "$env" == "production" ]; then
    export BREVO_API_KEY=${BREVO_API_KEY}
    export STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
    export STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}
    export GA_PRODUCTION_ID=${GA_PRODUCTION_ID}
  else
    export BREVO_API_KEY=${BREVO_API_KEY}
    export STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
    export STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}
    export GA_STAGING_ID=${GA_STAGING_ID}
  fi
  
  # Run the playbook
  # Make sure we're using the right filename for the playbook
  if [ "$env" == "production" ] && [ ! -f "$ansible_playbook" ]; then
    echo "Production playbook not found at $ansible_playbook, checking for alternative names..."
    if [ -f "production-deploy.yml" ]; then
      ansible_playbook="production-deploy.yml"
      echo "Using production-deploy.yml"
    fi
  fi
  
  # Verify that the playbook exists
  if [ ! -f "$ansible_playbook" ]; then
    echo "Error: Ansible playbook $ansible_playbook not found"
    exit 1
  fi
  
  ansible-playbook -i inventory.yml $ansible_playbook
  cd ..
}

# Main deployment logic
if [ "$ENV" == "qa" ] || [ "$ENV" == "staging" ] || [ "$ENV" == "production" ]; then
  deploy_with_ansible $ENV
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

# Print success message with URL
if [ "$ENV" == "qa" ] || [ "$ENV" == "staging" ] || [ "$ENV" == "production" ]; then
  echo ""
  echo "=========================================================="
  echo "🚀 Deployment to $ENV environment completed!"
  echo "🌐 Application URL: http://$DROPLET_IP"
  echo "=========================================================="
else
  echo "$ENV deployment completed!"
fi