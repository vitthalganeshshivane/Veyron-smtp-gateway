import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend directory or project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  HOST: process.env.HOST || '0.0.0.0',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-super-secret-jwt-key-min-32-chars-long-please-change-in-prod',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  ENCRYPTION_MASTER_KEY: process.env.ENCRYPTION_MASTER_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/veyron_smtp_gateway',
  MONGODB_MAX_POOL_SIZE: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10', 10),
  MONGODB_MIN_POOL_SIZE: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2', 10),
  REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
  REDIS_DB: parseInt(process.env.REDIS_DB || '0', 10),
  WORKER_CONCURRENCY: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
  JOB_MAX_RETRIES: parseInt(process.env.JOB_MAX_RETRIES || '3', 10),
  JOB_TIMEOUT_MS: parseInt(process.env.JOB_TIMEOUT_MS || '30000', 10),
  GLOBAL_RATE_LIMIT_WINDOW_MS: parseInt(process.env.GLOBAL_RATE_LIMIT_WINDOW_MS || '60000', 10),
  GLOBAL_RATE_LIMIT_MAX: parseInt(process.env.GLOBAL_RATE_LIMIT_MAX || '300', 10),
  MAX_EMAIL_BODY_SIZE: process.env.MAX_EMAIL_BODY_SIZE || '10mb',
  MAX_ATTACHMENT_SIZE_MB: parseInt(process.env.MAX_ATTACHMENT_SIZE_MB || '15', 10),
  CORS_ORIGINS: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()) : ['*'],
  ADMIN_INITIAL_EMAIL: process.env.ADMIN_INITIAL_EMAIL || 'admin@veyron.internal',
  ADMIN_INITIAL_PASSWORD: process.env.ADMIN_INITIAL_PASSWORD || 'ChangeThisMasterAdminPassword123!',
  LOG_LEVEL: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  MOCK_SMTP_ENABLED: process.env.MOCK_SMTP_ENABLED === 'true'
};
