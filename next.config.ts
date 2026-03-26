import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["openai", "@neondatabase/serverless"],
  experimental: {
    // Disable Next's dev-only segment explorer (dev overlay) which is causing
    // internal 500 errors / missing React client manifest modules for this project.
    devtoolSegmentExplorer: false,
  },
};

export default nextConfig;
