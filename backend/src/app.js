import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { getHealth, getQueueStats } from './controllers/systemController.js';
import { authenticateAdmin } from './middleware/auth.js';

import authRoutes from './routes/authRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import smtpAccountRoutes from './routes/smtpAccountRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration
const allowedOrigins = env.CORS_ORIGINS;
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key']
}));

// Body parsing with configurable limits for emails & attachments
app.use(express.json({ limit: env.MAX_EMAIL_BODY_SIZE }));
app.use(express.urlencoded({ extended: true, limit: env.MAX_EMAIL_BODY_SIZE }));

// Global IP rate limiting
app.use(globalRateLimiter);

// Public Health Check
app.get('/api/v1/health', getHealth);
app.get('/health', getHealth);

// Public Queue stats alias with admin auth
app.get('/api/v1/queue/stats', authenticateAdmin, getQueueStats);

// Module Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/emails', emailRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/smtp-accounts', smtpAccountRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/system', systemRoutes);
app.use('/api/v1/users', userRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
