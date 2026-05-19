import React, { useState } from 'react';
import { appManifest } from './manifest';
import * as vibeService from './services/vibeWorkflowService';
import { sendToLibrary, sendToRender } from '../../lib/outputHandoff';

export default function VibeWorkflowApp() {
  const [workflow, setWorkflow] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [runStatus, setRunStatus] = useState('');
  const [result, setResult] = useState(null);

  const addNode = (type) => {
    const newNode = { id: Date.now(), type, data: {} };
    setNodes([...nodes, newNode]);
  };

  const runWorkflow = async () => {
    setRunStatus('Running...');
    const run = await vibeService.runWorkflow(workflow?.id, { nodes, edges });
    setResult(run.output);
    setRunStatus('Completed');
  };

  const saveToLibrary = async () => {
    if (!result) return;
    await sendToLibrary({ ...result, app_id: 'vibe-workflow', app_name: 'Vibe Workflow' });
  };

  return React.createElement('div', { className: 'h-full flex flex-col bg-[#0a0a0a] text-white' },
    React.createElement('div', { className: 'p-4 border-b flex justify-between' },
      React.createElement('h1', { className: 'text-xl font-bold' }, 'Vibe Workflow'),
      React.createElement('div', { className: 'flex gap-2' },
        React.createElement('button', { onClick: () => addNode('prompt'), className: 'px-3 py-1 bg-white/10 rounded text-sm' }, 'Add Prompt Node'),
        React.createElement('button', { onClick: () => addNode('image'), className: 'px-3 py-1 bg-white/10 rounded text-sm' }, 'Add Image Gen'),
        React.createElement('button', { onClick: runWorkflow, className: 'px-4 py-1 bg-primary rounded' }, 'Run Workflow')
      )
    ),
    React.createElement('div', { className: 'flex-1 flex' },
      React.createElement('div', { className: 'flex-1 p-4 border-r' },
        React.createElement('div', { className: 'h-full bg-black/40 rounded border border-white/10' }, 'ReactFlow Canvas - Nodes: ' + nodes.length)
      ),
      React.createElement('div', { className: 'w-80 p-4' },
        result && React.createElement('div', null,
          React.createElement('video', { src: result.url, controls: true, className: 'w-full mb-2' }),
          React.createElement('button', { onClick: saveToLibrary, className: 'w-full py-2 bg-white/10 rounded' }, 'Save to Library'),
          React.createElement('button', { onClick: () => sendToRender(result), className: 'w-full py-2 bg-white/10 rounded mt-1' }, 'Send to Render')
        )
      )
    ),
    React.createElement('div', { className: 'p-2 text-xs text-center border-t' }, runStatus)
  );
}

export { appManifest } from './manifest';
export { routes as appRoutes } from './routes';