import React, { useState, useEffect } from 'react';

const GoogleTextToSpeech = ({ text, voice, onAudioGenerated }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (text && voice) {
      generateSpeech();
    }
  }, [text, voice]);

  const generateSpeech = async () => {
    if (!text || !voice) return;

    setIsGenerating(true);
    setProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Google Text-to-Speech API call
      const response = await fetch('/api/google-tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice: {
            languageCode: voice.languageCode || 'en-US',
            name: voice.name,
            ssmlGender: voice.gender === 'female' ? 'FEMALE' : 'MALE',
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: voice.speed || 1.0,
            pitch: voice.pitch || 0.0,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      clearInterval(progressInterval);
      setProgress(100);

      // Small delay to show 100% completion
      setTimeout(() => {
        onAudioGenerated(audioUrl);
        setIsGenerating(false);
        setProgress(0);
      }, 500);

    } catch (error) {
      console.error('Google TTS error:', error);
      setIsGenerating(false);
      setProgress(0);
    }
  };

  return (
    <div className="google-tts-generator">
      {isGenerating && (
        <div className="tts-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-text">
            Generating speech... {progress}%
          </div>
        </div>
      )}

      {text && voice && !isGenerating && (
        <div className="tts-ready">
          <div className="voice-preview">
            <div className="voice-icon">
              {voice.gender === 'female' ? '👩' : '👨'}
            </div>
            <div className="voice-details">
              <div className="voice-name">{voice.name}</div>
              <div className="voice-language">
                {voice.languageCode} • {voice.ssmlGender}
              </div>
            </div>
          </div>
          <div className="text-preview">
            "{text.length > 50 ? `${text.substring(0, 50)}...` : text}"
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleTextToSpeech;