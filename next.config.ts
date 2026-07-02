import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // En Windows el file-watcher y la caché webpack dejan chunks corruptos.
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }

    return config;
  },
};

export default nextConfig;
