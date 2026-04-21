/**
 * Hybrid Supabase Client with Offline Synchronization
 * Provides seamless online/offline functionality with automatic data synchronization
 */

import { createClient } from '@supabase/supabase-js';
import { offlineStorage } from './offline-storage.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Connection states
const CONNECTION_STATES = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  RECONNECTING: 'reconnecting'
};

class HybridSupabaseClient {
  constructor() {
    this.connectionState = CONNECTION_STATES.OFFLINE;
    this.supabase = null;
    this.syncQueue = [];
    this.syncInProgress = false;
    this.lastSyncTime = null;

    this.init();
    this.setupNetworkListeners();
    this.setupPeriodicSync();
  }

  async init() {
    // Try to initialize Supabase client
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          },
          global: {
            headers: {
              'X-Client-Info': 'open-higgsfield-ai'
            }
          }
        });

        // Test connection
        const { data, error } = await this.supabase.auth.getSession();
        if (!error) {
          this.connectionState = CONNECTION_STATES.ONLINE;
          console.log('[HybridSupabase] Connected to Supabase');
          this.triggerSync();
        } else {
          throw error;
        }
      } catch (error) {
        console.warn('[HybridSupabase] Failed to connect to Supabase, using offline mode:', error.message);
        this.connectionState = CONNECTION_STATES.OFFLINE;
      }
    } else {
      console.log('[HybridSupabase] Supabase not configured, using offline mode');
      this.connectionState = CONNECTION_STATES.OFFLINE;
    }
  }

  setupNetworkListeners() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('[HybridSupabase] Network online, attempting reconnection');
      this.connectionState = CONNECTION_STATES.RECONNECTING;
      this.attemptReconnection();
    });

    window.addEventListener('offline', () => {
      console.log('[HybridSupabase] Network offline, switching to offline mode');
      this.connectionState = CONNECTION_STATES.OFFLINE;
    });

    // Periodic connectivity check
    setInterval(() => {
      this.checkConnectivity();
    }, 30000); // Check every 30 seconds
  }

  async checkConnectivity() {
    if (!this.supabase) return;

    try {
      const { error } = await this.supabase.auth.getSession();
      if (!error && this.connectionState !== CONNECTION_STATES.ONLINE) {
        console.log('[HybridSupabase] Connectivity restored');
        this.connectionState = CONNECTION_STATES.ONLINE;
        this.triggerSync();
      } else if (error && this.connectionState === CONNECTION_STATES.ONLINE) {
        console.log('[HybridSupabase] Connection lost');
        this.connectionState = CONNECTION_STATES.OFFLINE;
      }
    } catch (error) {
      if (this.connectionState === CONNECTION_STATES.ONLINE) {
        console.log('[HybridSupabase] Connection check failed, switching to offline');
        this.connectionState = CONNECTION_STATES.OFFLINE;
      }
    }
  }

  async attemptReconnection() {
    if (!this.supabase) return;

    try {
      const { error } = await this.supabase.auth.getSession();
      if (!error) {
        this.connectionState = CONNECTION_STATES.ONLINE;
        console.log('[HybridSupabase] Successfully reconnected');
        this.triggerSync();
      } else {
        console.log('[HybridSupabase] Reconnection failed, staying offline');
        this.connectionState = CONNECTION_STATES.OFFLINE;
      }
    } catch (error) {
      console.log('[HybridSupabase] Reconnection attempt failed:', error.message);
      this.connectionState = CONNECTION_STATES.OFFLINE;
    }
  }

  setupPeriodicSync() {
    // Sync every 5 minutes when online
    setInterval(() => {
      if (this.connectionState === CONNECTION_STATES.ONLINE) {
        this.triggerSync();
      }
    }, 5 * 60 * 1000);
  }

  async triggerSync() {
    if (this.syncInProgress || this.connectionState !== CONNECTION_STATES.ONLINE) {
      return;
    }

    this.syncInProgress = true;
    console.log('[HybridSupabase] Starting data synchronization');

    try {
      await this.syncOfflineData();
      this.lastSyncTime = new Date();
      console.log('[HybridSupabase] Data synchronization completed');
    } catch (error) {
      console.error('[HybridSupabase] Data synchronization failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async syncOfflineData() {
    // Get all offline data that needs syncing
    const offlineData = await offlineStorage.exportData();

    // Sync projects
    if (offlineData.projects) {
      for (const project of offlineData.projects) {
        if (!project.synced_at) {
          await this.syncProjectToRemote(project);
        }
      }
    }

    // Sync media
    if (offlineData.media) {
      for (const media of offlineData.media) {
        if (!media.synced_at) {
          await this.syncMediaToRemote(media);
        }
      }
    }

    // Sync generations
    if (offlineData.generations) {
      for (const generation of offlineData.generations) {
        if (!generation.synced_at) {
          await this.syncGenerationToRemote(generation);
        }
      }
    }

    // Download any new remote data
    await this.syncRemoteData();
  }

  async syncProjectToRemote(project) {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .upsert({
          id: project.id,
          user_id: project.user_id,
          name: project.name,
          data: project.data,
          created_at: project.created_at,
          updated_at: project.updated_at
        });

      if (!error) {
        // Mark as synced locally
        project.synced_at = new Date().toISOString();
        await offlineStorage.saveProject(project);
        console.log(`[HybridSupabase] Synced project: ${project.name}`);
      }
    } catch (error) {
      console.error('[HybridSupabase] Failed to sync project:', error);
    }
  }

  async syncMediaToRemote(media) {
    try {
      // First upload the file to Supabase storage
      const file = await this.blobToFile(media.blob, media.name);
      const filePath = `${media.user_id}/${media.id}_${media.name}`;

      const { error: uploadError } = await this.supabase.storage
        .from('media')
        .upload(filePath, file, { upsert: true });

      if (!uploadError) {
        // Then save metadata to database
        const { error: dbError } = await this.supabase
          .from('media')
          .upsert({
            id: media.id,
            user_id: media.user_id,
            project_id: media.project_id,
            name: media.name,
            type: media.type,
            size: media.size,
            path: filePath,
            created_at: media.created_at
          });

        if (!dbError) {
          // Mark as synced locally
          media.synced_at = new Date().toISOString();
          await offlineStorage.saveMedia(media, file);
          console.log(`[HybridSupabase] Synced media: ${media.name}`);
        }
      }
    } catch (error) {
      console.error('[HybridSupabase] Failed to sync media:', error);
    }
  }

  async syncGenerationToRemote(generation) {
    try {
      const { error } = await this.supabase
        .from('generations')
        .upsert({
          id: generation.id,
          user_id: generation.user_id,
          type: generation.type,
          input: generation.input,
          output: generation.output,
          status: generation.status,
          created_at: generation.created_at
        });

      if (!error) {
        // Mark as synced locally
        generation.synced_at = new Date().toISOString();
        await offlineStorage.saveGeneration(generation);
        console.log(`[HybridSupabase] Synced generation: ${generation.id}`);
      }
    } catch (error) {
      console.error('[HybridSupabase] Failed to sync generation:', error);
    }
  }

  async syncRemoteData() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return;

      // Sync remote projects to local
      const { data: remoteProjects, error: projectsError } = await this.supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id);

      if (!projectsError && remoteProjects) {
        for (const project of remoteProjects) {
          const localProject = await offlineStorage.loadProject(project.id);
          if (!localProject || new Date(localProject.updated_at) < new Date(project.updated_at)) {
            project.synced_at = new Date().toISOString();
            await offlineStorage.saveProject(project);
            console.log(`[HybridSupabase] Downloaded project: ${project.name}`);
          }
        }
      }

      // Sync remote media to local
      const { data: remoteMedia, error: mediaError } = await this.supabase
        .from('media')
        .select('*')
        .eq('user_id', user.id);

      if (!mediaError && remoteMedia) {
        for (const media of remoteMedia) {
          const localMedia = await offlineStorage.loadMedia(media.id);
          if (!localMedia) {
            // Download file from storage
            const { data: fileData, error: downloadError } = await this.supabase.storage
              .from('media')
              .download(media.path);

            if (!downloadError && fileData) {
              const file = new File([fileData], media.name, { type: media.type });
              media.synced_at = new Date().toISOString();
              await offlineStorage.saveMedia(media, file);
              console.log(`[HybridSupabase] Downloaded media: ${media.name}`);
            }
          }
        }
      }

      // Sync remote generations to local
      const { data: remoteGenerations, error: generationsError } = await this.supabase
        .from('generations')
        .select('*')
        .eq('user_id', user.id);

      if (!generationsError && remoteGenerations) {
        for (const generation of remoteGenerations) {
          const localGeneration = await offlineStorage.listGenerations(user.id, generation.type);
          const exists = localGeneration.find(g => g.id === generation.id);
          if (!exists) {
            generation.synced_at = new Date().toISOString();
            await offlineStorage.saveGeneration(generation);
            console.log(`[HybridSupabase] Downloaded generation: ${generation.id}`);
          }
        }
      }
    } catch (error) {
      console.error('[HybridSupabase] Failed to sync remote data:', error);
    }
  }

  blobToFile(blob, filename) {
    return new File([blob], filename, { type: blob.type });
  }

  // Database operations - try online first, fallback to offline
  from(table) {
    return {
      select: (columns = '*') => ({
        eq: (column, value) => ({
          single: async () => {
            try {
              if (this.connectionState === CONNECTION_STATES.ONLINE && this.supabase) {
                const { data, error } = await this.supabase
                  .from(table)
                  .select(columns)
                  .eq(column, value)
                  .single();

                if (!error && data) {
                  return { data, error: null };
                }
              }

              // Fallback to offline storage
              return await this.offlineQuery(table, 'select', { [column]: value }, true);
            } catch (error) {
              console.warn(`[HybridSupabase] Online query failed, using offline:`, error.message);
              return await this.offlineQuery(table, 'select', { [column]: value }, true);
            }
          },

          order: (orderColumn, options = {}) => ({
            limit: (count) => ({
              range: async (start, end) => {
                try {
                  if (this.connectionState === CONNECTION_STATES.ONLINE && this.supabase) {
                    const query = this.supabase
                      .from(table)
                      .select(columns)
                      .eq(column, value)
                      .order(orderColumn, options);

                    if (count) query.limit(count);
                    if (start !== undefined && end !== undefined) query.range(start, end);

                    const { data, error } = await query;
                    if (!error && data) {
                      return { data, error: null };
                    }
                  }

                  // Fallback to offline storage
                  return await this.offlineQuery(table, 'select', { [column]: value }, false, { count, start, end });
                } catch (error) {
                  console.warn(`[HybridSupabase] Online query failed, using offline:`, error.message);
                  return await this.offlineQuery(table, 'select', { [column]: value }, false, { count, start, end });
                }
              }
            })
          })
        }),

        order: (orderColumn, options = {}) => ({
          limit: (count) => ({
            single: async () => {
              try {
                if (this.connectionState === CONNECTION_STATES.ONLINE && this.supabase) {
                  const { data, error } = await this.supabase
                    .from(table)
                    .select(columns)
                    .order(orderColumn, options)
                    .limit(count)
                    .single();

                  if (!error && data) {
                    return { data, error: null };
                  }
                }

                // Fallback to offline storage
                return await this.offlineQuery(table, 'select', {}, true, { count });
              } catch (error) {
                console.warn(`[HybridSupabase] Online query failed, using offline:`, error.message);
                return await this.offlineQuery(table, 'select', {}, true, { count });
              }
            },

            range: async (start, end) => {
              try {
                if (this.connectionState === CONNECTION_STATES.ONLINE && this.supabase) {
                  const { data, error } = await this.supabase
                    .from(table)
                    .select(columns)
                    .order(orderColumn, options)
                    .range(start, end);

                  if (!error && data) {
                    return { data, error: null };
                  }
                }

                // Fallback to offline storage
                return await this.offlineQuery(table, 'select', {}, false, { start, end });
              } catch (error) {
                console.warn(`[HybridSupabase] Online query failed, using offline:`, error.message);
                return await this.offlineQuery(table, 'select', {}, false, { start, end });
              }
            }
          })
        })
      }),

      insert: (data) => ({
        select: () => ({
          single: async () => {
            try {
              // Always try online first for inserts
              if (this.connectionState === CONNECTION_STATES.ONLINE && this.supabase) {
                const { data: result, error } = await this.supabase
                  .from(table)
                  .insert(data)
                  .select()
                  .single();

                if (!error && result) {
                  // Also save to offline storage for sync status
                  await this.offlineInsert(table, result);
                  return { data: result, error: null };
                }
              }

              // Fallback to offline storage
              const result = await this.offlineInsert(table, data);
              return { data: result, error: null };
            } catch (error) {
              console.warn(`[HybridSupabase] Online insert failed, using offline:`, error.message);
              const result = await this.offlineInsert(table, data);
              return { data: result, error: null };
            }
          }
        })
      }),

      update: (updates) => ({
        eq: (column, value) => ({
          select: () => ({
            single: async () => {
              try {
                // Always try online first for updates
                if (this.connectionState === CONNECTION_STATES.ONLINE && this.supabase) {
                  const { data, error } = await this.supabase
                    .from(table)
                    .update(updates)
                    .eq(column, value)
                    .select()
                    .single();

                  if (!error && data) {
                    // Also update offline storage
                    await this.offlineUpdate(table, { [column]: value }, updates);
                    return { data, error: null };
                  }
                }

                // Fallback to offline storage
                const result = await this.offlineUpdate(table, { [column]: value }, updates);
                return { data: result, error: null };
              } catch (error) {
                console.warn(`[HybridSupabase] Online update failed, using offline:`, error.message);
                const result = await this.offlineUpdate(table, { [column]: value }, updates);
                return { data: result, error: null };
              }
            }
          })
        })
      }),

      delete: () => ({
        eq: (column, value) => ({
          single: async () => {
            try {
              // Always try online first for deletes
              if (this.connectionState === CONNECTION_STATES.ONLINE && this.supabase) {
                const { error } = await this.supabase
                  .from(table)
                  .delete()
                  .eq(column, value);

                if (!error) {
                  // Also delete from offline storage
                  await this.offlineDelete(table, { [column]: value });
                  return { data: null, error: null };
                }
              }

              // Fallback to offline storage
              await this.offlineDelete(table, { [column]: value });
              return { data: null, error: null };
            } catch (error) {
              console.warn(`[HybridSupabase] Online delete failed, using offline:`, error.message);
              await this.offlineDelete(table, { [column]: value });
              return { data: null, error: null };
            }
          }
        })
      })
    };
  }

  // Offline query implementations
  async offlineQuery(table, operation, conditions, single = false, options = {}) {
    try {
      switch (table) {
        case 'projects':
          if (operation === 'select') {
            if (single && conditions.id) {
              const result = await offlineStorage.loadProject(conditions.id);
              return { data: result, error: null };
            } else {
              const userId = offlineStorage.getCurrentUserId();
              const results = await offlineStorage.listProjects(userId, options.count);
              return { data: single ? results[0] : results, error: null };
            }
          }
          break;

        case 'media':
          if (operation === 'select') {
            if (single && conditions.id) {
              const result = await offlineStorage.loadMedia(conditions.id);
              return { data: result, error: null };
            } else {
              const results = await offlineStorage.listMedia(conditions.project_id, null);
              return { data: single ? results[0] : results, error: null };
            }
          }
          break;

        case 'generations':
          if (operation === 'select') {
            const userId = offlineStorage.getCurrentUserId();
            const results = await offlineStorage.listGenerations(userId, conditions.type, options.count);
            return { data: single ? results[0] : results, error: null };
          }
          break;
      }
      return { data: single ? null : [], error: null };
    } catch (error) {
      return { data: single ? null : [], error };
    }
  }

  async offlineInsert(table, data) {
    switch (table) {
      case 'projects':
        return await offlineStorage.saveProject(data);
      case 'generations':
        return await offlineStorage.saveGeneration(data);
      default:
        return data;
    }
  }

  async offlineUpdate(table, conditions, updates) {
    switch (table) {
      case 'projects':
        const project = await offlineStorage.loadProject(conditions.id);
        if (project) {
          const updated = { ...project, ...updates };
          return await offlineStorage.saveProject(updated);
        }
        break;
    }
    return updates;
  }

  async offlineDelete(table, conditions) {
    switch (table) {
      case 'projects':
        await offlineStorage.deleteProject(conditions.id);
        break;
    }
  }

  // Storage operations - try online first, fallback to offline
  get storage() {
    return {
      from: (bucket) => ({
        upload: async (path, file, options = {}) => {
          try {
            if (this.connectionState === CONNECTION_STATES.ONLINE && this.supabase) {
              const { data, error } = await this.supabase.storage
                .from(bucket)
                .upload(path, file, options);

              if (!error) {
                return { data, error: null };
              }
            }

            // Fallback to offline storage
            const mediaData = {
              id: path.split('/').pop(),
              path,
              name: file.name,
              type: file.type,
              size: file.size,
              bucket,
              user_id: offlineStorage.getCurrentUserId()
            };

            const result = await offlineStorage.saveMedia(mediaData, file);
            return { data: { path: result.id }, error: null };
          } catch (error) {
            console.warn(`[HybridSupabase] Online upload failed, using offline:`, error.message);
            const mediaData = {
              id: path.split('/').pop(),
              path,
              name: file.name,
              type: file.type,
              size: file.size,
              bucket,
              user_id: offlineStorage.getCurrentUserId()
            };

            const result = await offlineStorage.saveMedia(mediaData, file);
            return { data: { path: result.id }, error: null };
          }
        },

        getPublicUrl: (path) => {
          try {
            if (this.connectionState === CONNECTION_STATES.ONLINE && this.supabase) {
              return this.supabase.storage.from(bucket).getPublicUrl(path);
            }

            // Offline fallback
            return {
              data: {
                publicUrl: `blob:offline/${path}`
              }
            };
          } catch (error) {
            console.warn(`[HybridSupabase] Online getPublicUrl failed, using offline:`, error.message);
            return {
              data: {
                publicUrl: `blob:offline/${path}`
              }
            };
          }
        },

        download: async (path) => {
          try {
            if (this.connectionState === CONNECTION_STATES.ONLINE && this.supabase) {
              const { data, error } = await this.supabase.storage
                .from(bucket)
                .download(path);

              if (!error && data) {
                return { data, error: null };
              }
            }

            // Fallback to offline storage
            const media = await offlineStorage.loadMedia(path);
            if (media) {
              return { data: media.blob, error: null };
            }

            return { data: null, error: new Error('File not found') };
          } catch (error) {
            console.warn(`[HybridSupabase] Online download failed, using offline:`, error.message);
            const media = await offlineStorage.loadMedia(path);
            if (media) {
              return { data: media.blob, error: null };
            }

            return { data: null, error: new Error('File not found') };
          }
        }
      })
    };
  }

  // Auth operations - try online first, fallback to offline mock
  get auth() {
    if (this.connectionState === CONNECTION_STATES.ONLINE && this.supabase) {
      return this.supabase.auth;
    }

    // Offline auth mock
    return {
      getSession: async () => ({
        data: {
          session: {
            user: { id: offlineStorage.getCurrentUserId() }
          }
        },
        error: null
      }),

      getUser: async () => ({
        data: {
          user: { id: offlineStorage.getCurrentUserId() }
        },
        error: null
      }),

      onAuthStateChange: (callback) => {
        callback('SIGNED_IN', { user: { id: offlineStorage.getCurrentUserId() } });
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
    };
  }

  // Edge Functions - try online first, fallback to offline processing
  get functions() {
    return {
      invoke: async (functionName, { body }) => {
        try {
          if (this.connectionState === CONNECTION_STATES.ONLINE && this.supabase) {
            const { data, error } = await this.supabase.functions.invoke(functionName, { body });
            if (!error) {
              return { data, error: null };
            }
          }

          // Fallback to offline function processing
          console.log(`[HybridSupabase] Using offline function for: ${functionName}`);
          return await this.processOfflineFunction(functionName, body);
        } catch (error) {
          console.warn(`[HybridSupabase] Online function failed, using offline:`, error.message);
          return await this.processOfflineFunction(functionName, body);
        }
      }
    };
  }

  async processOfflineFunction(functionName, body) {
    // Import offline function processor
    const { processOfflineFunction } = await import('./offline-functions.js');
    return await processOfflineFunction(functionName, body);
  }

  // RPC operations - try online first, fallback to offline
  rpc(functionName, params) {
    return {
      single: async () => {
        try {
          if (this.connectionState === CONNECTION_STATES.ONLINE && this.supabase) {
            const { data, error } = await this.supabase.rpc(functionName, params);
            if (!error) {
              return { data, error: null };
            }
          }

          // Fallback to offline RPC
          console.log(`[HybridSupabase] Using offline RPC for: ${functionName}`);
          return await this.processOfflineRpc(functionName, params);
        } catch (error) {
          console.warn(`[HybridSupabase] Online RPC failed, using offline:`, error.message);
          return await this.processOfflineRpc(functionName, params);
        }
      }
    };
  }

  async processOfflineRpc(functionName, params) {
    // Mock RPC responses for offline mode
    const mockResponses = {
      // Add specific RPC function mocks here as needed
    };

    const mockResponse = mockResponses[functionName];
    if (mockResponse) {
      return { data: mockResponse, error: null };
    }

    return { data: { success: true, function: functionName, params, mock: true }, error: null };
  }

  // Utility methods
  getConnectionState() {
    return this.connectionState;
  }

  isOnline() {
    return this.connectionState === CONNECTION_STATES.ONLINE;
  }

  getLastSyncTime() {
    return this.lastSyncTime;
  }

  forceSync() {
    return this.triggerSync();
  }
}

// Create singleton instance
export const hybridSupabase = new HybridSupabaseClient();

// Export for backward compatibility
export { hybridSupabase as supabase };

// Helper functions
export function isSupabaseConfigured() {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function getSupabaseUrl() {
  return SUPABASE_URL || '';
}

export function getSupabaseAnonKey() {
  return SUPABASE_ANON_KEY || '';
}

export function getUserKey() {
  const { data: { user } } = hybridSupabase.auth.getUser();
  return user?.id || offlineStorage.getCurrentUserId();
}

export async function uploadFileToStorage(file) {
  const userKey = getUserKey();
  const ext = file.name.split('.').pop() || 'bin';
  const uniqueName = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const path = `${userKey}/${uniqueName}`;

  const { data, error } = await hybridSupabase.storage
    .from('uploads')
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = hybridSupabase.storage
    .from('uploads')
    .getPublicUrl(path);

  return urlData.publicUrl;
}