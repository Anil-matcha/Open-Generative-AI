import axios from 'axios';

class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:1340',
      timeout: 30000,
    });

    // Request interceptor for auth headers
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('apiToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add required headers for remix-api
        config.headers['on-behalf'] = localStorage.getItem('userId') || 'default';
        config.headers['wl-domain'] = process.env.REACT_APP_WL_DOMAIN || 'videoremix.io';

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          localStorage.removeItem('apiToken');
          localStorage.removeItem('userId');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication methods
  async login(credentials) {
    const response = await this.client.post('/api/auth/login', credentials);
    return response.data;
  }

  async register(userData) {
    const response = await this.client.post('/api/auth/register', userData);
    return response.data;
  }

  async logout() {
    const response = await this.client.post('/api/auth/logout');
    return response.data;
  }

  // User methods
  async getCurrentUser() {
    const response = await this.client.get('/api/users/me?serialized=true');
    return response.data;
  }

  async updateUser(userData) {
    const response = await this.client.put('/api/users/me', userData);
    return response.data;
  }

  // Project/Make methods
  async getUserProjects() {
    const response = await this.client.get('/api/users/me/makes');
    return response.data;
  }

  async getProject(projectId) {
    const response = await this.client.get(`/api/users/me/makes/${projectId}`);
    return response.data;
  }

  async createProject(projectData) {
    const response = await this.client.post('/api/users/me/makes', projectData);
    return response.data;
  }

  async updateProject(projectId, projectData) {
    const response = await this.client.put(`/api/users/me/makes/${projectId}`, projectData);
    return response.data;
  }

  async deleteProject(projectId) {
    const response = await this.client.delete(`/api/users/me/makes/${projectId}`);
    return response.data;
  }

  async publishProject(projectId) {
    const response = await this.client.post(`/api/users/me/makes/${projectId}/publish`);
    return response.data;
  }

  // Template methods
  async getTemplates() {
    const response = await this.client.get('/api/makes/template-club');
    return response.data;
  }

  async getTemplateCategories() {
    const response = await this.client.get('/api/make-categories/template-club');
    return response.data;
  }

  // Pre-remix methods (for personalization)
  async getPreRemixData(projectId) {
    const response = await this.client.get(`/api/users/me/makes/${projectId}/pre-remix`);
    return response.data;
  }

  async remixPersonalized(projectId, personalizationData) {
    const response = await this.client.post(`/api/users/me/makes/${projectId}/remix-personalized`, personalizationData);
    return response.data;
  }

  // Media assets
  async uploadMedia(file, metadata = {}) {
    const formData = new FormData();
    formData.append('file', file);
    Object.keys(metadata).forEach(key => {
      formData.append(key, metadata[key]);
    });

    const response = await this.client.post('/api/media-assets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getMediaAssets() {
    const response = await this.client.get('/api/media-assets');
    return response.data;
  }

  // Campaign methods
  async createEmailCampaign(campaignData) {
    const response = await this.client.post('/api/campaigns/email', campaignData);
    return response.data;
  }

  async createSocialCampaign(campaignData) {
    const response = await this.client.post('/api/campaigns/social', campaignData);
    return response.data;
  }

  async createRetargetCampaign(campaignData) {
    const response = await this.client.post('/api/campaigns/retarget', campaignData);
    return response.data;
  }

  // Utility methods
  setAuthToken(token, userId) {
    localStorage.setItem('apiToken', token);
    localStorage.setItem('userId', userId);
  }

  clearAuthToken() {
    localStorage.removeItem('apiToken');
    localStorage.removeItem('userId');
  }

  isAuthenticated() {
    return !!localStorage.getItem('apiToken');
  }
}

export default new ApiClient();