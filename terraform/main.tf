# Digital Ocean provider configuration
terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
  required_version = ">= 1.0.0"
  
  backend "s3" {
    endpoint                    = "https://bxtf.tor1.digitaloceanspaces.com"
    region                      = "tor1"
    bucket                      = "bxtf"
    key                         = "terraform.tfstate"
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    force_path_style            = true
  }
}

# Configure the Digital Ocean Provider
provider "digitalocean" {
  token = var.do_token
}

# Look up existing project
data "digitalocean_project" "existing_project" {
  name = var.project_name
  count = var.use_existing_project ? 1 : 0
}

# Create a new Digital Ocean project if it doesn't exist
resource "digitalocean_project" "project" {
  count       = var.use_existing_project ? 0 : 1
  name        = var.project_name
  description = "${var.project_name} project created with Terraform"
  purpose     = "Web Application"
  environment = "Development"
}

# Add resources to project
resource "digitalocean_project_resources" "project_resources" {
  project = var.use_existing_project ? data.digitalocean_project.existing_project[0].id : digitalocean_project.project[0].id
  resources = [
    digitalocean_droplet.qa_dotca.urn
  ]
  depends_on = [digitalocean_droplet.qa_dotca]
}

# Create a new Droplet for QA environment
resource "digitalocean_droplet" "qa_dotca" {
  image    = "docker-20-04"  # Docker-ready Ubuntu image
  name     = "${var.project_name}-qa"
  region   = var.region
  size     = "s-1vcpu-1gb"   # Small droplet with 1 CPU, 1GB RAM
  ssh_keys = [var.ssh_key_fingerprint]
  tags     = ["qa", "nextjs", var.project_name]

  # Script to set up the droplet for running the Next.js container
  user_data = <<-EOF
    #!/bin/bash
    set -e

    # Create a startup log file
    exec > >(tee /var/log/user-data.log) 2>&1
    echo "Starting initialization: $(date)"
    
    # Wait until apt is available
    echo "Waiting for apt to be available..."
    until apt-get update -q; do
      echo "Apt not ready yet, waiting..."
      sleep 5
    done
    
    # Update system
    echo "Updating system packages..."
    apt-get update
    DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
    
    # Install required packages
    echo "Installing required packages..."
    DEBIAN_FRONTEND=noninteractive apt-get install -y git curl wget apt-transport-https ca-certificates gnupg lsb-release
    
    # Install Docker
    echo "Installing Docker..."
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
    apt-get update
    DEBIAN_FRONTEND=noninteractive apt-get install -y docker-ce docker-ce-cli containerd.io
    systemctl enable docker
    systemctl start docker
    
    # Create directory for the app
    echo "Creating application directory..."
    mkdir -p /app
    
    # Clone the repository
    echo "Cloning repository: ${var.git_repo_url}..."
    git clone ${var.git_repo_url} /app/repo
    cd /app/repo
    git checkout ${var.git_branch}
    
    # Create a deploy script to build and run the Docker container
    echo "Creating deployment script..."
    cat > /app/deploy.sh <<'SCRIPT'
    #!/bin/bash
    set -e
    
    echo "Starting deployment: $(date)"
    cd /app/repo
    
    # Get the public IP address
    PUBLIC_IP=$(curl -s http://169.254.169.254/metadata/v1/interfaces/public/0/ipv4/address)
    echo "Using public IP: $PUBLIC_IP"
    
    # Pull latest changes
    echo "Pulling latest changes from ${var.git_branch}..."
    git pull origin ${var.git_branch}
    
    # Build the Docker image locally
    echo "Building Docker image..."
    docker build \
      --build-arg NODE_ENV=production \
      --build-arg NEXT_PUBLIC_API_URL=http://$PUBLIC_IP/api \
      --build-arg NEXT_PUBLIC_ENVIRONMENT=qa \
      -t dotca_qa:latest .
    
    # Stop and remove any existing container
    echo "Stopping and removing any existing container..."
    docker stop dotca_qa 2>/dev/null || true
    docker rm dotca_qa 2>/dev/null || true
    
    # Run the new container
    echo "Starting new container..."
    docker run -d \
      --name dotca_qa \
      --restart unless-stopped \
      -p 80:3000 \
      -e NODE_ENV=production \
      -e NEXT_PUBLIC_API_URL=http://$PUBLIC_IP/api \
      -e NEXT_PUBLIC_ENVIRONMENT=qa \
      dotca_qa:latest
      
    echo "Deployment completed: $(date)"
    SCRIPT

    # Make the script executable
    chmod +x /app/deploy.sh

    # Setup complete marker to help with troubleshooting
    echo "System initialization complete: $(date)" > /var/log/tf-init-complete
    
    # Run the deploy script in the background to not block instance startup
    echo "Starting deployment in the background..."
    nohup /app/deploy.sh > /var/log/deploy.log 2>&1 &
    
    echo "Initialization script completed: $(date)"
  EOF
}

# Create a firewall
resource "digitalocean_firewall" "qa_firewall" {
  count = var.use_existing_firewall ? 0 : 1
  name = "${var.project_name}-qa-firewall-${formatdate("YYYYMMDD-HHmm", timestamp())}"
  
  # Allow SSH
  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = length(var.allowed_ssh_ips) > 0 ? var.allowed_ssh_ips : ["0.0.0.0/0", "::/0"]
  }

  # Allow HTTP
  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # Allow HTTPS
  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # Allow all outbound traffic
  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "icmp"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  # Apply the firewall to the droplet
  droplet_ids = [digitalocean_droplet.qa_dotca.id]
}
