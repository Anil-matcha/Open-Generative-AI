import React from 'react';
import { useTimelineStore } from '../../../hooks/useTimelineStore.jsx';

const ClipEditor = ({ clipId }) => {
  const { getClip, updateClipProperty, updateClipPosition } = useTimelineStore();
  const clip = getClip(clipId);

  if (!clip) {
    return <div>Clip not found</div>;
  }

  const handleVolumeChange = (e) => {
    updateClipProperty(clipId, 'volume', parseFloat(e.target.value));
  };

  const handleMuteToggle = () => {
    updateClipProperty(clipId, 'mute', !clip.mute);
  };

  const handleVisibilityToggle = () => {
    updateClipProperty(clipId, 'hidden', !clip.hidden);
  };

  const handleFadeInChange = (e) => {
    updateClipProperty(clipId, 'fadeIn', parseFloat(e.target.value));
  };

  const handleFadeOutChange = (e) => {
    updateClipProperty(clipId, 'fadeOut', parseFloat(e.target.value));
  };

  const handleTitleChange = (e) => {
    updateClipProperty(clipId, 'title', e.target.value);
  };

  const handleStartTimeChange = (e) => {
    const newStart = parseFloat(e.target.value);
    updateClipPosition(clipId, newStart, clip.to);
  };

  const handleEndTimeChange = (e) => {
    const newEnd = parseFloat(e.target.value);
    updateClipPosition(clipId, clip.from, newEnd);
  };

  const handleFillModeChange = (e) => {
    updateClipProperty(clipId, 'fillMode', e.target.value);
  };

  const handle360Toggle = () => {
    updateClipProperty(clipId, 'is360', !clip.is360);
  };

  const volumePercent = Math.round((clip.volume || 1) * 100);

  return (
    <div className="clip-editor">
      <div className="clip-editor__section">
        <h3>Basic Properties</h3>

        <div className="clip-editor__field">
          <label htmlFor={`title-${clipId}`}>Clip Title</label>
          <input
            id={`title-${clipId}`}
            type="text"
            value={clip.title || ''}
            onChange={handleTitleChange}
            placeholder="Enter clip title"
            aria-label="Clip title"
          />
        </div>

        <div className="clip-editor__field">
          <label htmlFor={`start-${clipId}`}>Start Time (seconds)</label>
          <input
            id={`start-${clipId}`}
            type="number"
            step="0.1"
            min="0"
            value={clip.from || 0}
            onChange={handleStartTimeChange}
            aria-label="Start time"
          />
        </div>

        <div className="clip-editor__field">
          <label htmlFor={`end-${clipId}`}>End Time (seconds)</label>
          <input
            id={`end-${clipId}`}
            type="number"
            step="0.1"
            min="0"
            value={clip.to || 0}
            onChange={handleEndTimeChange}
            aria-label="End time"
          />
        </div>
      </div>

      <div className="clip-editor__section">
        <h3>Audio Controls</h3>

        <div className="clip-editor__field">
          <label htmlFor={`volume-${clipId}`}>Volume: {volumePercent}%</label>
          <input
            id={`volume-${clipId}`}
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={clip.volume || 1}
            onChange={handleVolumeChange}
            disabled={clip.mute}
          />
        </div>

        <div className="clip-editor__field">
          <button
            type="button"
            onClick={handleMuteToggle}
            className={`mute-button ${clip.mute ? 'muted' : ''}`}
            aria-label="Mute"
          >
            {clip.mute ? 'Unmute' : 'Mute'}
          </button>
        </div>
      </div>

      <div className="clip-editor__section">
        <h3>Visual Controls</h3>

        <div className="clip-editor__field">
          <button
            type="button"
            onClick={handleVisibilityToggle}
            className={`visibility-button ${clip.hidden ? 'hidden' : ''}`}
            aria-label="Hide"
          >
            {clip.hidden ? 'Show' : 'Hide'}
          </button>
        </div>

        <div className="clip-editor__field">
          <label htmlFor={`fill-mode-${clipId}`}>Fill Mode</label>
          <select
            id={`fill-mode-${clipId}`}
            value={clip.fillMode || 'scale'}
            onChange={handleFillModeChange}
            aria-label="Fill mode"
          >
            <option value="scale">Scale to Fit</option>
            <option value="fit">Fit</option>
            <option value="fill">Fill</option>
            <option value="stretch">Stretch</option>
          </select>
        </div>

        {clip.type === 'video' && (
          <div className="clip-editor__field">
            <label>
              <input
                type="checkbox"
                checked={clip.is360 || false}
                onChange={handle360Toggle}
                aria-label="360 video"
              />
              360 Video
            </label>
          </div>
        )}
      </div>

      <div className="clip-editor__section">
        <h3>Fade Controls</h3>

        <div className="clip-editor__field">
          <label htmlFor={`fade-in-${clipId}`}>Fade In (seconds)</label>
          <input
            id={`fade-in-${clipId}`}
            type="number"
            step="0.1"
            min="0"
            value={clip.fadeIn || 0}
            onChange={handleFadeInChange}
            aria-label="Fade in"
          />
        </div>

        <div className="clip-editor__field">
          <label htmlFor={`fade-out-${clipId}`}>Fade Out (seconds)</label>
          <input
            id={`fade-out-${clipId}`}
            type="number"
            step="0.1"
            min="0"
            value={clip.fadeOut || 0}
            onChange={handleFadeOutChange}
            aria-label="Fade out"
          />
        </div>
      </div>
    </div>
  );
};

export default ClipEditor;