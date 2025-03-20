variable "do_token" {
  description = "Digital Ocean API Token"
  type        = string
  sensitive   = true
}

variable "ssh_key_fingerprint" {
  description = "SSH public key for Droplet access"
  type        = string
}

variable "project_name" {
  description = "Name of the Next.js project"
  type        = string
  default     = "dotCA-nextjs"
}

variable "region" {
  description = "Digital Ocean region to deploy resources"
  type        = string
  default     = "tor1"
}

variable "git_repo_url" {
  description = "Git repository URL for the Next.js application"
  type        = string
}

variable "git_branch" {
  description = "Git branch to deploy"
  type        = string
  default     = "main"
}

variable "allowed_ssh_ips" {
  description = "List of IP addresses allowed to connect via SSH"
  type        = list(string)
  default     = ["0.0.0.0/0"]  # Warning: This allows SSH access from anywhere, restrict in production
}

variable "create_domain" {
  description = "Whether to create a domain record for the QA environment"
  type        = bool
  default     = false
}

variable "domain_name" {
  description = "Base domain name for the QA environment"
  type        = string
  default     = "boximity.ca"
}

variable "subdomain" {
  description = "Subdomain for the QA environment"
  type        = string
  default     = "qa"
}