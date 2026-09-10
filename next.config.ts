import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  serverExternalPackages: [
    'pg',
    'ioredis',
    'bullmq',
    'passport',
    'passport-google-oauth20',
    'express',
    'express-session',
    'connect-pg-simple',
    'helmet',
    'cors',
    'multer',
    'nodemailer',
    'winston',
    'csv-parse',
    '@bull-board/api',
    '@bull-board/express',
    '@elastic/elasticsearch',
    'dotenv',
    'uuid',
    'express-rate-limit',
  ],
  outputFileTracingIncludes: {
    '/api/**/*': ['./backend/dist/**/*'],
  },
  async rewrites() {
    return [
      { source: '/auth/:path*', destination: '/api/auth/:path*' },
      { source: '/emails/:path*', destination: '/api/emails/:path*' },
      { source: '/slack/:path*', destination: '/api/slack/:path*' },
      { source: '/campaigns/:path*', destination: '/api/campaigns/:path*' },
      { source: '/admin/:path*', destination: '/api/admin/:path*' },
      { source: '/health', destination: '/api/health' },
      { source: '/me', destination: '/api/me' },
    ];
  },
};

export default nextConfig;
