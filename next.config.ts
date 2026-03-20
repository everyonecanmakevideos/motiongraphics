import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["openai", "@neondatabase/serverless"],
};

export default nextConfig;
