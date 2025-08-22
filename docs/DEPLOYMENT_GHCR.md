# GitHub Container Registry (GHCR) Deployment Guide

This document explains how to use GitHub Container Registry (GHCR) for your dotca deployment pipeline instead of building containers at deployment time.

## Overview

The new workflow:
1. **GitHub Actions** builds and pushes Docker images to GHCR on code changes
2. **Ansible deployment** pulls pre-built images from GHCR instead of building locally
3. **Faster deployments** with better version control and rollback capabilities

## Setup Instructions

### 1. Environment Variables

#### For Ansible Deployment (Your Local Environment)

Add these environment variables to your local environment where you run Ansible:

```bash
# Required for GHCR authentication
GITHUB_TOKEN=ghp_your_personal_access_token  # Personal Access Token (see step 2)
GITHUB_USERNAME=your_github_username

# Optional: Override default image
DOCKER_IMAGE=ghcr.io/your_username/dotca:staging

# All your existing environment variables
BREVO_API_KEY=your_brevo_key
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable
GA_STAGING_ID=your_ga_staging_id
# etc...
```

#### For GitHub Actions (Automatic)

GitHub Actions automatically provides `GITHUB_TOKEN` - **no setup needed**. The workflow file already uses `${{ secrets.GITHUB_TOKEN }}` which GitHub provides automatically.

### 2. GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate a new token with these permissions:
   - `read:packages` (to pull images)
   - `write:packages` (if you need to push manually)
3. Copy the token and set it as `GITHUB_TOKEN` environment variable

### 3. Private Package Authentication

**IMPORTANT:** Keep your packages private for security! Here are authentication options:

#### Option A: Personal Access Token (Recommended)
- ✅ Easy to set up
- ✅ Works with any deployment method
- ✅ Fine-grained permissions

#### Option B: Deploy Keys
- ✅ Repository-specific
- ✅ More secure for production
- ⚠️ Requires additional SSH setup

### 4. Image Naming Convention

The GitHub Actions workflow automatically creates these image tags:

- `ghcr.io/username/dotca:main` - Latest production build
- `ghcr.io/username/dotca:staging` - Latest staging build  
- `ghcr.io/username/dotca:main-abc1234` - Specific commit on main
- `ghcr.io/username/dotca:staging-def5678` - Specific commit on staging

## Deployment Process

### Automatic Build (Recommended)

1. **Push to staging branch** → GitHub Actions builds and pushes `staging` tag
2. **Push to main branch** → GitHub Actions builds and pushes `main` tag  
3. **Run Ansible deployment** → Pulls the appropriate pre-built image

### Manual Build (If needed)

```bash
# Build and push manually
docker build -t ghcr.io/your_username/dotca:staging .
docker push ghcr.io/your_username/dotca:staging
```

## Benefits

✅ **Faster Deployments**: No build time during deployment (60-90% faster)  
✅ **Better Reliability**: Pre-built images are tested before deployment  
✅ **Version Control**: Easy rollbacks to previous image versions  
✅ **Consistent Builds**: Same image across environments  
✅ **Reduced Server Load**: No CPU/memory usage for building  

## Migration Checklist

- [ ] Set up GitHub Actions workflow (`.github/workflows/docker-build.yml`)
- [ ] Configure environment variables (`GITHUB_TOKEN`, `GITHUB_USERNAME`)
- [ ] Update docker-compose.yml to use GHCR images
- [ ] Modify Ansible playbook to pull instead of build
- [ ] Test the new workflow on staging
- [ ] Monitor first production deployment

## Troubleshooting

### Authentication Issues
```bash
# Test GHCR authentication
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin
```

### Image Not Found
- Check if the GitHub Actions workflow completed successfully
- Verify the image name and tag in your environment variables
- Ensure the repository has public package visibility or proper authentication

### Permission Issues
- Verify your GitHub token has `read:packages` permission
- For private packages: ensure authentication is working
- Test authentication: `echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin`

### Rollback to Previous Version
```bash
# Update .env file with specific image tag
DOCKER_IMAGE=ghcr.io/username/dotca:staging-abc1234

# Re-run deployment
ansible-playbook ansible/staging-deploy.yml
```

## Environment-Specific Configurations

### Staging
- Uses `ghcr.io/username/dotca:staging` by default
- Builds automatically on pushes to `staging` branch
- Environment: `NEXT_PUBLIC_ENVIRONMENT=staging`

### Production  
- Uses `ghcr.io/username/dotca:main` by default
- Builds automatically on pushes to `main` branch
- Environment: `NEXT_PUBLIC_ENVIRONMENT=production`

## Working with Private Packages (Recommended)

### Why Keep Packages Private?
- ✅ **Security**: Only authorized users can access your images
- ✅ **Control**: Track who pulls your images
- ✅ **Compliance**: Meet security requirements

### Setup for Private Packages

1. **Your package will be private by default** - no additional action needed
2. **Set up authentication** using Personal Access Token (already configured in Ansible)
3. **Test the authentication**:
   ```bash
   echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin
   docker pull ghcr.io/bxtech/dotca:staging
   ```

### If You Get "Access Denied" Errors

1. **Check token permissions**: Token needs `read:packages`
2. **Verify token is active**: Personal access tokens can expire
3. **Check username**: Must match the repository owner
4. **Verify repository access**: Token owner needs access to the repository

### Package Visibility Settings

Your packages are private by default. If needed, you can:
- **Keep private** (recommended): Requires authentication
- **Make internal**: Visible to organization members only  
- **Make public**: Anyone can pull (not recommended for production)

To change visibility: GitHub → Repository → Packages → Package Settings → Change visibility

## Security Notes

- GitHub tokens should be stored securely and rotated regularly
- Use repository secrets for GitHub Actions workflows
- Consider using environment-specific tokens with minimal permissions
- Monitor package access logs for unusual activity
- **Never commit tokens to your repository**
