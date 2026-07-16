import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Server Actions are enabled by default in Next 15; keep body limit sane for form posts.
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
