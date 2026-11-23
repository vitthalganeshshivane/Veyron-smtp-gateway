import { Router } from 'express';
import {
  sendEmail,
  sendBulk,
  getEmailLogs,
  getEmailLogById,
  retryEmail,
  testDynamicSmtp
} from '../controllers/emailController.js';
import { authenticateProject, authenticateAdmin } from '../middleware/auth.js';
import { projectRateLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { SendEmailSchema, BulkEmailSchema } from '../validators/emailValidator.js';

const router = Router();

// Middleware that accepts either Admin JWT or Project API Key
async function authenticateEither(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  if (token.startsWith('vsg_live_')) {
    return authenticateProject(req, res, next);
  }
  return authenticateAdmin(req, res, next);
}

// Test / Verify dynamic SMTP credentials on-the-fly without database persistence
router.post('/verify-smtp', authenticateEither, testDynamicSmtp);

// Sending endpoints (require Project API Key)
router.post('/send', authenticateProject, projectRateLimiter, validate(SendEmailSchema), sendEmail);
router.post('/bulk', authenticateProject, projectRateLimiter, validate(BulkEmailSchema), sendBulk);

// Reading & management endpoints (allow Admin or Project)
router.get('/', authenticateEither, getEmailLogs);
router.get('/:jobId', authenticateEither, getEmailLogById);
router.post('/:jobId/retry', authenticateEither, retryEmail);

export default router;
