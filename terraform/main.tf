# Digital Ocean provider configuration
terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "2.74.0"
    }
  }
  required_version = "1.14.3"

  # Backend configuration is handled by separate backend-*.tf files
  # based on the use_local_state variable
}

# Configure the Digital Ocean Provider
provider "digitalocean" {
  token = var.do_token
}

# Get environment-specific subdomain
locals {
  subdomain = var.subdomain != "" ? var.subdomain : var.environment
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
  environment = var.environment == "production" ? "Production" : "Development"
}

# Add resources to project
resource "digitalocean_project_resources" "project_resources" {
  project = var.use_existing_project ? data.digitalocean_project.existing_project[0].id : digitalocean_project.project[0].id
  resources = [
    digitalocean_droplet.app_droplet.urn
  ]
  depends_on = [digitalocean_droplet.app_droplet]
}

# Get all SSH keys from DigitalOcean account
data "digitalocean_ssh_keys" "all_keys" {}

# Find SSH key by fingerprint or name
locals {
  # Filter keys by fingerprint if provided
  keys_by_fingerprint = var.ssh_key_fingerprint != "" ? [
    for key in data.digitalocean_ssh_keys.all_keys.ssh_keys : key
    if key.fingerprint == var.ssh_key_fingerprint
  ] : []

  # Filter keys by name if fingerprint not provided
  keys_by_name = var.ssh_key_fingerprint == "" && var.ssh_key_name != "" ? [
    for key in data.digitalocean_ssh_keys.all_keys.ssh_keys : key
    if key.name == var.ssh_key_name
  ] : []

  # Use fingerprint match first, then name match, then first available key
  ssh_key_id = (
    length(local.keys_by_fingerprint) > 0 ? local.keys_by_fingerprint[0].id :
    length(local.keys_by_name) > 0 ? local.keys_by_name[0].id :
    data.digitalocean_ssh_keys.all_keys.ssh_keys[0].id
  )
}

# Create a new Droplet for the environment
resource "digitalocean_droplet" "app_droplet" {
  image    = "docker-20-04"  # Docker-ready Ubuntu image
  name     = "${var.project_name}-${var.environment}"
  region   = var.region
  size     = "s-1vcpu-2gb"   # Small droplet with 1 CPU, 2GB RAM
  ssh_keys = [local.ssh_key_id]
  tags     = [var.environment, "nextjs", var.project_name]

  # Minimal setup script for Ansible compatibility
  user_data = <<-EOF
    #!/bin/bash
    set -e

    # Create a startup log file
    exec > >(tee /var/log/user-data.log) 2>&1
    echo "Starting minimal initialization for ${var.environment} environment: $(date)"

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
resource "digitalocean_firewall" "app_firewall" {
  count = var.use_existing_firewall ? 0 : 1
  name = "${var.project_name}-${var.environment}-firewall-${formatdate("YYYYMMDD-HHmm", timestamp())}"

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
  droplet_ids = [digitalocean_droplet.app_droplet.id]
}
