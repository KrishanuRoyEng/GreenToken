import PrismaClientSingleton from '../lib/prisma';
import { EmailService } from './EmailServices';
import { logger } from '../utils/logger';

export class NotificationService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  private async createDbNotification(userId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') {
    try {
      const prisma = await PrismaClientSingleton.getInstance();
      await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
        }
      });
    } catch (err) {
      logger.error(`Failed to create DB notification for user ${userId}`, err);
    }
  }

  async notifyWelcome(userId: string, email: string, name: string) {
    await Promise.all([
      this.emailService.sendWelcomeEmail(email, name),
      this.createDbNotification(userId, "Welcome to GreenToken", "Your account has been created successfully.", "info")
    ]);
  }

  async notifyProjectApproved(userId: string, email: string, projectName: string) {
    await Promise.all([
      this.emailService.sendProjectApprovalEmail(email, projectName),
      this.createDbNotification(userId, "Project Approved", `Your project "${projectName}" has been approved.`, "success")
    ]);
  }

  async notifyProjectRejected(userId: string, email: string, projectName: string, reason: string) {
    await Promise.all([
      this.emailService.sendProjectRejectionEmail(email, projectName, reason),
      this.createDbNotification(userId, "Project Rejected", `Your project "${projectName}" was rejected: ${reason}`, "error")
    ]);
  }

  async notifyAccountVerified(userId: string, email: string) {
    await Promise.all([
      this.emailService.sendAccountVerifiedEmail(email),
      this.createDbNotification(userId, "Account Verified", "Your identity has been verified.", "success")
    ]);
  }

  async notifyCreditsIssued(userId: string, email: string, amount: number, projectName: string) {
    await Promise.all([
      this.emailService.sendCreditIssuanceEmail(email, amount, projectName),
      this.createDbNotification(userId, "Credits Issued", `${amount} credits issued for "${projectName}"`, "success")
    ]);
  }
}

export const notificationService = new NotificationService();

