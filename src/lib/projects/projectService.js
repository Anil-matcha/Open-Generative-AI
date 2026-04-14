import { supabase } from '../supabase.js';
import { errorHandler } from '../error-handling/errorHandler.js';
import { inputValidator } from '../error-handling/inputValidator.js';
import { cacheManager } from '../caching/cacheManager.js';

/**
 * Project Service - Manages project CRUD operations with Supabase
 */
export class ProjectService {
  constructor() {
    this.supabase = supabase;
  }

  /**
   * Get all projects for the current user
   * @returns {Promise<Array>} Array of project objects
   */
  async getProjects() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      errorHandler.handleError(error, 'ProjectService.getProjects');
      throw error;
    }
  }

  /**
   * Get a single project by ID
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Project object
   */
  async getProject(projectId) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      errorHandler.handleError(error, `ProjectService.getproject`);
      throw error;
    }
  }

  /**
   * Create a new project
   * @param {Object} projectData - Project data
   * @param {string} projectData.title - Project title
   * @param {string} projectData.description - Project description
   * @param {Object} projectData.data - Project data/content
   * @param {Object} projectData.settings - Project settings
   * @param {string} projectData.template_id - Template ID (optional)
   * @returns {Promise<Object>} Created project object
   */
  async createProject(projectData) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: projectData.title,
          description: projectData.description || '',
          data: projectData.data || {},
          settings: projectData.settings || {},
          template_id: projectData.template_id || null,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      errorHandler.handleError(error, `ProjectService.createproject`);
      throw error;
    }
  }

  /**
   * Update an existing project
   * @param {string} projectId - Project ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated project object
   */
  async updateProject(projectId, updates) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      errorHandler.handleError(error, `ProjectService.updateproject`);
      throw error;
    }
  }

  /**
   * Delete a project
   * @param {string} projectId - Project ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteProject(projectId) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await this.supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      errorHandler.handleError(error, `ProjectService.deleteproject`);
      throw error;
    }
  }

  /**
   * Duplicate a project
   * @param {string} projectId - Project ID to duplicate
   * @param {string} newTitle - New project title
   * @returns {Promise<Object>} Duplicated project object
   */
  async duplicateProject(projectId, newTitle) {
    try {
      const originalProject = await this.getProject(projectId);

      const duplicatedData = {
        title: newTitle,
        description: originalProject.description,
        data: { ...originalProject.data },
        settings: { ...originalProject.settings },
        template_id: originalProject.template_id
      };

      return await this.createProject(duplicatedData);
    } catch (error) {
      errorHandler.handleError(error, `ProjectService.duplicateproject`);
      throw error;
    }
  }

  /**
   * Search projects by title or description
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of matching projects
   */
  async searchProjects(query) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Perform separate queries for security (avoiding template literals in SQL)
      const [titleResults, descriptionResults] = await Promise.all([
        this.supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .ilike('title', `%${query}%`)
          .order('updated_at', { ascending: false }),
        this.supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .ilike('description', `%${query}%`)
          .order('updated_at', { ascending: false })
      ]);

      if (titleResults.error) throw titleResults.error;
      if (descriptionResults.error) throw descriptionResults.error;

      // Combine and deduplicate results
      const allResults = [...(titleResults.data || []), ...(descriptionResults.data || [])];
      const uniqueResults = allResults.filter((project, index, self) => 
        index === self.findIndex(p => p.id === project.id)
      );

      return uniqueResults;
    } catch (error) {
      errorHandler.handleError(error, `ProjectService.searchprojects`);
      throw error;
    }
  }

  /**
   * Get projects by status
   * @param {string} status - Project status (draft, published, archived)
   * @returns {Promise<Array>} Array of projects with the specified status
   */
  async getProjectsByStatus(status) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', status)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      errorHandler.handleError(error, `ProjectService.getprojectsbystatus`);
      throw error;
    }
  }

  /**
   * Update project thumbnail
   * @param {string} projectId - Project ID
   * @param {string} thumbnailUrl - Thumbnail URL
   * @returns {Promise<Object>} Updated project object
   */
  async updateProjectThumbnail(projectId, thumbnailUrl) {
    return await this.updateProject(projectId, { thumbnail_url: thumbnailUrl });
  }

  /**
   * Publish a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Updated project object
   */
  async publishProject(projectId) {
    return await this.updateProject(projectId, {
      status: 'published',
      settings: {
        published_at: new Date().toISOString()
      }
    });
  }

  /**
   * Archive a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Updated project object
   */
  async archiveProject(projectId) {
    return await this.updateProject(projectId, { status: 'archived' });
  }
}

