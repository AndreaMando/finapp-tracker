import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,

  // suppress cross-origin dev warning when accessing via local network IP
  // see https://nextjs.org/docs/api-reference/next.config.js/cross-origin
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://192.168.178.*:3000',
  ],
};

export default nextConfig;
