import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { validateTokenTransaction } from '../utils/validation';

const prisma = new PrismaClient();

export class TokenController {
  getUserTokens = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user.id;

    // Get user's token transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        project: {
          select: { id: true, name: true }
        }
      }
    });

    // Calculate balances
    let totalTokens = 0;
    let soldTokens = 0;
    let acquiredTokens = 0;

    transactions.forEach(tx => {
      if (tx.type === 'mint' || tx.type === 'buy') {
        totalTokens += tx.amount;
        if (tx.type === 'buy') acquiredTokens += tx.amount;
      } else if (tx.type === 'sell' || tx.type === 'burn') {
        totalTokens -= tx.amount;
        if (tx.type === 'sell') soldTokens += tx.amount;
      }
    });

    res.json({
      balance: {
        total: Math.max(0, totalTokens),
        sold: soldTokens,
        acquired: acquiredTokens
      },
      transactions
    });
  });

  buyTokens = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = validateTokenTransaction(req.body);
    if (error) {
      return next(createError(error.details[0].message, 400));
    }

    const userId = req.user.id;
    const { amount } = value;
    const pricePerToken = 50; // Fixed price for demo
    const totalPrice = amount * pricePerToken;

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        type: 'buy',
        amount,
        pricePerToken,
        status: 'confirmed', // For demo - would be 'pending' in real implementation
        userId
      }
    });

    logger.info(`User ${req.user.email} bought ${amount} tokens for ₹${totalPrice}`);

    res.json({
      message: 'Tokens purchased successfully',
      transaction: {
        id: transaction.id,
        amount,
        totalPrice,
        pricePerToken
      }
    });
  });

  sellTokens = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = validateTokenTransaction(req.body);
    if (error) {
      return next(createError(error.details[0].message, 400));
    }

    const userId = req.user.id;
    const { amount, pricePerToken } = value;

    if (!pricePerToken) {
      return next(createError('Price per token is required for selling', 400));
    }

    // Check if user has enough tokens (simplified check)
    const userTransactions = await prisma.transaction.findMany({
      where: { userId }
    });

    let balance = 0;
    userTransactions.forEach(tx => {
      if (tx.type === 'mint' || tx.type === 'buy') {
        balance += tx.amount;
      } else if (tx.type === 'sell' || tx.type === 'burn') {
        balance -= tx.amount;
      }
    });

    if (balance < amount) {
      return next(createError('Insufficient token balance', 400));
    }

    // Create sell transaction
    const transaction = await prisma.transaction.create({
      data: {
        type: 'sell',
        amount,
        pricePerToken,
        status: 'pending', // Listed for sale
        userId
      }
    });

    logger.info(`User ${req.user.email} listed ${amount} tokens for sale at ₹${pricePerToken} each`);

    res.json({
      message: 'Tokens listed for sale successfully',
      transaction: {
        id: transaction.id,
        amount,
        pricePerToken,
        totalValue: amount * pricePerToken
      }
    });
  });

  getMarketplace = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 20 } = req.query;

    // Get active sell orders
    const sellOrders = await prisma.transaction.findMany({
      where: {
        type: 'sell',
        status: 'pending'
      },
      include: {
        user: {
          select: { name: true, organizationName: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    const total = await prisma.transaction.count({
      where: {
        type: 'sell',
        status: 'pending'
      }
    });

    // Get market statistics
    const stats = await this.getMarketStats();

    res.json({
      orders: sellOrders.map(order => ({
        id: order.id,
        seller: order.user.name || order.user.organizationName,
        amount: order.amount,
        pricePerToken: order.pricePerToken,
        totalPrice: order.amount * (order.pricePerToken || 0),
        listedAt: order.createdAt
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      },
      stats
    });
  });

  purchaseFromMarketplace = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { orderId } = req.params;
    const userId = req.user.id;

    const sellOrder = await prisma.transaction.findUnique({
      where: { id: orderId },
      include: { user: true }
    });

    if (!sellOrder || sellOrder.type !== 'sell' || sellOrder.status !== 'pending') {
      return next(createError('Sell order not found or not available', 404));
    }

    if (sellOrder.userId === userId) {
      return next(createError('Cannot purchase your own tokens', 400));
    }

    // Update sell order status
    await prisma.transaction.update({
      where: { id: orderId },
      data: { status: 'completed' }
    });

    // Create buy transaction for purchaser
    await prisma.transaction.create({
      data: {
        type: 'buy',
        amount: sellOrder.amount,
        pricePerToken: sellOrder.pricePerToken,
        status: 'confirmed',
        userId
      }
    });

    logger.info(`User ${req.user.email} purchased ${sellOrder.amount} tokens from marketplace`);

    res.json({
      message: 'Tokens purchased successfully from marketplace',
      purchase: {
        amount: sellOrder.amount,
        pricePerToken: sellOrder.pricePerToken,
        totalPrice: sellOrder.amount * (sellOrder.pricePerToken || 0),
        seller: sellOrder.user.name
      }
    });
  });

  private async getMarketStats() {
    const transactions = await prisma.transaction.findMany({
      where: {
        type: { in: ['buy', 'sell'] },
        status: 'confirmed',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });

    const totalVolume = transactions.reduce((sum, tx) => 
      sum + (tx.amount * (tx.pricePerToken || 0)), 0
    );

    const prices = transactions
      .filter(tx => tx.pricePerToken)
      .map(tx => tx.pricePerToken!);

    const avgPrice = prices.length > 0 
      ? prices.reduce((sum, price) => sum + price, 0) / prices.length 
      : 0;

    return {
      totalVolume,
      averagePrice: Math.round(avgPrice * 100) / 100,
      totalTransactions: transactions.length,
      activeOrders: await prisma.transaction.count({
        where: { type: 'sell', status: 'pending' }
      })
    };
  }
}