// Export singleton instance
export const projectService = new ProjectService();
// =============================================================================
// UNIVERSAL PROJECT INTEGRATION SERVICE
// =============================================================================

/**
 * Universal Project Integration Service
 * Standardized interface for all apps to save/load projects seamlessly
 */
export class ProjectIntegrationService {
  constructor() {
    this.supabase = supabase;
    this.projectService = projectService;
    this.activeProjects = new Map(); // Cache for active project sessions
    this.autoSaveIntervals = new Map(); // Auto-save timers per project
    this.changeListeners = new Map(); // Change listeners per project
  }

  /**
   * Register an app with the integration service
   * @param {string} appId - Unique app identifier (e.g., 'timeline-editor')
   * @param {Object} appConfig - App configuration
   */
  registerApp(appId, appConfig = {}) {
    console.log(`[ProjectIntegration] Registered app: ${appId}`, appConfig);
    // Store app configuration for compatibility checking
    this.appConfig = this.appConfig || {};
    this.appConfig[appId] = {
      version: appConfig.version || '1.0.0',
      supportedFeatures: appConfig.supportedFeatures || [],
      dataSchema: appConfig.dataSchema || {},
      migrationHandlers: appConfig.migrationHandlers || {},
      ...appConfig
    };
  }

  /**
   * Create a new project for an app
   * @param {string} appId - App identifier
   * @param {Object} projectData - Project data
   * @param {Object} appState - App-specific state data
   * @returns {Promise<Object>} Created project
   */
  async createAppProject(appId, projectData, appState) {
    try {
      const appConfig = this.appConfig?.[appId];
      if (!appConfig) {
        throw new Error(`App ${appId} not registered. Call registerApp() first.`);
      }

      // Validate app state against schema if provided
      if (appConfig.dataSchema) {
        this.validateAppData(appState, appConfig.dataSchema);
      }

      // Create project with app-specific metadata
      const project = await this.projectService.createProject({
        title: projectData.title,
        description: projectData.description || '',
        data: {
          appId,
          appVersion: appConfig.version,
          createdIn: appId,
          ...projectData
        },
        settings: {
          studio_type: appId,
          app_version: appConfig.version,
          auto_save: projectData.autoSave !== false,
          ...projectData.settings
        },
        template_id: projectData.templateId
      });

      // Save app-specific data
      await this.saveAppData(project.id, appId, appState);

      // Initialize project session
      this.activeProjects.set(project.id, {
        appId,
        projectId: project.id,
        lastSaved: new Date(),
        hasUnsavedChanges: false,
        appState: { ...appState }
      });

      console.log(`[ProjectIntegration] Created project ${project.id} for app ${appId}`);
      return project;
    } catch (error) {
      console.error('[ProjectIntegration] Failed to create app project:', error);
      throw error;
    }
  }

  /**
   * Load a project for an app
   * @param {string} projectId - Project ID
   * @param {string} appId - App identifier
   * @returns {Promise<Object>} Project data with app state
   */
  async loadAppProject(projectId, appId) {
    try {
      const appConfig = this.appConfig?.[appId];
      if (!appConfig) {
        throw new Error(`App ${appId} not registered. Call registerApp() first.`);
      }

      // Load project from database
      const project = await this.projectService.getProject(projectId);

      // Check app compatibility
      const compatibility = await this.checkAppCompatibility(projectId, appId);
      if (!compatibility.compatible) {
        throw new Error(`Project not compatible: ${compatibility.reason}`);
      }

      // Load app-specific data
      const appData = await this.loadAppData(projectId, appId);

      // Handle migration if needed
      let migratedAppData = appData;
      if (compatibility.migrationRequired) {
        migratedAppData = await this.migrateAppData(appData, project.app_version, appConfig.version, appId);
      }

      // Initialize project session
      this.activeProjects.set(projectId, {
        appId,
        projectId,
        lastSaved: new Date(),
        hasUnsavedChanges: false,
        appState: { ...migratedAppData }
      });

      console.log(`[ProjectIntegration] Loaded project ${projectId} for app ${appId}`);
      return {
        ...project,
        appData: migratedAppData,
        compatibility
      };
    } catch (error) {
      console.error('[ProjectIntegration] Failed to load app project:', error);
      throw error;
    }
  }

