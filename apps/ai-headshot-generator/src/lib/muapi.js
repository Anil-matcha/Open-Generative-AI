// MuapiClient for MU API integration in headshot generator
export class MuapiClient {
  constructor(apiKey, proxyUrl = '') {
    this.apiKey = apiKey;
    this.proxyUrl = proxyUrl;
    this.baseUrl = 'https://api.muapi.ai';
  }

  async generateHeadshot({ image, prompt, preset, options = {} }) {
    const formData = new FormData();
    formData.append('image', image);
    formData.append('prompt', prompt || '');
    formData.append('preset', preset || 'professional');
    if (options.aspectRatio) formData.append('aspect_ratio', options.aspectRatio);

    const headers = {};
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

    const url = this.proxyUrl || `${this.baseUrl}/v1/headshot/generate`;
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `MU API error: ${res.status}`);
    }
    return res.json();
  }

  async checkStatus(jobId) {
    const url = this.proxyUrl ? `${this.proxyUrl}/status/${jobId}` : `${this.baseUrl}/v1/headshot/status/${jobId}`;
    const res = await fetch(url);
    return res.json();
  }
}

export default MuapiClient;
