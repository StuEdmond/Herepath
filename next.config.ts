import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Admin and diary forms upload photos (each capped at 8MB in storage.ts); a form can carry several.
    serverActions: { bodySizeLimit: "30mb" },
  },
};

export default nextConfig;
