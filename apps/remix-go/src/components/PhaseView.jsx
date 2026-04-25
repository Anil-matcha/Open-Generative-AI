import React from 'react';

const PhaseView = ({ elements, onPhaseChanged }) => {
  return (
    <div className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-center gap-8">
        {elements.map((element, index) => (
          <React.Fragment key={element.key}>
            <button
              onClick={() => element.available && onPhaseChanged && onPhaseChanged(element)}
              className={`phase-indicator ${element.active ? 'active' : element.available ? '' : 'opacity-50 cursor-not-allowed'}`}
              disabled={!element.available}
            >
              <span className="text-sm font-medium">{element.title}</span>
            </button>
            {index < elements.length - 1 && (
              <div className="w-8 h-0.5 bg-muted"></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default PhaseView;