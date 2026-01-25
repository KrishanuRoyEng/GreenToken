import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export class EmailService {
  private transporter!: nodemailer.Transporter;

  constructor() {
    this.createTransporter();
  }

  private async createTransporter() {
    if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Create Ethereal test account for dev
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        logger.info('Ethereal Email initialized. Preview URLs will be logged.');
      } catch (err) {
        logger.error('Failed to create Ethereal account', err);
      }
    }
  }

  private async sendMail(to: string, subject: string, html: string) {
    if (!this.transporter) {
      await this.createTransporter();
    }

    try {
      const info = await this.transporter.sendMail({
        from: '"GreenToken" <noreply@greentoken.io>',
        to,
        subject,
        html,
      });

      logger.info(`Email sent to ${to}: ${subject}`);
      if (nodemailer.getTestMessageUrl(info)) {
        logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
    } catch (error) {
      logger.error(`Error sending email to ${to}:`, error);
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const subject = 'Welcome to GreenToken! 🌱';
    const html = `
      <h1>Welcome, ${name}!</h1>
      <p>Thank you for joining GreenToken. We're excited to have you on board.</p>
      <p>Start by verifying your account or exploring the dashboard.</p>
    `;
    await this.sendMail(email, subject, html);
  }

  async sendProjectApprovalEmail(email: string, projectName: string): Promise<void> {
    const subject = 'Project Approved! ✅';
    const html = `
      <h1>Project Approved</h1>
      <p>Good news! Your project "<strong>${projectName}</strong>" has been approved.</p>
      <p>You can now start issuing credits.</p>
    `;
    await this.sendMail(email, subject, html);
  }

  async sendProjectRejectionEmail(email: string, projectName: string, reason: string): Promise<void> {
    const subject = 'Project Update ⚠️';
    const html = `
      <h1>Project Status Update</h1>
      <p>We reviewed your project "<strong>${projectName}</strong>".</p>
      <p>Unfortunately, it was rejected for the following reason:</p>
      <blockquote>${reason}</blockquote>
      <p>Please update your project details and resubmit.</p>
    `;
    await this.sendMail(email, subject, html);
  }

  async sendAccountVerifiedEmail(email: string): Promise<void> {
    const subject = "Account Verified 🎉";
    const html = `
        <h1>You're Verified!</h1>
        <p>Your account has been fully verified. You now have full access to platform features.</p>
      `;
    await this.sendMail(email, subject, html);
  }

  async sendCreditIssuanceEmail(email: string, amount: number, projectName: string): Promise<void> {
    const subject = "Credits Issued 💎";
    const html = `
       <h1>Credits Minted</h1>
       <p>You have successfully issued <strong>${amount}</strong> credits for project "${projectName}".</p>
       <p>These are now available in your wallet.</p>
     `;
    await this.sendMail(email, subject, html);
  }

  async sendNotificationEmail(email: string, subject: string, message: string): Promise<void> {
    await this.sendMail(email, subject, `<p>${message}</p>`);
  }
}

