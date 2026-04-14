import React, { useState, useRef, useEffect } from 'react';

const VideoTransitionSettings = ({ onTransitionCreate, onTransitionPreview }) => {
  const [selectedTransition, setSelectedTransition] = useState('fade');
  const [duration, setDuration] = useState(1.0);
  const [startClipId, setStartClipId] = useState(null);
  const [endClipId, setEndClipId] = useState(null);
  const canvasRef = useRef(null);

  const transitions = [
    { id: 'fade', name: 'Fade', description: 'Crossfade between clips' },
    { id: 'wipe', name: 'Wipe', description: 'Wipe transition effect' },
    { id: 'push', name: 'Push', description: 'Push one clip out with another' },
    { id: 'slide', name: 'Slide', description: 'Slide transition effect' },
    { id: 'zoom', name: 'Zoom', description: 'Zoom in/out transition' }
  ];

  const handleTransitionSelect = (transitionId) => {
    setSelectedTransition(transitionId);
  };

  const handleDurationChange = (e) => {
    setDuration(parseFloat(e.target.value));
  };

  const handleCreateTransition = () => {
    if (!startClipId || !endClipId) {
      alert('Please select start and end clips for transition');
      return;
    }

    const transition = {
      type: selectedTransition,
      duration: duration,
      startClipId,
      endClipId,
      timestamp: Date.now()
    };

    if (onTransitionCreate) {
      onTransitionCreate(transition);
    }
  };

  const handlePreviewTransition = () => {
    if (!startClipId || !endClipId) {
      alert('Please select start and end clips for preview');
      return;
    }

    if (onTransitionPreview) {
      onTransitionPreview({
        type: selectedTransition,
        duration,
        startClipId,
        endClipId
      });
    }
  };

  // Draw transition preview on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Simple transition preview visualization
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#4a9eff');
    gradient.addColorStop(0.5, '#ff6b6b');
    gradient.addColorStop(1, '#4ecdc4');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw transition type indicator
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${selectedTransition.toUpperCase()} - ${duration}s`, canvas.width / 2, canvas.height / 2);
  }, [selectedTransition, duration]);

  return (
    <div className="video-transition-settings">
      <div className="transition-settings__header">
        <h3>Video Transitions</h3>
        <p>Create smooth transitions between clips</p>
      </div>

      <div className="transition-settings__section">
        <h4>Select Transition Type</h4>
        <div className="transition-types">
          {transitions.map(transition => (
            <div
              key={transition.id}
              className={`transition-type ${selectedTransition === transition.id ? 'selected' : ''}`}
              onClick={() => handleTransitionSelect(transition.id)}
            >
              <div className="transition-name">{transition.name}</div>
              <div className="transition-description">{transition.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="transition-settings__section">
        <h4>Transition Duration</h4>
        <div className="duration-controls">
          <input
            type="range"
            min="0.1"
            max="5.0"
            step="0.1"
            value={duration}
            onChange={handleDurationChange}
          />
          <span>{duration} seconds</span>
        </div>
      </div>

      <div className="transition-settings__section">
        <h4>Clip Selection</h4>
        <div className="clip-selection">
          <div className="clip-input">
            <label>Start Clip ID:</label>
            <input
              type="text"
              value={startClipId || ''}
              onChange={(e) => setStartClipId(e.target.value)}
              placeholder="Enter start clip ID"
            />
          </div>
          <div className="clip-input">
            <label>End Clip ID:</label>
            <input
              type="text"
              value={endClipId || ''}
              onChange={(e) => setEndClipId(e.target.value)}
              placeholder="Enter end clip ID"
            />
          </div>
        </div>
      </div>

      <div className="transition-settings__section">
        <h4>Preview</h4>
        <canvas
          ref={canvasRef}
          width={300}
          height={100}
          style={{ border: '1px solid #ccc', borderRadius: '4px' }}
        />
      </div>

      <div className="transition-settings__actions">
        <button onClick={handlePreviewTransition} className="preview-btn">
          Preview Transition
        </button>
        <button onClick={handleCreateTransition} className="create-btn">
          Create Transition
        </button>
      </div>
    </div>
  );
};

export default VideoTransitionSettings;