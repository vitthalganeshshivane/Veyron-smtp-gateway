import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export const redisConfig = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  db: env.REDIS_DB,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  lazyConnect: true,
  retryStrategy(times) {
    if (env.NODE_ENV === 'test' && times > 2) {
      return null; // Stop reconnecting in test mode
    }
    const delay = Math.min(times * 200, 3000);
    logger.warn(`Redis reconnect attempt #${times} in ${delay}ms`);
    return delay;
  }
};

let sharedRedisClient = null;

export function getRedisClient() {
  if (!sharedRedisClient) {
    sharedRedisClient = new Redis(redisConfig);

    sharedRedisClient.on('connect', () => {
      logger.info('Connected to Redis');
    });

    sharedRedisClient.on('error', (err) => {
      logger.error({ err: err.message }, 'Redis connection error');
    });

    sharedRedisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });
  }

  return sharedRedisClient;
}

export async function closeRedisConnection() {
  if (sharedRedisClient) {
    await sharedRedisClient.quit();
    sharedRedisClient = null;
    logger.info('Redis connection closed gracefully');
  }
}
