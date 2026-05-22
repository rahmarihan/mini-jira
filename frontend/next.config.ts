import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['172.22.128.1'],
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://mini-jira-alb-74822711.eu-north-1.elb.amazonaws.com:3001/:path*',
      },
    ];
  },
};

export default nextConfig;