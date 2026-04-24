import React from 'react';
import { WORKFLOWS } from '../lib/workflows.js';

function WorkflowGrid({ onSelect, selectedWorkflow }) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Available Workflows</h3>
      <div className="grid grid-cols-1 gap-4">
        {WORKFLOWS.map((workflow) => (
          <div
            key={workflow.id}
            onClick={() => onSelect(workflow)}
            className={`cursor-pointer rounded-lg p-4 border-2 transition-all ${
              selectedWorkflow?.id === workflow.id
                ? 'border-blue-500 bg-blue-900/20'
                : 'border-gray-700 bg-gray-700/20 hover:border-gray-600'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="text-2xl">{workflow.icon}</div>
              <div className="flex-1">
                <h4 className="font-medium text-white mb-1">{workflow.name}</h4>
                <p className="text-sm text-gray-400 mb-2">{workflow.description}</p>
                <div className="flex flex-wrap gap-1">
                  {workflow.features.map((feature, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-600 text-xs rounded text-gray-300"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WorkflowGrid;