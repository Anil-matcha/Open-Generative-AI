import React, { useState } from 'react';
import TextToSpeechLibrary from '../common/textToSpeech/TextToSpeechLibrary';
import VoiceModal from './VoiceModal';

const PreRemixVoiceModal = ({ isOpen, onClose, projectData, onVoiceAdded }) => {
  const [showVoiceGenerator, setShowVoiceGenerator] = useState(false);
  const [selectedVoices, setSelectedVoices] = useState([]);

  const handleAddVoice = (voice) => {
    setSelectedVoices([...selectedVoices, voice]);
  };

  const handleRemoveVoice = (voiceId) => {
    setSelectedVoices(selectedVoices.filter(v => v.id !== voiceId));
  };

  const handleApplyVoices = () => {
    // Apply selected voices to the project/timeline
    selectedVoices.forEach(voice => {
      onVoiceAdded(voice);
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="pre-remix-voice-modal-overlay">
      <div className="pre-remix-voice-modal">
        <div className="modal-header">
          <h2>Pre-Remix Voice Setup</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="modal-body">
          <div className="voice-setup-intro">
            <p>
              Set up voiceovers for your video before remixing. Choose from your existing voice library
              or generate new AI voices.
            </p>
          </div>

          <div className="voice-setup-content">
            <div className="voice-sections">
              <div className="existing-voices-section">
                <h3>Your Voice Library</h3>
                <div className="selected-voices">
                  {selectedVoices.map(voice => (
                    <div key={voice.id} className="selected-voice-item">
                      <div className="voice-info">
                        <span className="voice-name">{voice.title || 'Generated Voice'}</span>
                        <span className="voice-duration">{voice.duration}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveVoice(voice.id)}
                        className="remove-voice-btn"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {selectedVoices.length === 0 && (
                    <div className="no-voices-selected">
                      No voices selected yet
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowVoiceGenerator(true)}
                  className="add-voice-btn"
                >
                  + Add Voice
                </button>
              </div>

              <div className="voice-preview-section">
                <h3>Voice Preview</h3>
                {selectedVoices.length > 0 ? (
                  <div className="voice-timeline-preview">
                    {selectedVoices.map((voice, index) => (
                      <div key={voice.id} className="timeline-voice-item">
                        <div className="voice-waveform">
                          {/* Placeholder for waveform visualization */}
                          <div className="waveform-placeholder"></div>
                        </div>
                        <div className="voice-controls">
                          <button className="play-voice-btn">▶</button>
                          <span className="voice-timing">0:00 - {voice.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-preview">
                    Add voices to see timeline preview
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button
              onClick={handleApplyVoices}
              disabled={selectedVoices.length === 0}
              className="apply-btn"
            >
              Apply Voices to Project
            </button>
          </div>
        </div>

        {showVoiceGenerator && (
          <VoiceModal
            isOpen={showVoiceGenerator}
            onClose={() => setShowVoiceGenerator(false)}
            onVoiceAdded={handleAddVoice}
          />
        )}
      </div>
    </div>
  );
};

export default PreRemixVoiceModal;