/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // High-performance compilation settings
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "@tanstack/react-table"],
  },
  // Disable x-powered-by header for security and micro-optimization
  poweredByHeader: false,
};

export default nextConfig;
