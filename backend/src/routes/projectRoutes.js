import { Router } from 'express';
import {
  listProjects,
  createProject,
  getProject,
  updateProject,
  regenerateApiKey,
  deleteProject
} from '../controllers/projectController.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ProjectCreateSchema, ProjectUpdateSchema } from '../validators/emailValidator.js';

const router = Router();

router.use(authenticateAdmin);

router.get('/', listProjects);
router.post('/', validate(ProjectCreateSchema), createProject);
router.get('/:id', getProject);
router.put('/:id', validate(ProjectUpdateSchema), updateProject);
router.post('/:id/regenerate-key', regenerateApiKey);
router.delete('/:id', deleteProject);

export default router;
