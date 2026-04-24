import React, { useState, useEffect } from 'react';
import { WorkflowEngine } from '../lib/workflow/WorkflowEngine';
import { ModelRegistry } from '../lib/workflow/ModelRegistry';
import { CanvasEditor } from './CanvasEditor';
import { WorkflowNode, NodeType } from '../lib/workflow/WorkflowNode';

export const WorkflowManager: React.FC = () => {
  const [engine] = useState(() => new WorkflowEngine());
  const [registry] = useState(() => {
    const reg = new ModelRegistry();
    reg.initializeDefaults();
    return reg;
  });
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState<Record<string, any> | null>(null);

  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      const results = await engine.execute();
      setExecutionResults(results);
      console.log('Workflow execution results:', results);
    } catch (error) {
      console.error('Workflow execution failed:', error);
      alert(`Execution failed: ${error}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSave = () => {
    const workflowData = engine.serialize();
    const dataStr = JSON.stringify(workflowData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow.json';
    a.click();

    URL.revokeObjectURL(url);
  };

  const handleLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        engine.deserialize(data);
        setSelectedNode(null);
        setExecutionResults(null);
        // Force re-render
        window.location.reload();
      } catch (error) {
        alert(`Failed to load workflow: ${error}`);
      }
    };
    reader.readAsText(file);
  };

  const handleNodeSelect = (node: WorkflowNode) => {
    setSelectedNode(node);
  };

  const handleNodeUpdate = (node: WorkflowNode) => {
    // Node position updated, could trigger save or other actions
  };

  return (
    <div className="workflow-manager">
      <div className="workflow-header">
        <h2>CineGen Node-Based Workflow System</h2>
        <div className="workflow-controls">
          <button onClick={handleExecute} disabled={isExecuting}>
            {isExecuting ? 'Executing...' : 'Execute Workflow'}
          </button>
          <button onClick={handleSave}>Save Workflow</button>
          <label>
            Load Workflow
            <input type="file" accept=".json" onChange={handleLoad} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      <div className="workflow-content">
        <div className="canvas-section">
          <CanvasEditor
            engine={engine}
            registry={registry}
            onNodeSelect={handleNodeSelect}
            onNodeUpdate={handleNodeUpdate}
          />
        </div>

        <div className="sidebar-section">
          <div className="model-registry">
            <h3>Available Models</h3>
            <div className="model-list">
              {registry.getAllModels().map(model => (
                <div key={model.id} className="model-item">
                  <strong>{model.name}</strong>
                  <div>Type: {model.type}</div>
                  <div>Provider: {model.provider}</div>
                  {model.description && <div>{model.description}</div>}
                </div>
              ))}
            </div>
          </div>

          {selectedNode && (
            <div className="node-editor">
              <h3>Node Editor</h3>
              <div className="node-property">
                <label>ID:</label>
                <input type="text" value={selectedNode.id} readOnly />
              </div>
              <div className="node-property">
                <label>Type:</label>
                <select value={selectedNode.type} disabled>
                  <option value={NodeType.INPUT}>Input</option>
                  <option value={NodeType.PROCESS}>Process</option>
                  <option value={NodeType.OUTPUT}>Output</option>
                </select>
              </div>

              {selectedNode.type === NodeType.INPUT && (
                <div className="node-data">
                  <h4>Input Data</h4>
                  {Object.entries(selectedNode.data).map(([key, value]) => (
                    <div key={key} className="data-property">
                      <label>{key}:</label>
                      <input
                        type="text"
                        value={String(value)}
                        onChange={(e) => {
                          selectedNode.setData(key, e.target.value);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {executionResults && (
            <div className="execution-results">
              <h3>Execution Results</h3>
              <pre>{JSON.stringify(executionResults, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};