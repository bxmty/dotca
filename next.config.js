/** @type {import('next').NextConfig} */
const nextConfig = {
  // Config options here
  output: 'standalone',
  // Enable CSS import in server components
  transpilePackages: ['bootstrap'],
  // Image optimization configuration
  images: {
    domains: [],
    remotePatterns: [],
    unoptimized: false,
  },
  // Custom error handling
  experimental: {
    // Disable automatic static error pages
    disableOptimizedLoading: true,
    optimizeCss: false,
  },
  // Exclude test files from build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Add this section for ACME challenge handling
  async rewrites() {
    return [
      {
        source: '/.well-known/acme-challenge/:path*',
        destination: '/.well-known/acme-challenge/:path*'
      }
    ]
  }
};

module.exports = nextConfig;