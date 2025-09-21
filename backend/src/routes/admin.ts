import  express, { Router }  from 'express';
import { AdminController } from '../controllers/AdminController';
import { authenticateToken, requireAdmin, requireVerifier } from '../middleware/auth';

const router: Router = express.Router();
const adminController = new AdminController();

// All routes require authentication
router.use(authenticateToken);

// Admin only routes
router.get('/stats', requireAdmin, adminController.getSystemStats);
router.get('/users', requireAdmin, adminController.getAllUsers);
router.put('/users/:userId/role', requireAdmin, adminController.updateUserRole);
router.post('/users/:userId/verify', requireAdmin, adminController.verifyUser);

// Admin and Verifier routes
router.get('/projects/pending', requireVerifier, adminController.getPendingApprovals);
router.post('/projects/:projectId/issue-credits', requireAdmin, adminController.issueCredits);

router.post('/projects/:projectId/approve', requireAdmin, adminController.approveProject);
router.post('/projects/:projectId/reject', requireAdmin, adminController.rejectProject);

export default router;