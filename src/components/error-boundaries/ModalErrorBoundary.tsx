import React, { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface ModalErrorBoundaryProps {
  children: ReactNode;
  modalName?: string;
  onModalError?: (error: Error, errorInfo: React.ErrorInfo, errorId: string) => void;
}

export const ModalErrorBoundary: React.FC<ModalErrorBoundaryProps> = ({
  children,
  modalName,
  onModalError
}) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
    console.error(`Modal error in ${modalName || 'unknown modal'}:`, error);

    // Call custom error handler if provided
    if (onModalError) {
      onModalError(error, errorInfo, errorId);
    }

    // Could integrate with modal-specific error reporting
    // e.g., track modal usage analytics, user frustration metrics
  };

  return (
    <ErrorBoundary
      onError={handleError}
      fallback={
        <ModalErrorFallback
          modalName={modalName}
          onClose={() => {
            // Try to close the modal or navigate away
            // This could integrate with a modal context or router
            window.history.back();
          }}
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
};

interface ModalErrorFallbackProps {
  modalName?: string;
  onClose: () => void;
}

const ModalErrorFallback: React.FC<ModalErrorFallbackProps> = ({
  modalName,
  onClose
}) => {
  return (
    <div className="modal-error-fallback" style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      maxWidth: '400px',
      width: '90%',
      zIndex: 10000,
      border: '1px solid #e74c3c'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#e74c3c', fontSize: '18px' }}>
          Modal Error
        </h3>
        <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
          Something went wrong in {modalName ? `the ${modalName} modal` : 'this modal'}.
          The modal has been closed to prevent further issues.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button
          onClick={onClose}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Close Modal
        </button>
      </div>
    </div>
  );
};