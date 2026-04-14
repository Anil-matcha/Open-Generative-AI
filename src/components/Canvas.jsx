import React, { useRef, useEffect, useState, useCallback } from 'react';
import { observer } from 'mobx-react-lite';

const Canvas = ({
  width = 1920,
  height = 1080,
  backgroundColor = '#1a1a1a',
  onCanvasChange,
  elements = [],
  selectedElementId,
  onElementSelect,
  onElementUpdate,
  zoom = 1,
  pan = { x: 0, y: 0 }
}) => {
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedElement, setSelectedElement] = useState(null);

  // Canvas rendering
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Draw elements
    elements.forEach((element) => {
      drawElement(ctx, element, element.id === selectedElementId);
    });

    ctx.restore();
  }, [elements, selectedElementId, zoom, pan, backgroundColor, width, height]);

  const drawElement = (ctx, element, isSelected) => {
    ctx.save();

    // Apply element transformations
    ctx.translate(element.x || 0, element.y || 0);
    if (element.rotation) ctx.rotate(element.rotation * Math.PI / 180);
    if (element.scale) ctx.scale(element.scale, element.scale);

    switch (element.type) {
      case 'text':
        drawTextElement(ctx, element, isSelected);
        break;
      case 'image':
        drawImageElement(ctx, element, isSelected);
        break;
      case 'shape':
        drawShapeElement(ctx, element, isSelected);
        break;
      case 'video':
        drawVideoElement(ctx, element, isSelected);
        break;
      default:
        break;
    }

    ctx.restore();
  };

  const drawTextElement = (ctx, element, isSelected) => {
    ctx.font = `${element.fontSize || 24}px ${element.fontFamily || 'Arial'}`;
    ctx.fillStyle = element.color || '#ffffff';
    ctx.textAlign = element.textAlign || 'left';
    ctx.textBaseline = 'top';

    // Draw text
    const lines = element.text.split('\n');
    lines.forEach((line, index) => {
      ctx.fillText(line, 0, index * (element.lineHeight || element.fontSize * 1.2));
    });

    // Draw selection outline
    if (isSelected) {
      const metrics = ctx.measureText(element.text);
      const height = lines.length * (element.lineHeight || element.fontSize * 1.2);
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-2, -2, metrics.width + 4, height + 4);
    }
  };

  const drawImageElement = (ctx, element, isSelected) => {
    if (element.image) {
      ctx.drawImage(element.image, 0, 0, element.width || 100, element.height || 100);
    } else {
      // Placeholder
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 0, element.width || 100, element.height || 100);
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Image', (element.width || 100) / 2, (element.height || 100) / 2);
    }

    if (isSelected) {
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-2, -2, (element.width || 100) + 4, (element.height || 100) + 4);
    }
  };

  const drawShapeElement = (ctx, element, isSelected) => {
    ctx.fillStyle = element.fillColor || '#ffffff';
    ctx.strokeStyle = element.strokeColor || '#000000';
    ctx.lineWidth = element.strokeWidth || 1;

    switch (element.shape) {
      case 'rectangle':
        ctx.fillRect(0, 0, element.width || 100, element.height || 100);
        if (element.strokeWidth > 0) ctx.strokeRect(0, 0, element.width || 100, element.height || 100);
        break;
      case 'circle':
        ctx.beginPath();
        ctx.arc((element.width || 100) / 2, (element.height || 100) / 2, (element.width || 100) / 2, 0, 2 * Math.PI);
        ctx.fill();
        if (element.strokeWidth > 0) ctx.stroke();
        break;
      default:
        break;
    }

    if (isSelected) {
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-2, -2, (element.width || 100) + 4, (element.height || 100) + 4);
    }
  };

  const drawVideoElement = (ctx, element, isSelected) => {
    if (element.video) {
      ctx.drawImage(element.video, 0, 0, element.width || 200, element.height || 150);
    } else {
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 0, element.width || 200, element.height || 150);
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Video', (element.width || 200) / 2, (element.height || 150) / 2);
    }

    if (isSelected) {
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-2, -2, (element.width || 200) + 4, (element.height || 150) + 4);
    }
  };

  // Mouse event handlers
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    // Check if clicking on an element
    const clickedElement = elements.find(element => {
      const elementX = element.x || 0;
      const elementY = element.y || 0;
      const elementWidth = element.width || (element.type === 'text' ? 200 : 100);
      const elementHeight = element.height || (element.type === 'text' ? 50 : 100);

      return x >= elementX && x <= elementX + elementWidth &&
             y >= elementY && y <= elementY + elementHeight;
    });

    if (clickedElement) {
      onElementSelect(clickedElement.id);
      setSelectedElement(clickedElement);
      setIsDragging(true);
      setDragStart({ x: x - clickedElement.x, y: y - clickedElement.y });
    } else {
      onElementSelect(null);
      setSelectedElement(null);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !selectedElement) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    const updatedElement = {
      ...selectedElement,
      x: x - dragStart.x,
      y: y - dragStart.y
    };

    onElementUpdate(selectedElement.id, updatedElement);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedElement) {
        switch (e.key) {
          case 'Delete':
          case 'Backspace':
            // Remove selected element
            onElementUpdate(selectedElement.id, null);
            onElementSelect(null);
            setSelectedElement(null);
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, onElementUpdate, onElementSelect]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  return (
    <div className="canvas-container" style={{ position: 'relative', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          border: '1px solid #333',
          backgroundColor: '#000',
          cursor: isDragging ? 'grabbing' : 'default',
          maxWidth: '100%',
          height: 'auto'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="canvas-toolbar" style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        display: 'flex',
        gap: '8px',
        background: 'rgba(0,0,0,0.8)',
        padding: '8px',
        borderRadius: '8px'
      }}>
        <button
          onClick={() => onCanvasChange('add-text')}
          style={{ padding: '4px 8px', fontSize: '12px' }}
        >
          Add Text
        </button>
        <button
          onClick={() => onCanvasChange('add-shape')}
          style={{ padding: '4px 8px', fontSize: '12px' }}
        >
          Add Shape
        </button>
        <button
          onClick={() => onCanvasChange('add-image')}
          style={{ padding: '4px 8px', fontSize: '12px' }}
        >
          Add Image
        </button>
      </div>
    </div>
  );
};

Canvas.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  backgroundColor: PropTypes.string,
  onCanvasChange: PropTypes.func,
  elements: PropTypes.array,
  selectedElementId: PropTypes.string,
  onElementSelect: PropTypes.func,
  onElementUpdate: PropTypes.func,
  zoom: PropTypes.number,
  pan: PropTypes.object
};

export default observer(Canvas);