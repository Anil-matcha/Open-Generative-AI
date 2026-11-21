import { generateImage as generateMuapiImage, generateI2I as generateMuapiI2I } from './muapi.js';
import { getPreferredProvider } from './providerPreference.js';

async function callProvider(task, params) {
  const provider = getPreferredProvider();
  if (provider === 'muapi') {
    return task === 'image'
      ? generateMuapiImage(params.apiKey, params)
      : generateMuapiI2I(params.apiKey, params);
  }

  if (provider === 'comfyui') {
    if (task !== 'image') throw new Error('ComfyUI provider currently handles image generation through the configured workflow.');
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        provider: 'comfyui',
        task: 'image',
        model: params.model,
        prompt: params.prompt,
        options: { aspectRatio: params.aspect_ratio },
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || `ComfyUI request failed (${response.status})`);
    return { ...data, url: data.url || data.data?.url };
  }

  if (provider === 'gemini') {
    if (task === 'i2i') {
      throw new Error('Gemini image editing from Image Studio will be enabled after the reference-image upload adapter is added. Select MuAPI or ComfyUI for I2I for now.');
    }

    const generationConfig = { responseModalities: ['IMAGE'] };
    if (params.aspect_ratio) {
      generationConfig.responseFormat = { image: { aspectRatio: params.aspect_ratio } };
    }

    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        provider: 'gemini',
        task: 'image',
        model: 'gemini-2.5-flash-image',
        prompt: params.prompt,
        options: { generationConfig },
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || `Gemini request failed (${response.status})`);

    const image = data?.data;
    if (!image?.data) throw new Error('Gemini returned no image data.');
    return { ...data, url: `data:${image.mimeType || 'image/png'};base64,${image.data}` };
  }

  throw new Error(`Unsupported image provider: ${provider}`);
}

export async function generateImage(apiKey, params) {
  return callProvider('image', { ...params, apiKey });
}

export async function generateI2I(apiKey, params) {
  return callProvider('i2i', { ...params, apiKey });
}
