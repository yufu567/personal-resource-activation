import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  experimental: {
    // Incremental adoption — Turbopack is the default in Next.js 16
  },

  // Trust the Docker Compose reverse proxy
  poweredByHeader: false,
};

export default nextConfig;
