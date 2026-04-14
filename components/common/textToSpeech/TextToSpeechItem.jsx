import React, { useState, useRef } from 'react';

const TextToSpeechItem = ({ item, onDelete, onEdit }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const handlePlay = async () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current?.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Failed to play audio:', error);
      }
    }
  };

  const handleAudioEnd = () => {
    setIsPlaying(false);
  };

  return (
    <div className="tts-item">
      <div className="tts-item-header">
        <div className="tts-item-info">
          <h4>{item.title || 'Generated Speech'}</h4>
          <span className="tts-item-duration">
            Duration: {item.duration || '0:00'}
          </span>
        </div>
        <div className="tts-item-actions">
          <button onClick={() => onEdit(item)} className="edit-btn">
            ✏️
          </button>
          <button onClick={() => onDelete(item.id)} className="delete-btn">
            🗑️
          </button>
        </div>
      </div>

      <div className="tts-item-content">
        <p className="tts-text-preview">
          {item.text.length > 100
            ? `${item.text.substring(0, 100)}...`
            : item.text
          }
        </p>
      </div>

      <div className="tts-item-controls">
        <button onClick={handlePlay} className="play-btn">
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        <div className="tts-item-meta">
          <span className="voice-name">{item.voice?.name || 'Unknown Voice'}</span>
          <span className="created-date">
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={item.audioUrl}
        onEnded={handleAudioEnd}
        onError={() => setIsPlaying(false)}
      />
    </div>
  );
};

export default TextToSpeechItem;