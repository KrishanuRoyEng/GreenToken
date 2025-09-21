import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { validateUserRegistration, validateUserLogin } from '../utils/validation';

const prisma = new PrismaClient();

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = validateUserRegistration(req.body);
    if (error) {
      return next(createError(error.details[0].message, 400));
    }

    const { email, password, name, organizationName, role } = value;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return next(createError('User already exists', 409));
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        organizationName,
        role: role as any
      },
      select: {
        id: true,
        email: true,
        name: true,
        organizationName: true,
        role: true,
        createdAt: true
      }
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    logger.info(`User registered: ${user.email}`);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user
    });
  });

  login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = validateUserLogin(req.body);
    if (error) {
      return next(createError(error.details[0].message, 400));
    }

    const { email, password } = value;

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
      walletAddress: user.walletAddress
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        organizationName: true,
        role: true,
        walletAddress: true,
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

    res.json(user);
  });

  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { name, organizationName, walletAddress } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        organizationName,
        walletAddress
      },
      select: {
        id: true,
        email: true,
        name: true,
        organizationName: true,
        role: true,
        walletAddress: true,
        isVerified: true
      }
    });

    logger.info(`User profile updated: ${updatedUser.email}`);

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  });
}