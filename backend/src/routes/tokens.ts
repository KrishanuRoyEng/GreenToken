import express, { Router } from 'express';
import { TokenController } from '../controllers/TokenController';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();
const tokenController = new TokenController();

// All routes require authentication
router.use(authenticateToken);

router.get('/balance', tokenController.getUserTokens);
router.post('/buy', tokenController.buyTokens);
router.post('/sell', tokenController.sellTokens);
router.get('/marketplace', tokenController.getMarketplace);
router.post('/marketplace/:orderId/purchase', tokenController.purchaseFromMarketplace);

export default router;