import React from 'react';

const ActionsPane = ({ children, className = '' }) => {
  return (
    <div className={`bg-card border-l border-border p-6 ${className}`}>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

export default ActionsPane;