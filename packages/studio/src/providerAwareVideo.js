import { generateVideo as generateMuapiVideo, generateI2V as generateMuapiI2V, processV2V as processMuapiV2V } from './muapi.js';
import { getPreferredVideoProvider } from './videoProviderPreference.js';

async function generateLocal(task, params) {
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      provider: 'comfyui',
      task,
      model: params.model,
      prompt: params.prompt || '',
      options: {
        aspectRatio: params.aspect_ratio,
        timeoutMs: params.timeoutMs,
        referenceImages: params.image_urls || params.images_list || [],
      },
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || `ComfyUI request failed (${response.status})`);
  return { ...data, url: data.url || data.data?.url };
}

export async function generateVideo(apiKey, params) {
  if (getPreferredVideoProvider() === 'comfyui') {
    return generateLocal('video', params);
  }
  return generateMuapiVideo(apiKey, params);
}

export async function generateI2V(apiKey, params) {
  // The generic ComfyUI adapter is deliberately conservative: reference-video
  // and I2V workflows vary by installed graph, so MuAPI remains the safe path.
  return generateMuapiI2V(apiKey, params);
}

export async function processV2V(apiKey, params) {
  return processMuapiV2V(apiKey, params);
}
