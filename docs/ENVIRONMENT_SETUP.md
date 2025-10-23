# Environment Configuration Guide

This guide explains how to configure environment variables for the dotca application across different deployment environments (development, staging, and production).

## Environment Variables Overview

The application uses the following categories of environment variables:

### Core Application Settings
- `NODE_ENV`: Runtime environment (`development`, `production`)
- `NEXT_PUBLIC_ENVIRONMENT`: Application environment (`development`, `staging`, `production`)
- `NEXT_PUBLIC_API_URL`: API base URL for client-side requests
- `NEXT_PUBLIC_COMMIT_HASH`: Git commit hash (automatically set)

### Payment Processing (Stripe)
- `STRIPE_SECRET_KEY`: Stripe secret key for server-side operations
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key for client-side operations

### Email Service (Brevo/Sendinblue)
- `BREVO_API_KEY`: Brevo API key for transactional emails
- `NEXT_PUBLIC_BREVO_API_KEY`: Public Brevo API key (fallback for client-side)

### Analytics (Google Analytics 4)
- `NEXT_PUBLIC_STAGING_GA_ID`: Google Analytics ID for staging environment
- `NEXT_PUBLIC_PRODUCTION_GA_ID`: Google Analytics ID for production environment
- `NEXT_PUBLIC_DEV_GA_ID`: Google Analytics ID for development environment (optional)

### Analytics (Umami - Self-hosted)
- `NEXT_PUBLIC_UMAMI_WEBSITE_ID`: Umami website ID
- `NEXT_PUBLIC_UMAMI_HOST_URL`: Umami host URL

## Environment-Specific Setup

### Development Environment

Create a `.env.local` file in the project root:

```bash
# Core Application
NODE_ENV=development
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Stripe (Test Keys)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Brevo (Test API Key)
BREVO_API_KEY=your_brevo_test_api_key_here
NEXT_PUBLIC_BREVO_API_KEY=your_brevo_test_public_key_here

# Google Analytics (Optional - Development)
NEXT_PUBLIC_DEV_GA_ID=G-XXXXXXXXXX

# Umami (Optional - Local instance)
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your_umami_website_id
NEXT_PUBLIC_UMAMI_HOST_URL=http://localhost:3001
```

### Staging Environment

Create a `.env.staging` file or use deployment variables:

```bash
# Core Application
NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=staging
NEXT_PUBLIC_API_URL=https://your-staging-domain.com/api

# Stripe (Test/Stage Keys)
STRIPE_SECRET_KEY=sk_test_your_staging_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_staging_stripe_publishable_key

# Brevo (Production API Key - can use same as production)
BREVO_API_KEY=your_brevo_api_key_here
NEXT_PUBLIC_BREVO_API_KEY=your_brevo_public_key_here

# Google Analytics (Staging Property)
NEXT_PUBLIC_STAGING_GA_ID=G-XXXXXXXXXX

# Umami (Staging Instance)
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your_staging_umami_website_id
NEXT_PUBLIC_UMAMI_HOST_URL=https://umami-staging.yourdomain.com
```

### Production Environment

Create a `.env.production` file or use deployment variables:

```bash
# Core Application
NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# Stripe (Live Keys)
STRIPE_SECRET_KEY=sk_live_your_live_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_publishable_key

# Brevo (Production API Key)
BREVO_API_KEY=your_brevo_production_api_key
NEXT_PUBLIC_BREVO_API_KEY=your_brevo_production_public_key

# Google Analytics (Production Property)
NEXT_PUBLIC_PRODUCTION_GA_ID=G-XXXXXXXXXX

# Umami (Production Instance)
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your_production_umami_website_id
NEXT_PUBLIC_UMAMI_HOST_URL=https://umami.yourdomain.com
```

## Setting Up Environment Variables

### Local Development

1. **Copy the development template**:
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local`** with your actual values

3. **The `.env.local` file is automatically loaded** by Next.js and should be in `.gitignore`

### Deployment Environments

#### GitHub Actions Secrets

For automated deployments, set these as GitHub repository secrets:

- `BREVO_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `GA_STAGING_ID`
- `GA_PRODUCTION_ID`
- `UMAMI_WEBSITE_ID`
- `UMAMI_HOST_URL`

#### Ansible Deployment

Environment variables are passed to Ansible playbooks:

```bash
# Staging deployment
BREVO_API_KEY=your_key \
STRIPE_SECRET_KEY=your_key \
STRIPE_PUBLISHABLE_KEY=your_key \
GA_STAGING_ID=your_ga_id \
ansible-playbook ansible/staging-deploy.yml

# Production deployment
BREVO_API_KEY=your_key \
STRIPE_SECRET_KEY=your_key \
STRIPE_PUBLISHABLE_KEY=your_key \
GA_PRODUCTION_ID=your_ga_id \
ansible-playbook ansible/production-deploy.yml
```

