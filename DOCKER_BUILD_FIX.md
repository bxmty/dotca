# Docker Build Fix

## Issue
The Docker build was failing during the `npm run build` step with errors related to resolving path aliases:

```
Module not found: Can't resolve '@/lib/stripe'
```

The issue is that while Next.js path aliases (`@/lib/...`) work locally, they sometimes have issues resolving in the Docker build environment.

## Solution
We created a modified Dockerfile (`Dockerfile.fix`) that includes a step to replace the path aliases with relative paths before building:

```Dockerfile
# Fix import paths for Docker build
RUN sed -i 's|@/lib/stripe|../../lib/stripe|g' src/app/components/StripeWrapper.tsx && \
    sed -i 's|@/lib/stripe|../../../../lib/stripe|g' src/app/api/stripe/create-payment-intent/route.ts && \
    echo "Fixed import paths for Docker build"
```

This approach allows us to keep using path aliases in the codebase while ensuring the Docker build succeeds.

## Added Environment Variables
We also added the necessary Stripe environment variables to the Dockerfile:

```Dockerfile
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG STRIPE_SECRET_KEY

ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
```

## GitHub Actions
The GitHub Actions workflow now uses the fixed Dockerfile and provides test placeholder values for the Stripe keys during the build phase.

## Testing
To test locally, use:

```bash
docker build -f Dockerfile.fix \
  --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder \
  --build-arg STRIPE_SECRET_KEY=sk_test_placeholder \
  -t dotca:test .

docker run -p 3000:3000 \
  -e NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder \
  -e STRIPE_SECRET_KEY=sk_test_placeholder \
  -e NODE_ENV=production \
  dotca:test
```