/**
 * AI Storyboard API Client
 */

class CutAIClient {
  constructor() {
    this.baseUrl = '/api';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('CutAI API Error:', error);
      throw error;
    }
  }

  async createProject(name) {
    return this.request('/projects/', {
      method: 'POST',
      body: { name },
    });
  }

  async getProjects() {
    return this.request('/projects/');
  }

  async getProject(id) {
    return this.request(`/projects/${id}`);
  }

  async deleteProject(id) {
    return this.request(`/projects/${id}`, { method: 'DELETE' });
  }

  async duplicateProject(id) {
    return this.request(`/projects/${id}/duplicate`, {
      method: 'POST',
    });
  }

  async generateStoryboard(projectId, genre, premise) {
    return this.request('/storyboard/generate', {
      method: 'POST',
      body: { project_id: projectId, genre, premise },
    });
  }

  async getStoryboard(projectId) {
    return this.request(`/storyboard/${projectId}`);
  }

  async updateScene(sceneId, data) {
    return this.request(`/scenes/${sceneId}`, {
      method: 'PATCH',
      body: data,
    });
  }

  async updateShot(shotId, data) {
    return this.request(`/shots/${shotId}`, {
      method: 'PATCH',
      body: data,
    });
  }

  async exportJSON(projectId) {
    return this.request('/export/json', {
      method: 'POST',
      body: { project_id: projectId, format: 'json' },
    });
  }

  async exportPDF(projectId) {
    return this.request('/export/pdf', {
      method: 'POST',
      body: { project_id: projectId, format: 'pdf' },
    });
  }

  async createStoryboardProject(data) {
    return this.request('/storyboard/projects', {
      method: 'POST',
      body: data,
    });
  }
}

export const cutai = new CutAIClient();
