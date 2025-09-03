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
