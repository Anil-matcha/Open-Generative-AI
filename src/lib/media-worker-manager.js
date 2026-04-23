// Media Worker Manager
// Provides the same API as the original functions but uses Web Workers for heavy operations

class MediaWorkerManager {
  constructor() {
    this.worker = null;
    this.pendingRequests = new Map();
    this.requestId = 0;
  }

  async initialize() {
    if (this.worker) return;

    // Create worker from blob to avoid path issues
    const workerCode = `
      ${await fetch('./lib/media-worker.js').then(r => r.text())}
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));

    this.worker.onmessage = (e) => {
      const { success, action, fileId, result, error } = e.data;
      const callback = this.pendingRequests.get(fileId);

      if (callback) {
        this.pendingRequests.delete(fileId);
        if (success) {
          callback.resolve(result);
        } else {
          callback.reject(new Error(error));
        }
      }
    };

    this.worker.onerror = (error) => {
      console.error('[MediaWorker] Worker error:', error);
      // Reject all pending requests
      for (const [fileId, callback] of this.pendingRequests) {
        callback.reject(new Error('Worker error'));
      }
      this.pendingRequests.clear();
    };
  }

  async getMediaDuration(file) {
    await this.initialize();
    return new Promise((resolve, reject) => {
      const fileId = ++this.requestId;
      this.pendingRequests.set(fileId, { resolve, reject });
      this.worker.postMessage({ action: 'getMediaDuration', file, fileId });
    });
  }

  async getImageDimensions(file) {
    await this.initialize();
    return new Promise((resolve, reject) => {
      const fileId = ++this.requestId;
      this.pendingRequests.set(fileId, { resolve, reject });
      this.worker.postMessage({ action: 'getImageDimensions', file, fileId });
    });
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.pendingRequests.clear();
    }
  }
}

// Export singleton instance
export const mediaWorker = new MediaWorkerManager();