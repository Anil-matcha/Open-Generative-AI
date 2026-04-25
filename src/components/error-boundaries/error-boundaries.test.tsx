/**
 * Basic tests for React Error Boundaries
 * These tests verify that error boundaries catch and handle errors appropriately
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  ErrorBoundary,
  ModalErrorBoundary,
  EditorErrorBoundary,
  DashboardErrorBoundary,
  ErrorFallback,
  NetworkErrorFallback,
  DataErrorFallback
} from './index';

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Component that throws an error
const ErrorComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders fallback when error occurs', () => {
    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const mockOnError = vi.fn();

    render(
      <ErrorBoundary onError={mockOnError}>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(mockOnError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(Object),
      expect.any(String)
    );
  });
});

describe('ModalErrorBoundary', () => {
  it('renders modal-specific fallback', () => {
    render(
      <ModalErrorBoundary modalName="Test Modal">
        <ErrorComponent />
      </ModalErrorBoundary>
    );

    expect(screen.getByText('Modal Error')).toBeInTheDocument();
    expect(screen.getByText('Close Modal')).toBeInTheDocument();
  });
});

describe('EditorErrorBoundary', () => {
  it('renders editor-specific fallback with recovery options', () => {
    render(
      <EditorErrorBoundary editorName="Test Editor">
        <ErrorComponent />
      </EditorErrorBoundary>
    );

    expect(screen.getByText('Editor Error')).toBeInTheDocument();
    expect(screen.getByText('Try to Recover')).toBeInTheDocument();
    expect(screen.getByText('Reload Editor')).toBeInTheDocument();
  });

  it('shows auto-recovery countdown when enabled', () => {
    render(
      <EditorErrorBoundary
        editorName="Test Editor"
        enableAutoRecovery={true}
        recoveryDelay={3000}
      >
        <ErrorComponent />
      </EditorErrorBoundary>
    );

    expect(screen.getByText(/Auto-recovering in/)).toBeInTheDocument();
  });
});

describe('DashboardErrorBoundary', () => {
  it('renders dashboard-specific fallback', () => {
    render(
      <DashboardErrorBoundary dashboardName="Test Dashboard">
        <ErrorComponent />
      </DashboardErrorBoundary>
    );

    expect(screen.getByText('Dashboard Unavailable')).toBeInTheDocument();
    expect(screen.getByText('Refresh Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
  });
});

describe('ErrorFallback Components', () => {
  it('NetworkErrorFallback shows retry button', () => {
    const mockOnRetry = vi.fn();

    render(
      <NetworkErrorFallback
        onRetry={mockOnRetry}
        isRetrying={false}
      />
    );

    expect(screen.getByText('Connection Problem')).toBeInTheDocument();

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);
    expect(mockOnRetry).toHaveBeenCalled();
  });

  it('DataErrorFallback shows data type in message', () => {
    render(
      <DataErrorFallback
        dataType="user profiles"
        onRetry={() => {}}
        isRetrying={false}
      />
    );

    expect(screen.getByText(/Failed to Load user profiles/)).toBeInTheDocument();
  });

  it('shows retrying state correctly', () => {
    render(
      <NetworkErrorFallback
        onRetry={() => {}}
        isRetrying={true}
      />
    );

    expect(screen.getByText('Retrying...')).toBeInTheDocument();
  });
});

describe('Error Recovery', () => {
  it('can reset error boundary', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Reset by changing props
    rerender(
      <ErrorBoundary resetOnPropsChange={true} resetKeys={['resetKey']}>
        <ErrorComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });
});