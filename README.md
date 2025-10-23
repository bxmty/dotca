# dotca - Enterprise IT Solutions for Small Businesses

A modern web application that provides small businesses with enterprise-grade IT solutions without the complexity or cost. Built with Next.js, this platform offers secure password management, professional web hosting, business email solutions, and Microsoft collaboration tools tailored for 5-10 person teams.

## 🚀 Features

### Core Services
- **Secure Password Management** - Enterprise-grade credential protection
- **Professional Web Hosting** - Reliable hosting solutions
- **Business Email Solutions** - Professional email communication
- **Microsoft Collaboration Tools** - Teams, SharePoint, and Office integration
- **Quarterly IT Assessments** - Regular technology health checks

### Technology Stack
- **Framework**: Next.js 15 with React 19
- **Styling**: Bootstrap 5.3 for responsive design
- **Payments**: Stripe integration for secure transactions
- **Analytics**: Google Analytics + Umami self-hosted analytics
- **Phone Validation**: libphonenumber-js for international phone support
- **Testing**: Jest with React Testing Library (91.8% coverage)

### Business Features
- **Pricing Tiers**: Free, Basic ($99/user/month), Standard ($249/user/month), Premium ($449/user/month)
- **Onboarding Flow**: Multi-step company information collection
- **Contact Forms**: Lead generation and customer support
- **Web Vitals Monitoring**: Performance tracking and optimization

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dotca
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (see Environment Setup below)

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Environment Setup

This application requires several environment variables to function properly. See the [Environment Configuration Guide](./docs/ENVIRONMENT_SETUP.md) for complete setup instructions.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── analytics/     # Web vitals analytics
│   │   ├── contact/       # Contact form handling
│   │   ├── onboarding/    # Company onboarding
│   │   └── stripe/        # Payment processing
│   ├── checkout/          # Payment checkout page
│   ├── components/        # Reusable React components
│   ├── onboarding/        # Multi-step onboarding flow
│   ├── pricing/           # Pricing page with plans
│   └── page.tsx           # Landing page
├── lib/                   # Utility functions
├── tests/                 # Test files
└── types/                 # TypeScript type definitions

docs/                      # Documentation
├── DEPLOYMENT_GHCR.md    # GitHub Container Registry deployment
├── image-promotion-workflow.md  # CI/CD workflow docs
└── ...

ansible/                   # Infrastructure as code
terraform/                 # Infrastructure provisioning
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run test` - Run Jest tests
- `npm run test:coverage` - Run tests with coverage report

### Code Style Guidelines

- **TypeScript**: Strict type checking enabled
- **Components**: Functional components with TypeScript interfaces
- **Styling**: Bootstrap CSS classes and utilities
- **Imports**: Absolute imports with `@/*` alias for src directory
- **Naming**: PascalCase for components, camelCase for variables
- **Testing**: Jest with React Testing Library, 91.8% coverage target

## Deployment

This project uses a sophisticated CI/CD pipeline with image promotion for safe deployments:

### Local Development
```bash
docker-compose -f docker-compose.dev.yml up
```

### Production Deployment

The project uses GitHub Container Registry (GHCR) with image promotion:

1. **Staging**: Automatic builds on `staging` branch pushes
2. **Image Promotion**: Manual promotion from staging to production images
3. **Production**: Deploy promoted images to production environment

See [GHCR Deployment Guide](./docs/DEPLOYMENT_GHCR.md) for detailed instructions.

### Infrastructure

- **Cloud Provider**: DigitalOcean
- **Container Registry**: GitHub Container Registry (GHCR)
- **CI/CD**: GitHub Actions with image promotion workflow
- **Infrastructure as Code**: Terraform + Ansible
- **Monitoring**: Health checks and automated rollbacks

## Testing

The project maintains high test coverage (91.8%) with Jest and React Testing Library:

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Analytics & Monitoring

### Web Vitals
The application automatically tracks Core Web Vitals metrics:
- **CLS (Cumulative Layout Shift)**: Visual stability
- **FID (First Input Delay)**: Interactivity
- **LCP (Largest Contentful Paint)**: Loading performance
- **FCP (First Contentful Paint)**: Initial content rendering
- **TTFB (Time to First Byte)**: Server response time

### Analytics Integration
- **Google Analytics**: External analytics tracking
- **Umami**: Self-hosted privacy-focused analytics (in development)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

This application implements several security measures:
- Environment variable validation
- Secure payment processing via Stripe
- Input sanitization and validation
- HTTPS enforcement in production
- Regular security updates

## License

This project is proprietary software owned by dotca.

## Support

For support and questions:
- Email: hi@boximity.ca
- Phone: (289) 539-0098
- Location: Toronto, Ontario, Canada