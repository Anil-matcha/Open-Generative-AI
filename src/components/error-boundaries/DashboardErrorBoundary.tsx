import React, { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface DashboardErrorBoundaryProps {
  children: ReactNode;
  dashboardName?: string;
  onDashboardError?: (error: Error, errorInfo: React.ErrorInfo, errorId: string) => void;
  showRefreshOption?: boolean;
  showNavigationOptions?: boolean;
}

export const DashboardErrorBoundary: React.FC<DashboardErrorBoundaryProps> = ({
  children,
  dashboardName,
  onDashboardError,
  showRefreshOption = true,
  showNavigationOptions = true
}) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
    console.error(`Dashboard error in ${dashboardName || 'unknown dashboard'}:`, error);

    // Call custom error handler if provided
    if (onDashboardError) {
      onDashboardError(error, errorInfo, errorId);
    }

    // Could integrate with dashboard analytics
    // e.g., track dashboard load failures, user experience metrics
  };

  return (
    <ErrorBoundary
      onError={handleError}
      fallback={
        <DashboardErrorFallback
          dashboardName={dashboardName}
          showRefreshOption={showRefreshOption}
          showNavigationOptions={showNavigationOptions}
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
};

interface DashboardErrorFallbackProps {
  dashboardName?: string;
  showRefreshOption: boolean;
  showNavigationOptions: boolean;
}

const DashboardErrorFallback: React.FC<DashboardErrorFallbackProps> = ({
  dashboardName,
  showRefreshOption,
  showNavigationOptions
}) => {
  return (
    <div className="dashboard-error-fallback" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      padding: '32px',
      backgroundColor: '#f8f9fa',
      textAlign: 'center'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          fontSize: '64px',
          color: '#e74c3c',
          marginBottom: '16px'
        }}>
          📊
        </div>
        <h2 style={{ margin: '0 0 16px 0', color: '#495057' }}>
          Dashboard Unavailable
        </h2>
        <p style={{ margin: '0', fontSize: '16px', color: '#6c757d', maxWidth: '500px' }}>
          {dashboardName ? `The ${dashboardName} dashboard` : 'This dashboard'} encountered an error and cannot be displayed.
          This might be due to a temporary issue with the data or application.
        </p>
      </div>

      <div style={{
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {showRefreshOption && (
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>🔄</span>
            Refresh Dashboard
          </button>
        )}

        {showNavigationOptions && (
          <>
            <button
              onClick={() => window.history.back()}
              style={{
                padding: '12px 24px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>⬅️</span>
              Go Back
            </button>

            <button
              onClick={() => window.location.href = '/'}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>🏠</span>
              Home
            </button>
          </>
        )}
      </div>

      <div style={{
        marginTop: '32px',
        padding: '16px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '6px',
        maxWidth: '500px'
      }}>
        <p style={{ margin: '0', fontSize: '14px', color: '#856404' }}>
          <strong>Troubleshooting Tips:</strong>
        </p>
        <ul style={{
          margin: '8px 0 0 0',
          paddingLeft: '20px',
          textAlign: 'left',
          fontSize: '14px',
          color: '#856404'
        }}>
          <li>Check your internet connection</li>
          <li>Try refreshing the page</li>
          <li>Clear your browser cache</li>
          <li>Contact support if the issue persists</li>
        </ul>
      </div>
    </div>
  );
};