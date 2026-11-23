import { Router } from 'express';
import {
  login,
  register,
  logout,
  getMe,
  changePassword,
  regenerateMyKey
} from '../controllers/authController.js';
import { authenticateUser } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.post('/logout', authenticateUser, logout);
router.get('/me', authenticateUser, getMe);
router.post('/change-password', authenticateUser, changePassword);
router.post('/regenerate-my-key', authenticateUser, regenerateMyKey);

export default router;
