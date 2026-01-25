import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { createError } from './errorHandler';

const prisma = new PrismaClient();

// Note: Express Request.user type is defined in src/types/express.d.ts

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(createError('Access token required', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationName: true,
        walletAddress: true,
        usesCustodianWallet: true,
        isVerified: true
      }
    });

    if (!user) {
      return next(createError('User not found', 401));
    }

    req.user = user;
    next();
  } catch (error) {
    next(createError('Invalid or expired token', 401));
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(createError('Insufficient permissions', 403));
    }
    next();
  };
};

export const requireAdmin = requireRole(['ADMIN']);
export const requireVerifier = requireRole(['ADMIN', 'VERIFIER']);
