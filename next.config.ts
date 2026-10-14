import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Pages from the earlier privacy-policy version of Kalkan.
  async redirects() {
    return [
      { source: "/rating", destination: "/", permanent: false },
      { source: "/business", destination: "/", permanent: false },
      { source: "/guides", destination: "/schemes", permanent: false },
      { source: "/rights", destination: "/help", permanent: false },
    ];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
