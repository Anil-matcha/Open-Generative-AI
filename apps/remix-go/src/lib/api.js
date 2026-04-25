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

  // User methods (demo mode)
  async getCurrentUser() {
    // Demo mode - return mock user
    return {
      _id: 'demo-user',
      username: 'demo',
      email: 'demo@example.com',
      fullName: 'Demo User',
      features: {
        templates: { state: 'enabled' },
        personalization: { state: 'enabled' },
        campaigns: { state: 'enabled' },
      },
    };
  }

  async updateUser(userData) {
    // Demo mode - return updated user
    return {
      _id: 'demo-user',
      ...userData,
    };
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
    // Demo mode - return mock project
    return {
      _id: projectId,
      title: 'Demo Project',
      description: 'A demo video project',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      published: false,
      thumbnail: '/api/placeholder/400/225',
      make: { _id: projectId, url: '#' },
    };
  }

  async updateProject(projectId, projectData) {
    // Demo mode - return updated project
    return {
      _id: projectId,
      ...projectData,
      updatedAt: new Date().toISOString(),
    };
  }

  async deleteProject(projectId) {
    // Demo mode - always succeed
    return { success: true };
  }

  async publishProject(projectId) {
    // Demo mode - return published project
    return {
      _id: projectId,
      published: true,
      publishedAt: new Date().toISOString(),
      url: `https://demo.vidcloud.io/watch/${projectId}`,
    };
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

  // Pre-remix methods (for personalization) - demo mode
  async getPreRemixData(projectId) {
    // Demo mode - return mock data
    return {
      scenario: 'hasData',
      data: [
        { _id: 'voice1', url: '/api/placeholder/audio', text: 'Welcome to our demo!' },
        { _id: 'voice2', url: '/api/placeholder/audio', text: 'Thank you for trying VideoRemix Go' },
      ]
    };
  }

  async remixPersonalized(projectId, personalizationData) {
    // Demo mode - return updated project
    return {
      _id: projectId,
      personalized: true,
      updatedAt: new Date().toISOString(),
    };
  }

  // Media assets - demo mode
  async uploadMedia(file, metadata = {}) {
    // Demo mode - simulate upload
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate upload time
    return {
      _id: Date.now().toString(),
      filename: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
    };
  }

  async getMediaAssets() {
    // Demo mode - return mock assets
    return [
      {
        _id: 'asset1',
        filename: 'sample-video.mp4',
        url: '/api/placeholder/video',
        type: 'video/mp4',
        size: 1024000,
        thumbnail: '/api/placeholder/300x200',
      },
      {
        _id: 'asset2',
        filename: 'sample-image.jpg',
        url: '/api/placeholder/image',
        type: 'image/jpeg',
        size: 512000,
        thumbnail: '/api/placeholder/300x200',
      }
    ];
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

  // Utility methods (demo mode - always authenticated)
  setAuthToken(token, userId) {
    // Demo mode - no token storage needed
  }

  clearAuthToken() {
    // Demo mode - no token to clear
  }

  isAuthenticated() {
    return true; // Always authenticated in demo mode
  }
}

export default new ApiClient();