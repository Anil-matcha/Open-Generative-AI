import axios from 'axios';

class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:1340',
      timeout: 30000,
    });

    // Request interceptor for auth headers (disabled for demo)
    this.client.interceptors.request.use(
      (config) => {
        // Skip authentication for demo mode
        // Add required headers for remix-api
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

  // Authentication methods (disabled in demo mode)
  async login(credentials) {
    // Demo mode - always succeed
    return { user: { id: 'demo', name: 'Demo User' }, token: 'demo-token' };
  }

  async register(userData) {
    // Demo mode - always succeed
    return { user: { id: 'demo', name: 'Demo User' }, token: 'demo-token' };
  }

  async logout() {
    // Demo mode - always succeed
    return {};
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
    // Demo mode - return mock projects
    return [
      {
        _id: '1',
        title: 'Sample Project 1',
        description: 'A sample video project',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        published: false,
        thumbnail: '/api/placeholder/400/225',
      },
      {
        _id: '2',
        title: 'Sample Project 2',
        description: 'Another sample video project',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        published: true,
        thumbnail: '/api/placeholder/400/225',
      }
    ];
  }

  async getProject(projectId) {
    const response = await this.client.get(`/api/users/me/makes/${projectId}`);
    return response.data;
  }

  async createProject(projectData) {
    // Demo mode - return mock project data
    const mockProject = {
      _id: Date.now().toString(),
      ...projectData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      published: false,
      thumbnail: projectData.thumbnail || '/api/placeholder/400/225',
    };
    return mockProject;
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
    // Demo mode - return mock templates
    return [
      {
        _id: 'template1',
        title: 'Business Presentation',
        description: 'Professional business presentation template',
        thumbnail: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Business+Template',
        category: 'business',
        duration: '2:30',
      },
      {
        _id: 'template2',
        title: 'Product Demo',
        description: 'Showcase your product features',
        thumbnail: 'https://via.placeholder.com/300x200/059669/ffffff?text=Product+Demo',
        category: 'product',
        duration: '1:45',
      },
      {
        _id: 'template3',
        title: 'Customer Story',
        description: 'Share customer testimonials',
        thumbnail: 'https://via.placeholder.com/300x200/dc2626/ffffff?text=Customer+Story',
        category: 'testimonial',
        duration: '3:15',
      },
      {
        _id: 'template4',
        title: 'Tutorial Video',
        description: 'Educational content template',
        thumbnail: 'https://via.placeholder.com/300x200/7c3aed/ffffff?text=Tutorial',
        category: 'education',
        duration: '5:20',
      }
    ];
  }

  async getTemplateCategories() {
    // Demo mode - return mock categories
    return [
      { _id: 'business', name: 'Business', priority: 1 },
      { _id: 'product', name: 'Product', priority: 2 },
      { _id: 'testimonial', name: 'Testimonials', priority: 3 },
      { _id: 'education', name: 'Education', priority: 4 },
      { _id: 'marketing', name: 'Marketing', priority: 5 },
    ];
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
    // Demo mode - return mock campaign
    return {
      id: Date.now().toString(),
      ...campaignData,
      status: 'created',
      createdAt: new Date().toISOString(),
    };
  }

  async createSocialCampaign(campaignData) {
    // Demo mode - return mock campaign
    return {
      id: Date.now().toString(),
      ...campaignData,
      status: 'posted',
      postedAt: new Date().toISOString(),
    };
  }

  async createRetargetCampaign(campaignData) {
    // Demo mode - return mock campaign
    return {
      id: Date.now().toString(),
      ...campaignData,
      status: 'active',
      startedAt: new Date().toISOString(),
    };
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