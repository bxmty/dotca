import { withSentryConfig } from "@sentry/nextjs/config";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Config options here
  // Only use standalone output in production
  ...(process.env.NODE_ENV === "production" && { output: "standalone" }),
  // Allow overriding the build dir, e.g. when .next has root-owned Docker artifacts
  ...(process.env.NEXT_DIST_DIR && { distDir: process.env.NEXT_DIST_DIR }),
  // Dev-only (ignored in production builds): Next 16 blocks /_next/* asset
  // requests from non-localhost origins, which breaks testing the dev server
  // from phones/other devices on the LAN. Allow private-network origins.
  // Patterns match hostname segments split on ".", so IPv4 needs one "*" per octet.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
  // Enable CSS import in server components
  transpilePackages: ["bootstrap"],
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
  // Configure pageExtensions to include md and mdx
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  // Add this section for ACME challenge handling
  async rewrites() {
    return [
      {
        source: "/.well-known/acme-challenge/:path*",
        destination: "/.well-known/acme-challenge/:path*",
      },
    ];
  },
  // Retired vertical pages — preserve SEO equity by redirecting inbound links
  async redirects() {
    return [
      {
        source: "/services/it-services-for-law-firms",
        destination: "/services/managed-it-services-ontario",
        permanent: true,
      },
      {
        source: "/services/it-services-for-accounting-firms",
        destination: "/services/managed-it-services-ontario",
        permanent: true,
      },
      {
        source: "/services/it-services-for-marketing-agencies",
        destination: "/services/managed-it-services-ontario",
        permanent: true,
      },
    ];
  },
};

// Sentry configuration: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
export default withSentryConfig(nextConfig, {
  org: "boximity-inc",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
