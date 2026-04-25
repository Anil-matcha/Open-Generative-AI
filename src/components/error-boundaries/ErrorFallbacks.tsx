import React from 'react';

// Generic loading spinner component
export const LoadingSpinner: React.FC<{ size?: 'small' | 'medium' | 'large' }> = ({
  size = 'medium'
}) => {
  const sizeMap = {
    small: '20px',
    medium: '40px',
    large: '60px'
  };

  return (
    <div style={{
      display: 'inline-block',
      width: sizeMap[size],
      height: sizeMap[size],
      border: '3px solid #f3f3f3',
      borderTop: '3px solid #3498db',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Generic retry button component
export const RetryButton: React.FC<{
  onRetry: () => void;
  isRetrying?: boolean;
  retryText?: string;
  retryingText?: string;
}> = ({
  onRetry,
  isRetrying = false,
  retryText = 'Try Again',
  retryingText = 'Retrying...'
}) => (
  <button
    onClick={onRetry}
    disabled={isRetrying}
    style={{
      padding: '8px 16px',
      backgroundColor: isRetrying ? '#6c757d' : '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: isRetrying ? 'not-allowed' : 'pointer',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}
  >
    {isRetrying && <LoadingSpinner size="small" />}
    {isRetrying ? retryingText : retryText}
  </button>
);

// Network error fallback
export const NetworkErrorFallback: React.FC<{
  onRetry: () => void;
  isRetrying?: boolean;
}> = ({ onRetry, isRetrying }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #dee2e6'
  }}>
    <div style={{
      fontSize: '48px',
      color: '#ffc107',
      marginBottom: '16px'
    }}>
      📡
    </div>
    <h3 style={{ margin: '0 0 12px 0', color: '#495057' }}>
      Connection Problem
    </h3>
    <p style={{
      margin: '0 0 24px 0',
      color: '#6c757d',
      maxWidth: '400px'
    }}>
      Unable to connect to the server. Please check your internet connection and try again.
    </p>
    <RetryButton onRetry={onRetry} isRetrying={isRetrying} />
  </div>
);

// Data loading error fallback
export const DataErrorFallback: React.FC<{
  onRetry: () => void;
  isRetrying?: boolean;
  dataType?: string;
}> = ({ onRetry, isRetrying, dataType = 'data' }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  }}>
    <div style={{
      fontSize: '48px',
      color: '#e74c3c',
      marginBottom: '16px'
    }}>
      📊
    </div>
    <h3 style={{ margin: '0 0 12px 0', color: '#495057' }}>
      Failed to Load {dataType}
    </h3>
    <p style={{
      margin: '0 0 20px 0',
      color: '#6c757d',
      maxWidth: '400px'
    }}>
      There was an error loading the {dataType.toLowerCase()}. This might be a temporary issue.
    </p>
    <RetryButton onRetry={onRetry} isRetrying={isRetrying} />
  </div>
);

// Component initialization error fallback
export const ComponentErrorFallback: React.FC<{
  componentName?: string;
  onRetry: () => void;
  onReload: () => void;
}> = ({ componentName, onRetry, onReload }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
    textAlign: 'center',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '8px',
    maxWidth: '500px'
  }}>
    <div style={{
      fontSize: '48px',
      color: '#856404',
      marginBottom: '16px'
    }}>
      ⚙️
    </div>
    <h3 style={{ margin: '0 0 12px 0', color: '#856404' }}>
      Component Error
    </h3>
    <p style={{
      margin: '0 0 20px 0',
      color: '#856404',
      maxWidth: '400px'
    }}>
      {componentName ? `The ${componentName} component` : 'This component'} failed to initialize properly.
    </p>
    <div style={{ display: 'flex', gap: '12px' }}>
      <button
        onClick={onRetry}
        style={{
          padding: '8px 16px',
          backgroundColor: '#ffc107',
          color: '#212529',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Retry
      </button>
      <button
        onClick={onReload}
        style={{
          padding: '8px 16px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Reload
      </button>
    </div>
  </div>
);

// Empty state fallback
export const EmptyStateFallback: React.FC<{
  title: string;
  description: string;
  icon?: string;
  actionButton?: {
    text: string;
    onClick: () => void;
  };
}> = ({ title, description, icon = '📭', actionButton }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    minHeight: '200px'
  }}>
    <div style={{
      fontSize: '48px',
      marginBottom: '16px'
    }}>
      {icon}
    </div>
    <h3 style={{ margin: '0 0 12px 0', color: '#495057' }}>
      {title}
    </h3>
    <p style={{
      margin: '0 0 24px 0',
      color: '#6c757d',
      maxWidth: '400px'
    }}>
      {description}
    </p>
    {actionButton && (
      <button
        onClick={actionButton.onClick}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        {actionButton.text}
      </button>
    )}
  </div>
);

// Permission denied fallback
export const PermissionErrorFallback: React.FC<{
  resource?: string;
  onLogin?: () => void;
  onGoBack?: () => void;
}> = ({ resource, onLogin, onGoBack }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    textAlign: 'center',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: '8px',
    maxWidth: '500px'
  }}>
    <div style={{
      fontSize: '48px',
      color: '#721c24',
      marginBottom: '16px'
    }}>
      🔒
    </div>
    <h3 style={{ margin: '0 0 12px 0', color: '#721c24' }}>
      Access Denied
    </h3>
    <p style={{
      margin: '0 0 24px 0',
      color: '#721c24',
      maxWidth: '400px'
    }}>
      You don't have permission to access {resource ? `the ${resource}` : 'this resource'}.
      Please check your permissions or contact an administrator.
    </p>
    <div style={{ display: 'flex', gap: '12px' }}>
      {onLogin && (
        <button
          onClick={onLogin}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Sign In
        </button>
      )}
      {onGoBack && (
        <button
          onClick={onGoBack}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Go Back
        </button>
      )}
    </div>
  </div>
);

// Timeout error fallback
export const TimeoutErrorFallback: React.FC<{
  operation?: string;
  onRetry: () => void;
  isRetrying?: boolean;
}> = ({ operation, onRetry, isRetrying }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
    textAlign: 'center',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '8px'
  }}>
    <div style={{
      fontSize: '48px',
      color: '#856404',
      marginBottom: '16px'
    }}>
      ⏱️
    </div>
    <h3 style={{ margin: '0 0 12px 0', color: '#856404' }}>
      Operation Timed Out
    </h3>
    <p style={{
      margin: '0 0 20px 0',
      color: '#856404',
      maxWidth: '400px'
    }}>
      {operation ? `The ${operation} operation` : 'This operation'} took too long to complete.
      Please try again.
    </p>
    <RetryButton onRetry={onRetry} isRetrying={isRetrying} />
  </div>
);