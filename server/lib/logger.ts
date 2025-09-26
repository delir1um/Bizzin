// Enhanced logging system with environment-based controls
import { createLogger as createViteLogger } from "vite";

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  data?: any;
  userId?: string;
  requestId?: string;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private isDevelopment: boolean;
  private viteLogger = createViteLogger();

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.logLevel = this.getLogLevel();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private getLogLevel(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
    if (['debug', 'info', 'warn', 'error'].includes(envLevel)) {
      return envLevel;
    }
    return this.isDevelopment ? 'debug' : 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    return levels[level] >= levels[this.logLevel];
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    const levelIcon = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌'
    }[entry.level];

    const baseMessage = `${timestamp} ${levelIcon} [${entry.source}] ${entry.message}`;
    
    if (entry.data && this.isDevelopment) {
      return `${baseMessage}\n${JSON.stringify(entry.data, null, 2)}`;
    }
    
    return baseMessage;
  }

  private log(level: LogLevel, source: string, message: string, data?: any, context?: { userId?: string; requestId?: string }) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      data,
      ...context
    };

    const formattedMessage = this.formatMessage(entry);

    // Use appropriate console method
    switch (level) {
      case 'debug':
        console.debug(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
    }
  }

  debug(source: string, message: string, data?: any, context?: { userId?: string; requestId?: string }) {
    this.log('debug', source, message, data, context);
  }

  info(source: string, message: string, data?: any, context?: { userId?: string; requestId?: string }) {
    this.log('info', source, message, data, context);
  }

  warn(source: string, message: string, data?: any, context?: { userId?: string; requestId?: string }) {
    this.log('warn', source, message, data, context);
  }

  error(source: string, message: string, data?: any, context?: { userId?: string; requestId?: string }) {
    this.log('error', source, message, data, context);
  }

  // Specialized logging methods
  security(message: string, data?: any, context?: { userId?: string; requestId?: string }) {
    this.error('SECURITY', message, data, context);
  }

  audit(action: string, data?: any, context?: { userId?: string; requestId?: string }) {
    this.info('AUDIT', action, data, context);
  }

  api(method: string, path: string, status: number, duration: number, context?: { userId?: string; requestId?: string }) {
    const message = `${method} ${path} ${status} ${duration}ms`;
    const level = status >= 400 ? 'error' : 'info';
    this.log(level, 'API', message, undefined, context);
  }

  database(operation: string, table: string, success: boolean, data?: any, context?: { userId?: string; requestId?: string }) {
    const message = `${operation} ${table} ${success ? 'SUCCESS' : 'FAILED'}`;
    const level = success ? 'debug' : 'error';
    this.log(level, 'DB', message, data, context);
  }

  // Legacy compatibility - maintains existing log function signature
  legacy(message: string, source: string = "express") {
    this.info(source, message);
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Legacy compatibility export
export function log(message: string, source: string = "express") {
  logger.legacy(message, source);
}