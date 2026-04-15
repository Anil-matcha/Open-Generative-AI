/**
 * ViMax Layout Implementation
 * Simplified layout without shared dependencies for compatibility
 */

import React from 'react';

export function ViMaxLayout({ children, currentView, onViewChange }) {
  // Simple wrapper that just renders children
  // The actual layout is handled by the individual components in App.js
  return (
    <div className="vimax-app-container">
      {children}
    </div>
  );
}
