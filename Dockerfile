# Multi-environment Dockerfile for Next.js deployment
FROM node:18-alpine AS builder

# Install git for potential npm package dependencies that require it
RUN apk add --no-cache git

WORKDIR /app

# Set build arguments with defaults
ARG NODE_ENV=production
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ENVIRONMENT

# Set environment variables for build
ENV NODE_ENV=$NODE_ENV
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ENVIRONMENT=$NEXT_PUBLIC_ENVIRONMENT

# Copy package files and install dependencies
COPY package.json package-lock.json ./
# Install dependencies, including dev dependencies needed for build
RUN npm ci

# Copy the entire project
COPY . .

# Build the Next.js application
RUN npm run build

# Production image
FROM node:18-alpine AS runner

# Install dependencies
RUN apk add --no-cache curl

WORKDIR /app

# Set runtime environment variables with defaults
ARG NODE_ENV=production
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ENVIRONMENT

ENV NODE_ENV=$NODE_ENV
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ENVIRONMENT=$NEXT_PUBLIC_ENVIRONMENT

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