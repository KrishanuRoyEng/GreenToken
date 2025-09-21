import express, { Router } from 'express';
import { UploadController, upload } from '../controllers/UploadController';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();
const uploadController = new UploadController();

// All routes require authentication
router.use(authenticateToken);

router.post('/', upload.single('file'), uploadController.uploadFile);
router.get('/:fileId', uploadController.getFile);
router.delete('/:fileId', uploadController.deleteFile);

export default router;