  /**
   * Save current app state to project
   * @param {string} projectId - Project ID
   * @param {Object} appState - Current app state
   * @param {boolean} isAutoSave - Whether this is an auto-save
   * @returns {Promise<Object>} Save result
   */
  async saveAppProject(projectId, appState, isAutoSave = false) {
    try {
      const session = this.activeProjects.get(projectId);
      if (!session) {
        throw new Error(`No active session for project ${projectId}`);
      }

      const appConfig = this.appConfig?.[session.appId];
      if (!appConfig) {
        throw new Error(`App ${session.appId} not registered`);
      }

      // Validate app state
      if (appConfig.dataSchema) {
        this.validateAppData(appState, appConfig.dataSchema);
      }

      // Save app data
      const saveResult = await this.saveAppData(projectId, session.appId, appState, isAutoSave);

      // Update session
      session.lastSaved = new Date();
      session.hasUnsavedChanges = false;
      session.appState = { ...appState };

      // Update project metadata
      await this.projectService.updateProject(projectId, {
        settings: {
          last_opened_app: session.appId,
          ...(isAutoSave && { last_auto_save: new Date().toISOString() })
        }
      });

      // Notify listeners
      this.notifyChangeListeners(projectId, 'saved', { isAutoSave });

      console.log(`[ProjectIntegration] ${isAutoSave ? 'Auto-' : ''}Saved project ${projectId} for app ${session.appId}`);
      return saveResult;
    } catch (error) {
      console.error('[ProjectIntegration] Failed to save app project:', error);
      throw error;
    }
  }

  /**
   * Mark project as having unsaved changes
   * @param {string} projectId - Project ID
   */
  markUnsavedChanges(projectId) {
    const session = this.activeProjects.get(projectId);
    if (session) {
      session.hasUnsavedChanges = true;
      this.notifyChangeListeners(projectId, 'unsaved-changes');
    }
  }

  /**
   * Check if project has unsaved changes
   * @param {string} projectId - Project ID
   * @returns {boolean} Whether project has unsaved changes
   */
  hasUnsavedChanges(projectId) {
    const session = this.activeProjects.get(projectId);
    return session ? session.hasUnsavedChanges : false;
  }

  /**
   * Enable auto-save for a project
   * @param {string} projectId - Project ID
   * @param {number} intervalMs - Auto-save interval in milliseconds
   */
  enableAutoSave(projectId, intervalMs = 30000) { // 30 seconds default
    this.disableAutoSave(projectId); // Clear any existing

    const session = this.activeProjects.get(projectId);
    if (!session) return;

    const intervalId = setInterval(async () => {
      if (session.hasUnsavedChanges) {
        try {
          await this.saveAppProject(projectId, session.appState, true);
        } catch (error) {
          console.error('[ProjectIntegration] Auto-save failed:', error);
        }
      }
    }, intervalMs);

    this.autoSaveIntervals.set(projectId, intervalId);
    console.log(`[ProjectIntegration] Enabled auto-save for project ${projectId} (${intervalMs}ms)`);
  }

  /**
   * Disable auto-save for a project
   * @param {string} projectId - Project ID
   */
  disableAutoSave(projectId) {
    const intervalId = this.autoSaveIntervals.get(projectId);
    if (intervalId) {
      clearInterval(intervalId);
      this.autoSaveIntervals.delete(projectId);
      console.log(`[ProjectIntegration] Disabled auto-save for project ${projectId}`);
    }
  }

  /**
   * Close project session
   * @param {string} projectId - Project ID
   * @param {boolean} force - Force close without saving prompt
   */
  async closeProject(projectId, force = false) {
    const session = this.activeProjects.get(projectId);
    if (!session) return;

    // Check for unsaved changes
    if (!force && session.hasUnsavedChanges) {
      const shouldSave = confirm('You have unsaved changes. Save before closing?');
      if (shouldSave) {
        await this.saveAppProject(projectId, session.appState);
      }
    }

    // Clean up
    this.disableAutoSave(projectId);
    this.activeProjects.delete(projectId);
    this.changeListeners.delete(projectId);

    console.log(`[ProjectIntegration] Closed project ${projectId}`);
  }

  /**
   * Add change listener for a project
   * @param {string} projectId - Project ID
   * @param {Function} callback - Change callback
   */
  addChangeListener(projectId, callback) {
    if (!this.changeListeners.has(projectId)) {
      this.changeListeners.set(projectId, []);
    }
    this.changeListeners.get(projectId).push(callback);
  }

