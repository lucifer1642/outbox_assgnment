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
  // Ensure backend TypeScript is transpiled
  transpilePackages: [],
};

export default nextConfig;
