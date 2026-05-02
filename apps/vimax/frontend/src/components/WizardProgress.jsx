/* eslint-disable */
import React from 'react';
import './WizardProgress.css';

const STEPS = [
  { id: 0, label: 'Tell Your Idea', shortLabel: 'Idea' },
  { id: 1, label: 'Your Content', shortLabel: 'Content' },
  { id: 2, label: 'Style & Quality', shortLabel: 'Style' },
  { id: 3, label: 'Generating', shortLabel: 'Generate' },
  { id: 4, label: 'Your Video', shortLabel: 'Result' },
];

export default function WizardProgress({ currentStep, onStepClick }) {
  return (
    <div className="wizard-progress">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isClickable = index < currentStep && onStepClick;

        return (
          <React.Fragment key={step.id}>
            <button
              className={`wizard-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''} ${isClickable ? 'clickable' : ''}`}
              onClick={() => isClickable && onStepClick(index)}
              disabled={!isClickable}
              title={step.label}
            >
              <div className="wizard-step-circle">
                {isCompleted ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span className="wizard-step-label">{step.label}</span>
              <span className="wizard-step-short-label">{step.shortLabel}</span>
            </button>
            {index < STEPS.length - 1 && (
              <div className={`wizard-connector ${isCompleted ? 'completed' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
