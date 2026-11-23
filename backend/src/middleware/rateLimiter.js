import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { getRedisClient } from '../config/redis.js';
import { logger } from '../utils/logger.js';

/**
 * Standard Global IP Rate Limiter
 */
export const globalRateLimiter = rateLimit({
  windowMs: env.GLOBAL_RATE_LIMIT_WINDOW_MS,
  max: env.GLOBAL_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  }
});

/**
 * Auth Rate Limiter for Login Endpoint (brute-force protection)
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts. Please try again after 15 minutes.'
  }
});

/**
 * Dynamic Project Rate Limiter based on Project's rateLimitPerMinute
 */
export async function projectRateLimiter(req, res, next) {
  if (!req.project) return next();

  const projectId = req.project._id.toString();
  const maxPerMinute = req.project.rateLimitPerMinute || 60;
  const currentMinute = Math.floor(Date.now() / 60000);
  const redisKey = `ratelimit:project:${projectId}:${currentMinute}`;

  try {
    const redis = getRedisClient();
    const count = await redis.incr(redisKey);

    if (count === 1) {
      await redis.expire(redisKey, 70); // Expire slightly after the minute
    }

    if (count > maxPerMinute) {
      logger.warn({ projectId, count, maxPerMinute }, 'Project exceeded per-minute rate limit');
      return res.status(429).json({
        success: false,
        error: `Project rate limit exceeded. Max allowed is ${maxPerMinute} requests per minute.`
      });
    }

    res.setHeader('X-RateLimit-Limit', maxPerMinute);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxPerMinute - count));

    next();
  } catch (err) {
    // If Redis rate limit check fails, log warning and let request pass to not block service
    logger.warn({ err: err.message }, 'Redis rate limit check bypassed due to error');
    next();
  }
}
