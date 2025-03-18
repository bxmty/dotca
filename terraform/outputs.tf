output "droplet_id" {
  description = "ID of the created Droplet"
  value       = digitalocean_droplet.qa_dotCA.id
}

output "droplet_ip" {
  description = "Public IP address of the QA environment"
  value       = digitalocean_droplet.qa_dotCA.ipv4_address
}

output "droplet_status" {
  description = "Status of the Droplet"
  value       = digitalocean_droplet.qa_dotCA.status
}

output "qa_url" {
  description = "URL to access the QA environment"
  value       = var.create_domain ? "http://${var.subdomain}.${var.domain_name}" : "http://${digitalocean_droplet.qa_dotCA.ipv4_address}"
}