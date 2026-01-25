import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public route - check payment mode
router.get('/mode', PaymentController.getPaymentMode);

// Protected routes (require authentication)
router.post('/create-order', authenticateToken, PaymentController.createOrder);
router.post('/verify', authenticateToken, PaymentController.verifyPayment);
router.post('/crypto/verify', authenticateToken, PaymentController.verifyCryptoPayment);
router.get('/history', authenticateToken, PaymentController.getPaymentHistory);
router.post('/refund', authenticateToken, PaymentController.requestRefund);

// Webhook route (no auth - verified via signature)
router.post('/webhook', PaymentController.handleWebhook);

export default router;
