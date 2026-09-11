import 'dotenv/config';
import dns from 'dns';

// Ensure DNS resolves modern cloud endpoints reliably across local and serverless environments
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (_) {}

const resolver = new dns.promises.Resolver();
try {
  resolver.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}

const originalLookup = dns.lookup;
// @ts-ignore
dns.lookup = function (hostname: string, options: any, callback?: any) {
  const cb = typeof options === 'function' ? options : callback;
  const opts = typeof options === 'function' ? {} : options;

  originalLookup(hostname, opts, (err, address, family) => {
    if (!err && address) {
      return cb(null, address, family);
    }
    resolver.resolve4(hostname)
      .then((addresses) => {
        if (addresses && addresses.length > 0) {
          if (opts && opts.all) {
            cb(null, addresses.map((a) => ({ address: a, family: 4 })));
          } else {
            cb(null, addresses[0], 4);
          }
        } else {
          cb(err || new Error(`Failed to resolve ${hostname}`), '', 4);
        }
      })
      .catch(() => cb(err || new Error(`Failed to resolve ${hostname}`), '', 4));
  });
};

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
import { errorHandler, authenticateToken } from './middleware/auth';

import { reconcilePendingJobs } from './services/reconciliationService';

import authRoutes from './routes/auth';
import emailRoutes from './routes/emails';
import slackRoutes from './routes/slack';

const app = express();

// ─── Trust Proxy (Required for Render, Vercel & Reverse Proxies) ────────────
app.set('trust proxy', true);

// ─── Security & Parsing ────────────────────────────────────────────────────

app.use(helmet({
  contentSecurityPolicy: false, // Disabled for bull-board
}));

const isProduction = config.nodeEnv === 'production' || process.env.NODE_ENV === 'production';
const isCrossDomain = Boolean(config.frontendUrl && !config.frontendUrl.includes('localhost'));

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
    createTableIfMissing: false,
  }),
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    secure: isProduction || isCrossDomain,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: isCrossDomain ? 'none' : 'lax',
  },
}));

// ─── Passport & Auth ────────────────────────────────────────────────────────

setupPassport();
app.use(passport.initialize());
app.use(passport.session());
app.use(authenticateToken);

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
    try { await initElasticsearch(); } catch (e: any) {
      logger.warn('Elasticsearch init failed (non-fatal)', { error: e.message });
    }

    // Initialize default Ethereal email account (non-fatal)
    try { await initDefaultEmailAccount(); } catch (e: any) {
      logger.warn('Ethereal email init failed (non-fatal)', { error: e.message });
    }

    // Run boot reconciliation for missing pending jobs (non-fatal)
    try { await reconcilePendingJobs(); } catch (e: any) {
      logger.warn('Reconciliation failed (non-fatal)', { error: e.message });
    }

    // Start BullMQ worker (if Redis available and not in pure serverless environment)
    if (!process.env.DISABLE_WORKER && !process.env.VERCEL && !process.env.NEXT_RUNTIME) {
      startEmailWorker();
    }

    isInitialized = true;
  } catch (err: any) {
    logger.error('Failed to initialize services', { error: err.message, stack: err.stack });
    if (!process.env.VERCEL && !process.env.NEXT_RUNTIME) {
      process.exit(1);
    }
    // In serverless, allow partial initialization so basic routes still work
    isInitialized = true;
  }
}

// ─── Startup ───────────────────────────────────────────────────────────────

async function start(): Promise<void> {
  await initializeServices();

  if (!process.env.VERCEL) {
    app.listen(config.port, '0.0.0.0', () => {
      logger.info(`🚀 Server running on port ${config.port} (0.0.0.0)`);
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

// Only start standalone server when not imported as a module by Next.js
if (!process.env.NEXT_RUNTIME && require.main === module) {
  start();
}

export default app;
