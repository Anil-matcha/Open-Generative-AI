import { ErrorInfo } from 'react';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error categories for better classification
export enum ErrorCategory {
  RUNTIME = 'runtime',
  NETWORK = 'network',
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  RESOURCE = 'resource',
  UNKNOWN = 'unknown'
}

// Error context information
export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  componentName?: string;
  componentStack?: string;
  timestamp: string;
  userAgent?: string;
  url: string;
  action?: string;
  metadata?: Record<string, any>;
}

// Error recovery options
export interface ErrorRecoveryOptions {
  canRetry: boolean;
  maxRetries: number;
  retryDelay: number;
  fallbackComponent?: React.ComponentType<any>;
  onRetry?: () => void;
  onFallback?: () => void;
}

// Error reporting configuration
export interface ErrorReportingConfig {
  enabled: boolean;
  endpoint?: string;
  apiKey?: string;
  environment: string;
  sampleRate: number; // 0.0 to 1.0
  includeStackTrace: boolean;
  includeUserContext: boolean;
}

// Default error reporting configuration
const defaultErrorReportingConfig: ErrorReportingConfig = {
  enabled: process.env.NODE_ENV === 'production',
  environment: process.env.NODE_ENV || 'development',
  sampleRate: 1.0,
  includeStackTrace: true,
  includeUserContext: true
};

class ErrorRecoveryManager {
  private recoveryAttempts = new Map<string, number>();
  private recoveryTimeouts = new Map<string, NodeJS.Timeout>();

  canRecover(errorId: string, maxRetries: number = 3): boolean {
    const attempts = this.recoveryAttempts.get(errorId) || 0;
    return attempts < maxRetries;
  }

  async attemptRecovery(
    errorId: string,
    recoveryFn: () => Promise<void> | void,
    options: {
      maxRetries?: number;
      retryDelay?: number;
      onRetry?: (attempt: number) => void;
      onMaxRetriesExceeded?: () => void;
    } = {}
  ): Promise<boolean> {
    const { maxRetries = 3, retryDelay = 1000, onRetry, onMaxRetriesExceeded } = options;

    if (!this.canRecover(errorId, maxRetries)) {
      onMaxRetriesExceeded?.();
      return false;
    }

    const currentAttempts = this.recoveryAttempts.get(errorId) || 0;
    const newAttempts = currentAttempts + 1;
    this.recoveryAttempts.set(errorId, newAttempts);

    onRetry?.(newAttempts);

    try {
      await recoveryFn();
      // Recovery successful, reset attempts
      this.recoveryAttempts.delete(errorId);
      return true;
    } catch (error) {
      console.warn(`Recovery attempt ${newAttempts} failed for error ${errorId}:`, error);

      if (newAttempts >= maxRetries) {
        onMaxRetriesExceeded?.();
        return false;
      }

      // Schedule another attempt after delay
      return new Promise((resolve) => {
        const timeout = setTimeout(async () => {
          const success = await this.attemptRecovery(errorId, recoveryFn, options);
          resolve(success);
        }, retryDelay);

        this.recoveryTimeouts.set(errorId, timeout);
      });
    }
  }

  cancelRecovery(errorId: string): void {
    const timeout = this.recoveryTimeouts.get(errorId);
    if (timeout) {
      clearTimeout(timeout);
      this.recoveryTimeouts.delete(errorId);
    }
    this.recoveryAttempts.delete(errorId);
  }

  resetRecovery(errorId: string): void {
    this.cancelRecovery(errorId);
  }
}

// Global error recovery manager instance
export const errorRecoveryManager = new ErrorRecoveryManager();

class ErrorLogger {
  private config: ErrorReportingConfig;

  constructor(config: Partial<ErrorReportingConfig> = {}) {
    this.config = { ...defaultErrorReportingConfig, ...config };
  }

  logError(
    error: Error,
    errorInfo: ErrorInfo,
    errorId: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    context?: Partial<ErrorContext>
  ): void {
    // Always log to console
    console.error(`[${severity.toUpperCase()}] Error ${errorId}:`, error);

    if (!this.config.enabled) {
      return;
    }

    // Sample errors based on sample rate
    if (Math.random() > this.config.sampleRate) {
      return;
    }

    const errorContext: ErrorContext = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...context
    };

    const errorData = {
      id: errorId,
      message: error.message,
      stack: this.config.includeStackTrace ? error.stack : undefined,
      componentStack: errorInfo.componentStack,
      severity,
      category,
      context: this.config.includeUserContext ? errorContext : { timestamp: errorContext.timestamp, url: errorContext.url }
    };

    // Send to error reporting service
    this.reportError(errorData);
  }

  private async reportError(errorData: any): Promise<void> {
    if (!this.config.endpoint) {
      console.warn('Error reporting endpoint not configured');
      return;
    }

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify(errorData)
      });

      if (!response.ok) {
        console.warn('Failed to report error:', response.statusText);
      }
    } catch (reportError) {
      console.warn('Error reporting failed:', reportError);
    }
  }

  updateConfig(config: Partial<ErrorReportingConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Global error logger instance
export const errorLogger = new ErrorLogger();

// Utility functions for error classification
export const classifyError = (error: Error): ErrorCategory => {
  const message = error.message.toLowerCase();

  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return ErrorCategory.NETWORK;
  }

  if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
    return ErrorCategory.PERMISSION;
  }

  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return ErrorCategory.VALIDATION;
  }

  if (message.includes('out of memory') || message.includes('resource') || message.includes('limit')) {
    return ErrorCategory.RESOURCE;
  }

  return ErrorCategory.RUNTIME;
};

export const getErrorSeverity = (error: Error, category: ErrorCategory): ErrorSeverity => {
  // Critical errors
  if (category === ErrorCategory.PERMISSION || error.message.includes('critical')) {
    return ErrorSeverity.CRITICAL;
  }

  // High severity
  if (category === ErrorCategory.RESOURCE || error.message.includes('failed')) {
    return ErrorSeverity.HIGH;
  }

  // Medium severity (default)
  if (category === ErrorCategory.NETWORK || category === ErrorCategory.VALIDATION) {
    return ErrorSeverity.MEDIUM;
  }

  // Low severity
  return ErrorSeverity.LOW;
};

// Error boundary HOC for easy integration
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<React.ComponentProps<typeof ErrorBoundary>, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};