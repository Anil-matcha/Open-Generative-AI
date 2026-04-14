// Task 5: Media loading performance optimizations
export class MediaLoader {
  constructor() {
    this.cache = new Map();
    this.loadingQueue = [];
    this.maxConcurrentLoads = 3;
    this.activeLoads = 0;
    this.preloadEnabled = true;
    this.qualityLevels = ['thumbnail', 'preview', 'full'];
  }

  // Progressive image loading with blur-up effect
  async loadImage(src, options = {}) {
    const {
      priority = 'normal',
      quality = 'full',
      blur = true,
      onProgress,
      onComplete,
      onError
    } = options;

    // Check cache first
    const cacheKey = `${src}-${quality}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 300000) { // 5 min cache
        onComplete?.(cached.blob);
        return cached.blob;
      }
    }

    // Add to loading queue
    return new Promise((resolve, reject) => {
      const loadRequest = {
        src,
        quality,
        priority,
        resolve,
        reject,
        onProgress,
        onComplete,
        onError,
        startTime: Date.now()
      };

      if (priority === 'high') {
        this.loadingQueue.unshift(loadRequest);
      } else {
        this.loadingQueue.push(loadRequest);
      }

      this.processQueue();
    });
  }

  async processQueue() {
    if (this.activeLoads >= this.maxConcurrentLoads || this.loadingQueue.length === 0) {
      return;
    }

    const request = this.loadingQueue.shift();
    this.activeLoads++;

    try {
      const result = await this.performLoad(request);
      request.resolve(result);
      request.onComplete?.(result);
    } catch (error) {
      request.reject(error);
      request.onError?.(error);
    } finally {
      this.activeLoads--;
      // Process next item in queue
      setTimeout(() => this.processQueue(), 0);
    }
  }

  async performLoad(request) {
    const { src, quality } = request;

    // Create progressive loading with blur placeholder
    if (request.blur && quality !== 'thumbnail') {
      // Load thumbnail first for blur effect
      const thumbnailSrc = this.getThumbnailSrc(src);
      if (thumbnailSrc !== src) {
        await this.loadImage(thumbnailSrc, { quality: 'thumbnail', blur: false });
        request.onProgress?.(0.3); // 30% loaded (thumbnail)
      }
    }

    // Load the actual image
    const response = await fetch(src);
    if (!response.ok) {
      throw new Error(`Failed to load image: ${response.status}`);
    }

    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength) : 0;
    let loaded = 0;

    const reader = response.body.getReader();
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      loaded += value.length;

      if (total > 0 && request.onProgress) {
        request.onProgress(0.3 + (loaded / total) * 0.7); // 30-100%
      }
    }

    const blob = new Blob(chunks);
    const cacheKey = `${src}-${quality}`;

    // Cache the result
    this.cache.set(cacheKey, {
      blob,
      timestamp: Date.now(),
      size: blob.size
    });

    // Clean old cache entries if cache is too large
    this.cleanCache();

    return blob;
  }

  getThumbnailSrc(src) {
    // Generate thumbnail URL (implementation depends on your backend)
    // For example, add query parameter or use different endpoint
    return src.replace(/(\.[^.]+)$/, '_thumb$1');
  }

  // Video progressive loading
  async loadVideo(src, options = {}) {
    const {
      preload = 'metadata',
      quality = 'full',
      onProgress,
      onCanPlay,
      onError
    } = options;

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');

      video.preload = preload;
      video.muted = true; // Required for autoplay in some browsers
      video.playsInline = true;

      video.onloadedmetadata = () => {
        console.log(`[Video] Metadata loaded: ${video.duration}s`);
        onProgress?.(0.2);
      };

      video.oncanplay = () => {
        console.log(`[Video] Can play: ${src}`);
        onCanPlay?.(video);
        onProgress?.(0.5);
        resolve(video);
      };

      video.onprogress = () => {
        if (video.buffered.length > 0) {
          const buffered = video.buffered.end(0);
          const duration = video.duration || 1;
          const progress = buffered / duration;
          onProgress?.(0.5 + progress * 0.5); // 50-100%
        }
      };

      video.onerror = () => {
        const error = new Error(`Failed to load video: ${src}`);
        onError?.(error);
        reject(error);
      };

      video.src = this.getVideoSrc(src, quality);
      video.load();
    });
  }

  getVideoSrc(src, quality) {
    // Return appropriate quality URL
    switch (quality) {
      case 'thumbnail':
        return src.replace(/(\.[^.]+)$/, '_thumb$1');
      case 'preview':
        return src.replace(/(\.[^.]+)$/, '_preview$1');
      default:
        return src;
    }
  }

  // Intelligent preloading based on user behavior
  startPreloading(mediaItems, userContext = {}) {
    if (!this.preloadEnabled) return;

    const { viewport, scrollDirection, userIntent } = userContext;

    // Prioritize visible and near-visible content
    const prioritizedItems = this.prioritizeItems(mediaItems, viewport);

    prioritizedItems.forEach((item, index) => {
      setTimeout(() => {
        if (item.type === 'image') {
          this.loadImage(item.src, {
            priority: index < 3 ? 'high' : 'normal',
            quality: 'preview'
          });
        } else if (item.type === 'video') {
          this.loadVideo(item.src, {
            preload: 'metadata',
            quality: 'thumbnail'
          });
        }
      }, index * 100); // Stagger loads
    });
  }

  prioritizeItems(items, viewport) {
    return items
      .map(item => ({
        ...item,
        priority: this.calculatePriority(item, viewport)
      }))
      .sort((a, b) => b.priority - a.priority);
  }

  calculatePriority(item, viewport) {
    let priority = 0;

    // Distance from viewport center
    if (viewport && item.position) {
      const distance = Math.abs(item.position.y - viewport.centerY);
      priority += Math.max(0, 1000 - distance);
    }

    // Item type priority
    if (item.type === 'image') priority += 100;
    if (item.type === 'video') priority += 50;

    // User interaction history
    if (item.lastViewed) {
      const daysSinceViewed = (Date.now() - item.lastViewed) / (1000 * 60 * 60 * 24);
      priority += Math.max(0, 50 - daysSinceViewed);
    }

    return priority;
  }

  cleanCache() {
    const maxCacheSize = 50 * 1024 * 1024; // 50MB
    let totalSize = 0;

    for (const [key, item] of this.cache) {
      totalSize += item.size;
    }

    if (totalSize > maxCacheSize) {
      // Remove oldest items
      const sortedByAge = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      while (totalSize > maxCacheSize * 0.8 && sortedByAge.length > 0) {
        const [key, item] = sortedByAge.shift();
        totalSize -= item.size;
        this.cache.delete(key);
      }

      console.log(`[Media Cache] Cleaned up ${sortedByAge.length} items`);
    }
  }

  // Get cache statistics
  getCacheStats() {
    let totalSize = 0;
    const items = [];

    for (const [key, item] of this.cache) {
      totalSize += item.size;
      items.push({
        key,
        size: item.size,
        age: Date.now() - item.timestamp
      });
    }

    return {
      totalItems: this.cache.size,
      totalSizeMB: Math.round(totalSize / (1024 * 1024)),
      items: items.sort((a, b) => b.size - a.size).slice(0, 10) // Top 10 largest
    };
  }
}

export const mediaLoader = new MediaLoader();