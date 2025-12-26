# Multi-environment Dockerfile for Next.js deployment
FROM node:24.12.0-alpine AS builder

# Install git for potential npm package dependencies that require it
RUN apk add --no-cache git

WORKDIR /app

# Set build arguments with defaults
ARG NODE_ENV=production
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ENVIRONMENT
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_COMMIT_HASH
ARG NEXT_PUBLIC_STAGING_GA_ID
ARG NEXT_PUBLIC_PRODUCTION_GA_ID

# Set environment variables for build
ENV NODE_ENV=$NODE_ENV
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ENVIRONMENT=$NEXT_PUBLIC_ENVIRONMENT
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_COMMIT_HASH=$NEXT_PUBLIC_COMMIT_HASH
ENV NEXT_PUBLIC_STAGING_GA_ID=$NEXT_PUBLIC_STAGING_GA_ID
ENV NEXT_PUBLIC_PRODUCTION_GA_ID=$NEXT_PUBLIC_PRODUCTION_GA_ID

# Copy package files and install dependencies
COPY package.json package-lock.json ./
# Install dependencies, including dev dependencies needed for build
RUN npm install --frozen-lockfile

# Copy the entire project (including get-commit-hash.js)
COPY . .

# Debug environment variables at build time
RUN echo "Using NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
RUN echo "Using NEXT_PUBLIC_COMMIT_HASH: $NEXT_PUBLIC_COMMIT_HASH"

# Removed path replacements as they're not needed with proper Next.js alias configuration
RUN echo "Using Next.js path aliases for imports"

# Build the Next.js application
RUN npm run build

# Production image
FROM node:24.12.0-alpine AS runner

# Install dependencies
RUN apk add --no-cache curl

WORKDIR /app

# Set runtime environment variables with defaults
ARG NODE_ENV=production
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ENVIRONMENT
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_COMMIT_HASH
ARG NEXT_PUBLIC_STAGING_GA_ID
ARG NEXT_PUBLIC_PRODUCTION_GA_ID

ENV NODE_ENV=$NODE_ENV
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ENVIRONMENT=$NEXT_PUBLIC_ENVIRONMENT
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_COMMIT_HASH=$NEXT_PUBLIC_COMMIT_HASH
ENV STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
ENV NEXT_PUBLIC_STAGING_GA_ID=$NEXT_PUBLIC_STAGING_GA_ID
ENV NEXT_PUBLIC_PRODUCTION_GA_ID=$NEXT_PUBLIC_PRODUCTION_GA_ID

# Copy necessary files from builder stage
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Create a non-root user to run the application
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set the command to run the optimized app
CMD ["node", "server.js"]
