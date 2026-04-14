// Task 2: Memory leak detection utilities
export class MemoryLeakDetector {
  constructor() {
    this.snapshots = [];
    this.isDetecting = false;
  }

  startDetection(interval = 10000) {
    this.isDetecting = true;
    this.takeSnapshot('baseline');
    
    this.intervalId = setInterval(() => {
      this.takeSnapshot();
      this.analyzeLeaks();
    }, interval);
  }

  stopDetection() {
    this.isDetecting = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  takeSnapshot(label = `snapshot-${Date.now()}`) {
    if (typeof window === 'undefined' || !performance.memory) {
      console.warn('Memory monitoring not available');
      return;
    }

    const snapshot = {
      label,
      timestamp: Date.now(),
      memory: {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      },
      nodes: this.getDOMNodeCount(),
      eventListeners: this.getEventListenerCount()
    };

    this.snapshots.push(snapshot);
    
    // Keep last 20 snapshots
    if (this.snapshots.length > 20) {
      this.snapshots.shift();
    }

    console.log(`[Memory] Snapshot taken: ${label}`, {
      usedMB: Math.round(snapshot.memory.used / 1024 / 1024),
      nodes: snapshot.nodes,
      listeners: snapshot.eventListeners
    });
  }

  getDOMNodeCount() {
    return document.getElementsByTagName('*').length;
  }

  getEventListenerCount() {
    // Estimate event listeners by checking common patterns
    let count = 0;
    
    // Check all elements for event listeners
    const allElements = document.getElementsByTagName('*');
    for (let i = 0; i < Math.min(allElements.length, 1000); i++) {
      const element = allElements[i];
      // This is a rough estimate - in a real implementation you'd need
      // more sophisticated event listener tracking
      if (element.onclick || element.onchange || element.onmouseover) {
        count++;
      }
    }
    
    return count;
  }

  analyzeLeaks() {
    if (this.snapshots.length < 3) return;

    const recent = this.snapshots.slice(-5);
    const baseline = this.snapshots[0];

    // Check for memory growth trend
    const memoryGrowth = recent.map(s => s.memory.used);
    const isGrowing = this.detectGrowthTrend(memoryGrowth);

    // Check for DOM node growth
    const nodeGrowth = recent.map(s => s.nodes);
    const nodesGrowing = this.detectGrowthTrend(nodeGrowth);

    // Check for event listener growth
    const listenerGrowth = recent.map(s => s.eventListeners);
    const listenersGrowing = this.detectGrowthTrend(listenerGrowth);

    if (isGrowing || nodesGrowing || listenersGrowing) {
      console.warn('[Memory Leak Detected]', {
        memoryGrowth: isGrowing,
        nodeGrowth: nodesGrowing,
        listenerGrowth: listenersGrowing,
        recentSnapshots: recent.map(s => ({
          label: s.label,
          usedMB: Math.round(s.memory.used / 1024 / 1024),
          nodes: s.nodes,
          listeners: s.eventListeners
        }))
      });
    }
  }

  detectGrowthTrend(values) {
    if (values.length < 3) return false;

    // Simple trend detection: check if recent values are consistently higher
    const recent = values.slice(-3);
    const first = recent[0];
    const last = recent[recent.length - 1];
    
    // If last value is significantly higher than first (10% threshold)
    return (last - first) / first > 0.1;
  }

  forceGarbageCollection() {
    if (window.gc) {
      window.gc();
      console.log('[Memory] Forced garbage collection');
    } else {
      console.log('[Memory] Garbage collection not available');
    }
  }

  getLeakReport() {
    return {
      snapshots: this.snapshots,
      isDetecting: this.isDetecting,
      recommendations: this.generateRecommendations()
    };
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.snapshots.length > 0) {
      const latest = this.snapshots[this.snapshots.length - 1];
      const usagePercent = (latest.memory.used / latest.memory.limit) * 100;
      
      if (usagePercent > 80) {
        recommendations.push('High memory usage detected. Consider optimizing large data structures.');
      }
      
      if (latest.nodes > 10000) {
        recommendations.push('High DOM node count. Consider using virtualization for large lists.');
      }
    }

    return recommendations;
  }
}

export const memoryLeakDetector = new MemoryLeakDetector();