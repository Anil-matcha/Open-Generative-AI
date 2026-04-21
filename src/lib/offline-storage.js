/**
 * Offline Storage Service
 * Replaces Supabase with local IndexedDB-based storage for complete offline functionality
 */

export class OfflineStorageService {
  constructor() {
    this.db = null;
    this.dbName = 'OpenHiggsfieldOfflineDB';
    this.version = 1;
    this.stores = {
      projects: 'projects',
      media: 'media',
      users: 'users',
      settings: 'settings',
      templates: 'templates',
      generations: 'generations',
      cache: 'cache'
    };

    this.initPromise = this.init();
  }

  /**
   * Initialize IndexedDB database
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('[OfflineStorage] Database initialization failed');
        reject(new Error('Failed to initialize offline storage'));
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('[OfflineStorage] Database initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Projects store
        if (!db.objectStoreNames.contains(this.stores.projects)) {
          const projectsStore = db.createObjectStore(this.stores.projects, { keyPath: 'id' });
          projectsStore.createIndex('user_id', 'user_id', { unique: false });
          projectsStore.createIndex('created_at', 'created_at', { unique: false });
          projectsStore.createIndex('updated_at', 'updated_at', { unique: false });
        }

        // Media store
        if (!db.objectStoreNames.contains(this.stores.media)) {
          const mediaStore = db.createObjectStore(this.stores.media, { keyPath: 'id' });
          mediaStore.createIndex('user_id', 'user_id', { unique: false });
          mediaStore.createIndex('project_id', 'project_id', { unique: false });
          mediaStore.createIndex('type', 'type', { unique: false });
          mediaStore.createIndex('created_at', 'created_at', { unique: false });
        }

        // Users store
        if (!db.objectStoreNames.contains(this.stores.users)) {
          const usersStore = db.createObjectStore(this.stores.users, { keyPath: 'id' });
          usersStore.createIndex('email', 'email', { unique: true });
          usersStore.createIndex('created_at', 'created_at', { unique: false });
        }

        // Settings store
        if (!db.objectStoreNames.contains(this.stores.settings)) {
          db.createObjectStore(this.stores.settings, { keyPath: 'key' });
        }

        // Templates store
        if (!db.objectStoreNames.contains(this.stores.templates)) {
          const templatesStore = db.createObjectStore(this.stores.templates, { keyPath: 'id' });
          templatesStore.createIndex('category', 'category', { unique: false });
          templatesStore.createIndex('user_id', 'user_id', { unique: false });
          templatesStore.createIndex('created_at', 'created_at', { unique: false });
        }

        // Generations store (for AI-generated content history)
        if (!db.objectStoreNames.contains(this.stores.generations)) {
          const generationsStore = db.createObjectStore(this.stores.generations, { keyPath: 'id' });
          generationsStore.createIndex('user_id', 'user_id', { unique: false });
          generationsStore.createIndex('type', 'type', { unique: false });
          generationsStore.createIndex('created_at', 'created_at', { unique: false });
          generationsStore.createIndex('status', 'status', { unique: false });
        }

        // Cache store for temporary data
        if (!db.objectStoreNames.contains(this.stores.cache)) {
          const cacheStore = db.createObjectStore(this.stores.cache, { keyPath: 'key' });
          cacheStore.createIndex('expires_at', 'expires_at', { unique: false });
        }
      };
    });
  }

  /**
   * Ensure database is initialized
   */
  async ensureInit() {
    if (!this.initPromise) {
      this.initPromise = this.init();
    }
    await this.initPromise;
  }

  // === PROJECTS ===

  /**
   * Save a project
   */
  async saveProject(project) {
    await this.ensureInit();
    const transaction = this.db.transaction([this.stores.projects], 'readwrite');
    const store = transaction.objectStore(this.stores.projects);

    const projectData = {
      ...project,
      id: project.id || this.generateId(),
      updated_at: new Date().toISOString(),
      created_at: project.created_at || new Date().toISOString(),
      synced_at: project.synced_at || null // Track sync status
    };

    return new Promise((resolve, reject) => {
      const request = store.put(projectData);
      request.onsuccess = () => resolve(projectData);
      request.onerror = () => reject(new Error('Failed to save project'));
    });
  }

  /**
   * Load a project by ID
   */
  async loadProject(projectId) {
    await this.ensureInit();
    const transaction = this.db.transaction([this.stores.projects], 'readonly');
    const store = transaction.objectStore(this.stores.projects);

    return new Promise((resolve, reject) => {
      const request = store.get(projectId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error('Failed to load project'));
    });
  }

  /**
   * List projects for a user
   */
  async listProjects(userId, limit = 50) {
    await this.ensureInit();
    const transaction = this.db.transaction([this.stores.projects], 'readonly');
    const store = transaction.objectStore(this.stores.projects);
    const index = store.index('user_id');

    return new Promise((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.only(userId));
      const results = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          // Sort by updated_at descending
          results.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
          resolve(results);
        }
      };

