import React, { useState, useEffect } from 'react';
import { useVoiceStore } from '../../hooks/useVoiceStore';

const TextToSpeechContent = ({ onVoiceGenerated, onClose }) => {
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { voices, generateSpeech, isLoading } = useVoiceStore();

  const handleGenerate = async () => {
    if (!text.trim() || !selectedVoice) return;

    setIsGenerating(true);
    try {
      const audioUrl = await generateSpeech(text, selectedVoice);
      onVoiceGenerated(audioUrl, text);
      setText('');
    } catch (error) {
      console.error('Failed to generate speech:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="text-to-speech-content">
      <div className="tts-header">
        <h3>Text-to-Speech Generator</h3>
        <button onClick={onClose} className="close-btn">×</button>
      </div>

      <div className="tts-body">
        <div className="text-input-section">
          <label htmlFor="tts-text">Enter text to convert to speech:</label>
          <textarea
            id="tts-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your text here..."
            rows={6}
            maxLength={5000}
          />
          <div className="char-count">{text.length}/5000</div>
        </div>

        <div className="voice-selection-section">
          <h4>Select Voice</h4>
          <div className="voice-grid">
            {voices.map((voice) => (
              <div
                key={voice.id}
                className={`voice-option ${selectedVoice?.id === voice.id ? 'selected' : ''}`}
                onClick={() => setSelectedVoice(voice)}
              >
                <div className="voice-icon">
                  {voice.gender === 'female' ? '👩' : '👨'}
                </div>
                <div className="voice-info">
                  <div className="voice-name">{voice.name}</div>
                  <div className="voice-language">{voice.language}</div>
                </div>
                <div className="voice-preview">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Preview voice functionality
                    }}
                    className="preview-btn"
                  >
                    ▶
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="generate-section">
          <button
            onClick={handleGenerate}
            disabled={!text.trim() || !selectedVoice || isGenerating}
            className="generate-btn"
          >
            {isGenerating ? 'Generating...' : 'Generate Speech'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextToSpeechContent;