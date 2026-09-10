import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../db/logger';

export function getRedisOptions(forBullMQ = false) {
  if (config.redis.url) {
    return {
      maxRetriesPerRequest: forBullMQ ? null : 3,
      enableReadyCheck: false,
      tls: config.redis.url.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
    };
  }
  return {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    maxRetriesPerRequest: forBullMQ ? null : 3,
    enableReadyCheck: false,
  };
}

// Connection for BullMQ (requires maxRetriesPerRequest: null)
export function createBullMQConnection(): Redis {
  if (config.redis.url) {
    return new Redis(config.redis.url, getRedisOptions(true));
  }
  return new Redis(getRedisOptions(true));
}

// Shared connection for general use
export const redis = config.redis.url
  ? new Redis(config.redis.url, getRedisOptions(false))
  : new Redis(getRedisOptions(false));

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis error', { error: err.message }));

export default redis;
