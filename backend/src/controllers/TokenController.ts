import { Request, Response, NextFunction } from "express";
import { PrismaClient, Transaction, Prisma } from "@prisma/client";
import { logger } from "../utils/logger";
import { asyncHandler, createError } from "../middleware/errorHandler";
import { validateTokenTransaction } from "../utils/validation";

const prisma = new PrismaClient();

// Use Prisma's generated types for complex queries
type TransactionWithProject = Prisma.TransactionGetPayload<{
  include: { project: { select: { id: true, name: true } } }
}>;

type TransactionWithUser = Prisma.TransactionGetPayload<{
  include: { user: { select: { name: true, organizationName: true } } }
}>;

export class TokenController {
  // Get user token balances and transactions
  getUserTokens = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user.id;

    const transactions: TransactionWithProject[] = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    let totalTokens = 0;
    let soldTokens = 0;
    let acquiredTokens = 0;

    transactions.forEach((tx: TransactionWithProject) => {
      if (tx.type === "mint" || tx.type === "buy") {
        totalTokens += tx.amount;
        if (tx.type === "buy") acquiredTokens += tx.amount;
      } else if (tx.type === "sell" || tx.type === "burn") {
        totalTokens -= tx.amount;
        if (tx.type === "sell") soldTokens += tx.amount;
      }
    });

    res.json({
      balance: {
        total: Math.max(0, totalTokens),
        sold: soldTokens,
        acquired: acquiredTokens,
      },
      transactions,
    });
  });

  // Buy tokens
  buyTokens = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { error, value } = validateTokenTransaction(req.body);
      if (error) return next(createError(error.details[0].message, 400));

      const userId = req.user.id;
      const { amount } = value;
      const pricePerToken = 50;
      const totalPrice = amount * pricePerToken;

      const transaction = await prisma.transaction.create({
        data: {
          type: "buy",
          amount,
          pricePerToken,
          status: "confirmed",
          userId,
        },
      });

      logger.info(
        `User ${req.user.email} bought ${amount} tokens for ₹${totalPrice}`
      );

      res.json({
        message: "Tokens purchased successfully",
        transaction: { id: transaction.id, amount, totalPrice, pricePerToken },
      });
    }
  );

  // Sell tokens
  sellTokens = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { error, value } = validateTokenTransaction(req.body);
      if (error) return next(createError(error.details[0].message, 400));

      const userId = req.user.id;
      const { amount, pricePerToken } = value;

      if (!pricePerToken)
        return next(createError("Price per token is required", 400));

      // Calculate user balance
      const userTransactions: Transaction[] = await prisma.transaction.findMany({
        where: { userId },
      });

      let balance = 0;
      userTransactions.forEach((tx: Transaction) => {
        if (tx.type === "mint" || tx.type === "buy") balance += tx.amount;
        else if (tx.type === "sell" || tx.type === "burn") balance -= tx.amount;
      });

      if (balance < amount)
        return next(createError("Insufficient token balance", 400));

      const transaction = await prisma.transaction.create({
        data: {
          type: "sell",
          amount,
          pricePerToken,
          status: "pending",
          userId,
        },
      });

      logger.info(
        `User ${req.user.email} listed ${amount} tokens for sale at ₹${pricePerToken} each`
      );

      res.json({
        message: "Tokens listed for sale successfully",
        transaction: {
          id: transaction.id,
          amount,
          pricePerToken,
          totalValue: amount * pricePerToken,
        },
      });
    }
  );

  // Get marketplace sell orders
  getMarketplace = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const sellOrders: TransactionWithUser[] = await prisma.transaction.findMany({
      where: { type: "sell", status: "pending" },
      include: { user: { select: { name: true, organizationName: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.transaction.count({
      where: { type: "sell", status: "pending" },
    });

    const stats = await this.getMarketStats();

    res.json({
      orders: sellOrders.map((order) => ({
        id: order.id,
        seller: order.user
          ? order.user.name || order.user.organizationName
          : "Unknown",
        amount: order.amount,
        pricePerToken: order.pricePerToken,
        totalPrice: order.amount * (order.pricePerToken || 0),
        listedAt: order.createdAt,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats,
    });
  });

  // Purchase tokens from marketplace
  purchaseFromMarketplace = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { orderId } = req.params;
      const userId = req.user.id;

      const sellOrder: TransactionWithUser | null = await prisma.transaction.findUnique({
        where: { id: orderId },
        include: { user: { select: { name: true, organizationName: true } } },
      });

      if (!sellOrder || sellOrder.type !== "sell" || sellOrder.status !== "pending")
        return next(createError("Sell order not found", 404));

      if (sellOrder.userId === userId)
        return next(createError("Cannot purchase your own tokens", 400));

      await prisma.transaction.update({
        where: { id: orderId },
        data: { status: "completed" },
      });

      await prisma.transaction.create({
        data: {
          type: "buy",
          amount: sellOrder.amount,
          pricePerToken: sellOrder.pricePerToken,
          status: "confirmed",
          userId,
        },
      });

      logger.info(
        `User ${req.user.email} purchased ${sellOrder.amount} tokens from marketplace`
      );

      res.json({
        message: "Tokens purchased successfully",
        purchase: {
          amount: sellOrder.amount,
          pricePerToken: sellOrder.pricePerToken,
          totalPrice: sellOrder.amount * (sellOrder.pricePerToken || 0),
          seller: sellOrder.user ? sellOrder.user.name : "Unknown",
        },
      });
    }
  );

  // Private helper: get market statistics
  private async getMarketStats() {
    const transactions: Transaction[] = await prisma.transaction.findMany({
      where: {
        type: { in: ["buy", "sell"] },
        status: "confirmed",
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    const totalVolume = transactions.reduce(
      (sum: number, tx: Transaction) => sum + tx.amount * (tx.pricePerToken || 0),
      0
    );

    const prices = transactions
      .filter((tx: Transaction) => tx.pricePerToken)
      .map((tx: Transaction) => tx.pricePerToken!);

    const avgPrice =
      prices.length > 0
        ? prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length
        : 0;

    return {
      totalVolume,
      averagePrice: Math.round(avgPrice * 100) / 100,
      totalTransactions: transactions.length,
      activeOrders: await prisma.transaction.count({
        where: { type: "sell", status: "pending" },
      }),
    };
  }
}
