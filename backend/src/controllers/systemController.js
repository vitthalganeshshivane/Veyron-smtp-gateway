import os from 'os';
import mongoose from 'mongoose';
import { getRedisClient } from '../config/redis.js';
import { getEmailQueue } from '../queues/emailQueue.js';
import { SystemLog } from '../models/SystemLog.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Basic health check endpoint
 * GET /api/v1/health
 */
export async function getHealth(req, res) {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  let redisStatus = 'disconnected';

  try {
    const redis = getRedisClient();
    if (redis.status === 'ready') {
      const ping = await Promise.race([
        redis.ping(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 1000))
      ]);
      if (ping === 'PONG') redisStatus = 'connected';
    } else {
      redisStatus = redis.status || 'disconnected';
    }
  } catch (err) {
    redisStatus = 'error';
  }

  const isHealthy = mongoStatus === 'connected' && redisStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'veyron-smtp-gateway',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: mongoStatus,
    redis: redisStatus
  });
}

/**
 * Detailed System Health and Resource Telemetry
 * GET /api/v1/system/health
 */
export async function getDetailedSystemHealth(req, res) {
  try {
    // 1. Process Memory
    const mem = process.memoryUsage();
    const totalOsMemory = os.totalmem();
    const freeOsMemory = os.freemem();

    // 2. Redis Info
    let redisMemory = 'N/A';
    let redisConnectedClients = 0;
    try {
      const redis = getRedisClient();
      const info = await redis.info('memory');
      const match = info.match(/used_memory_human:(.*)/);
      if (match) redisMemory = match[1].trim();

      const clientsInfo = await redis.info('clients');
      const clientsMatch = clientsInfo.match(/connected_clients:(.*)/);
      if (clientsMatch) redisConnectedClients = parseInt(clientsMatch[1].trim(), 10);
    } catch {
      // Ignore if Redis info fails
    }

    // 3. Queue counts
    const queue = getEmailQueue();
    const [waiting, active, delayed, failed, completed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getDelayedCount(),
      queue.getFailedCount(),
      queue.getCompletedCount()
    ]);

    // 4. Worker count
    const workers = await queue.getWorkers();

    res.json({
      success: true,
      system: {
        nodeVersion: process.version,
        uptime: Math.floor(process.uptime()),
        platform: process.platform,
        arch: process.arch,
        cpuCount: os.cpus().length,
        memory: {
          rssMb: Math.round(mem.rss / (1024 * 1024)),
          heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
          heapTotalMb: Math.round(mem.heapTotal / (1024 * 1024)),
          osFreeMb: Math.round(freeOsMemory / (1024 * 1024)),
          osTotalMb: Math.round(totalOsMemory / (1024 * 1024)),
          redisUsed: redisMemory
        }
      },
      services: {
        mongodb: {
          status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
          host: mongoose.connection.host || 'External Atlas Cluster'
        },
        redis: {
          status: 'connected',
          connectedClients: redisConnectedClients,
          host: env.REDIS_HOST,
          port: env.REDIS_PORT
        },
        queue: {
          waiting,
          active,
          delayed,
          failed,
          completed,
          activeWorkers: workers.length,
          concurrency: env.WORKER_CONCURRENCY
        }
      }
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Error retrieving detailed system health');
    res.status(500).json({ success: false, error: 'Failed to retrieve system health telemetry' });
  }
}

/**
 * Queue Stats Endpoint
 * GET /api/v1/queue/stats
 */
export async function getQueueStats(req, res) {
  try {
    const queue = getEmailQueue();
    const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed', 'paused');
    const workers = await queue.getWorkers();

    res.json({
      success: true,
      queue: {
        name: queue.name,
        counts,
        activeWorkers: workers.length,
        concurrency: env.WORKER_CONCURRENCY
      }
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Error retrieving queue stats');
    res.status(500).json({ success: false, error: 'Failed to retrieve queue statistics' });
  }
}

/**
 * Clean Completed or Failed Jobs from Queue
 * POST /api/v1/queue/clean
 */
export async function cleanQueue(req, res) {
  try {
    const { type = 'completed', gracePeriodMs = 0 } = req.body;
    const queue = getEmailQueue();
    const cleaned = await queue.clean(gracePeriodMs, 5000, type);

    res.json({
      success: true,
      message: `Cleaned ${cleaned.length} ${type} jobs from queue`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to clean queue' });
  }
}

/**
 * Get System Logs
 * GET /api/v1/system/logs
 */
export async function getSystemLogs(req, res) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.level) query.level = req.query.level;
    if (req.query.event) query.event = req.query.event;

    const [logs, total] = await Promise.all([
      SystemLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SystemLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      logs
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve system logs' });
  }
}
