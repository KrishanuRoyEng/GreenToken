import express, { Router } from 'express';
import { UploadController, upload } from '../controllers/UploadController';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();
const uploadController = new UploadController();

// Public IPFS route (served locally)
router.get('/ipfs/:cid', uploadController.streamIPFS);

// All routes require authentication
router.use(authenticateToken);

// File upload routes
router.post('/', upload.single('file'), uploadController.uploadFile);
router.post('/drone', upload.single('file'), uploadController.uploadDroneData);

// File info and retrieval
router.get('/:fileId', uploadController.getFile);
router.get('/:fileId/info', uploadController.getFileInfo);
router.delete('/:fileId', uploadController.deleteFile);

// Project documents
router.get('/project/:projectId', uploadController.getProjectDocuments);

export default router;