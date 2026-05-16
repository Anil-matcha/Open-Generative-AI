import { saveGeneratedAsset } from '../../../src/lib/assets/assetActions.js';

export async function generateVideoWithAssetPipeline(prompt, options = {}) {
  // Your existing generation logic here
  const result = await callMuAPI('/generate/video', { prompt, ...options });
  
  // Save to universal asset pipeline
  const asset = await saveGeneratedAsset('video', {
    title: options.title || 'Generated Video',
    media: { url: result.videoUrl },
    metadata: {
      duration: result.duration,
      width: result.width,
      height: result.height,
      prompt: prompt,
      model: options.model || 'muapi-v2',
      generationSettings: options
    }
  }, 'ai-vfx');
  
  return { ...result, assetId: asset.id };
}

export async function generateImageWithAssetPipeline(prompt, options = {}) {
  // Your existing generation logic here
  const result = await callMuAPI('/generate/image', { prompt, ...options });
  
  // Save to universal asset pipeline
  const asset = await saveGeneratedAsset('image', {
    title: options.title || 'Generated Image',
    media: { 
      url: result.imageUrl,
      thumbnail: result.thumbnailUrl 
    },
    metadata: {
      width: result.width,
      height: result.height,
      prompt: prompt,
      model: options.model || 'muapi-v2'
    }
  }, 'ai-vfx');
  
  return { ...result, assetId: asset.id };
}