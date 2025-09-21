import { logger } from '../utils/logger';

export class EmailService {
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    // Mock email sending for development
    logger.info(`Mock email sent to ${email}: Welcome ${name}!`);
  }

  async sendProjectApprovalEmail(email: string, projectName: string): Promise<void> {
    logger.info(`Mock email sent to ${email}: Project "${projectName}" approved!`);
  }

  async sendCreditIssuanceEmail(email: string, amount: number, projectName: string): Promise<void> {
    logger.info(`Mock email sent to ${email}: ${amount} credits issued for "${projectName}"`);
  }

  async sendNotificationEmail(email: string, subject: string, message: string): Promise<void> {
    logger.info(`Mock email sent to ${email}: ${subject} - ${message}`);
  }
}
