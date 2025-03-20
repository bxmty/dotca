This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

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

## Deployment

### Local Development

For local development, use the development Docker setup:

```bash
docker-compose -f docker-compose.dev.yml up
```

### Remote Deployment (QA, Staging, Production)

This project includes a multi-environment deployment setup for Digital Ocean:

1. Environment configuration files:
   - `.env.qa` - QA environment variables
   - `.env.staging` - Staging environment variables
   - `.env.production` - Production environment variables

2. Deploy to a specific environment:

```bash
# Deploy to QA
./deploy.sh qa

# Deploy to Staging
./deploy.sh staging

# Deploy to Production
./deploy.sh production
```

### Manual Deployment

If you need to manually build and deploy:

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
