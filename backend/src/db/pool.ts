import { Pool } from 'pg';
import { config } from '../config';
import { logger } from './logger';

const isProduction = config.nodeEnv === 'production';
const requiresSsl = config.database.url.includes('sslmode=require') || config.database.url.includes('ssl=true') || (isProduction && !config.database.url.includes('localhost'));

export const pool = new Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 8000,
  ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
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
