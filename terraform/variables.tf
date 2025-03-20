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
  default     = "dotca-nextjs"
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

variable "use_existing_project" {
  description = "Whether to use an existing project instead of creating a new one"
  type        = bool
  default     = true
}

variable "use_existing_firewall" {
  description = "Whether to use an existing firewall instead of creating a new one"
  type        = bool
  default     = false
}

variable "existing_firewall_id" {
  description = "ID of an existing firewall to use if use_existing_firewall is true"
  type        = string
  default     = ""
}