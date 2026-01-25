import dotenv from 'dotenv';
dotenv.config();

import { httpServer, app } from './app';
import { logger } from './utils/logger';
import PrismaClientSingleton from './lib/prisma';
import express from 'express';
import path from 'path';

// Serve uploads directory specifically for fallback IPFS files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    logger.info('🚀 Starting Blue Carbon MRV Backend...');
    logger.info(`📊 Environment: ${process.env.NODE_ENV}`);

    // Don't initialize Prisma here - let it happen lazily on first request
    logger.info('⏳ Prisma client will initialize on first database request');

    // Start server
    httpServer.listen(PORT, () => {
      logger.info(`✅ Server running on port ${PORT}`);
      logger.info(`🌐 API URL: http://localhost:${PORT}/api`);
      logger.info(`📚 Health check: http://localhost:${PORT}/health`);
      logger.info('🔄 Server is ready to accept connections');
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
const shutdown = async () => {
  logger.info('🔄 Shutting down gracefully...');
  try {
    await PrismaClientSingleton.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();