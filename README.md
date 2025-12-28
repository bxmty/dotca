This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Web Vitals Monitoring

This project includes Web Vitals monitoring to track Core Web Vitals metrics:

- **CLS (Cumulative Layout Shift)**: Measures visual stability
- **FID (First Input Delay)**: Measures interactivity
- **LCP (Largest Contentful Paint)**: Measures loading performance
- **FCP (First Contentful Paint)**: Measures when the first content is painted
- **TTFB (Time to First Byte)**: Measures time until first byte is received

Web Vitals are automatically collected on the client side and sent to the `/api/analytics/web-vitals` endpoint. In production, you can connect this endpoint to your analytics platform of choice.

### Local Development

```bash
docker-compose -f docker-compose.dev.yml up
```

### Remote Deployment (Staging, Production)

This project includes a multi-environment deployment setup for Digital Ocean:

1. Environment configuration files:
   - `.env.staging` - Staging environment variables
   - `.env.production` - Production environment variables

2. Deploy to a specific environment:

```bash
# Deploy to Staging
# Use GitHub Actions: Go to Actions → stg-deploy → Run workflow

# Deploy to Production
# Use GitHub Actions: Go to Actions → prod-deploy → Run workflow
```

### Manual Deployment

This project uses GitHub Actions for automated deployment. To deploy manually:

1. **Staging Deployment**:
   - Go to GitHub Actions → stg-deploy
   - Click "Run workflow"
   - Select staging branch and run

2. **Production Deployment**:
   - First promote an image using image-promotion workflow
   - Then use prod-deploy workflow with the promoted image

For local development only:

```bash
# Build the Docker image with environment-specific variables
docker build \
  --build-arg NODE_ENV=production \
  --build-arg NEXT_PUBLIC_API_URL=https://api.example.com \
  --build-arg NEXT_PUBLIC_ENVIRONMENT=production \
  -t dotca-app .

# Run the container
docker run -p 3000:3000 dotca-app
```

The Dockerfile includes:

- Multi-stage build for optimized image size
- Environment variable configuration
- Health checks for monitoring
- Next.js standalone output mode

For more deployment options, check out [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).
