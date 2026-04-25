/**
 * Example usage of React Error Boundaries in the Timeline Editor Application
 *
 * This file demonstrates how to integrate the comprehensive error boundary system
 * with existing React components in the timeline editor app.
 */

import React from 'react';
import {
  ErrorBoundary,
  ModalErrorBoundary,
  EditorErrorBoundary,
  DashboardErrorBoundary,
  NetworkErrorFallback,
  DataErrorFallback,
  ComponentErrorFallback,
  EmptyStateFallback,
  withErrorBoundary,
  renderReactComponent,
  createReactContainer
} from '../error-boundaries';

// Example 1: Basic Error Boundary usage
const BasicExample = () => (
  <ErrorBoundary>
    <div>
      <h2>Basic Component</h2>
      {/* Component content that might throw errors */}
    </div>
  </ErrorBoundary>
);

// Example 2: Modal Error Boundary
const ModalExample = () => (
  <ModalErrorBoundary
    modalName="Settings Modal"
    onModalError={(error, errorInfo, errorId) => {
      // Log to analytics service
      console.error(`Modal error logged: ${errorId}`, error);
    }}
  >
    <div className="modal-content">
      <h2>Settings</h2>
      {/* Modal content */}
    </div>
  </ModalErrorBoundary>
);

// Example 3: Editor Error Boundary with recovery
const EditorExample = () => (
  <EditorErrorBoundary
    editorName="Timeline Editor"
    enableAutoRecovery={true}
    recoveryDelay={3000}
    onEditorError={(error, errorInfo, errorId) => {
      // Track editor crashes
      console.error(`Editor crash: ${errorId}`, error);
    }}
  >
    <div className="timeline-editor">
      <h2>Timeline Editor</h2>
      {/* Editor content */}
    </div>
  </EditorErrorBoundary>
);

// Example 4: Dashboard Error Boundary
const DashboardExample = () => (
  <DashboardErrorBoundary
    dashboardName="Project Dashboard"
    showNavigationOptions={true}
    onDashboardError={(error, errorInfo, errorId) => {
      // Send to monitoring service
      console.error(`Dashboard error: ${errorId}`, error);
    }}
  >
    <div className="project-dashboard">
      <h2>Project Dashboard</h2>
      {/* Dashboard content */}
    </div>
  </DashboardErrorBoundary>
);

// Example 5: Using Higher-Order Component
const UnsafeComponent = () => {
  // This component might throw errors
  throw new Error('Something went wrong!');
};

const SafeComponent = withErrorBoundary(UnsafeComponent, 'generic', {
  onError: (error, errorInfo, errorId) => {
    console.error(`Component error: ${errorId}`, error);
  }
});

// Example 6: Specialized Fallback Components
const NetworkErrorExample = () => (
  <NetworkErrorFallback
    onRetry={() => {
      // Retry network operation
      console.log('Retrying network request...');
    }}
    isRetrying={false}
  />
);

const DataErrorExample = () => (
  <DataErrorFallback
    dataType="user data"
    onRetry={() => {
      // Retry data loading
      console.log('Retrying data load...');
    }}
    isRetrying={false}
  />
);

const ComponentErrorExample = () => (
  <ComponentErrorFallback
    componentName="Video Player"
    onRetry={() => {
      // Retry component initialization
      console.log('Retrying component init...');
    }}
    onReload={() => {
      // Full reload
      window.location.reload();
    }}
  />
);

const EmptyStateExample = () => (
  <EmptyStateFallback
    title="No Projects Found"
    description="You haven't created any projects yet. Start by creating your first project."
    actionButton={{
      text: "Create Project",
      onClick: () => {
        // Navigate to create project
        console.log('Navigate to create project...');
      }
    }}
  />
);

// Example 7: Integrating with vanilla JS app
export function renderReactComponentWithErrorBoundary() {
  // Create container
  const container = createReactContainer('react-component-wrapper', {
    width: '100%',
    minHeight: '200px'
  });

  // Render React component with error boundary
  const wrapper = renderReactComponent(
    DashboardExample,
    {},
    container,
    {
      errorBoundary: 'dashboard',
      boundaryProps: {
        dashboardName: 'React Component Dashboard',
        onDashboardError: (error, errorInfo, errorId) => {
          console.error(`React component error: ${errorId}`, error);
        }
      }
    }
  );

  // Return wrapper for cleanup
  return wrapper;
}

// Example 8: Error Recovery Manager usage
import { errorRecoveryManager, classifyError, getErrorSeverity } from '../error-boundaries';

export const errorRecoveryExample = async () => {
  const errorId = 'example_error_123';

  try {
    // Some operation that might fail
    await riskyOperation();
  } catch (error) {
    const category = classifyError(error as Error);
    const severity = getErrorSeverity(error as Error, category);

    console.log(`Error classified as ${category} with severity ${severity}`);

    // Attempt recovery
    const recovered = await errorRecoveryManager.attemptRecovery(
      errorId,
      async () => {
        // Retry the operation
        await riskyOperation();
      },
      {
        maxRetries: 3,
        retryDelay: 1000,
        onRetry: (attempt) => {
          console.log(`Recovery attempt ${attempt}`);
        },
        onMaxRetriesExceeded: () => {
          console.log('Max retries exceeded, showing error UI');
        }
      }
    );

    if (!recovered) {
      // Show error UI
      console.log('Failed to recover, showing fallback');
    }
  }
};

// Mock risky operation
const riskyOperation = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Simulate random failure
    if (Math.random() > 0.7) {
      reject(new Error('Network request failed'));
    } else {
      resolve();
    }
  });
};

export {
  BasicExample,
  ModalExample,
  EditorExample,
  DashboardExample,
  SafeComponent,
  NetworkErrorExample,
  DataErrorExample,
  ComponentErrorExample,
  EmptyStateExample
};