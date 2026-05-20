import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['172.22.128.1'],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
