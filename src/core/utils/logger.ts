/**
 * Logging Utility
 * Provides structured logging with multiple levels
 */

import { Logger } from '../../types';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LoggerOptions {
  level?: LogLevel;
  prefix?: string;
  timestamp?: boolean;
}

export class ConsoleLogger implements Logger {
  private level: LogLevel;
  private prefix: string;
  private useTimestamp: boolean;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? LogLevel.INFO;
    this.prefix = options.prefix ?? 'JARVIS';
    this.useTimestamp = options.timestamp ?? true;
  }

  private formatMessage(level: string, message: string): string {
    const parts: string[] = [];
    
    if (this.useTimestamp) {
      parts.push(new Date().toISOString());
    }
    
    parts.push(`[${this.prefix}]`);
    parts.push(`[${level}]`);
    parts.push(message);
    
    return parts.join(' ');
  }

  debug(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(this.formatMessage('DEBUG', message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info(this.formatMessage('INFO', message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message), ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(this.formatMessage('ERROR', message), ...args);
    }
  }
}

// Default logger instance
export const logger = new ConsoleLogger({
  level: process.env.LOG_LEVEL 
    ? (LogLevel as any)[process.env.LOG_LEVEL.toUpperCase()] 
    : LogLevel.INFO,
});
