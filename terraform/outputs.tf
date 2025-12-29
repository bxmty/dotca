output "droplet_id" {
  description = "ID of the created Droplet"
  value       = digitalocean_droplet.app_droplet.id
}

output "droplet_ip" {
  description = "Public IP address of the environment"
  value       = digitalocean_droplet.app_droplet.ipv4_address
}

output "droplet_status" {
  description = "Status of the Droplet"
  value       = digitalocean_droplet.app_droplet.status
}

output "environment_url" {
  description = "URL to access the environment"
  value       = var.create_domain ? "http://${local.subdomain}.${var.domain_name}" : "http://${digitalocean_droplet.app_droplet.ipv4_address}"
}

output "project_id" {
  description = "ID of the DigitalOcean project"
  value       = var.use_existing_project ? (length(data.digitalocean_project.existing_project) > 0 ? data.digitalocean_project.existing_project[0].id : "") : (length(digitalocean_project.project) > 0 ? digitalocean_project.project[0].id : "")
}

output "firewall_id" {
  description = "ID of the DigitalOcean firewall"
  value       = var.use_existing_firewall ? var.existing_firewall_id : (length(digitalocean_firewall.app_firewall) > 0 ? digitalocean_firewall.app_firewall[0].id : "")
}

output "ssh_key_id_used" {
  description = "ID of the SSH key used for the droplet"
  value       = local.ssh_key_id
}

output "ssh_key_fingerprint_requested" {
  description = "SSH key fingerprint that was requested (from variable)"
  value       = var.ssh_key_fingerprint
}

output "ssh_keys_found_by_fingerprint" {
  description = "Number of SSH keys found matching the fingerprint"
  value       = length(local.keys_by_fingerprint)
}

output "ssh_keys_found_by_name" {
  description = "Number of SSH keys found matching the name"
  value       = length(local.keys_by_name)
}

output "all_ssh_keys_in_account" {
  description = "All SSH keys available in the DigitalOcean account (for debugging)"
  value       = [for key in data.digitalocean_ssh_keys.all_keys.ssh_keys : {
    name        = key.name
    fingerprint = key.fingerprint
    id          = key.id
  }]
}
