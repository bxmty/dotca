# Remote Terraform state backend configuration (DigitalOcean Spaces)
# This file should be renamed/copied to backend.tf when using remote state

terraform {
  backend "s3" {
    endpoint                    = "https://bxtf.tor1.digitaloceanspaces.com"
    region                      = "tor1"
    bucket                      = "bxtf"
    key                         = "dotca/terraform.tfstate"
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    force_path_style            = true
  }
}
