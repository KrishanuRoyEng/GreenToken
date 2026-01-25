import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type LogLevel = 'info' | 'warn' | 'error';

class Logger {
    private async sendLog(level: LogLevel, message: string, context?: any) {
        // Always log to console in development
        const timestamp = new Date().toISOString();
        const consoleMsg = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

        if (level === 'error') {
            console.error(consoleMsg, context);
        } else if (level === 'warn') {
            console.warn(consoleMsg, context);
        } else {
            console.log(consoleMsg, context);
        }

        // Send to backend
        try {
            await axios.post(`${API_URL}/api/logs`, {
                level,
                message,
                context,
                timestamp
            });
        } catch (err) {
            // Silently fail network logging to avoid loops
            console.error('Failed to send log to backend', err);
        }
    }

    info(message: string, context?: any) {
        this.sendLog('info', message, context);
    }

    warn(message: string, context?: any) {
        this.sendLog('warn', message, context);
    }

    error(message: string, context?: any) {
        this.sendLog('error', message, context);
    }
}

export const logger = new Logger();
