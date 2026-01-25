import { Router } from 'express';
import { LogController } from '../controllers/LogController';

const router = Router();
const logController = new LogController();

router.post('/', logController.ingestLogs.bind(logController));

export default router;
