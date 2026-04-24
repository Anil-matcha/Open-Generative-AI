import React, { useState, useEffect } from 'react';
import ApiKeyModal from './ApiKeyModal.jsx';
import WorkflowGrid from './WorkflowGrid.jsx';
import WorkflowSettings from './WorkflowSettings.jsx';
import WorkflowProgress from './WorkflowProgress.jsx';
import WorkflowResults from './WorkflowResults.jsx';
import { muAPIClient } from '../lib/muapi.js';

function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('muapi_key') || '');
  const [showApiKeyModal, setShowApiKeyModal] = useState(!apiKey);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [workflowConfig, setWorkflowConfig] = useState({
    inputType: 'text', // text, image, video
    outputType: 'video', // video, social
    platforms: [],
    schedule: 'immediate'
  });
  const [isRunning, setIsRunning] = useState(false);
  const [workflowProgress, setWorkflowProgress] = useState(0);
  const [workflowResults, setWorkflowResults] = useState(null);
  const [error, setError] = useState(null);

  // Initialize API client on mount
  useEffect(() => {
    if (apiKey) {
      muAPIClient.setApiKey(apiKey);
    }
  }, [apiKey]);

  const handleApiKeySubmit = (key) => {
    setApiKey(key);
    muAPIClient.setApiKey(key);
    muAPIClient.saveApiKey();
    setShowApiKeyModal(false);
  };

  const handleWorkflowSelect = (workflow) => {
    setSelectedWorkflow(workflow);
    setError(null);
  };

  const handleConfigChange = (newConfig) => {
    setWorkflowConfig(newConfig);
  };

  const handleRunWorkflow = async () => {
    if (!selectedWorkflow) {
      setError('Please select a workflow');
      return;
    }

    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }

    setIsRunning(true);
    setWorkflowProgress(0);
    setError(null);

    try {
      // Execute workflow
      const workflowParams = {
        workflow: selectedWorkflow.id,
        config: workflowConfig
      };

      const result = await muAPIClient.runWorkflow(workflowParams);

      // Poll for completion with progress updates
      await muAPIClient.pollForCompletion(result.workflowId, {
        onProgress: (status) => {
          setWorkflowProgress(status.progress || 0);
        },
        interval: 2000, // Check every 2 seconds
        timeout: 600000 // 10 minute timeout
      });

      // If we get here, workflow completed successfully
      const finalStatus = await muAPIClient.checkWorkflowStatus(result.workflowId);
      setWorkflowResults(finalStatus.results);
      setIsRunning(false);

    } catch (err) {
      setError(err.message);
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setSelectedWorkflow(null);
    setWorkflowResults(null);
    setError(null);
    setWorkflowProgress(0);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Sendspark Workflow Studio</h1>
          <p className="text-gray-400">Automated video creation and publishing workflows</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Workflow Selection */}
          <div className="space-y-6">
            <WorkflowGrid onSelect={handleWorkflowSelect} selectedWorkflow={selectedWorkflow} />
          </div>

          {/* Center Panel - Configuration & Progress */}
          <div className="space-y-6">
            {selectedWorkflow && (
              <WorkflowSettings
                workflow={selectedWorkflow}
                config={workflowConfig}
                onChange={handleConfigChange}
              />
            )}

            {error && (
              <div className="bg-red-900 border border-red-700 rounded-lg p-4">
                <p className="text-red-200">{error}</p>
              </div>
            )}

            {isRunning && (
              <WorkflowProgress progress={workflowProgress} workflow={selectedWorkflow} />
            )}
          </div>

          {/* Right Panel - Results & Actions */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Workflow Summary</h3>

              {selectedWorkflow && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Selected Workflow:</h4>
                  <div className="bg-gray-700 rounded p-3">
                    <p className="font-medium">{selectedWorkflow.name}</p>
                    <p className="text-sm text-gray-400">{selectedWorkflow.description}</p>
                  </div>
                </div>
              )}

              {workflowResults && (
                <WorkflowResults results={workflowResults} />
              )}

              <div className="space-y-3">
                <button
                  onClick={handleRunWorkflow}
                  disabled={!selectedWorkflow || isRunning}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  {isRunning ? 'Running Workflow...' : 'Run Workflow'}
                </button>

                <button
                  onClick={handleReset}
                  className="w-full bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showApiKeyModal && (
        <ApiKeyModal
          onSubmit={handleApiKeySubmit}
          onClose={() => setShowApiKeyModal(false)}
        />
      )}
    </div>
  );
}

export default App;