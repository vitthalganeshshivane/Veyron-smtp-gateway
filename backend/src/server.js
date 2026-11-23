import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { initRedis, closeRedisConnection } from './config/redis.js';
import { closeEmailQueue } from './queues/emailQueue.js';
import { seedInitialAdmin } from './controllers/authController.js';
import { logger } from './utils/logger.js';

let server = null;
let isShuttingDown = false;

async function startServer() {
  try {
    logger.info('Initializing Veyron SMTP Gateway API Service...');

    // 1. Connect to MongoDB Atlas
    await connectDatabase();

    // 2. Initialize and verify shared Redis connection
    await initRedis();

    // 3. Seed initial administrator if database is fresh
    await seedInitialAdmin();

    // 4. Start listening
    server = app.listen(env.PORT, env.HOST, () => {
      logger.info(
        { port: env.PORT, host: env.HOST, nodeEnv: env.NODE_ENV },
        `Veyron SMTP Gateway API listening at http://${env.HOST}:${env.PORT}`
      );
    });

    // 5. Graceful Shutdown Handlers
    const shutdown = async (signal) => {
      if (isShuttingDown) return;
      isShuttingDown = true;

      logger.info({ signal }, 'Graceful shutdown initiated...');

      // Force shutdown if taking longer than 10s
      const forceExitTimer = setTimeout(() => {
        logger.error('Shutdown timed out. Forcing process exit.');
        process.exit(1);
      }, 10000);
      forceExitTimer.unref();

      try {
        if (server) {
          await new Promise((resolve) => {
            server.close(() => {
              logger.info('HTTP server closed');
              resolve();
            });
          });
        }

        // Close BullMQ queue first to finish pending commands
        await closeEmailQueue();

        // Close shared Redis connection
        await closeRedisConnection();

        // Disconnect MongoDB Atlas
        await disconnectDatabase();

        logger.info('All connections closed. Gateway exited cleanly.');
        process.exit(0);
      } catch (err) {
        logger.error({ err: err.message }, 'Error during graceful shutdown');
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start API server');
    process.exit(1);
  }
}

startServer();
