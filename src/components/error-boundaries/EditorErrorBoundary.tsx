import React, { ReactNode, useState } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface EditorErrorBoundaryProps {
  children: ReactNode;
  editorName?: string;
  onEditorError?: (error: Error, errorInfo: React.ErrorInfo, errorId: string) => void;
  enableAutoRecovery?: boolean;
  recoveryDelay?: number;
}

export const EditorErrorBoundary: React.FC<EditorErrorBoundaryProps> = ({
  children,
  editorName,
  onEditorError,
  enableAutoRecovery = false,
  recoveryDelay = 3000
}) => {
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);
  const maxRecoveryAttempts = 3;

  const handleError = (error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
    console.error(`Editor error in ${editorName || 'unknown editor'}:`, error);

    // Call custom error handler if provided
    if (onEditorError) {
      onEditorError(error, errorInfo, errorId);
    }

    // Track editor-specific errors for analytics
    // Could integrate with editor usage metrics
  };

  const handleRecovery = () => {
    setRecoveryAttempts(prev => prev + 1);
  };

  return (
    <ErrorBoundary
      onError={handleError}
      resetOnPropsChange={true}
      resetKeys={['children']} // Reset when children change (e.g., new editor instance)
      fallback={
        <EditorErrorFallback
          editorName={editorName}
          recoveryAttempts={recoveryAttempts}
          maxRecoveryAttempts={maxRecoveryAttempts}
          enableAutoRecovery={enableAutoRecovery}
          recoveryDelay={recoveryDelay}
          onManualRecovery={handleRecovery}
          onFallbackAction={() => {
            // Could save current work, show recovery options, etc.
            window.location.reload();
          }}
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
};

interface EditorErrorFallbackProps {
  editorName?: string;
  recoveryAttempts: number;
  maxRecoveryAttempts: number;
  enableAutoRecovery: boolean;
  recoveryDelay: number;
  onManualRecovery: () => void;
  onFallbackAction: () => void;
}

const EditorErrorFallback: React.FC<EditorErrorFallbackProps> = ({
  editorName,
  recoveryAttempts,
  maxRecoveryAttempts,
  enableAutoRecovery,
  recoveryDelay,
  onManualRecovery,
  onFallbackAction
}) => {
  const [countdown, setCountdown] = useState(enableAutoRecovery ? recoveryDelay / 1000 : 0);

  React.useEffect(() => {
    if (enableAutoRecovery && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (enableAutoRecovery && countdown === 0 && recoveryAttempts < maxRecoveryAttempts) {
      onManualRecovery();
    }
  }, [countdown, enableAutoRecovery, recoveryAttempts, maxRecoveryAttempts, onManualRecovery]);

  const canRecover = recoveryAttempts < maxRecoveryAttempts;

  return (
    <div className="editor-error-fallback" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '300px',
      padding: '24px',
      backgroundColor: '#f8f9fa',
      border: '2px dashed #dee2e6',
      borderRadius: '8px',
      textAlign: 'center'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          fontSize: '48px',
          color: '#e74c3c',
          marginBottom: '12px'
        }}>
          ⚠️
        </div>
        <h3 style={{ margin: '0 0 12px 0', color: '#495057' }}>
          Editor Error
        </h3>
        <p style={{ margin: '0', fontSize: '14px', color: '#6c757d' }}>
          {editorName ? `The ${editorName} editor` : 'This editor'} encountered an error.
          {canRecover ? ' Attempting to recover...' : ' Recovery attempts exhausted.'}
        </p>
        {recoveryAttempts > 0 && (
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6c757d' }}>
            Recovery attempts: {recoveryAttempts}/{maxRecoveryAttempts}
          </p>
        )}
      </div>

      {enableAutoRecovery && countdown > 0 && canRecover && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e9ecef',
            borderTop: '3px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 12px auto'
          }} />
          <p style={{ margin: '0', fontSize: '14px', color: '#6c757d' }}>
            Auto-recovering in {countdown} seconds...
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {canRecover && (
          <button
            onClick={onManualRecovery}
            disabled={enableAutoRecovery && countdown > 0}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: enableAutoRecovery && countdown > 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: enableAutoRecovery && countdown > 0 ? 0.6 : 1
            }}
          >
            {enableAutoRecovery && countdown > 0 ? 'Auto-recovering...' : 'Try to Recover'}
          </button>
        )}

        <button
          onClick={onFallbackAction}
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
          Reload Editor
        </button>

        <button
          onClick={() => window.history.back()}
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
          Go Back
        </button>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};