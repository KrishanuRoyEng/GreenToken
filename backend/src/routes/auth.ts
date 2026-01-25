import express, { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();
const authController = new AuthController();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);

// Wallet management routes
router.get('/wallet', authenticateToken, authController.getWalletInfo);
router.post('/wallet/custom', authenticateToken, authController.setCustomWallet);
router.post('/wallet/custodian', authenticateToken, authController.useCustodianWallet);

// Payout preferences routes
router.get('/payout-preferences', authenticateToken, authController.getPayoutPreferences);
router.post('/payout-preferences', authenticateToken, authController.updatePayoutPreferences);

export default router;