#### Docker Environment

Environment variables are set in the Docker Compose template:

```yaml
environment:
  - NODE_ENV=production
  - NEXT_PUBLIC_API_URL=https://yourdomain.com/api
  - NEXT_PUBLIC_ENVIRONMENT=production
  - STRIPE_SECRET_KEY=your_stripe_secret_key
  - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
  - BREVO_API_KEY=your_brevo_api_key
  - NEXT_PUBLIC_STAGING_GA_ID=your_staging_ga_id
  - NEXT_PUBLIC_PRODUCTION_GA_ID=your_production_ga_id
  - NEXT_PUBLIC_UMAMI_WEBSITE_ID=your_umami_website_id
  - NEXT_PUBLIC_UMAMI_HOST_URL=your_umami_host_url
```

## Required vs Optional Variables

### Required for All Environments
- `NODE_ENV`
- `NEXT_PUBLIC_ENVIRONMENT`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `BREVO_API_KEY`

### Required for Production
- `NEXT_PUBLIC_PRODUCTION_GA_ID` (for Google Analytics tracking)
- `NEXT_PUBLIC_UMAMI_WEBSITE_ID` and `NEXT_PUBLIC_UMAMI_HOST_URL` (for self-hosted analytics)

### Optional Variables
- `NEXT_PUBLIC_DEV_GA_ID` (development analytics)
- `NEXT_PUBLIC_STAGING_GA_ID` (staging analytics)
- `NEXT_PUBLIC_BREVO_API_KEY` (client-side fallback)
- `NEXT_PUBLIC_COMMIT_HASH` (automatically set by build scripts)

## Security Considerations

### Never Commit Secrets
- **DO NOT** commit `.env.local`, `.env.staging`, or `.env.production` files
- **DO NOT** include actual API keys in repository
- Use `.env.example` file with placeholder values for documentation

### Environment Variable Security
- Use strong, unique API keys for each environment
- Rotate keys regularly (recommended: every 90 days)
- Use different Stripe accounts for test/production
- Store production secrets securely (GitHub Secrets, 1Password, etc.)

### GitHub Secrets Setup

1. Go to your repository Settings → Secrets and variables → Actions
2. Add each secret with its actual value:
   - `BREVO_API_KEY`: Your Brevo API key
   - `STRIPE_SECRET_KEY`: Stripe secret key (starts with `sk_live_` or `sk_test_`)
   - `STRIPE_PUBLISHABLE_KEY`: Stripe publishable key (starts with `pk_live_` or `pk_test_`)
   - `GA_STAGING_ID`: Google Analytics ID for staging (format: `G-XXXXXXXXXX`)
   - `GA_PRODUCTION_ID`: Google Analytics ID for production (format: `G-XXXXXXXXXX`)

## Troubleshooting

### Common Issues

**"STRIPE_SECRET_KEY is not set"**
- Check that `STRIPE_SECRET_KEY` is properly set in your environment
- Verify the key format (should start with `sk_test_` or `sk_live_`)

**"Missing BREVO_API_KEY"**
- Ensure `BREVO_API_KEY` is set in your deployment environment
- Check that the API key has the correct permissions

**Analytics not tracking**
- Verify `NEXT_PUBLIC_ENVIRONMENT` is set correctly
- Check that the appropriate GA_ID variables are set for your environment
- Ensure GA_ID format is correct (`G-XXXXXXXXXX`)

**Umami not loading**
- Verify both `NEXT_PUBLIC_UMAMI_WEBSITE_ID` and `NEXT_PUBLIC_UMAMI_HOST_URL` are set
- Check that the Umami server is accessible from your application

### Environment Variable Validation

The application includes validation to help catch configuration issues:

- Stripe keys are validated on application startup
- Google Analytics IDs are checked for proper format
- Missing critical variables will cause the application to fail fast with clear error messages

### Debug Mode

For debugging environment variable issues, check the application logs:

```bash
# Check container environment
docker-compose exec web env | grep -E "(NEXT_PUBLIC|STRIPE|BREV)"

# View application logs
docker-compose logs web
```

## Environment Examples

### .env.example (Template)

```bash
# Core Application Settings
NODE_ENV=development
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Email Service (Brevo)
BREVO_API_KEY=your_brevo_api_key_here
NEXT_PUBLIC_BREVO_API_KEY=your_brevo_public_api_key_here

# Google Analytics (Optional)
NEXT_PUBLIC_DEV_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_STAGING_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_PRODUCTION_GA_ID=G-XXXXXXXXXX

# Umami Analytics (Optional)
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your_umami_website_id
NEXT_PUBLIC_UMAMI_HOST_URL=https://umami.yourdomain.com
```

---

**Last Updated**: $(date)
**Contact**: For environment setup assistance, contact the DevOps team
