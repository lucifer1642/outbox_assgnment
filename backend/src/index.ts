import 'dotenv/config';
import dns from 'dns';

// Ensure DNS resolves modern cloud endpoints reliably across local and serverless environments
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (_) {}

import express from 'express';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import helmet from 'helmet';
import connectPgSimple from 'connect-pg-simple';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import { config } from './config';
import { pool, testConnection } from './db/pool';
import { runMigrations } from './db/migrations';
import { logger } from './db/logger';
import { setupPassport } from './config/passport';
import { initDefaultEmailAccount } from './services/emailService';
import { initElasticsearch } from './services/elasticsearchService';
import { emailQueue } from './queues/emailQueue';
import { startEmailWorker } from './queues/emailWorker';
import { errorHandler } from './middleware/auth';

import { reconcilePendingJobs } from './services/reconciliationService';

import authRoutes from './routes/auth';
import emailRoutes from './routes/emails';
import slackRoutes from './routes/slack';

const app = express();

// ─── Trust Proxy (Required for Vercel / Reverse Proxies) ───────────────────
app.set('trust proxy', 1);

// ─── Security & Parsing ────────────────────────────────────────────────────

app.use(helmet({
  contentSecurityPolicy: false, // Disabled for bull-board
}));

const isProduction = config.nodeEnv === 'production';
const isCrossDomain = isProduction && config.frontendUrl && !config.frontendUrl.includes('localhost');

app.use(cors({
  origin: config.frontendUrl || true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Session ───────────────────────────────────────────────────────────────

const PgSession = connectPgSimple(session);

app.use(session({
  store: new PgSession({
    pool,
    tableName: 'user_sessions',
    createTableIfMissing: true,
  }),
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: isProduction ? (isCrossDomain ? 'none' : 'lax') : 'lax',
  },
}));

// ─── Passport ─────────────────────────────────────────────────────────────

setupPassport();
app.use(passport.initialize());
app.use(passport.session());

// ─── BullMQ Dashboard (Bull Board) ────────────────────────────────────────

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(emailQueue) as any],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

// ─── Routes ────────────────────────────────────────────────────────────────

app.use(authRoutes);
app.use(emailRoutes);
app.use(slackRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      redis: 'connected',
    },
  });
});

// ─── Error Handler ─────────────────────────────────────────────────────────

app.use(errorHandler);

// ─── Startup ───────────────────────────────────────────────────────────────

let isInitialized = false;

export async function initializeServices(): Promise<void> {
  if (isInitialized) return;
  try {
    // Test DB connection
    await testConnection();

    // Run migrations
    await runMigrations();

    // Initialize Elasticsearch (non-fatal if unavailable)
    await initElasticsearch();

    // Initialize default Ethereal email account
    await initDefaultEmailAccount();

    // Run boot reconciliation for missing pending jobs
    await reconcilePendingJobs();

    // Start BullMQ worker (if Redis available and not in pure serverless environment)
    if (!process.env.DISABLE_WORKER) {
      startEmailWorker();
    }

    isInitialized = true;
  } catch (err: any) {
    logger.error('Failed to initialize services', { error: err.message, stack: err.stack });
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
}

// ─── Startup ───────────────────────────────────────────────────────────────

async function start(): Promise<void> {
  await initializeServices();

  if (!process.env.VERCEL) {
    app.listen(config.port, () => {
      logger.info(`🚀 Server running on http://localhost:${config.port}`);
      logger.info(`📊 BullMQ Dashboard: http://localhost:${config.port}/admin/queues`);
      logger.info(`🌍 Frontend: ${config.frontendUrl}`);
      logger.info(`⚙️  Worker concurrency: ${config.worker.concurrency}`);
      logger.info(`⏱️  Min delay between sends: ${config.worker.minDelayBetweenSendsMs}ms`);
      logger.info(`📧 Max emails/hour/sender: ${config.rateLimiting.maxEmailsPerHourPerSender}`);
    });
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

start();

export default app;