      request.onerror = () => reject(new Error('Failed to list projects'));
    });
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId) {
    await this.ensureInit();
    const transaction = this.db.transaction([this.stores.projects], 'readwrite');
    const store = transaction.objectStore(this.stores.projects);

    return new Promise((resolve, reject) => {
      const request = store.delete(projectId);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(new Error('Failed to delete project'));
    });
  }

  // === MEDIA ===

  /**
   * Save media file
   */
  async saveMedia(mediaData, file) {
    await this.ensureInit();
    const transaction = this.db.transaction([this.stores.media], 'readwrite');
    const store = transaction.objectStore(this.stores.media);

    const mediaEntry = {
      ...mediaData,
      id: mediaData.id || this.generateId(),
      created_at: new Date().toISOString(),
      file: await this.fileToBase64(file),
      synced_at: mediaData.synced_at || null // Track sync status
    };

    return new Promise((resolve, reject) => {
      const request = store.put(mediaEntry);
      request.onsuccess = () => resolve(mediaEntry);
      request.onerror = () => reject(new Error('Failed to save media'));
    });
  }

  /**
   * Load media by ID
   */
  async loadMedia(mediaId) {
    await this.ensureInit();
    const transaction = this.db.transaction([this.stores.media], 'readonly');
    const store = transaction.objectStore(this.stores.media);

    return new Promise((resolve, reject) => {
      const request = store.get(mediaId);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Convert base64 back to blob
          result.blob = this.base64ToBlob(result.file, result.type);
        }
        resolve(result || null);
      };
      request.onerror = () => reject(new Error('Failed to load media'));
    });
  }

  /**
   * List media for a project
   */
  async listMedia(projectId, type = null) {
    await this.ensureInit();
    const transaction = this.db.transaction([this.stores.media], 'readonly');
    const store = transaction.objectStore(this.stores.media);
    const index = type ? store.index('type') : store.index('project_id');

    return new Promise((resolve, reject) => {
      const range = type ? IDBKeyRange.only(type) : IDBKeyRange.only(projectId);
      const request = index.openCursor(range);
      const results = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const item = cursor.value;
          item.blob = this.base64ToBlob(item.file, item.type);
          results.push(item);
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(new Error('Failed to list media'));
    });
  }

  // === SETTINGS ===

  /**
   * Save setting
   */
  async saveSetting(key, value) {
    await this.ensureInit();
    const transaction = this.db.transaction([this.stores.settings], 'readwrite');
    const store = transaction.objectStore(this.stores.settings);

    return new Promise((resolve, reject) => {
      const request = store.put({ key, value });
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(new Error('Failed to save setting'));
    });
  }

  /**
   * Load setting
   */
  async loadSetting(key) {
    await this.ensureInit();
    const transaction = this.db.transaction([this.stores.settings], 'readonly');
    const store = transaction.objectStore(this.stores.settings);

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(new Error('Failed to load setting'));
    });
  }

  // === GENERATIONS ===

  /**
   * Save generation result
   */
  async saveGeneration(generation) {
    await this.ensureInit();
    const transaction = this.db.transaction([this.stores.generations], 'readwrite');
    const store = transaction.objectStore(this.stores.generations);

    const generationData = {
      ...generation,
      id: generation.id || this.generateId(),
      created_at: new Date().toISOString(),
      status: generation.status || 'completed',
      synced_at: generation.synced_at || null // Track sync status
    };

    return new Promise((resolve, reject) => {
      const request = store.put(generationData);
      request.onsuccess = () => resolve(generationData);
      request.onerror = () => reject(new Error('Failed to save generation'));
    });
  }

  /**
   * List generations for user
   */
  async listGenerations(userId, type = null, limit = 50) {
    await this.ensureInit();
    const transaction = this.db.transaction([this.stores.generations], 'readonly');
    const store = transaction.objectStore(this.stores.generations);
    const index = type ? store.index('type') : store.index('user_id');

    return new Promise((resolve, reject) => {
      const range = type ? IDBKeyRange.only(type) : IDBKeyRange.only(userId);
      const request = index.openCursor(range);
      const results = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          // Sort by created_at descending
          results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          resolve(results);
        }
      };

      request.onerror = () => reject(new Error('Failed to list generations'));
    });
  }

  // === UTILITY METHODS ===

  /**
   * Generate unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Convert file to base64
   */
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Convert base64 to blob
   */
  base64ToBlob(base64, mimeType) {
    const byteString = atob(base64.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeType });
  }

  /**
   * Get current user ID (from localStorage for now)
   */
  getCurrentUserId() {
    return localStorage.getItem('offline_user_id') || 'anonymous';
  }

  /**
   * Export all data for backup
   */
  async exportData() {
    await this.ensureInit();
    const data = {};

    for (const storeName of Object.values(this.stores)) {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      data[storeName] = await new Promise((resolve) => {
        request.onsuccess = () => resolve(request.result);
      });
    }

    return data;
  }

  /**
   * Import data from backup
   */
  async importData(data) {
    await this.ensureInit();

    for (const [storeName, items] of Object.entries(data)) {
      if (!Object.values(this.stores).includes(storeName)) continue;

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      for (const item of items) {
        await new Promise((resolve, reject) => {
          const request = store.put(item);
          request.onsuccess = resolve;
          request.onerror = reject;
        });
      }
    }
  }

  /**
   * Clear all data
   */
  async clearAll() {
    await this.ensureInit();

    for (const storeName of Object.values(this.stores)) {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await new Promise((resolve) => {
        const request = store.clear();
        request.onsuccess = resolve;
      });
    }
  }
}

// Create singleton instance
export const offlineStorage = new OfflineStorageService();