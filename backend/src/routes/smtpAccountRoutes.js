import { Router } from 'express';
import {
  listAccounts,
  createAccount,
  getAccount,
  updateAccount,
  testAccountConnection,
  deleteAccount
} from '../controllers/smtpAccountController.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { SmtpAccountSchema } from '../validators/emailValidator.js';

const router = Router();

router.use(authenticateAdmin);

router.get('/', listAccounts);
router.post('/', validate(SmtpAccountSchema), createAccount);
router.get('/:id', getAccount);
router.put('/:id', updateAccount);
router.post('/:id/test', testAccountConnection);
router.delete('/:id', deleteAccount);

export default router;
