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
# Install dependencies, ensuring dev dependencies are included for build
RUN npm ci --include=dev || (echo "Lock file out of sync, updating..." && npm install --include=dev)

# Install the new @tailwindcss/postcss package
RUN npm install @tailwindcss/postcss --save-dev

# Copy the entire project including Tailwind configuration files
COPY . .

# Verify Tailwind configuration files exist
RUN if [ ! -f tailwind.config.js ] || [ ! -f postcss.config.mjs ]; then \
      echo "Error: Missing Tailwind configuration files"; \
      exit 1; \
    fi

# Update postcss.config.mjs to use @tailwindcss/postcss instead of tailwindcss
RUN sed -i 's/require("tailwindcss")/require("@tailwindcss\/postcss")/g' postcss.config.mjs || true
RUN sed -i "s/import tailwindcss from 'tailwindcss'/import tailwindcss from '@tailwindcss\/postcss'/g" postcss.config.mjs || true
RUN sed -i "s/tailwindcss()/@tailwindcss\/postcss()/g" postcss.config.mjs || true

# Debug: Show installed packages and configurations
RUN echo "Installed versions:" && \
    npm list tailwindcss @tailwindcss/postcss postcss autoprefixer @tailwindcss/typography @tailwindcss/forms && \
    echo "Configuration files:" && \
    ls -la tailwind.config.js postcss.config.mjs && \
    echo "PostCSS Config content:" && \
    cat postcss.config.mjs

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
COPY --from=builder /app/next.config.ts ./
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

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Set the command to run the optimized app
CMD ["node", "server.js"]