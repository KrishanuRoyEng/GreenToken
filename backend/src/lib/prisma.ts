// backend/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

class PrismaClientSingleton {
  private static instance: PrismaClient | null = null;
  private static isInitializing = false;

  static async getInstance(): Promise<PrismaClient> {
    if (this.instance) {
      return this.instance;
    }

    if (this.isInitializing) {
      // Wait for initialization to complete
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.instance!;
    }

    this.isInitializing = true;

    try {
      logger.info('🔄 Initializing Prisma client...');
      
      // Initialize Prisma client
      this.instance = new PrismaClient({
        log: ['error', 'warn'],
        errorFormat: 'pretty',
      });

      // Test connection
      await this.instance.$connect();
      logger.info('✅ Prisma client initialized and connected');

      this.isInitializing = false;
      return this.instance;
    } catch (error) {
      this.isInitializing = false;
      logger.error('❌ Failed to initialize Prisma client:', error);
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.$disconnect();
      this.instance = null;
      logger.info('✅ Prisma client disconnected');
    }
  }
}

export default PrismaClientSingleton;