import { Router } from 'express';
import {
  getDetailedSystemHealth,
  getSystemLogs,
  getQueueStats,
  cleanQueue
} from '../controllers/systemController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticateAdmin);

router.get('/health', getDetailedSystemHealth);
router.get('/logs', getSystemLogs);
router.get('/queue/stats', getQueueStats);
router.post('/queue/clean', cleanQueue);

export default router;
