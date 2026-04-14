import React, { useRef, useEffect, useState, useCallback } from 'react';
import interact from 'interactjs';
import useTimelineStore from '../../../src/components/hooks/useTimelineStore.js';

const LineDuration = ({
  clipId,
  start,
  end,
  trimIn,
  trimOut,
  onDurationChange,
  onTrimChange,
  width = 200,
  height = 40
}) => {
  const containerRef = useRef(null);
  const inHandleRef = useRef(null);
  const outHandleRef = useRef(null);
  const timelineStore = useTimelineStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState(null);

  // Calculate positions based on trim values
  const totalDuration = end - start;
  const trimmedDuration = trimOut - trimIn;
  const inPosition = (trimIn / totalDuration) * width;
  const outPosition = (trimOut / totalDuration) * width;

  // Convert pixels to time
  const pixelsToTime = useCallback((pixels) => {
    return (pixels / width) * totalDuration;
  }, [width, totalDuration]);

  // Convert time to pixels
  const timeToPixels = useCallback((time) => {
    return (time / totalDuration) * width;
  }, [totalDuration, width]);

  // Handle drag start
  const handleDragStart = useCallback((event, handleType) => {
    setIsDragging(true);
    setDragHandle(handleType);
  }, []);

  // Handle drag move
  const handleDragMove = useCallback((event) => {
    if (!isDragging || !dragHandle) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const relativeX = event.clientX - containerRect.left;
    const clampedX = Math.max(0, Math.min(width, relativeX));
    const newTime = pixelsToTime(clampedX);

    let newTrimIn = trimIn;
    let newTrimOut = trimOut;

    if (dragHandle === 'in') {
      newTrimIn = Math.max(0, Math.min(trimOut - 0.1, newTime));
    } else if (dragHandle === 'out') {
      newTrimOut = Math.max(trimIn + 0.1, Math.min(totalDuration, newTime));
    }

    // Snap to grid if enabled
    if (timelineStore.snapEnabled) {
      const gridSize = 0.1; // 0.1 second grid
      newTrimIn = Math.round(newTrimIn / gridSize) * gridSize;
      newTrimOut = Math.round(newTrimOut / gridSize) * gridSize;
    }

    if (onTrimChange) {
      onTrimChange({
        trimIn: newTrimIn,
        trimOut: newTrimOut
      });
    }

    // Update timeline store
    timelineStore.updateClipDuration(clipId, {
      trimIn: newTrimIn,
      trimOut: newTrimOut
    });
  }, [isDragging, dragHandle, trimIn, trimOut, pixelsToTime, width, totalDuration, onTrimChange, timelineStore, clipId]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragHandle(null);

    if (onDurationChange) {
      onDurationChange({
        start,
        end,
        trimIn,
        trimOut
      });
    }
  }, [onDurationChange, start, end, trimIn, trimOut]);

  // Keyboard navigation
  const handleKeyDown = useCallback((event, handleType) => {
    const step = event.shiftKey ? 1 : 0.1; // Larger steps with shift
    let newTrimIn = trimIn;
    let newTrimOut = trimOut;

    switch (event.key) {
      case 'ArrowLeft':
        if (handleType === 'in') {
          newTrimIn = Math.max(0, trimIn - step);
        } else if (handleType === 'out') {
          newTrimOut = Math.max(trimIn + 0.1, trimOut - step);
        }
        break;
      case 'ArrowRight':
        if (handleType === 'in') {
          newTrimIn = Math.min(trimOut - 0.1, trimIn + step);
        } else if (handleType === 'out') {
          newTrimOut = Math.min(totalDuration, trimOut + step);
        }
        break;
      default:
        return;
    }

    event.preventDefault();

    if (onTrimChange) {
      onTrimChange({
        trimIn: newTrimIn,
        trimOut: newTrimOut
      });
    }

    timelineStore.updateClipDuration(clipId, {
      trimIn: newTrimIn,
      trimOut: newTrimOut
    });
  }, [trimIn, trimOut, totalDuration, onTrimChange, timelineStore, clipId]);

  // Initialize interact.js
  useEffect(() => {
    if (!inHandleRef.current || !outHandleRef.current || !interact) return;

    const inInteract = interact(inHandleRef.current)
      .draggable({
        listeners: {
          start: (event) => handleDragStart(event, 'in'),
          move: handleDragMove,
          end: handleDragEnd
        }
      });

    const outInteract = interact(outHandleRef.current)
      .draggable({
        listeners: {
          start: (event) => handleDragStart(event, 'out'),
          move: handleDragMove,
          end: handleDragEnd
        }
      });

    return () => {
      inInteract.unset();
      outInteract.unset();
    };
  }, [handleDragStart, handleDragMove, handleDragEnd]);

  return (
    <div className="line-duration" style={{ width, height }}>
      <div
        ref={containerRef}
        className="line-duration-track"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          backgroundColor: '#2a2a2a',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        {/* Trimmed region indicator */}
        <div
          className="line-duration-trimmed"
          style={{
            position: 'absolute',
            left: `${inPosition}px`,
            width: `${outPosition - inPosition}px`,
            height: '100%',
            backgroundColor: '#4a9eff',
            borderRadius: '2px',
            opacity: 0.8
          }}
        />

        {/* In-point handle */}
        <div
          ref={inHandleRef}
          className={`line-duration-handle line-duration-handle-in ${isDragging && dragHandle === 'in' ? 'dragging' : ''}`}
          style={{
            position: 'absolute',
            left: `${inPosition - 8}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '16px',
            height: '16px',
            backgroundColor: '#ff6b6b',
            borderRadius: '50%',
            cursor: 'ew-resize',
            border: '2px solid #fff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            zIndex: 10
          }}
          tabIndex={0}
          role="button"
          aria-label="Trim in point"
          onKeyDown={(e) => handleKeyDown(e, 'in')}
        />

        {/* Out-point handle */}
        <div
          ref={outHandleRef}
          className={`line-duration-handle line-duration-handle-out ${isDragging && dragHandle === 'out' ? 'dragging' : ''}`}
          style={{
            position: 'absolute',
            left: `${outPosition - 8}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '16px',
            height: '16px',
            backgroundColor: '#4ecdc4',
            borderRadius: '50%',
            cursor: 'ew-resize',
            border: '2px solid #fff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            zIndex: 10
          }}
          tabIndex={0}
          role="button"
          aria-label="Trim out point"
          onKeyDown={(e) => handleKeyDown(e, 'out')}
        />

        {/* Duration display */}
        <div
          className="line-duration-display"
          style={{
            position: 'absolute',
            top: '-24px',
            left: `${inPosition}px`,
            backgroundColor: '#1a1a1a',
            color: '#fff',
            padding: '2px 6px',
            borderRadius: '3px',
            fontSize: '12px',
            fontFamily: 'monospace',
            whiteSpace: 'nowrap'
          }}
        >
          {trimmedDuration.toFixed(2)}s
        </div>

        {/* Time markers */}
        <div
          className="line-duration-markers"
          style={{
            position: 'absolute',
            bottom: '-16px',
            left: 0,
            right: 0,
            height: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '10px',
            color: '#888'
          }}
        >
          <span>{start.toFixed(1)}s</span>
          <span>{end.toFixed(1)}s</span>
        </div>
      </div>
    </div>
  );
};

export default LineDuration;