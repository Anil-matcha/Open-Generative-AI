import React, { useState, useEffect, useRef } from 'react';
import ApiKeyModal from './ApiKeyModal.jsx';
import ImageUpload from './ImageUpload.jsx';
import EffectGrid from './EffectGrid.jsx';
import SettingsPanel from './SettingsPanel.jsx';
import GenerationProgress from './GenerationProgress.jsx';
import VideoPlayer from './VideoPlayer.jsx';
import { muAPIClient } from '../lib/muapi.js';
import { saveGeneratedAsset } from '../../../../src/lib/assets/assetActions.js';

function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('muapi_key') || '');
  const [showApiKeyModal, setShowApiKeyModal] = useState(!apiKey);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [selectedEffect, setSelectedEffect] = useState(null);
  const [settings, setSettings] = useState({
    aspectRatio: '16:9',
    duration: 5,
    resolution: '1080p',
    quality: 'premium'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedVideo, setGeneratedVideo] = useState(null);
  const [generatedAssetId, setGeneratedAssetId] = useState(null);
  const [error, setError] = useState(null);
  const assetActionsRef = useRef(null);

  useEffect(() => {
    if (apiKey) {
      muAPIClient.setApiKey(apiKey);
    }
  }, [apiKey]);

  const handleApiKeySubmit = (key) => {
    setApiKey(key);
    muAPIClient.setApiKey(key);
    muAPIClient.saveApiKey();
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
      const generationParams = {
        imageUrl: uploadedImage.url || uploadedImage.preview,
        effect: selectedEffect.id,
        aspectRatio: settings.aspectRatio,
        duration: settings.duration,
        resolution: settings.resolution,
        quality: settings.quality
      };

      const result = await muAPIClient.generateVFX(generationParams);

      await muAPIClient.pollForCompletion(result.requestId, {
        onProgress: (status) => {
          setGenerationProgress(status.progress || 0);
        },
        interval: 3000,
        timeout: 300000
      });

      const finalStatus = await muAPIClient.checkStatus(result.requestId);
      const videoUrl = finalStatus.videoUrl;
      
      const asset = await saveGeneratedAsset('video', {
        title: `${selectedEffect.name} - ${new Date().toLocaleDateString()}`,
        media: {
          url: videoUrl,
          thumbnail: uploadedImage.preview,
          type: 'video/mp4'
        },
        metadata: {
          duration: settings.duration,
          effect: selectedEffect.id,
          effectName: selectedEffect.name,
          aspectRatio: settings.aspectRatio,
          resolution: settings.resolution,
          prompt: generationParams.imageUrl
        },
        sourceApp: 'ai-vfx'
      });
      
      setGeneratedVideo(videoUrl);
      setGeneratedAssetId(asset.id);
      setIsGenerating(false);

    } catch (err) {
      setError(err.message);
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setUploadedImage(null);
    setSelectedEffect(null);
    setGeneratedVideo(null);
    setGeneratedAssetId(null);
    setError(null);
    setGenerationProgress(0);
  };

  useEffect(() => {
    if (generatedAssetId && assetActionsRef.current) {
      const { createAssetActionsBar } = require('../../../../src/components/shared/AssetActionsBar.js');
      const bar = createAssetActionsBar(generatedAssetId);
      assetActionsRef.current.innerHTML = '';
      assetActionsRef.current.appendChild(bar);
    }
  }, [generatedAssetId]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">AI-VFX Studio</h1>
          <p className="text-gray-400">Generate cinematic video effects with AI</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <ImageUpload onUpload={handleImageUpload} />
            <SettingsPanel settings={settings} onChange={handleSettingsChange} />
          </div>

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
              <div className="space-y-4">
                <VideoPlayer videoUrl={generatedVideo} />
                <div ref={assetActionsRef} className="asset-actions-container"></div>
              </div>
            )}
          </div>

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