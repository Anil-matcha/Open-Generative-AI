import { MuapiClient } from './muapi.js';

const DEFAULT_PROVIDER = import.meta.env.VITE_HEADSHOT_PROVIDER || 'muapi';
const PROXY_URL = import.meta.env.VITE_HEADSHOT_PROXY_URL || '';

export async function generateHeadshot({ image, prompt, preset, apiKey, provider = DEFAULT_PROVIDER, options = {} }) {
  if (!image) throw new Error('Please upload a source portrait first.');

  if (provider === 'muapi') {
    if (!apiKey && !localStorage.getItem('muapi_key') && !PROXY_URL) {
      throw new Error('Missing MUAPI key. Add your key in Headshot Settings.');
    }

    if (apiKey) localStorage.setItem('muapi_key', apiKey);

    if (PROXY_URL) {
      const res = await fetch(PROXY_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'muapi', prompt, preset, options })
      });
      if (!res.ok) throw new Error('Headshot proxy request failed.');
      return res.json();
    }

    const client = new MuapiClient();
    const imageUrl = await client.uploadFile(image);
    const result = await client.generateImage({
      model: options.model || 'flux-dev',
      prompt,
      image_url: imageUrl,
      aspect_ratio: options.aspectRatio || '1:1',
      strength: options.strength ?? 0.6,
      onRequestId: options.onRequestId
    });

    const images = result.outputs || (result.url ? [result.url] : []);
    return { images, raw: result };
  }

  throw new Error(`Unsupported headshot provider: ${provider}`);
}
