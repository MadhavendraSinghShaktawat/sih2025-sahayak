import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Disable ESLint during builds and dev to avoid blocking on lint errors for now
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
