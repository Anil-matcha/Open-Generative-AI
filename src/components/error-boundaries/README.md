# React Error Boundaries for Timeline Editor

This directory contains comprehensive React error boundaries designed for the timeline editor application, providing robust error handling, recovery mechanisms, and fallback UI components.

## Overview

The error boundary system includes:

1. **Generic ErrorBoundary** - Basic error catching with customizable fallback UI
2. **Specialized Boundaries** - Modal, Editor, and Dashboard-specific error boundaries
3. **Error Recovery** - Automatic and manual recovery mechanisms
4. **Fallback Components** - Pre-built UI components for common error scenarios
5. **Logging Integration** - Configurable error reporting and logging

## Quick Start

### Basic Usage

```tsx
import { ErrorBoundary } from './error-boundaries';

function MyComponent() {
  return (
    <ErrorBoundary>
      <div>
        {/* Your component content */}
      </div>
    </ErrorBoundary>
  );
}
```

### Specialized Boundaries

```tsx
import {
  ModalErrorBoundary,
  EditorErrorBoundary,
  DashboardErrorBoundary
} from './error-boundaries';

// For modals
<ModalErrorBoundary modalName="Settings">
  <SettingsModal />
</ModalErrorBoundary>

// For editors with auto-recovery
<EditorErrorBoundary
  editorName="Timeline Editor"
  enableAutoRecovery={true}
  recoveryDelay={3000}
>
  <TimelineEditor />
</EditorErrorBoundary>

// For dashboard-like components
<DashboardErrorBoundary
  dashboardName="Project Dashboard"
  showNavigationOptions={true}
>
  <ProjectDashboard />
</DashboardErrorBoundary>
```

### Higher-Order Component

```tsx
import { withErrorBoundary } from './error-boundaries';

const SafeComponent = withErrorBoundary(
  UnsafeComponent,
  'editor',
  {
    editorName: 'My Editor',
    enableAutoRecovery: true
  }
);
```

## Components

### Error Boundaries

- **ErrorBoundary** - Generic error boundary with customizable fallback
- **ModalErrorBoundary** - Specialized for modal dialogs
- **EditorErrorBoundary** - For editor components with recovery options
- **DashboardErrorBoundary** - For dashboard-like components

### Fallback UI Components

- **ErrorFallback** - Generic error display
- **NetworkErrorFallback** - Network-related errors
- **DataErrorFallback** - Data loading failures
- **ComponentErrorFallback** - Component initialization errors
- **EmptyStateFallback** - Empty state displays
- **PermissionErrorFallback** - Access denied scenarios
- **TimeoutErrorFallback** - Operation timeout errors

### Utilities

- **errorRecoveryManager** - Manages error recovery attempts
- **errorLogger** - Configurable error logging and reporting
- **LoadingSpinner** - Loading indicator
- **RetryButton** - Retry action button

## Error Recovery

The system supports automatic and manual error recovery:

```tsx
import { errorRecoveryManager } from './error-boundaries';

const recovered = await errorRecoveryManager.attemptRecovery(
  'error_id',
  async () => {
    // Retry operation
    await riskyOperation();
  },
  {
    maxRetries: 3,
    retryDelay: 1000,
    onRetry: (attempt) => console.log(`Attempt ${attempt}`),
    onMaxRetriesExceeded: () => console.log('Recovery failed')
  }
);
```

## Error Classification

Errors are automatically classified by type:

```tsx
import { classifyError, getErrorSeverity } from './error-boundaries';

const error = new Error('Network request failed');
const category = classifyError(error); // ErrorCategory.NETWORK
const severity = getErrorSeverity(error, category); // ErrorSeverity.MEDIUM
```

## Configuration

### Error Reporting

```tsx
import { errorLogger } from './error-boundaries';

errorLogger.updateConfig({
  enabled: true,
  endpoint: 'https://api.example.com/errors',
  apiKey: 'your-api-key',
  environment: 'production',
  sampleRate: 0.1, // Report 10% of errors
  includeStackTrace: true,
  includeUserContext: true
});
```

## Integration with Vanilla JS App

For integrating React components with error boundaries in the vanilla JS application:

```tsx
import { renderReactComponent, createReactContainer } from './error-boundaries';

// Create container
const container = createReactContainer('react-wrapper');

// Render with error boundary
const wrapper = renderReactComponent(
  MyReactComponent,
  props,
  container,
  {
    errorBoundary: 'dashboard',
    boundaryProps: {
      dashboardName: 'My Dashboard'
    },
    onError: (error, errorInfo, errorId) => {
      console.error(`Component error: ${errorId}`, error);
    }
  }
);

// Cleanup when done
wrapper.unmount();
```

## Examples

See `examples.tsx` for comprehensive usage examples including:

- Basic error boundary usage
- Specialized boundary implementations
- Fallback component usage
- Recovery manager usage
- Error classification examples

## Best Practices

1. **Wrap Top-Level Components** - Use appropriate boundaries at component hierarchy levels
2. **Use Specialized Boundaries** - Choose the right boundary type for the component context
3. **Enable Recovery Where Possible** - Use auto-recovery for recoverable errors
4. **Log Errors Appropriately** - Configure error reporting for production
5. **Provide Meaningful Fallbacks** - Show helpful error messages and recovery options
6. **Test Error Scenarios** - Ensure error boundaries work in development and production

## Error Types Handled

- JavaScript runtime errors
- React component errors
- Async operation failures
- Network errors
- Data loading errors
- Permission/access errors
- Component initialization errors
- Timeout errors

## Development vs Production

- **Development**: Shows detailed error information and stack traces
- **Production**: Shows user-friendly error messages with recovery options
- **Error Reporting**: Only enabled in production by default

## Migration Guide

To add error boundaries to existing components:

1. Import the appropriate boundary component
2. Wrap your component with the boundary
3. Configure boundary props as needed
4. Test error scenarios
5. Deploy and monitor error reports