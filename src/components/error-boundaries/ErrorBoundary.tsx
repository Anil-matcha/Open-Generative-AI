import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;
    const { errorId } = this.state;

    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call optional error handler
    if (onError && errorId) {
      onError(error, errorInfo, errorId);
    }

    // Report error to external service if configured
    this.reportError(error, errorInfo, errorId);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && resetOnPropsChange) {
      // Check if any of the resetKeys have changed
      if (resetKeys && resetKeys.some(key =>
        prevProps[key as keyof ErrorBoundaryProps] !== this.props[key as keyof ErrorBoundaryProps]
      )) {
        this.resetError();
      }
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo, errorId: string | null) => {
    // TODO: Integrate with error reporting service (e.g., Sentry, LogRocket, etc.)
    // For now, just log to console
    console.error(`Error reported [${errorId}]:`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
  };

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleRetry = () => {
    this.resetError();
  };

  render() {
    const { hasError, error, errorId } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      return (
        <ErrorFallback
          error={error}
          errorId={errorId}
          onRetry={this.handleRetry}
        />
      );
    }

    return children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  errorId: string | null;
  onRetry: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorId,
  onRetry
}) => {
  return (
    <div className="error-boundary-fallback" style={{
      padding: '20px',
      margin: '20px',
      border: '1px solid #e74c3c',
      borderRadius: '8px',
      backgroundColor: '#fdf2f2',
      color: '#721c24'
    }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#e74c3c' }}>
          Something went wrong
        </h3>
        <p style={{ margin: '0', fontSize: '14px' }}>
          An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
        </p>
        {errorId && (
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', fontFamily: 'monospace' }}>
            Error ID: {errorId}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          onClick={onRetry}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#95a5a6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Refresh Page
        </button>
      </div>

      {process.env.NODE_ENV === 'development' && error && (
        <details style={{ marginTop: '16px' }}>
          <summary style={{ cursor: 'pointer', fontSize: '12px' }}>
            Error Details (Development)
          </summary>
          <pre style={{
            marginTop: '8px',
            padding: '12px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto',
            maxHeight: '200px'
          }}>
            {error.message}
            {error.stack && '\n\nStack Trace:\n' + error.stack}
          </pre>
        </details>
      )}
    </div>
  );
};