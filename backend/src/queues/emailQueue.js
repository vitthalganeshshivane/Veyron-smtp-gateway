import { Queue } from 'bullmq';
import { redisConfig } from '../config/redis.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const EMAIL_QUEUE_NAME = 'email-delivery';

let emailQueue = null;

export function getEmailQueue() {
  if (!emailQueue) {
    emailQueue = new Queue(EMAIL_QUEUE_NAME, {
      connection: redisConfig,
      defaultJobOptions: {
        attempts: env.JOB_MAX_RETRIES,
        backoff: {
          type: 'exponential',
          delay: 5000 // 5s, 10s, 20s...
        },
        timeout: env.JOB_TIMEOUT_MS,
        removeOnComplete: {
          count: 1000,
          age: 3600 * 24 // Keep completed in Redis for 24h
        },
        removeOnFail: {
          count: 5000,
          age: 3600 * 72 // Keep failed in Redis for 3 days
        }
      }
    });

    emailQueue.on('error', (err) => {
      logger.error({ err: err.message }, 'BullMQ Queue error');
    });
  }

  return emailQueue;
}

/**
 * Enqueue an email sending task
 * @param {Object} jobData
 * @param {string} jobId
 */
export async function enqueueEmail(jobData, jobId) {
  const queue = getEmailQueue();
  const job = await queue.add('send-email', jobData, {
    jobId: jobId
  });

  logger.info({ jobId, projectId: jobData.projectId }, 'Email successfully enqueued in BullMQ');
  return job;
}

/**
 * Gracefully close the BullMQ Queue connection
 */
export async function closeEmailQueue() {
  if (emailQueue) {
    try {
      await emailQueue.close();
    } catch (err) {
      logger.warn({ err: err.message }, 'Error closing BullMQ queue');
    } finally {
      emailQueue = null;
      logger.info('BullMQ email queue closed gracefully');
    }
  }
}
