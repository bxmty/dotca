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

  # Minimal setup script for Ansible compatibility
  user_data = <<-EOF
    #!/bin/bash
    set -e

    # Create a startup log file
    exec > >(tee /var/log/user-data.log) 2>&1
    echo "Starting minimal initialization: $(date)"
    
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
    
    # Install Python for Ansible
    echo "Installing Python for Ansible..."
    DEBIAN_FRONTEND=noninteractive apt-get install -y python3 python3-pip
    
    # Mark initialization as complete
    echo "Droplet initialized and ready for Ansible: $(date)" > /var/log/tf-init-complete
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
