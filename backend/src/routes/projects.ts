import express, { Router } from 'express';
import { ProjectController } from '../controllers/ProjectController';
import { authenticateToken, requireVerifier } from '../middleware/auth';

const router: Router = express.Router();
const projectController = new ProjectController();

// All routes require authentication
router.use(authenticateToken);

router.get('/', projectController.getAllProjects);
router.post('/', projectController.createProject);
router.get('/user', projectController.getUserProjects);
router.get('/:id', projectController.getProject);
router.put('/:id', projectController.updateProject);

// Admin/Verifier only routes
router.post('/:id/approve', requireVerifier, projectController.approveProject);
router.post('/:id/reject', requireVerifier, projectController.rejectProject);

export default router;