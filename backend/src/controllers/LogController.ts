import { Request, Response } from 'express';
import { logger } from '../utils/logger';

export class LogController {
    ingestLogs(req: Request, res: Response) {
        const { level, message, context, timestamp } = req.body;

        // Validate functionality
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const logMessage = `[CLIENT] ${message} | Context: ${JSON.stringify(context || {})}`;
        const logTimestamp = timestamp || new Date().toISOString();

        // Log to backend logger with special tag
        if (level === 'error') {
            logger.error(`${logTimestamp} ${logMessage}`);
        } else if (level === 'warn') {
            logger.warn(`${logTimestamp} ${logMessage}`);
        } else {
            logger.info(`${logTimestamp} ${logMessage}`);
        }

        return res.status(200).json({ received: true });
    }
}
