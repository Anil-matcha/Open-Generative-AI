import { supabase } from '../supabase.js';
import { templates, TEMPLATE_CATEGORIES } from '../templates.js';

/**
 * Template Browser Service - Manages template discovery and access
 */
export class TemplateBrowserService {
  constructor() {
    this.supabase = supabase;
  }

  /**
   * Get all available templates (combines built-in and user-created)
   * @returns {Promise<Array>} Array of template objects
   */
  async getAllTemplates() {
    try {
      const [builtInTemplates, userTemplates] = await Promise.all([
        this.getBuiltInTemplates(),
        this.getUserTemplates()
      ]);

      return [...builtInTemplates, ...userTemplates];
    } catch (error) {
      console.error('[TemplateBrowserService] Failed to get templates:', error);
      // Fallback to built-in templates only
      return this.getBuiltInTemplates();
    }
  }

  /**
   * Get built-in templates from the application
   * @returns {Promise<Array>} Array of built-in template objects
   */
  async getBuiltInTemplates() {
    // Transform built-in templates to match the expected format
    return templates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      thumbnail_url: template.thumbnail || null,
      data: template,
      is_public: true,
      created_by: null,
      created_at: null,
      is_built_in: true
    }));
  }

  /**
   * Get user-created templates from Supabase
   * @returns {Promise<Array>} Array of user template objects
   */
  async getUserTemplates() {
    try {
      const { data, error } = await this.supabase
        .from('templates')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(template => ({
        ...template,
        is_built_in: false
      }));
    } catch (error) {
      console.error('[TemplateBrowserService] Failed to get user templates:', error);
      return [];
    }
  }

  /**
   * Get templates by category
   * @param {string} category - Template category
   * @returns {Promise<Array>} Array of templates in the category
   */
  async getTemplatesByCategory(category) {
    try {
      const allTemplates = await this.getAllTemplates();
      return allTemplates.filter(template => template.category === category);
    } catch (error) {
      console.error('[TemplateBrowserService] Failed to get templates by category:', error);
      throw error;
    }
  }

  /**
   * Search templates by name or description
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of matching templates
   */
  async searchTemplates(query) {
    try {
      const allTemplates = await this.getAllTemplates();
      const lowerQuery = query.toLowerCase();

      return allTemplates.filter(template =>
        template.name.toLowerCase().includes(lowerQuery) ||
        (template.description && template.description.toLowerCase().includes(lowerQuery)) ||
        template.category.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('[TemplateBrowserService] Failed to search templates:', error);
      throw error;
    }
  }

  /**
   * Get template categories
   * @returns {Array} Array of category objects
   */
  getCategories() {
    return Object.entries(TEMPLATE_CATEGORIES).map(([key, value]) => ({
      id: key,
      name: value,
      count: 0 // Will be populated when templates are loaded
    }));
  }

  /**
   * Get template categories with counts
   * @returns {Promise<Array>} Array of category objects with template counts
   */
  async getCategoriesWithCounts() {
    try {
      const templates = await this.getAllTemplates();
      const categories = this.getCategories();

      // Count templates per category
      const categoryCounts = {};
      templates.forEach(template => {
        categoryCounts[template.category] = (categoryCounts[template.category] || 0) + 1;
      });

      return categories.map(category => ({
        ...category,
        count: categoryCounts[category.name] || 0
      }));
    } catch (error) {
      console.error('[TemplateBrowserService] Failed to get categories with counts:', error);
      return this.getCategories();
    }
  }

  /**
   * Get a single template by ID
   * @param {string} templateId - Template ID
   * @returns {Promise<Object>} Template object
   */
  async getTemplate(templateId) {
    try {
      // First check built-in templates
      const builtInTemplates = await this.getBuiltInTemplates();
      const builtInTemplate = builtInTemplates.find(t => t.id === templateId);
      if (builtInTemplate) {
        return builtInTemplate;
      }

      // Then check user templates
      const { data, error } = await this.supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;
      return {
        ...data,
        is_built_in: false
      };
    } catch (error) {
      console.error('[TemplateBrowserService] Failed to get template:', error);
      throw error;
    }
  }

  /**
   * Create a new user template
   * @param {Object} templateData - Template data
   * @returns {Promise<Object>} Created template object
   */
  async createTemplate(templateData) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase
        .from('templates')
        .insert({
          name: templateData.name,
          description: templateData.description,
          category: templateData.category,
          thumbnail_url: templateData.thumbnail_url || null,
          data: templateData.data || {},
          is_public: templateData.is_public || false,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        is_built_in: false
      };
    } catch (error) {
      console.error('[TemplateBrowserService] Failed to create template:', error);
      throw error;
    }
  }

  /**
   * Update a user template
   * @param {string} templateId - Template ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated template object
   */
  async updateTemplate(templateId, updates) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase
        .from('templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId)
        .eq('created_by', user.id)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        is_built_in: false
      };
    } catch (error) {
      console.error('[TemplateBrowserService] Failed to update template:', error);
      throw error;
    }
  }

  /**
   * Delete a user template
   * @param {string} templateId - Template ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteTemplate(templateId) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await this.supabase
        .from('templates')
        .delete()
        .eq('id', templateId)
        .eq('created_by', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[TemplateBrowserService] Failed to delete template:', error);
      throw error;
    }
  }

  /**
   * Get featured/popular templates
   * @param {number} limit - Number of templates to return
   * @returns {Promise<Array>} Array of featured templates
   */
  async getFeaturedTemplates(limit = 8) {
    try {
      const allTemplates = await this.getAllTemplates();

      // For now, just return the first N templates
      // In a real implementation, this could be based on usage statistics
      return allTemplates.slice(0, limit);
    } catch (error) {
      console.error('[TemplateBrowserService] Failed to get featured templates:', error);
      return [];
    }
  }

  /**
   * Get recent templates (for user templates)
   * @param {number} limit - Number of templates to return
   * @returns {Promise<Array>} Array of recent templates
   */
  async getRecentTemplates(limit = 10) {
    try {
      const userTemplates = await this.getUserTemplates();
      return userTemplates.slice(0, limit);
    } catch (error) {
      console.error('[TemplateBrowserService] Failed to get recent templates:', error);
      return [];
    }
  }
}

// Export singleton instance
export const templateBrowserService = new TemplateBrowserService();