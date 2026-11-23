import { Router } from 'express';
import { getOverview, getDaily, getProjectStats } from '../controllers/analyticsController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticateAdmin);

router.get('/overview', getOverview);
router.get('/daily', getDaily);
router.get('/projects', getProjectStats);

export default router;
