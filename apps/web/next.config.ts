import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
  transpilePackages: [
    "@agent-platform/shared",
    "@agent-platform/db",
    "viem",
    "wagmi",
    "@rainbow-me/rainbowkit",
    "@tanstack/react-query",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
