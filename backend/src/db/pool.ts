import { Pool } from 'pg';
import { config } from '../config';
import { logger } from './logger';

import dns from 'dns';

const isProduction = config.nodeEnv === 'production';
const requiresSsl = config.database.url.includes('sslmode=require') || config.database.url.includes('ssl=true') || (isProduction && !config.database.url.includes('localhost'));

const resolver = new dns.promises.Resolver();
try {
  resolver.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}

function customLookup(hostname: string, options: any, callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void) {
  dns.lookup(hostname, options, (err, address, family) => {
    if (!err && address) {
      return callback(null, address, family);
    }
    // Fallback to public DNS resolver
    resolver.resolve4(hostname)
      .then((addresses) => {
        if (addresses && addresses.length > 0) {
          callback(null, addresses[0], 4);
        } else {
          callback(err || new Error('Host resolution failed'), '', 4);
        }
      })
      .catch((resErr) => callback(resErr, '', 4));
  });
}

export const pool = new Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 8000,
  ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
  // @ts-ignore - pg supports net lookup
  lookup: customLookup,
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle PostgreSQL client', err);
});

export async function testConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
    logger.info('PostgreSQL connection established successfully');
  } finally {
    client.release();
  }
}
