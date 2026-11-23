import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { closeRedisConnection } from './config/redis.js';
import { seedInitialAdmin } from './controllers/authController.js';
import { logger } from './utils/logger.js';

let server = null;

async function startServer() {
  try {
    logger.info('Initializing Veyron SMTP Gateway API Service...');

    // 1. Connect to MongoDB Atlas
    await connectDatabase();

    // 2. Seed initial administrator if database is fresh
    await seedInitialAdmin();

    // 3. Start listening
    server = app.listen(env.PORT, env.HOST, () => {
      logger.info(
        { port: env.PORT, host: env.HOST, nodeEnv: env.NODE_ENV },
        `Veyron SMTP Gateway API listening at http://${env.HOST}:${env.PORT}`
      );
    });

    // 4. Graceful Shutdown Handlers
    const shutdown = async (signal) => {
      logger.info({ signal }, 'Graceful shutdown initiated...');

      if (server) {
        server.close(async () => {
          logger.info('HTTP server closed');
          await closeRedisConnection();
          await disconnectDatabase();
          logger.info('All connections closed. Gateway exited cleanly.');
          process.exit(0);
        });

        // Force shutdown if taking longer than 10s
        setTimeout(() => {
          logger.error('Shutdown timed out. Forcing process exit.');
          process.exit(1);
        }, 10000).unref();
      } else {
        process.exit(0);
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
