import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { validateUserRegistration, validateUserLogin } from '../utils/validation';
import PrismaClientSingleton from '../lib/prisma';
import { walletService } from '../services/WalletService';
import { notificationService } from '../services';

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const result = validateUserRegistration(req.body);
    if (!result.success) {
      return next(
        createError(
          result.error.issues.map((i) => i.message).join(', '),
          400
        )
      );
    }

    const { email, password, name, organizationName, role } = result.data;

    // Get Prisma client lazily
    const prisma = await PrismaClientSingleton.getInstance();

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return next(createError('User already exists', 409));
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate custodian wallet for new user
    const walletIndex = await walletService.getNextWalletIndex(prisma);
    const { address: custodianWallet } = walletService.generateCustodianWallet(walletIndex);

    // Create user with custodian wallet
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        organizationName,
        role: role as any,
        walletAddress: custodianWallet,
        usesCustodianWallet: true,
        custodianWalletIndex: walletIndex
      },
      select: {
        id: true,
        email: true,
        name: true,
        organizationName: true,
        role: true,
        walletAddress: true,
        usesCustodianWallet: true,
        createdAt: true
      }
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    logger.info(`User registered with custodian wallet: ${user.email}`);

    // Notify user
    await notificationService.notifyWelcome(user.id, user.email, user.name);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user
    });
  });

  login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const result = validateUserLogin(req.body);
    if (!result.success) {
      return next(
        createError(
          result.error.issues.map((i) => i.message).join(', '),
          400
        )
      );
    }

    const { email, password } = result.data;

    // Get Prisma client lazily
    const prisma = await PrismaClientSingleton.getInstance();

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return next(createError('Invalid credentials', 401));
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return next(createError('Invalid credentials', 401));
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationName: user.organizationName,
      role: user.role,
      walletAddress: user.walletAddress,
      usesCustodianWallet: user.usesCustodianWallet
    };

    logger.info(`User logged in: ${user.email}`);

    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });
  });

  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user.id;
    // Get Prisma client lazily
    const prisma = await PrismaClientSingleton.getInstance();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        organizationName: true,
        role: true,
        walletAddress: true,
        usesCustodianWallet: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: { projects: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  });

  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { name, organizationName } = req.body;
    // Get Prisma client lazily
    const prisma = await PrismaClientSingleton.getInstance();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        organizationName
      },
      select: {
        id: true,
        email: true,
        name: true,
        organizationName: true,
        role: true,
        walletAddress: true,
        usesCustodianWallet: true,
        isVerified: true
      }
    });

    logger.info(`User profile updated: ${updatedUser.email}`);

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  });

  // Set custom wallet address
  setCustomWallet = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.id;
    const { walletAddress } = req.body;

    // Validate wallet address format
    if (!walletAddress || !walletService.validateWalletAddress(walletAddress)) {
      return next(createError('Invalid wallet address format. Must be a valid Ethereum address (0x...)', 400));
    }

    const prisma = await PrismaClientSingleton.getInstance();

    // Check if wallet is already in use
    const existingWallet = await prisma.user.findUnique({
      where: { walletAddress }
    });

    if (existingWallet && existingWallet.id !== userId) {
      return next(createError('This wallet address is already associated with another account', 409));
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        walletAddress,
        usesCustodianWallet: false
      },
      select: {
        id: true,
        email: true,
        walletAddress: true,
        usesCustodianWallet: true
      }
    });

    logger.info(`User switched to custom wallet: ${updatedUser.email}`);

    res.json({
      message: 'Custom wallet set successfully',
      user: updatedUser
    });
  });

  // Switch back to custodian wallet
  useCustodianWallet = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const prisma = await PrismaClientSingleton.getInstance();

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate or regenerate custodian wallet if needed
    let walletIndex = user.custodianWalletIndex;
    if (!walletIndex) {
      walletIndex = await walletService.getNextWalletIndex(prisma);
    }

    const { address: custodianWallet } = walletService.generateCustodianWallet(walletIndex);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        walletAddress: custodianWallet,
        usesCustodianWallet: true,
        custodianWalletIndex: walletIndex
      },
      select: {
        id: true,
        email: true,
        walletAddress: true,
        usesCustodianWallet: true
      }
    });

    logger.info(`User switched to custodian wallet: ${updatedUser.email}`);

    return res.json({
      message: 'Switched to custodian wallet successfully',
      user: updatedUser
    });
  });

  // Get wallet info
  getWalletInfo = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const prisma = await PrismaClientSingleton.getInstance();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        walletAddress: true,
        usesCustodianWallet: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      walletAddress: user.walletAddress,
      usesCustodianWallet: user.usesCustodianWallet,
      walletType: user.usesCustodianWallet ? 'custodian' : 'custom'
    });
  });

  // Get payout preferences
  getPayoutPreferences = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const prisma = await PrismaClientSingleton.getInstance();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        payoutMethod: true,
        bankAccountName: true,
        bankAccountNumber: true,
        bankIfsc: true,
        upiId: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      payoutMethod: user.payoutMethod,
      bankAccountName: user.bankAccountName || '',
      bankAccountNumber: user.bankAccountNumber ? '••••••' + user.bankAccountNumber.slice(-4) : '',
      bankIfsc: user.bankIfsc || '',
      upiId: user.upiId || ''
    });
  });

  // Update payout preferences
  updatePayoutPreferences = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { payoutMethod, bankAccountName, bankAccountNumber, bankIfsc, upiId } = req.body;

    // Validate payout method
    const validMethods = ['CRYPTO', 'BANK_TRANSFER', 'UPI'];
    if (payoutMethod && !validMethods.includes(payoutMethod)) {
      return res.status(400).json({ error: 'Invalid payout method' });
    }

    const prisma = await PrismaClientSingleton.getInstance();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        payoutMethod: payoutMethod || undefined,
        bankAccountName: bankAccountName || undefined,
        bankAccountNumber: bankAccountNumber || undefined,
        bankIfsc: bankIfsc?.toUpperCase() || undefined,
        upiId: upiId || undefined
      },
      select: {
        payoutMethod: true,
        bankAccountName: true,
        bankIfsc: true,
        upiId: true
      }
    });

    logger.info(`User payout preferences updated: ${userId}`);

    return res.json({
      message: 'Payout preferences updated successfully',
      preferences: updatedUser
    });
  });
}