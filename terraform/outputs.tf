output "droplet_id" {
  description = "ID of the created Droplet"
  value       = digitalocean_droplet.qa_nextjs.id
}

output "droplet_ip" {
  description = "Public IP address of the QA environment"
  value       = digitalocean_droplet.qa_nextjs.ipv4_address
}

output "droplet_status" {
  description = "Status of the Droplet"
  value       = digitalocean_droplet.qa_nextjs.status
}

output "qa_url" {
  description = "URL to access the QA environment"
  value       = var.create_domain ? "http://${digitalocean_domain.qa_domain[0].name}" : "http://${digitalocean_droplet.qa_nextjs.ipv4_address}"
}