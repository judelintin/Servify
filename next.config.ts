import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Keep the documented preview origin working with Next's dev-only endpoints.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
