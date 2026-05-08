import React from 'react';

function WorkflowProgress({ progress, workflow }) {
  const stages = [
    'Initializing workflow...',
    'Processing input...',
    'Generating content...',
    'Applying effects...',
    'Rendering output...',
    'Publishing to platforms...'
  ];

  const currentStage = Math.floor((progress / 100) * stages.length);

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Workflow Progress</h3>

      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Progress Percentage */}
        <div className="text-center">
          <span className="text-2xl font-bold text-blue-400">{progress}%</span>
          <span className="text-gray-400 ml-2">Complete</span>
        </div>

        {/* Current Stage */}
        <div className="text-center">
          <p className="text-gray-300">
            {stages[Math.min(currentStage, stages.length - 1)]}
          </p>
        </div>

        {/* Stage Indicators */}
        <div className="space-y-2">
          {stages.map((stage, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  index < currentStage
                    ? 'bg-green-500'
                    : index === currentStage
                    ? 'bg-blue-500 animate-pulse'
                    : 'bg-gray-600'
                }`}
              ></div>
              <span
                className={`text-sm ${
                  index <= currentStage ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                {stage}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default WorkflowProgress;