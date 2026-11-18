"use client";

import React from 'react';

/**
 * StudioErrorBoundary — catches render errors in individual studio tabs
 * so a crash in one studio (e.g., Video Studio) doesn't white-screen
 * the entire application.
 *
 * Usage:
 *   <StudioErrorBoundary studio="video" onError={logError}>
 *     <VideoStudio ... />
 *   </StudioErrorBoundary>
 */
export default class StudioErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(
      `[StudioErrorBoundary] ${this.props.studio || 'unknown'} crashed:`,
      error,
      errorInfo
    );

    this.setState({ errorInfo });

    if (this.props.onError) {
      this.props.onError({
        studio: this.props.studio || 'unknown',
        error: error?.message || String(error),
        componentStack: errorInfo?.componentStack || '',
        timestamp: Date.now(),
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          reset: this.handleReset,
          studio: this.props.studio,
        });
      }

      // Default fallback UI
      return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-[#050505] text-white p-8">
          <div className="max-w-md w-full bg-[#0a0a0b] border border-red-500/20 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgb(239,68,68)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">
              {this.props.studio
                ? `${this.props.studio} Studio encountered an error`
                : 'Something went wrong'}
            </h2>

            <p className="text-sm text-white/50 mb-1">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>

            {this.state.errorInfo && (
              <details className="mt-3 mb-4 text-left">
                <summary className="text-xs text-white/30 cursor-pointer hover:text-white/50">
                  Technical details
                </summary>
                <pre className="mt-2 text-[10px] text-white/30 bg-black/50 rounded-lg p-3 overflow-auto max-h-32 whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack || 'No stack trace available'}
                </pre>
              </details>
            )}

            <button
              onClick={this.handleReset}
              className="mt-4 px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-sm font-bold text-white transition-colors"
            >
              Try Again
            </button>

            <p className="mt-4 text-[11px] text-white/20">
              If this persists, try refreshing the page or switching to another studio.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
