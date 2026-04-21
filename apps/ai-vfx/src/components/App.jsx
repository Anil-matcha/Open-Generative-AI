import React, { useState, useEffect } from 'react';
import ApiKeyModal from './ApiKeyModal.jsx';
import ImageUpload from './ImageUpload.jsx';
import EffectGrid from './EffectGrid.jsx';
import SettingsPanel from './SettingsPanel.jsx';
import GenerationProgress from './GenerationProgress.jsx';
import VideoPlayer from './VideoPlayer.jsx';
import { muapiVFX } from '../lib/muapi.js';

function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('muapi_key') || '');
  const [showApiKeyModal, setShowApiKeyModal] = useState(!apiKey);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [selectedEffect, setSelectedEffect] = useState(null);
  const [settings, setSettings] = useState({
    aspectRatio: '16:9',
    duration: 3,
    resolution: '720p',
    quality: 'standard'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedVideo, setGeneratedVideo] = useState(null);
  const [error, setError] = useState(null);

  const handleApiKeySubmit = (key) => {
    setApiKey(key);
    muapiVFX.setApiKey(key);
    setShowApiKeyModal(false);
  };

  const handleImageUpload = (imageData) => {
    setUploadedImage(imageData);
    setError(null);
  };

  const handleEffectSelect = (effect) => {
    setSelectedEffect(effect);
    setError(null);
  };

  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
  };

  const handleGenerate = async () => {
    if (!uploadedImage || !selectedEffect) {
      setError('Please upload an image and select an effect');
      return;
    }

    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setError(null);

    try {
      // Upload image first
      const uploadResult = await muapiVFX.uploadFile(uploadedImage.file);
      const imageUrl = uploadResult.url;

      // Start generation
      const generationParams = {
        image_url: imageUrl,
        effect_type: selectedEffect.id,
        aspect_ratio: settings.aspectRatio,
        duration: settings.duration,
        resolution: settings.resolution,
        quality: settings.quality
      };

      const result = await muapiVFX.generateVFXEffect(generationParams);

      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const status = await muapiVFX.checkGenerationStatus(result.request_id);
          setGenerationProgress(status.progress || 0);

          if (status.status === 'completed') {
            clearInterval(pollInterval);
            setGeneratedVideo(status.video_url);
            setIsGenerating(false);
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            setError('Generation failed. Please try again.');
            setIsGenerating(false);
          }
        } catch (err) {
          console.error('Status check error:', err);
        }
      }, 2000);

    } catch (err) {
      setError(err.message);
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setUploadedImage(null);
    setSelectedEffect(null);
    setGeneratedVideo(null);
    setError(null);
    setGenerationProgress(0);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">AI-VFX Studio</h1>
          <p className="text-gray-400">Generate cinematic video effects with AI</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Upload & Settings */}
          <div className="space-y-6">
            <ImageUpload onUpload={handleImageUpload} />
            <SettingsPanel settings={settings} onChange={handleSettingsChange} />
          </div>

          {/* Center Panel - Effects */}
          <div className="space-y-6">
            <EffectGrid onSelect={handleEffectSelect} selectedEffect={selectedEffect} />

            {error && (
              <div className="bg-red-900 border border-red-700 rounded-lg p-4">
                <p className="text-red-200">{error}</p>
              </div>
            )}

            {isGenerating && (
              <GenerationProgress progress={generationProgress} />
            )}

            {generatedVideo && (
              <VideoPlayer videoUrl={generatedVideo} />
            )}
          </div>

          {/* Right Panel - Preview & Actions */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Generation Summary</h3>

              {uploadedImage && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Uploaded Image:</h4>
                  <img
                    src={uploadedImage.preview}
                    alt="Uploaded"
                    className="w-full h-32 object-cover rounded"
                  />
                </div>
              )}

              {selectedEffect && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Selected Effect:</h4>
                  <div className="bg-gray-700 rounded p-3">
                    <p className="font-medium">{selectedEffect.name}</p>
                    <p className="text-sm text-gray-400">{selectedEffect.description}</p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleGenerate}
                  disabled={!uploadedImage || !selectedEffect || isGenerating}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  {isGenerating ? 'Generating...' : 'Generate Video'}
                </button>

                <button
                  onClick={handleReset}
                  className="w-full bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showApiKeyModal && (
        <ApiKeyModal
          onSubmit={handleApiKeySubmit}
          onClose={() => setShowApiKeyModal(false)}
        />
      )}
    </div>
  );
}

export default App;