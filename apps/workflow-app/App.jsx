import React, { useState, useCallback } from 'react'
import ReactFlow, { Controls, Background, addEdge } from 'react-flow-renderer'
import { Play, Save, Download, Upload } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import './App.css'

const initialNodes = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Start' },
    position: { x: 250, y: 50 },
  },
  {
    id: '2',
    data: { label: 'Process' },
    position: { x: 250, y: 200 },
  },
  {
    id: '3',
    type: 'output',
    data: { label: 'End' },
    position: { x: 250, y: 350 },
  },
]

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
]

function WorkflowApp() {
  const [nodes, setNodes] = useState(initialNodes)
  const [edges, setEdges] = useState(initialEdges)
  const [workflowName, setWorkflowName] = useState('Untitled Workflow')

  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => nds.map((node) => {
      if (node.id === '1') {
        return { ...node, data: { label: 'Start' } }
      }
      if (node.id === '2') {
        return { ...node, data: { label: 'Process' } }
      }
      if (node.id === '3') {
        return { ...node, data: { label: 'End' } }
      }
      return node
    }))
  }, [])

  const onEdgesChange = useCallback(() => {}, [])

  const onConnect = useCallback((params) => {
    const id = `edge-${params.source}-${params.target}`
    setEdges((eds) => addEdge({ ...params, id }, eds))
  }, [])

  const handleSave = async () => {
    try {
      const workflow = { name: workflowName, nodes, edges }
      await fetch('/api/workflows/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow)
      })
      toast.success('Workflow saved!')
    } catch (error) {
      toast.error('Failed to save workflow')
    }
  }

  const handleExecute = async () => {
    try {
      await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow: { name: workflowName, nodes, edges } })
      })
      toast.success('Workflow executed!')
    } catch (error) {
      toast.error('Failed to execute workflow')
    }
  }

  return (
    <div className="workflow-app">
      <Toaster />
      <div className="toolbar">
        <input
          type="text"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          className="workflow-name"
        />
        <div className="actions">
          <button className="icon-btn" onClick={handleSave}>
            <Save />
          </button>
          <button className="icon-btn" onClick={handleExecute}>
            <Play />
          </button>
        </div>
      </div>
      <div className="flow-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  )
}

export default WorkflowApp