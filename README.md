# dotca - Enterprise IT Solutions for Small Businesses

A modern Next.js application for enterprise IT solutions, built with TypeScript, Bootstrap, and deployed on DigitalOcean infrastructure.

## ⚠️ Migration to Justfile

**Important**: This project has migrated from Make to [Just](https://github.com/casey/just) as the primary command runner. Just provides a cleaner, more maintainable alternative to Makefiles with better cross-platform support and syntax.

- **Old**: `make <command>`
- **New**: `just <command>`

All commands remain the same - only the tool has changed. The Makefile is deprecated and will be removed in a future version.

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Terraform & Ansible (for infrastructure deployment)
- Git

### Local Development Setup

1. **Clone and setup:**

```bash
git clone <repository-url>
cd dotca
just setup
```

2. **Start development environment:**

```bash
just dev-up
```

3. **View the application:**
   - Open [http://localhost:3000](http://localhost:3000) in your browser
   - The app auto-reloads as you edit files

### Development Commands

```bash
# Start development environment
just dev-up

# Stop development environment
just dev-down

# View logs
just dev-logs

# Restart containers
just dev-restart

# Run tests (unit + E2E)
just dev-test

# Run linting and type checking
just dev-lint

# Clean development environment
just dev-clean FORCE=true
```

### Manual Development (without Docker)

If you prefer to run without Docker:

```bash
npm install
npm run dev
```

## 🧪 Testing

This project includes comprehensive testing:

### Unit Tests (Jest)

```bash
npm run test
npm run test:watch
npm run test:coverage
```

### End-to-End Tests (Playwright)

```bash
just dev-up  # Start environment first
npm run test:e2e
npm run test:e2e:debug
npm run test:e2e:ui
```

## 🚀 Deployment

### Infrastructure Deployment

This project uses infrastructure-as-code with Terraform and Ansible for DigitalOcean deployments:

```bash
# Validate environment setup
just validate

# Deploy to staging
just deploy ENVIRONMENT=staging

# Deploy to production
just deploy ENVIRONMENT=production

# Check deployment status
just status ENVIRONMENT=staging

# Clean up deployment
just destroy ENVIRONMENT=staging
```

### CI/CD Pipelines

Automated deployment via GitHub Actions:

- **Staging**: Automatic deployment on push to `staging` branch
- **Production**: Manual deployment after image promotion

### Manual Infrastructure Deployment

For advanced users or debugging:

```bash
# Terraform operations
just terraform-plan ENVIRONMENT=staging
just terraform-apply ENVIRONMENT=staging BACKEND=local

# Ansible operations
just ansible-ping
just ansible-syntax
```

### Environment Configuration

Required environment variables (create `.env.local` for local development):

```bash
DO_TOKEN=your_digitalocean_token
BREVO_API_KEY=your_email_service_key
RESEND_API_KEY=your_resend_api_key
WEBMASTER_EMAIL=webmaster@example.com
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## 📊 Monitoring & Analytics

### Web Vitals

The application includes automatic Web Vitals monitoring:

- **CLS (Cumulative Layout Shift)**: Visual stability
- **FID (First Input Delay)**: Interactivity
- **LCP (Largest Contentful Paint)**: Loading performance
- **FCP (First Contentful Paint)**: First content paint
- **TTFB (Time to First Byte)**: Network performance

Metrics are collected and sent to `/api/analytics/web-vitals`.

## 📁 Project Structure

```
├── src/                    # Next.js application source
├── e2e/                    # End-to-end tests (Playwright)
├── docker-compose.dev.yml  # Local development environment
├── terraform/             # Infrastructure as code
├── ansible/               # Configuration management
├── scripts/               # Development and deployment scripts
├── docs/                  # Documentation
├── justfile               # Development and deployment commands
└── Makefile               # Deprecated - replaced by justfile
```

## 🛠️ Development Guidelines

### Code Quality

- **Linting**: `npm run lint`
- **Type checking**: `npm run typecheck`
- **Testing**: `just dev-test`
- **Pre-commit hooks**: `npm run pre-commit:install`

### Commit Messages

Follow conventional commit format:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Testing
- `chore:` Maintenance

### Contributing

1. Create a feature branch from `staging`
2. Make your changes with tests
3. Run `just dev-test` to ensure everything works
4. Submit a pull request

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Playwright Testing](https://playwright.dev/)
- [Terraform Documentation](https://developer.hashicorp.com/terraform)
- [Ansible Documentation](https://docs.ansible.com/)
- [Local Development Setup](docs/local-development-setup.md)
- [Makefile to Justfile Migration](docs/makefile-to-justfile-migration.md)
