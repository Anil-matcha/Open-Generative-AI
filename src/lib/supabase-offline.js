import { offlineStorage } from './offline-storage.js';

/**
 * Mock Supabase client for offline functionality
 * Provides the same API as Supabase but uses local IndexedDB storage
 */

class MockSupabaseStorage {
  constructor() {
    this.from = (bucket) => ({
      upload: async (path, file, options = {}) => {
        try {
          const mediaData = {
            path,
            name: file.name,
            type: file.type,
            size: file.size,
            bucket,
            uploaded_at: new Date().toISOString()
          };

          const result = await offlineStorage.saveMedia(mediaData, file);
          return { data: { path: result.id }, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },

      getPublicUrl: (path) => {
        // Return a blob URL for offline access
        return {
          data: {
            publicUrl: `blob:offline/${path}`
          }
        };
      },

      download: async (path) => {
        try {
          const media = await offlineStorage.loadMedia(path);
          if (!media) {
            return { data: null, error: new Error('File not found') };
          }
          return { data: media.blob, error: null };
        } catch (error) {
          return { data: null, error };
        }
      }
    });
  }
}

class MockSupabaseAuth {
  constructor() {
    this.currentUser = { id: offlineStorage.getCurrentUserId() };
  }

  async getSession() {
    return {
      data: {
        session: {
          user: this.currentUser
        }
      },
      error: null
    };
  }

  async getUser() {
    return {
      data: {
        user: this.currentUser
      },
      error: null
    };
  }

  onAuthStateChange(callback) {
    // Mock auth state changes
    callback('SIGNED_IN', { user: this.currentUser });
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
}

class MockSupabaseFunctions {
  constructor() {
    this.mockResponses = {
      // Mock AI processing functions
      'videoagent': this.mockVideoAgent.bind(this),
      'frame-agent': this.mockFrameAgent.bind(this),
      'muapi-proxy': this.mockMuApiProxy.bind(this),
      'director-agent': this.mockDirectorAgent.bind(this),
      'rendiv-render': this.mockRendivRender.bind(this),
      'yucut-processor': this.mockYucutProcessor.bind(this)
    };
  }

  async invoke(functionName, { body }) {
    const mockFunction = this.mockResponses[functionName];
    if (mockFunction) {
      return await mockFunction(body);
    }

    // Fallback mock response
    return {
      data: {
        success: true,
        message: `Mock ${functionName} executed`,
        result: { mock: true, function: functionName }
      },
      error: null
    };
  }

  // Mock implementations for different AI functions
  async mockVideoAgent(body) {
    // Simulate video processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockResult = {
      video_url: `blob:offline/generated-video-${Date.now()}.mp4`,
      duration: body.duration || 10,
      status: 'completed',
      mock: true
    };

    // Save to offline storage
    await offlineStorage.saveGeneration({
      type: 'video',
      input: body,
      output: mockResult,
      status: 'completed'
    });

    return { data: mockResult, error: null };
  }

  async mockFrameAgent(body) {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockResult = {
      image_url: `blob:offline/generated-image-${Date.now()}.png`,
      prompt: body.prompt,
      status: 'completed',
      mock: true
    };

    await offlineStorage.saveGeneration({
      type: 'image',
      input: body,
      output: mockResult,
      status: 'completed'
    });

    return { data: mockResult, error: null };
  }

  async mockMuApiProxy(body) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock various AI generation types
    const mockResult = {
      outputs: [`blob:offline/generated-${body.generationType || 'content'}-${Date.now()}`],
      status: 'completed',
      mock: true
    };

    await offlineStorage.saveGeneration({
      type: body.generationType || 'unknown',
      input: body,
      output: mockResult,
      status: 'completed'
    });

    return { data: mockResult, error: null };
  }

  async mockDirectorAgent(body) {
    await new Promise(resolve => setTimeout(resolve, 3000));

    const mockResult = {
      storyboard: {
        scenes: [
          { id: 1, description: 'Scene 1', duration: 5 },
          { id: 2, description: 'Scene 2', duration: 5 }
        ]
      },
      status: 'completed',
      mock: true
    };

    return { data: mockResult, error: null };
  }

  async mockRendivRender(body) {
    await new Promise(resolve => setTimeout(resolve, 4000));

    const mockResult = {
      video_url: `blob:offline/rendiv-video-${Date.now()}.mp4`,
      status: 'completed',
      mock: true
    };

    return { data: mockResult, error: null };
  }

  async mockYucutProcessor(body) {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockResult = {
      scenes: [
        { start: 0, end: 5, description: 'Opening scene' },
        { start: 5, end: 10, description: 'Main content' }
      ],
      status: 'completed',
      mock: true
    };

    return { data: mockResult, error: null };
  }
}

class MockSupabaseClient {
  constructor() {
    this.storage = new MockSupabaseStorage();
    this.auth = new MockSupabaseAuth();
    this.functions = new MockSupabaseFunctions();
  }

