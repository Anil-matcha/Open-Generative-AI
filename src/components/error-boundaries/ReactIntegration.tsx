import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ErrorBoundary, ModalErrorBoundary, EditorErrorBoundary, DashboardErrorBoundary } from '../error-boundaries';

// Type for React component integration
export interface ReactComponentWrapper {
  element: HTMLElement;
  root: Root;
  unmount: () => void;
}

// Global registry for React roots to prevent memory leaks
const reactRoots = new WeakMap<HTMLElement, Root>();

/**
 * Renders a React component with error boundary protection
 */
export function renderReactComponent<T extends object>(
  Component: React.ComponentType<T>,
  props: T,
  container: HTMLElement,
  options: {
    errorBoundary?: 'generic' | 'modal' | 'editor' | 'dashboard';
    boundaryProps?: any;
    onError?: (error: Error, errorInfo: React.ErrorInfo, errorId: string) => void;
  } = {}
): ReactComponentWrapper {
  const {
    errorBoundary = 'generic',
    boundaryProps = {},
    onError
  } = options;

  // Clean up existing root if any
  if (reactRoots.has(container)) {
    const existingRoot = reactRoots.get(container);
    if (existingRoot) {
      existingRoot.unmount();
    }
  }

  // Create new root
  const root = createRoot(container);
  reactRoots.set(container, root);

  // Choose error boundary based on type
  let BoundaryComponent: React.ComponentType<any>;

  switch (errorBoundary) {
    case 'modal':
      BoundaryComponent = ModalErrorBoundary;
      break;
    case 'editor':
      BoundaryComponent = EditorErrorBoundary;
      break;
    case 'dashboard':
      BoundaryComponent = DashboardErrorBoundary;
      break;
    case 'generic':
    default:
      BoundaryComponent = ErrorBoundary;
      break;
  }

  // Render with error boundary
  const element = React.createElement(
    BoundaryComponent,
    {
      ...boundaryProps,
      onError
    },
    React.createElement(Component, props)
  );

  root.render(element);

  return {
    element: container,
    root,
    unmount: () => {
      root.unmount();
      reactRoots.delete(container);
    }
  };
}

/**
 * Unmounts a React component and cleans up
 */
export function unmountReactComponent(container: HTMLElement): void {
  if (reactRoots.has(container)) {
    const root = reactRoots.get(container);
    if (root) {
      root.unmount();
      reactRoots.delete(container);
    }
  }
}

/**
 * Utility to create a DOM container for React components
 */
export function createReactContainer(className = '', styles: Partial<CSSStyleDeclaration> = {}): HTMLElement {
  const container = document.createElement('div');
  container.className = className;
  Object.assign(container.style, styles);
  return container;
}

/**
 * Higher-order component for easy error boundary integration
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryType: 'generic' | 'modal' | 'editor' | 'dashboard' = 'generic',
  boundaryProps: any = {}
) {
  return (props: P) => {
    let BoundaryComponent: React.ComponentType<any>;

    switch (errorBoundaryType) {
      case 'modal':
        BoundaryComponent = ModalErrorBoundary;
        break;
      case 'editor':
        BoundaryComponent = EditorErrorBoundary;
        break;
      case 'dashboard':
        BoundaryComponent = DashboardErrorBoundary;
        break;
      case 'generic':
      default:
        BoundaryComponent = ErrorBoundary;
        break;
    }

    return React.createElement(
      BoundaryComponent,
      boundaryProps,
      React.createElement(Component, props)
    );
  };
}