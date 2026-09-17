/**
 * Structured Logger
 * 
 * Emits JSON logs with consistent structure for test reporting.
 * Includes correlation_id, tenant_id, timestamp, and structured fields.
 */

export interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  service: string;
  correlation_id?: string;
  tenant_id?: string;
  message: string;
  [key: string]: any;
}

export class Logger {
  private service: string;

  constructor(service: string) {
    this.service = service;
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log('DEBUG', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('INFO', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('WARN', message, context);
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    const contextWithError = {
      ...context,
      ...(error && {
        error_name: error.name,
        error_message: error.message,
        error_stack: error.stack
      })
    };
    this.log('ERROR', message, contextWithError);
  }

  private log(
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR',
    message: string,
    context?: Record<string, any>
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message,
      ...context
    };

    // Output as JSON
    const json = JSON.stringify(entry);
    
    if (level === 'ERROR') {
      console.error(json);
    } else if (level === 'WARN') {
      console.warn(json);
    } else {
      console.log(json);
    }
  }
}

/**
 * Global logger instance for tests
 */
export const globalLogger = new Logger('test-suite');
