# dotca - Enterprise IT Solutions for Small Businesses

A modern Next.js application for enterprise IT solutions, built with TypeScript, Bootstrap, and deployed on DigitalOcean infrastructure.

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
make setup
```

2. **Start development environment:**

```bash
make dev-up
```

3. **View the application:**
   - Open [http://localhost:3000](http://localhost:3000) in your browser
   - The app auto-reloads as you edit files

### Development Commands

```bash
# Start development environment
make dev-up

# Stop development environment
make dev-down

# View logs
make dev-logs

# Restart containers
make dev-restart

# Run tests (unit + E2E)
make dev-test

# Clean development environment
make dev-clean FORCE=true
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
make dev-up  # Start environment first
npm run test:e2e
npm run test:e2e:debug
npm run test:e2e:ui
```

## 🚀 Deployment

### Infrastructure Deployment

This project uses infrastructure-as-code with Terraform and Ansible for DigitalOcean deployments:

```bash
# Validate environment setup
make validate

# Deploy to staging
make deploy ENVIRONMENT=staging

# Deploy to production
make destroy ENVIRONMENT=production

# Check deployment status
make status ENVIRONMENT=staging

# Clean up deployment
make destroy ENVIRONMENT=staging
```

### CI/CD Pipelines

Automated deployment via GitHub Actions:

- **Staging**: Automatic deployment on push to `staging` branch
- **Production**: Manual deployment after image promotion

### Manual Infrastructure Deployment

For advanced users or debugging:

```bash
# Terraform operations
make terraform-plan ENVIRONMENT=staging
make terraform-apply ENVIRONMENT=staging BACKEND=local

# Ansible operations
make ansible-ping ENVIRONMENT=staging
make ansible-syntax
```

### Environment Configuration

Required environment variables (create `.env.local` for local development):

```bash
DO_TOKEN=your_digitalocean_token
BREVO_API_KEY=your_email_service_key
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
└── Makefile               # Development and deployment commands
```

## 🛠️ Development Guidelines

### Code Quality

- **Linting**: `npm run lint`
- **Type checking**: `npm run typecheck`
- **Testing**: `make dev-test`
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
3. Run `make dev-test` to ensure everything works
4. Submit a pull request

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Playwright Testing](https://playwright.dev/)
- [Terraform Documentation](https://developer.hashicorp.com/terraform)
- [Ansible Documentation](https://docs.ansible.com/)
- [Local Development Setup](docs/local-development-setup.md)
