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

    // Validate required parameters
    if (!params.image_url || !params.effect_type) {
      throw new Error('Missing required parameters: image_url and effect_type');
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/generate_wan_ai_effects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed (${response.status}): ${errorText}`);
      }

      const result = await response.json();

      // Validate response structure
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid API response format');
      }

      return result;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to MuAPI server');
      }
      throw error;
    }
  }

  async uploadFile(file) {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    if (!file || !(file instanceof File)) {
      throw new Error('Invalid file provided');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are supported');
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 10MB');
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${this.baseUrl}/upload_file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed (${response.status}): ${errorText}`);
      }

      const result = await response.json();

      // Validate response has URL
      if (!result || !result.url) {
        throw new Error('Upload succeeded but no file URL returned');
      }

      return result;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to MuAPI server');
      }
      throw error;
    }
  }

  async checkGenerationStatus(requestId) {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    if (!requestId || typeof requestId !== 'string') {
      throw new Error('Invalid request ID provided');
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/predictions/${requestId}/result`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Generation request not found');
        }
        const errorText = await response.text();
        throw new Error(`Status check failed (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to MuAPI server');
      }
      throw error;
    }
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

export { MuAPIVFXClient };
export const muapiVFX = new MuAPIVFXClient();