import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["argon2", "@prisma/client", "pino"],
  experimental: {
    // Keep form-post/server-action bodies bounded (uploads go via presigned URLs).
    serverActions: { bodySizeLimit: "2mb" },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
