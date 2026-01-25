import { Request, Response } from 'express';
import crypto from 'crypto';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import PrismaClientSingleton from '../lib/prisma';

// Check if Razorpay is configured
const IS_DEMO_MODE = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === '';

// Conditionally import Razorpay (only if configured)
let razorpay: any = null;
if (!IS_DEMO_MODE) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Razorpay = require('razorpay');
        razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    } catch {
        logger.warn('Razorpay SDK not installed. Running in DEMO mode.');
    }
}

export class PaymentController {
    /**
     * Create a payment order (Razorpay or Demo mode)
     */
    static createOrder = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user.id;
        const { amount, currency = 'INR', tokenAmount, orderId: marketplaceOrderId } = req.body;

        if (!amount || amount < 1) {
            throw createError('Invalid amount', 400);
        }

        const prisma = await PrismaClientSingleton.getInstance();

        // DEMO MODE: Create mock order
        if (IS_DEMO_MODE || !razorpay) {
            const mockOrderId = `demo_order_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

            const payment = await prisma.payment.create({
                data: {
                    userId,
                    orderId: mockOrderId,
                    amount,
                    currency,
                    status: 'PENDING',
                    paymentMethod: 'RAZORPAY',
                    razorpayOrderId: mockOrderId,
                    metadata: {
                        tokenAmount,
                        marketplaceOrderId,
                        demoMode: true,
                    },
                },
            });

            logger.info(`[DEMO MODE] Payment order created: ${payment.id} for user ${userId}`);

            res.status(201).json({
                success: true,
                demoMode: true,
                order: {
                    id: mockOrderId,
                    amount: Math.round(amount * 100),
                    currency,
                    receipt: `demo_rcpt_${Date.now()}`,
                },
                paymentId: payment.id,
                key: 'demo_key',
                message: 'Running in DEMO mode. Click "Complete Demo Payment" to simulate payment.',
            });
            return;
        }

        // PRODUCTION MODE: Create Razorpay order
        const options = {
            amount: Math.round(amount * 100),
            currency,
            receipt: `rcpt_${Date.now()}_${userId.slice(0, 8)}`,
            notes: {
                userId,
                tokenAmount: tokenAmount?.toString() || '',
                marketplaceOrderId: marketplaceOrderId || '',
                purpose: 'carbon_credit_purchase',
            },
        };

        const razorpayOrder = await razorpay.orders.create(options);

        const payment = await prisma.payment.create({
            data: {
                userId,
                orderId: razorpayOrder.id,
                amount,
                currency,
                status: 'PENDING',
                paymentMethod: 'RAZORPAY',
                razorpayOrderId: razorpayOrder.id,
                metadata: {
                    tokenAmount,
                    marketplaceOrderId,
                },
            },
        });

        logger.info(`Payment order created: ${payment.id} for user ${userId}`);

        res.status(201).json({
            success: true,
            demoMode: false,
            order: {
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                receipt: razorpayOrder.receipt,
            },
            paymentId: payment.id,
            key: process.env.RAZORPAY_KEY_ID,
        });
    });

    /**
     * Verify payment (Razorpay signature or Demo mode)
     */
    static verifyPayment = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user.id;
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, demoMode } = req.body;

        const prisma = await PrismaClientSingleton.getInstance();

        // DEMO MODE: Auto-verify
        if (demoMode || IS_DEMO_MODE || razorpay_order_id?.startsWith('demo_')) {
            const payment = await prisma.payment.update({
                where: { razorpayOrderId: razorpay_order_id },
                data: {
                    status: 'COMPLETED',
                    razorpayPaymentId: `demo_pay_${Date.now()}`,
                    completedAt: new Date(),
                },
            });

            // Process token transfer
            const metadata = payment.metadata as any;
            if (metadata?.tokenAmount) {
                await PaymentController.issueNewTokens(userId, parseInt(metadata.tokenAmount));
            }

            logger.info(`[DEMO MODE] Payment verified: ${payment.id} for user ${userId}`);

            res.json({
                success: true,
                demoMode: true,
                message: 'Demo payment completed successfully!',
                payment: {
                    id: payment.id,
                    status: payment.status,
                    amount: payment.amount,
                },
            });
            return;
        }

        // PRODUCTION MODE: Verify Razorpay signature
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            throw createError('Missing payment verification data', 400);
        }

        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            throw createError('Invalid payment signature', 400);
        }

        const payment = await prisma.payment.update({
            where: { razorpayOrderId: razorpay_order_id },
            data: {
                status: 'COMPLETED',
                razorpayPaymentId: razorpay_payment_id,
                completedAt: new Date(),
            },
        });

        const metadata = payment.metadata as any;
        if (metadata?.marketplaceOrderId && metadata?.tokenAmount) {
            await PaymentController.completeTokenPurchase(
                userId,
                metadata.marketplaceOrderId,
                parseInt(metadata.tokenAmount)
            );
        } else if (metadata?.tokenAmount) {
            await PaymentController.issueNewTokens(userId, parseInt(metadata.tokenAmount));
        }

        logger.info(`Payment verified: ${payment.id} for user ${userId}`);

        res.json({
            success: true,
            message: 'Payment verified successfully',
            payment: {
                id: payment.id,
                status: payment.status,
                amount: payment.amount,
            },
        });
    });

    /**
     * Complete token purchase from marketplace
     */
    private static async completeTokenPurchase(
        buyerId: string,
        orderId: string,
        amount: number
    ) {
        const prisma = await PrismaClientSingleton.getInstance();

        const order = await prisma.transaction.findUnique({
            where: { id: orderId },
            include: { user: true },
        });

        if (!order || order.status !== 'pending') {
            throw createError('Order not available', 400);
        }

        await prisma.$transaction(async (tx: any) => {
            await tx.transaction.update({
                where: { id: orderId },
                data: { status: 'completed' },
            });

            await tx.transaction.create({
                data: {
                    userId: buyerId,
                    type: 'buy',
                    amount,
                    pricePerToken: order.pricePerToken,
                    status: 'confirmed',
                },
            });

            logger.info(`Token purchase completed: ${amount} tokens transferred to ${buyerId}`);
        });
    }

    /**
     * Issue new tokens for direct purchase
     */
    private static async issueNewTokens(userId: string, amount: number) {
        const prisma = await PrismaClientSingleton.getInstance();

        await prisma.transaction.create({
            data: {
                userId,
                type: 'buy',
                amount,
                pricePerToken: 50,
                status: 'confirmed',
            },
        });

        logger.info(`New tokens issued: ${amount} tokens to user ${userId}`);
    }

    /**
     * Get user's payment history
     */
    static getPaymentHistory = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const prisma = await PrismaClientSingleton.getInstance();

        const [payments, total] = await Promise.all([
            prisma.payment.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum,
            }),
            prisma.payment.count({ where: { userId } }),
        ]);

        res.json({
            success: true,
            demoMode: IS_DEMO_MODE,
            payments,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
            },
        });
    });

    /**
     * Razorpay webhook handler
     */
    static handleWebhook = asyncHandler(async (req: Request, res: Response) => {
        // Skip in demo mode
        if (IS_DEMO_MODE) {
            res.json({ received: true, demoMode: true });
            return;
        }

        const signature = req.headers['x-razorpay-signature'] as string;
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

        const generatedSignature = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (generatedSignature !== signature) {
            logger.warn('Invalid webhook signature');
            res.status(400).json({ error: 'Invalid signature' });
            return;
        }

        const event = req.body;
        const prisma = await PrismaClientSingleton.getInstance();

        switch (event.event) {
            case 'payment.captured':
                await prisma.payment.update({
                    where: { razorpayOrderId: event.payload.payment.entity.order_id },
                    data: {
                        status: 'COMPLETED',
                        razorpayPaymentId: event.payload.payment.entity.id,
                    },
                });
                logger.info(`Webhook: Payment captured ${event.payload.payment.entity.id}`);
                break;

            case 'payment.failed':
                await prisma.payment.update({
                    where: { razorpayOrderId: event.payload.payment.entity.order_id },
                    data: { status: 'FAILED' },
                });
                logger.info(`Webhook: Payment failed ${event.payload.payment.entity.id}`);
                break;

            case 'refund.created':
                // Find payment by razorpayPaymentId using findFirst, then update by id
                const paymentToRefund = await prisma.payment.findFirst({
                    where: { razorpayPaymentId: event.payload.refund.entity.payment_id },
                });
                if (paymentToRefund) {
                    await prisma.payment.update({
                        where: { id: paymentToRefund.id },
                        data: { status: 'REFUNDED' },
                    });
                }
                logger.info(`Webhook: Refund created ${event.payload.refund.entity.id}`);
                break;
        }

        res.json({ received: true });
    });

    /**
     * Request refund for a payment
     */
    static requestRefund = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user.id;
        const { paymentId, reason } = req.body;

        const prisma = await PrismaClientSingleton.getInstance();

        const payment = await prisma.payment.findFirst({
            where: { id: paymentId, userId, status: 'COMPLETED' },
        });

        if (!payment || !payment.razorpayPaymentId) {
            throw createError('Payment not found or not eligible for refund', 404);
        }

        // Demo mode refund
        if (IS_DEMO_MODE || payment.razorpayPaymentId.startsWith('demo_')) {
            await prisma.payment.update({
                where: { id: paymentId },
                data: { status: 'REFUNDED' },
            });

            res.json({
                success: true,
                demoMode: true,
                message: 'Demo refund processed',
                refund: { id: `demo_refund_${Date.now()}`, status: 'processed' },
            });
            return;
        }

        // Production refund
        const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
            amount: Math.round(payment.amount * 100),
            notes: { reason, userId },
        });

        await prisma.payment.update({
            where: { id: paymentId },
            data: { status: 'REFUNDED' },
        });

        logger.info(`Refund initiated: ${refund.id} for payment ${paymentId}`);

        res.json({
            success: true,
            message: 'Refund initiated',
            refund: { id: refund.id, status: refund.status },
        });
    });

    /**
     * Get system payment mode
     */
    static getPaymentMode = asyncHandler(async (_req: Request, res: Response) => {
        res.json({
            demoMode: IS_DEMO_MODE,
            provider: IS_DEMO_MODE ? 'demo' : 'razorpay',
            message: IS_DEMO_MODE
                ? 'Running in DEMO mode. Payments are simulated.'
                : 'Production mode with Razorpay.',
        });
    });

    /**
     * Verify a crypto (ETH) payment transaction
     */
    static verifyCryptoPayment = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user.id;
        const { txHash, amount, tokenAmount, orderId: marketplaceOrderId, walletAddress } = req.body;

        if (!txHash || !walletAddress) {
            throw createError('Transaction hash and wallet address are required', 400);
        }

        const prisma = await PrismaClientSingleton.getInstance();

        // Check if transaction already processed
        const existingPayment = await prisma.payment.findFirst({
            where: { razorpayPaymentId: txHash },
        });

        if (existingPayment) {
            throw createError('Transaction already processed', 400);
        }

        // Import blockchain service for verification
        const { blockchainService } = await import('../services/BlockchainServices');

        // Verify transaction on blockchain
        const txDetails = await blockchainService.verifyTransaction(txHash);

        if (!txDetails.confirmed) {
            throw createError('Transaction not confirmed on blockchain', 400);
        }

        // Create payment record
        const payment = await prisma.payment.create({
            data: {
                userId,
                orderId: `crypto_${txHash.substring(0, 16)}`,
                amount,
                currency: 'ETH',
                status: 'COMPLETED',
                paymentMethod: 'CRYPTO',
                razorpayOrderId: txHash, // Store txHash for reference
                razorpayPaymentId: txHash,
                metadata: {
                    walletAddress,
                    blockNumber: txDetails.blockNumber,
                    ethValue: txDetails.value,
                },
            },
        });

        // Handle token transfer if marketplace order
        if (marketplaceOrderId) {
            // Find the sell order (which is the listing)
            const sellOrder = await prisma.transaction.findUnique({
                where: { id: marketplaceOrderId },
                include: { user: true },
            });

            if (sellOrder && sellOrder.type === 'sell' && sellOrder.status === 'pending' && tokenAmount) {
                // Update seller's sell order to completed
                await prisma.transaction.update({
                    where: { id: sellOrder.id },
                    data: { status: 'completed', txHash },
                });

                // Create buy transaction for buyer
                await prisma.transaction.create({
                    data: {
                        userId,
                        type: 'buy',
                        amount: tokenAmount,
                        pricePerToken: sellOrder.pricePerToken,
                        status: 'completed',
                        txHash,
                    },
                });
            }
        }

        logger.info(`Crypto payment verified: ${txHash}, user: ${userId}`);

        res.json({
            success: true,
            message: 'Crypto payment verified successfully',
            payment: {
                id: payment.id,
                status: payment.status,
                txHash,
                amount,
                tokenAmount,
            },
        });
    });
}

export default PaymentController;
