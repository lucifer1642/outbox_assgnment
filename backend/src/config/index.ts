import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  sessionSecret: process.env.SESSION_SECRET || 'fallback-secret-change-in-prod',

  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5432/emailscheduler',
  },

  redis: {
    url: process.env.REDIS_URL || '',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  elasticsearch: {
    url: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  },

  google: {
    clientId: (process.env.GOOGLE_CLIENT_ID || '').trim(),
    clientSecret: (process.env.GOOGLE_CLIENT_SECRET || '').trim(),
    callbackUrl: (process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/auth/google/callback').trim().replace(/[\r\n]+$/, ''),
  },

  slack: {
    clientId: (process.env.SLACK_CLIENT_ID || '').trim(),
    clientSecret: (process.env.SLACK_CLIENT_SECRET || '').trim(),
    redirectUri: (process.env.SLACK_REDIRECT_URI || 'http://localhost:4000/slack/callback').trim().replace(/[\r\n]+$/, ''),
  },

  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:3000').trim().replace(/[\r\n]+$/, '').replace(/\/+$/, ''),

  rateLimiting: {
    maxEmailsPerHourPerSender: parseInt(process.env.MAX_EMAILS_PER_HOUR_PER_SENDER || '200'),
  },

  worker: {
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5'),
    minDelayBetweenSendsMs: parseInt(process.env.MIN_DELAY_BETWEEN_SENDS_MS || '2000'),
  },

  ethereal: {
    user: process.env.ETHEREAL_USER || '',
    pass: process.env.ETHEREAL_PASS || '',
  },
};
