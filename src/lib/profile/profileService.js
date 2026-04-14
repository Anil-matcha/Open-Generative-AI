import { supabase } from '../supabase.js';

/**
 * Profile Service - Manages user profile operations with Supabase
 */
export class ProfileService {
  constructor() {
    this.supabase = supabase;
  }

  /**
   * Get current user's profile
   * @returns {Promise<Object>} User profile object
   */
  async getCurrentProfile() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, return default profile
        return this.createDefaultProfile(user);
      }

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ProfileService] Failed to get current profile:', error);
      throw error;
    }
  }

  /**
   * Create a default profile for a new user
   * @param {Object} user - Supabase auth user object
   * @returns {Promise<Object>} Default profile object
   */
  async createDefaultProfile(user) {
    try {
      const defaultProfile = {
        id: user.id,
        email: user.email,
        display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        avatar_url: user.user_metadata?.avatar_url || null,
        preferences: {
          theme: 'dark',
          language: 'en',
          notifications: true,
          auto_save: true
        },
        feature_flags: {},
        tenant_id: null // Will be set when joining a tenant
      };

      const { data, error } = await this.supabase
        .from('user_profiles')
        .insert(defaultProfile)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ProfileService] Failed to create default profile:', error);
      throw error;
    }
  }

  /**
   * Update current user's profile
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated profile object
   */
  async updateProfile(updates) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ProfileService] Failed to update profile:', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   * @param {Object} preferences - Preferences object
   * @returns {Promise<Object>} Updated profile object
   */
  async updatePreferences(preferences) {
    const currentProfile = await this.getCurrentProfile();
    const updatedPreferences = { ...currentProfile.preferences, ...preferences };
    return await this.updateProfile({ preferences: updatedPreferences });
  }

  /**
   * Update feature flags
   * @param {Object} featureFlags - Feature flags object
   * @returns {Promise<Object>} Updated profile object
   */
  async updateFeatureFlags(featureFlags) {
    const currentProfile = await this.getCurrentProfile();
    const updatedFlags = { ...currentProfile.feature_flags, ...featureFlags };
    return await this.updateProfile({ feature_flags: updatedFlags });
  }

  /**
   * Check if a feature is enabled for the current user
   * @param {string} featureName - Feature name
   * @returns {Promise<boolean>} Whether the feature is enabled
   */
  async isFeatureEnabled(featureName) {
    try {
      const profile = await this.getCurrentProfile();
      return profile.feature_flags?.[featureName] === true;
    } catch (error) {
      console.error('[ProfileService] Failed to check feature flag:', error);
      return false;
    }
  }

  /**
   * Upload avatar image
   * @param {File} file - Image file
   * @returns {Promise<string>} Avatar URL
   */
  async uploadAvatar(file) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await this.supabase.storage
        .from('user-assets')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = this.supabase.storage
        .from('user-assets')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      await this.updateProfile({ avatar_url: urlData.publicUrl });

      return urlData.publicUrl;
    } catch (error) {
      console.error('[ProfileService] Failed to upload avatar:', error);
      throw error;
    }
  }

  /**
   * Delete avatar
   * @returns {Promise<Object>} Updated profile object
   */
  async deleteAvatar() {
    try {
      const profile = await this.getCurrentProfile();

      if (profile.avatar_url) {
        // Extract file path from URL and delete from storage
        const urlParts = profile.avatar_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `avatars/${fileName}`;

        await this.supabase.storage
          .from('user-assets')
          .remove([filePath]);
      }

      return await this.updateProfile({ avatar_url: null });
    } catch (error) {
      console.error('[ProfileService] Failed to delete avatar:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   * @returns {Promise<Object>} User statistics
   */
  async getUserStats() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get project count
      const { count: projectCount } = await this.supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get media assets count
      const { count: mediaCount } = await this.supabase
        .from('media_assets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get render jobs count
      const { count: renderCount } = await this.supabase
        .from('render_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      return {
        projects: projectCount || 0,
        mediaAssets: mediaCount || 0,
        renderJobs: renderCount || 0
      };
    } catch (error) {
      console.error('[ProfileService] Failed to get user stats:', error);
      return {
        projects: 0,
        mediaAssets: 0,
        renderJobs: 0
      };
    }
  }

  /**
   * Export user data
   * @returns {Promise<Object>} User data export
   */
  async exportUserData() {
    try {
      const profile = await this.getCurrentProfile();
      const stats = await this.getUserStats();

      // Get recent projects
      const { data: projects } = await this.supabase
        .from('projects')
        .select('id, title, description, status, created_at, updated_at')
        .eq('user_id', profile.id)
        .order('updated_at', { ascending: false })
        .limit(10);

      return {
        profile,
        stats,
        recentProjects: projects || [],
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[ProfileService] Failed to export user data:', error);
      throw error;
    }
  }

  /**
   * Delete user account and all associated data
   * @returns {Promise<boolean>} Success status
   */
  async deleteAccount() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Delete associated data in order
      // Note: This is a simplified version. In production, you'd want more sophisticated cleanup

      // Delete render jobs
      await this.supabase
        .from('render_jobs')
        .delete()
        .eq('user_id', user.id);

      // Delete media assets
      await this.supabase
        .from('media_assets')
        .delete()
        .eq('user_id', user.id);

      // Delete projects
      await this.supabase
        .from('projects')
        .delete()
        .eq('user_id', user.id);

      // Delete templates created by user
      await this.supabase
        .from('templates')
        .delete()
        .eq('created_by', user.id);

      // Delete profile
      await this.supabase
        .from('user_profiles')
        .delete()
        .eq('id', user.id);

      // Delete user from auth (this will cascade delete everything)
      // Note: In Supabase, this requires admin privileges
      // For now, we'll just mark the profile as deleted
      console.log('[ProfileService] Account deletion requested - manual admin action required');

      return true;
    } catch (error) {
      console.error('[ProfileService] Failed to delete account:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const profileService = new ProfileService();