import React, { useRef, useEffect, useState, useCallback } from 'react';
import { WorkflowEngine, WorkflowNode, NodeType } from '../lib/workflow';
import { ModelRegistry } from '../lib/workflow/ModelRegistry';
import { ErrorBoundary } from './error-boundaries';

interface CanvasEditorProps {
  engine: WorkflowEngine;
  registry: ModelRegistry;
  onNodeSelect?: (node: WorkflowNode) => void;
  onNodeUpdate?: (node: WorkflowNode) => void;
}

interface DragState {
  isDragging: boolean;
  dragNode: WorkflowNode | null;
  offsetX: number;
  offsetY: number;
}

const CanvasEditorContent: React.FC<CanvasEditorProps> = ({
  engine,
  registry,
  onNodeSelect,
  onNodeUpdate
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragNode: null,
    offsetX: 0,
    offsetY: 0
  });
  const [connectionStart, setConnectionStart] = useState<{ node: WorkflowNode; port: string } | null>(null);

  const drawNode = useCallback((ctx: CanvasRenderingContext2D, node: WorkflowNode) => {
    const { x, y } = node.position;
    const width = 120;
    const height = 80;

    // Node background
    ctx.fillStyle = selectedNode?.id === node.id ? '#4A90E2' : '#2C3E50';
    ctx.fillRect(x - width/2, y - height/2, width, height);

    // Node border
    ctx.strokeStyle = '#34495E';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - width/2, y - height/2, width, height);

    // Node title
    ctx.fillStyle = '#ECF0F1';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(node.type.toUpperCase(), x, y - 20);

    // Node ID
    ctx.fillText(node.id, x, y + 5);

    // Draw ports
    ctx.fillStyle = '#E74C3C';
    node.inputs.forEach((input, index) => {
      const portY = y - 20 + (index + 1) * 15;
      ctx.beginPath();
      ctx.arc(x - width/2, portY, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    ctx.fillStyle = '#27AE60';
    node.outputs.forEach((output, index) => {
      const portY = y - 20 + (index + 1) * 15;
      ctx.beginPath();
      ctx.arc(x + width/2, portY, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  }, [selectedNode]);

  const drawConnection = useCallback((ctx: CanvasRenderingContext2D, connection: any) => {
    const startNode = connection.sourceNode;
    const endNode = connection.targetNode;

    const startX = startNode.position.x + 60; // Right edge
    const startY = startNode.position.y;
    const endX = endNode.position.x - 60; // Left edge
    const endY = endNode.position.y;

    ctx.strokeStyle = '#BDC3C7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(
      startX + 50, startY,
      endX - 50, endY,
      endX, endY
    );
    ctx.stroke();

    // Arrow head
    const angle = Math.atan2(endY - startY, endX - startX);
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - 10, endY - 5);
    ctx.lineTo(endX - 10, endY + 5);
    ctx.closePath();
    ctx.fillStyle = '#BDC3C7';
    ctx.fill();
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    engine.connections.forEach(connection => {
      drawConnection(ctx, connection);
    });

    // Draw nodes
    engine.nodes.forEach(node => {
      drawNode(ctx, node);
    });
  }, [engine, drawNode, drawConnection]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const findNodeAt = (x: number, y: number): WorkflowNode | null => {
    for (const node of engine.nodes.values()) {
      const { position } = node;
      if (x >= position.x - 60 && x <= position.x + 60 &&
          y >= position.y - 40 && y <= position.y + 40) {
        return node;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePos(e);
    const node = findNodeAt(x, y);

    if (node) {
      setSelectedNode(node);
      onNodeSelect?.(node);

      setDragState({
        isDragging: true,
        dragNode: node,
        offsetX: x - node.position.x,
        offsetY: y - node.position.y
      });
    } else {
      setSelectedNode(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragState.isDragging || !dragState.dragNode) return;

    const { x, y } = getMousePos(e);
    const newX = x - dragState.offsetX;
    const newY = y - dragState.offsetY;

    dragState.dragNode.position.x = newX;
    dragState.dragNode.position.y = newY;

    onNodeUpdate?.(dragState.dragNode);
    redraw();
  };

  const handleMouseUp = () => {
    setDragState({
      isDragging: false,
      dragNode: null,
      offsetX: 0,
      offsetY: 0
    });
  };

  const addNode = (type: NodeType, x: number, y: number) => {
    const nodeId = `${type}-${Date.now()}`;
    const node = new WorkflowNode(nodeId, type, { x, y });

    // Add default ports based on type
    if (type === NodeType.INPUT) {
      node.addOutput('output', 'any');
    } else if (type === NodeType.PROCESS) {
      node.addInput('input', 'any');
      node.addOutput('output', 'any');
    } else if (type === NodeType.OUTPUT) {
      node.addInput('input', 'any');
    }

    engine.addNode(node);
    redraw();
  };

  return (
    <div className="canvas-editor">
      <div className="canvas-toolbar">
        <button onClick={() => addNode(NodeType.INPUT, 100, 100)}>Add Input</button>
        <button onClick={() => addNode(NodeType.PROCESS, 200, 100)}>Add Process</button>
        <button onClick={() => addNode(NodeType.OUTPUT, 300, 100)}>Add Output</button>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ border: '1px solid #ccc', cursor: dragState.isDragging ? 'grabbing' : 'default' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      {selectedNode && (
        <div className="node-properties">
          <h3>Node Properties</h3>
          <p>ID: {selectedNode.id}</p>
          <p>Type: {selectedNode.type}</p>
          <p>Position: ({selectedNode.position.x}, {selectedNode.position.y})</p>
        </div>
      )}
    </div>
  );
};

export const CanvasEditor: React.FC<CanvasEditorProps> = (props) => (
  <ErrorBoundary
    onError={(error, errorInfo, errorId) => {
      console.error(`Canvas editor error [${errorId}]:`, error);
      // Could integrate with canvas-specific error tracking
    }}
    fallback={
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        border: '2px dashed #dee2e6',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', color: '#e74c3c', marginBottom: '16px' }}>
          🎨
        </div>
        <h3 style={{ margin: '0 0 12px 0', color: '#495057' }}>
          Canvas Error
        </h3>
        <p style={{ margin: '0 0 20px 0', color: '#6c757d' }}>
          The canvas editor encountered an error and cannot be displayed.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Reload Canvas
        </button>
      </div>
    }
  >
    <CanvasEditorContent {...props} />
  </ErrorBoundary>
);