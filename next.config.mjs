/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Only optimize lucide-react; @tanstack/react-table uses ESM loaders that conflict with Next.js barrel optimization
    optimizePackageImports: ["lucide-react"],
  },
  poweredByHeader: false,
};

export default nextConfig;
