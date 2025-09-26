// Client-side logging with development-only output
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ClientLogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  data?: any;
  userId?: string;
}

class ClientLogger {
  private static instance: ClientLogger;
  private isDevelopment: boolean;
  private logLevel: LogLevel;

  private constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.logLevel = this.getLogLevel();
  }

  static getInstance(): ClientLogger {
    if (!ClientLogger.instance) {
      ClientLogger.instance = new ClientLogger();
    }
    return ClientLogger.instance;
  }

  private getLogLevel(): LogLevel {
    const envLevel = import.meta.env.VITE_LOG_LEVEL?.toLowerCase() as LogLevel;
    if (['debug', 'info', 'warn', 'error'].includes(envLevel)) {
      return envLevel;
    }
    return this.isDevelopment ? 'debug' : 'error';
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log errors unless specifically configured
    if (!this.isDevelopment && level !== 'error') {
      return false;
    }

    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    return levels[level] >= levels[this.logLevel];
  }

  private formatMessage(entry: ClientLogEntry): string {
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

    return `${timestamp} ${levelIcon} [${entry.component}] ${entry.message}`;
  }

  private log(level: LogLevel, component: string, message: string, data?: any, userId?: string) {
    if (!this.shouldLog(level)) return;

    const entry: ClientLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      data,
      userId
    };

    const formattedMessage = this.formatMessage(entry);

    // Use appropriate console method
    switch (level) {
      case 'debug':
        console.debug(formattedMessage, data || '');
        break;
      case 'info':
        console.info(formattedMessage, data || '');
        break;
      case 'warn':
        console.warn(formattedMessage, data || '');
        break;
      case 'error':
        console.error(formattedMessage, data || '');
        break;
    }
  }

  debug(component: string, message: string, data?: any, userId?: string) {
    this.log('debug', component, message, data, userId);
  }

  info(component: string, message: string, data?: any, userId?: string) {
    this.log('info', component, message, data, userId);
  }

  warn(component: string, message: string, data?: any, userId?: string) {
    this.log('warn', component, message, data, userId);
  }

  error(component: string, message: string, data?: any, userId?: string) {
    this.log('error', component, message, data, userId);
  }

  // Specialized logging methods for common UI events
  userAction(action: string, component: string, data?: any, userId?: string) {
    this.debug(component, `User action: ${action}`, data, userId);
  }

  apiCall(method: string, endpoint: string, status?: number, component: string = 'API', userId?: string) {
    const message = `${method} ${endpoint}${status ? ` (${status})` : ''}`;
    const level = status && status >= 400 ? 'error' : 'debug';
    this.log(level, component, message, undefined, userId);
  }

  performance(metric: string, value: number, component: string, userId?: string) {
    this.debug(component, `Performance: ${metric} = ${value}ms`, undefined, userId);
  }

  // React component lifecycle logging
  componentMount(componentName: string, props?: any, userId?: string) {
    this.debug(componentName, 'Component mounted', props, userId);
  }

  componentUnmount(componentName: string, userId?: string) {
    this.debug(componentName, 'Component unmounted', undefined, userId);
  }

  // Form and validation logging
  formSubmit(formName: string, success: boolean, errors?: any, userId?: string) {
    const message = `Form ${formName} ${success ? 'submitted successfully' : 'failed validation'}`;
    const level = success ? 'info' : 'warn';
    this.log(level, 'FORM', message, errors, userId);
  }

  // Voice input logging (replaces existing voice debug logs)
  voiceInput(event: string, data?: any, userId?: string) {
    this.debug('VoiceInput', event, data, userId);
  }
}

// Export singleton instance
export const clientLogger = ClientLogger.getInstance();

// Development-only helper functions for backward compatibility
export const devLog = {
  debug: (component: string, message: string, data?: any) => 
    clientLogger.debug(component, message, data),
  info: (component: string, message: string, data?: any) => 
    clientLogger.info(component, message, data),
  warn: (component: string, message: string, data?: any) => 
    clientLogger.warn(component, message, data),
  error: (component: string, message: string, data?: any) => 
    clientLogger.error(component, message, data),
};

// Legacy console replacement (will be no-op in production)
export const prodSafeConsole = {
  log: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(message, ...args);
    }
  },
  debug: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.debug(message, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.warn(message, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    // Always allow errors in production for debugging
    console.error(message, ...args);
  }
};