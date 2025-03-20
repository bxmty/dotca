# Multi-environment Dockerfile for Next.js deployment
FROM node:18-alpine AS builder

WORKDIR /app

# Set build arguments with defaults
ARG NODE_ENV=production
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ENVIRONMENT

# Set environment variables for build
ENV NODE_ENV=$NODE_ENV
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ENVIRONMENT=$NEXT_PUBLIC_ENVIRONMENT

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source code
COPY . .

# Install Tailwind CSS and related dependencies explicitly
RUN npm install --save-dev tailwindcss postcss autoprefixer @tailwindcss/typography @tailwindcss/forms

# Create tailwind config file directly
RUN echo "/** @type {import('tailwindcss').Config} */\nmodule.exports = {\n  content: [\n    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',\n    './src/components/**/*.{js,ts,jsx,tsx,mdx}',\n    './src/app/**/*.{js,ts,jsx,tsx,mdx}',\n  ],\n  theme: {\n    extend: {},\n  },\n  plugins: [\n    require('@tailwindcss/typography'),\n    require('@tailwindcss/forms'),\n  ],\n};" > tailwind.config.js

# Print module versions for debugging
RUN echo "Installed versions:" && \
    npm list tailwindcss postcss autoprefixer

# Build the Next.js application
RUN npm run build || (echo "Build failed. Check tailwind configuration." && exit 1)

# Production image
FROM node:18-alpine AS runner

WORKDIR /app

# Set runtime environment variables with defaults
ARG NODE_ENV=production
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ENVIRONMENT

ENV NODE_ENV=$NODE_ENV
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ENVIRONMENT=$NEXT_PUBLIC_ENVIRONMENT

# Install curl for healthcheck
RUN apk --no-cache add curl

# Copy necessary files from builder stage
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose port
EXPOSE 3000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Set the command to run the optimized app
CMD ["node", "server.js"]