  /**
   * Remove change listener
   * @param {string} projectId - Project ID
   * @param {Function} callback - Change callback to remove
   */
  removeChangeListener(projectId, callback) {
    const listeners = this.changeListeners.get(projectId);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Save app-specific data
   * @private
   */
  async saveAppData(projectId, appId, appState, isAutoSave = false) {
    try {
      const { data, error } = await this.supabase.rpc('save_app_project', {
        project_id_param: projectId,
        studio_type_param: appId,
        app_version_param: this.appConfig[appId].version,
        app_data_param: appState,
        compatibility_flags_param: this.generateCompatibilityFlags(appId, appState)
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ProjectIntegration] Failed to save app data:', error);
      throw error;
    }
  }

  /**
   * Load app-specific data
   * @private
   */
  async loadAppData(projectId, appId) {
    try {
      const { data, error } = await this.supabase.rpc('load_app_project', {
        project_id_param: projectId,
        requesting_app: appId
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      return data.app_data || {};
    } catch (error) {
      console.error('[ProjectIntegration] Failed to load app data:', error);
      throw error;
    }
  }

  /**
   * Check app compatibility
   * @private
   */
  async checkAppCompatibility(projectId, targetApp) {
    try {
      const { data, error } = await this.supabase.rpc('validate_app_compatibility', {
        project_id_param: projectId,
        target_app: targetApp
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ProjectIntegration] Failed to check compatibility:', error);
      return { compatible: true, warnings: ['Could not verify compatibility'] };
    }
  }

  /**
   * Generate compatibility flags for app data
   * @private
   */
  generateCompatibilityFlags(appId, appState) {
    // Generate basic compatibility flags - can be extended per app
    const flags = {};

    // Check if app data has features that might not be compatible elsewhere
    if (appState && typeof appState === 'object') {
      // Add compatibility logic based on app-specific requirements
      // For now, assume all apps are compatible with basic warnings
      const compatibleApps = this.getCompatibleApps(appId);
      compatibleApps.forEach(compatibleApp => {
        flags[compatibleApp] = {
          compatible: true,
          warnings: [`Project created in ${appId}, some ${compatibleApp} features may differ`]
        };
      });
    }

    return flags;
  }

  /**
   * Get list of apps compatible with the given app
   * @private
   */
  getCompatibleApps(appId) {
    // Define compatibility matrix
    const compatibilityMatrix = {
      'timeline-editor': ['video-studio', 'cinema-studio', 'edit-studio'],
      'image-studio': ['text-to-image', 'image-to-image'],
      'video-studio': ['timeline-editor', 'cinema-studio', 'video-tools-studio'],
      'audio-studio': ['video-studio', 'timeline-editor', 'cinema-studio'],
      // Add more as needed
    };

    return compatibilityMatrix[appId] || [];
  }

  /**
   * Validate app data against schema
   * @private
   */
  validateAppData(data, schema) {
    // Basic validation - can be extended with proper JSON schema validation
    if (!data || typeof data !== 'object') {
      throw new Error('App data must be a valid object');
    }

    // Add more validation logic as needed
  }

  /**
   * Migrate app data between versions
   * @private
   */
  async migrateAppData(appData, fromVersion, toVersion, appId) {
    const appConfig = this.appConfig?.[appId];
    if (!appConfig?.migrationHandlers) {
      console.warn(`[ProjectIntegration] No migration handlers for ${appId}`);
      return appData;
    }

    // Apply migration handlers
    let migratedData = { ...appData };
    const migrationPath = this.getMigrationPath(fromVersion, toVersion);

    for (const version of migrationPath) {
      const handler = appConfig.migrationHandlers[version];
      if (handler) {
        try {
          migratedData = await handler(migratedData, fromVersion, toVersion);
          console.log(`[ProjectIntegration] Migrated ${appId} data from ${fromVersion} to ${version}`);
        } catch (error) {
          console.error(`[ProjectIntegration] Migration failed for ${appId} ${version}:`, error);
          throw error;
        }
      }
    }

    return migratedData;
  }

  /**
   * Get migration path between versions
   * @private
   */
  getMigrationPath(fromVersion, toVersion) {
    // Simple version comparison - can be enhanced for complex versioning
    const fromParts = fromVersion.split('.').map(Number);
    const toParts = toVersion.split('.').map(Number);

    if (fromParts[0] < toParts[0] || 
        (fromParts[0] === toParts[0] && fromParts[1] < toParts[1])) {
      // Forward migration needed
      return [toVersion];
    }

    return [];
  }

  /**
   * Notify change listeners
   * @private
   */
  notifyChangeListeners(projectId, event, data = {}) {
    const listeners = this.changeListeners.get(projectId);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event, data);
        } catch (error) {
          console.error('[ProjectIntegration] Change listener error:', error);
        }
      });
    }
  }
}

// Export singleton instance
export const projectIntegrationService = new ProjectIntegrationService();
