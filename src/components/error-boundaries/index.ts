// Main error boundary components
export { ErrorBoundary, ErrorFallback } from './ErrorBoundary';
export { ModalErrorBoundary } from './ModalErrorBoundary';
export { EditorErrorBoundary } from './EditorErrorBoundary';
export { DashboardErrorBoundary } from './DashboardErrorBoundary';

// Error recovery and logging utilities
export {
  ErrorSeverity,
  ErrorCategory,
  ErrorContext,
  ErrorRecoveryOptions,
  ErrorReportingConfig,
  errorRecoveryManager,
  errorLogger,
  classifyError,
  getErrorSeverity,
  withErrorBoundary
} from './ErrorRecovery';

// Specialized fallback UI components
export {
  LoadingSpinner,
  RetryButton,
  NetworkErrorFallback,
  DataErrorFallback,
  ComponentErrorFallback,
  EmptyStateFallback,
  PermissionErrorFallback,
  TimeoutErrorFallback
} from './ErrorFallbacks';

// React integration utilities
export {
  renderReactComponent,
  unmountReactComponent,
  createReactContainer
} from './ReactIntegration';