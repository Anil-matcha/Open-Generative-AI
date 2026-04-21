// MuAPI VFX Client for AI-VFX standalone app
class MuAPIVFXClient {
  constructor() {
    this.apiKey = localStorage.getItem('muapi_key') || '';
    this.baseUrl = 'https://api.muapi.ai';
  }

  setApiKey(key) {
    this.apiKey = key;
    localStorage.setItem('muapi_key', key);
  }

  async generateVFXEffect(params) {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    const response = await fetch(`${this.baseUrl}/api/v1/generate_wan_ai_effects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return await response.json();
  }

  async uploadFile(file) {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/upload_file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return await response.json();
  }

  async checkGenerationStatus(requestId) {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    const response = await fetch(`${this.baseUrl}/api/v1/predictions/${requestId}/result`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    return await response.json();
  }
}

export const muapiVFX = new MuAPIVFXClient();