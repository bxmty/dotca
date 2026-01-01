/** @type {import('next').NextConfig} */
const nextConfig = {
  // Config options here
  // Only use standalone output in production
  ...(process.env.NODE_ENV === "production" && { output: "standalone" }),
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
  // Add this section for ACME challenge handling
  async rewrites() {
    return [
      {
        source: "/.well-known/acme-challenge/:path*",
        destination: "/.well-known/acme-challenge/:path*",
      },
    ];
  },
};

// For standalone server configuration, ensure proper binding
if (process.env.NODE_ENV === "production") {
  // This ensures the server binds to 0.0.0.0 in production containers
  process.env.HOST = process.env.HOST || "0.0.0.0";
  process.env.HOSTNAME = process.env.HOSTNAME || "0.0.0.0";
}

module.exports = nextConfig;
