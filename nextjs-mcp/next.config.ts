import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3-multiple-ciphers'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@main-src': path.resolve(__dirname, '../src'),
      };
    }
    return config;
  },
};

export default nextConfig;
