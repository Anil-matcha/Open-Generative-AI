import React, { useState } from 'react';
import TextToSpeechContent from '../common/textToSpeech/TextToSpeechContent';
import GoogleTextToSpeech from '../media/GoogleTextToSpeech';

const VoiceModal = ({ isOpen, onClose, onVoiceAdded }) => {
  const [generatedAudio, setGeneratedAudio] = useState(null);

  const handleVoiceGenerated = (audioUrl, text) => {
    setGeneratedAudio({ audioUrl, text });
  };

  const handleAddToTimeline = () => {
    if (generatedAudio && onVoiceAdded) {
      onVoiceAdded(generatedAudio);
      setGeneratedAudio(null);
      onClose();
    }
  };

  const handleDiscard = () => {
    setGeneratedAudio(null);
  };

  if (!isOpen) return null;

  return (
    <div className="voice-modal-overlay">
      <div className="voice-modal">
        <div className="modal-header">
          <h2>AI Voice Generator</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="modal-body">
          {!generatedAudio ? (
            <TextToSpeechContent
              onVoiceGenerated={handleVoiceGenerated}
              onClose={onClose}
            />
          ) : (
            <div className="voice-preview-section">
              <h3>Voice Generated Successfully!</h3>

              <div className="audio-preview">
                <audio controls src={generatedAudio.audioUrl} />
              </div>

              <div className="text-preview">
                <h4>Generated Text:</h4>
                <p>{generatedAudio.text}</p>
              </div>

              <div className="preview-actions">
                <button onClick={handleAddToTimeline} className="primary-btn">
                  Add to Timeline
                </button>
                <button onClick={handleDiscard} className="secondary-btn">
                  Generate Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceModal;