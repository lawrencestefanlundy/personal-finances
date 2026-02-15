import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/cash-flow', destination: '/#cash-flow', permanent: true },
      { source: '/net-worth', destination: '/#assets', permanent: true },
      { source: '/assets', destination: '/#assets', permanent: true },
      { source: '/investments', destination: '/#assets', permanent: true },
      { source: '/wealth', destination: '/#assets', permanent: true },
      { source: '/carry', destination: '/#assets', permanent: true },
      { source: '/scenarios', destination: '/', permanent: true },
    ];
  },
};

export default nextConfig;
