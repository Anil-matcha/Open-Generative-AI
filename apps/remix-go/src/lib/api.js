import { supabase } from './supabase';
import { saveGeneratedAsset } from '../../src/lib/assets/assetActions.js';

class ApiClient {
  constructor() {
    this.supabase = supabase;
  }

  // Authentication methods
  async login(credentials) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) throw error;
    return { user: data.user, token: data.session?.access_token };
  }

  async register(userData) {
    const { data, error } = await this.supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.fullName,
        }
      }
    });

    if (error) throw error;
    return { user: data.user, token: data.session?.access_token };
  }

  async logout() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
    return {};
  }

  // User methods
  async getCurrentUser() {
    const { data: { user }, error } = await this.supabase.auth.getUser();
    if (error) throw error;

    if (!user) throw new Error('No authenticated user');

    return {
      _id: user.id,
      username: user.email?.split('@')[0] || 'user',
      email: user.email,
      fullName: user.user_metadata?.full_name || 'User',
      features: {
        templates: { state: 'enabled' },
        personalization: { state: 'enabled' },
        campaigns: { state: 'enabled' },
      },
    };
  }

  async updateUser(userData) {
    const { data, error } = await this.supabase.auth.updateUser({
      data: userData
    });

    if (error) throw error;
    return data.user;
  }

  // Project/Make methods
  async getUserProjects() {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('author_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getProject(projectId) {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) throw error;
    return data;
  }

  async updateProject(projectId, projectData) {
    const { data, error } = await this.supabase
      .from('projects')
      .update({
        ...projectData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteProject(projectId) {
    const { error } = await this.supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
    return { success: true };
  }

  async publishProject(projectId) {
    const publishedUrl = `https://${import.meta.env.VITE_SUPABASE_URL?.replace('https://', '')}/watch/${projectId}`;

    const { data, error } = await this.supabase
      .from('projects')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        published_url: publishedUrl,
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;

    // Save to universal asset pipeline (non-blocking)
    try {
      await saveGeneratedAsset('video', {
        title: data.title || 'Published Project',
        media: { url: publishedUrl },
        metadata: {
          projectId: projectId,
          type: 'remix-go-project',
          published_at: new Date().toISOString()
        }
      }, 'remix-go');
    } catch (err) {
      console.warn('[Asset Pipeline] Failed to save published project:', err.message);
    }

    return { ...data, url: publishedUrl };
  }

  async createProject(projectData) {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await this.supabase
      .from('projects')
      .insert({
        ...projectData,
        author_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
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
    const { data, error } = await this.supabase
      .from('templates')
      .select('*')
      .eq('is_public', true)
      .order('usage_count', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getTemplateCategories() {
    const { data, error } = await this.supabase
      .from('template_categories')
      .select('*')
      .eq('published', true)
      .order('priority', { ascending: false });

    if (error) throw error;
    return data;
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

  // Media assets
  async uploadMedia(file, type = 'media') {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const folder = type === 'video' ? 'videos' : type === 'image' ? 'images' : 'media';
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${file.name.split('.').pop()}`;
    const filePath = `${folder}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await this.supabase.storage
      .from('remix-media')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = this.supabase.storage
      .from('remix-media')
      .getPublicUrl(filePath);

    // Save metadata to database
    const { data: assetData, error: dbError } = await this.supabase
      .from('media_assets')
      .insert({
        filename: fileName,
        original_name: file.name,
        url: publicUrl,
        path: filePath,
        size: file.size,
        mime_type: file.type,
        type: type,
        user_id: user.id,
      })
      .select()
      .single();

    if (dbError) throw dbError;
    return assetData;
  }

  async getMediaAssets() {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await this.supabase
      .from('media_assets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
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
  async setAuthToken(token, userId) {
    // Supabase handles auth tokens automatically
    localStorage.setItem('supabase_user_id', userId);
  }

  async clearAuthToken() {
    // Supabase handles auth tokens automatically
    localStorage.removeItem('supabase_user_id');
  }

  async isAuthenticated() {
    const { data: { user } } = await this.supabase.auth.getUser();
    return !!user;
  }
}

export default new ApiClient();