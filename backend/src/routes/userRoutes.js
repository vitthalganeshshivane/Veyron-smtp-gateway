import { Router } from 'express';
import { listUsers, approveUser, rejectUser, revokeUserKey } from '../controllers/userController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticateAdmin);

router.get('/', listUsers);
router.post('/:id/approve', approveUser);
router.post('/:id/reject', rejectUser);
router.post('/:id/revoke', revokeUserKey);

export default router;