  // Mock database operations using offline storage
  from(table) {
    return {
      select: (columns = '*') => ({
        eq: (column, value) => ({
          single: async () => {
            try {
              let result = null;
              switch (table) {
                case 'projects':
                  result = await offlineStorage.loadProject(value);
                  break;
                case 'media':
                  result = await offlineStorage.loadMedia(value);
                  break;
                default:
                  result = null;
              }
              return { data: result, error: null };
            } catch (error) {
              return { data: null, error };
            }
          },
          order: (column, options = {}) => ({
            limit: (count) => ({
              range: async (start, end) => {
                try {
                  let results = [];
                  switch (table) {
                    case 'projects':
                      results = await offlineStorage.listProjects(offlineStorage.getCurrentUserId(), count);
                      break;
                    case 'media':
                      results = await offlineStorage.listMedia(value, null);
                      break;
                    case 'generations':
                      results = await offlineStorage.listGenerations(offlineStorage.getCurrentUserId(), null, count);
                      break;
                    default:
                      results = [];
                  }
                  return { data: results, error: null };
                } catch (error) {
                  return { data: [], error };
                }
              }
            })
          })
        }),
        order: (column, options = {}) => ({
          limit: (count) => ({
            single: async () => {
              try {
                let results = [];
                switch (table) {
                  case 'projects':
                    results = await offlineStorage.listProjects(offlineStorage.getCurrentUserId(), count);
                    break;
                  case 'media':
                    results = await offlineStorage.listMedia(null, null);
                    break;
                  case 'generations':
                    results = await offlineStorage.listGenerations(offlineStorage.getCurrentUserId(), null, count);
                    break;
                  default:
                    results = [];
                }
                return { data: results[0] || null, error: null };
              } catch (error) {
                return { data: null, error };
              }
            },
            range: async (start, end) => {
              try {
                let results = [];
                switch (table) {
                  case 'projects':
                    results = await offlineStorage.listProjects(offlineStorage.getCurrentUserId(), 50);
                    break;
                  case 'media':
                    results = await offlineStorage.listMedia(null, null);
                    break;
                  case 'generations':
                    results = await offlineStorage.listGenerations(offlineStorage.getCurrentUserId(), null, 50);
                    break;
                  default:
                    results = [];
                }
                return { data: results.slice(start, end), error: null };
              } catch (error) {
                return { data: [], error };
              }
            }
          })
        })
      }),

      insert: (data) => ({
        select: () => ({
          single: async () => {
            try {
              let result = null;
              switch (table) {
                case 'projects':
                  result = await offlineStorage.saveProject(data);
                  break;
                case 'media':
                  // For media, we need the file data
                  result = data;
                  break;
                case 'generations':
                  result = await offlineStorage.saveGeneration(data);
                  break;
                default:
                  result = data;
              }
              return { data: result, error: null };
            } catch (error) {
              return { data: null, error };
            }
          }
        })
      }),

      update: (updates) => ({
        eq: (column, value) => ({
          select: () => ({
            single: async () => {
              try {
                let result = null;
                switch (table) {
                  case 'projects':
                    const project = await offlineStorage.loadProject(value);
                    if (project) {
                      result = await offlineStorage.saveProject({ ...project, ...updates });
                    }
                    break;
                  default:
                    result = updates;
                }
                return { data: result, error: null };
              } catch (error) {
                return { data: null, error };
              }
            }
          })
        })
      }),

      delete: () => ({
        eq: (column, value) => ({
          single: async () => {
            try {
              switch (table) {
                case 'projects':
                  await offlineStorage.deleteProject(value);
                  break;
              }
              return { data: null, error: null };
            } catch (error) {
              return { data: null, error };
            }
          }
        })
      })
    };
  }

  rpc(functionName, params) {
    // Mock RPC calls
    return {
      single: async () => {
        const mockResult = { success: true, function: functionName, params };
        return { data: mockResult, error: null };
      }
    };
  }
}

// Create mock client instance
export const supabase = new MockSupabaseClient();

// Export helper functions
export function isSupabaseConfigured() {
  return true; // Always available in offline mode
}

export function getSupabaseUrl() {
  return 'offline://local';
}

export function getSupabaseAnonKey() {
  return 'offline-key';
}

export function getUserKey() {
  return offlineStorage.getCurrentUserId();
}

export async function uploadFileToStorage(file) {
  const mediaData = {
    name: file.name,
    type: file.type,
    size: file.size
  };

  const result = await offlineStorage.saveMedia(mediaData, file);
  return `blob:offline/${result.id}`;
}