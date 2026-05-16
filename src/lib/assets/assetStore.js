import { ASSET_TYPES, ASSET_STATUS } from './assetSchema.js';

const STORAGE_KEYS = {
  ASSETS: 'universal_assets',
  METADATA: 'universal_assets_meta'
};

const defaultStorage = {
  getItem: (key) => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key, value) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  }
};

export class AssetStore {
  constructor(options = {}) {
    this.storage = options.storage || defaultStorage;
    this.db = null;
    this.useIndexedDB = options.useIndexedDB || false;
    this.subscribers = new Set();
  }

  async init() {
    if (this.useIndexedDB && typeof window !== 'undefined' && window.indexedDB) {
      await this.initIndexedDB();
    }
  }

  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('UniversalAssetStore', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const store = db.createObjectStore('assets', { keyPath: 'id' });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('sourceApp', 'sourceApp', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      };
    });
  }

  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async saveAsset(asset) {
    try {
      if (!asset || typeof asset !== 'object') {
        throw new Error('Invalid asset: asset must be an object');
      }

      asset.updatedAt = new Date().toISOString();
      
      if (!asset.id) {
        asset.id = this.generateId();
      }
      
      if (!asset.createdAt) {
        asset.createdAt = asset.updatedAt;
      }

      if (this.db) {
        return new Promise((resolve, reject) => {
          const transaction = this.db.transaction(['assets'], 'readwrite');
          const store = transaction.objectStore('assets');
          const request = store.put(asset);
          request.onsuccess = () => resolve(asset);
          request.onerror = () => reject(request.error);
        });
      } else {
        const assets = this.getAllAssetsSync();
        assets[asset.id] = asset;
        this.storage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
        return asset;
      }
    } catch (error) {
      console.error('Failed to save asset:', error);
      throw error;
    }
  }

  async updateAsset(id, updates) {
    try {
      const asset = await this.getAsset(id);
      if (!asset) return null;
      
      const updated = { ...asset, ...updates, updatedAt: new Date().toISOString() };
      return this.saveAsset(updated);
    } catch (error) {
      console.error('Failed to update asset:', error);
      throw error;
    }
  }

  async deleteAsset(id) {
    try {
      if (this.db) {
        return new Promise((resolve, reject) => {
          const transaction = this.db.transaction(['assets'], 'readwrite');
          const store = transaction.objectStore('assets');
          const request = store.delete(id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      } else {
        const assets = this.getAllAssetsSync();
        delete assets[id];
        this.storage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
      }
      
      this._notify('asset:deleted', { id });
    } catch (error) {
      console.error('Failed to delete asset:', error);
      throw error;
    }
  }

  async getAsset(id) {
    try {
      if (this.db) {
        return new Promise((resolve) => {
          const transaction = this.db.transaction(['assets'], 'readonly');
          const store = transaction.objectStore('assets');
          const request = store.get(id);
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => resolve(null);
        });
      } else {
        const assets = this.getAllAssetsSync();
        return assets[id] || null;
      }
    } catch (error) {
      console.error('Failed to get asset:', error);
      return null;
    }
  }

  async getAssets(filters = {}) {
    try {
      let assets = Object.values(this.getAllAssetsSync());
      
      if (filters.type) {
        assets = assets.filter(a => a.type === filters.type);
      }
      if (filters.sourceApp) {
        assets = assets.filter(a => a.sourceApp === filters.sourceApp);
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        assets = assets.filter(a => 
          a.title?.toLowerCase().includes(searchLower) ||
          a.metadata?.prompt?.toLowerCase().includes(searchLower) ||
          a.sourceApp?.toLowerCase().includes(searchLower)
        );
      }
      
      return assets.sort((a, b) => 
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
    } catch (error) {
      console.error('Failed to get assets:', error);
      return [];
    }
  }

  getAllAssetsSync() {
    try {
      const data = this.storage.getItem(STORAGE_KEYS.ASSETS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to parse assets from storage:', error);
      return {};
    }
  }

  clearAll() {
    try {
      this.storage.removeItem(STORAGE_KEYS.ASSETS);
      this.storage.removeItem(STORAGE_KEYS.METADATA);
      this._notify('assets:cleared', {});
    } catch (error) {
      console.error('Failed to clear assets:', error);
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  _notify(event, data) {
    this.subscribers.forEach(cb => cb(event, data));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(event, { detail: data }));
    }
  }
}

export const assetStore = new AssetStore();