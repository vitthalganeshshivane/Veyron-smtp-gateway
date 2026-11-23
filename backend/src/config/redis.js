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

    sharedRedisClient.on('ready', () => {
      logger.info('Redis client ready');
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

/**
 * Idempotent function to explicitly initialize and verify the shared Redis connection.
 * Safe to call regardless of whether the client is in 'wait', 'connecting', 'connect', or 'ready' state.
 */
export async function initRedis() {
  const client = getRedisClient();

  if (client.status === 'wait') {
    await client.connect();
  } else if (client.status === 'connecting' || client.status === 'connect') {
    await new Promise((resolve, reject) => {
      const onReady = () => {
        client.removeListener('error', onError);
        resolve();
      };
      const onError = (err) => {
        client.removeListener('ready', onReady);
        reject(err);
      };
      client.once('ready', onReady);
      client.once('error', onError);
    });
  }

  const pong = await client.ping();
  if (pong !== 'PONG') {
    throw new Error(`Unexpected Redis ping response: ${pong}`);
  }

  return client;
}

export async function closeRedisConnection() {
  if (sharedRedisClient) {
    try {
      if (sharedRedisClient.status !== 'end') {
        await sharedRedisClient.quit();
      }
    } catch (err) {
      logger.warn({ err: err.message }, 'Error during Redis quit, forcing disconnect');
      sharedRedisClient.disconnect();
    } finally {
      sharedRedisClient = null;
      logger.info('Redis connection closed gracefully');
    }
  }
}
