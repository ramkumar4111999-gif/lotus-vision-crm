import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  turbopack: {
    // Workaround for Loader2 reference issue in SSR chunk
    resolveAlias: {},
  },
};

export default nextConfig;
