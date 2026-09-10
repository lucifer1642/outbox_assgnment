import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  async rewrites() {
    return [
      { source: '/auth/:path*', destination: '/api' },
      { source: '/emails/:path*', destination: '/api' },
      { source: '/slack/:path*', destination: '/api' },
      { source: '/admin/:path*', destination: '/api' },
      { source: '/health', destination: '/api' },
    ];
  },
};

export default nextConfig;
