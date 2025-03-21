/** @type {import('next').NextConfig} */
const nextConfig = {
  // Config options here
  output: 'standalone',
  // Enable CSS import in server components
  transpilePackages: ['bootstrap'],
};

module.exports = nextConfig;
