/**
 * Performance Utilities
 * Provides debounce, throttle, and other performance optimization functions
 */

/**
 * Debounce function - delays execution until after wait ms have elapsed
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in milliseconds
 * @param {Object} options - Options
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait, options = {}) {
    const { leading = false, trailing = true, maxWait = null } = options;
    
    let timeoutId = null;
    let maxTimeoutId = null;
    let lastArgs = null;
    let lastThis = null;
    let lastCallTime = null;
    let result = null;
    
    const invokeFunc = (time) => {
        const args = lastArgs;
        const thisArg = lastThis;
        
        lastArgs = null;
        lastThis = null;
        lastCallTime = time;
        result = func.apply(thisArg, args);
        return result;
    };
    
    const startTimer = (pendingFunc, wait) => {
        return setTimeout(pendingFunc, wait);
    };
    
    const cancelTimer = (id) => {
        if (id) {
            clearTimeout(id);
        }
    };
    
    const leadingEdge = (time) => {
        lastCallTime = time;
        timeoutId = startTimer(timerExpired, wait);
        return leading ? invokeFunc(time) : result;
    };
    
    const remainingWait = (time) => {
        const timeSinceLastCall = time - lastCallTime;
        const timeWaiting = wait - timeSinceLastCall;
        return maxWait ? Math.min(timeWaiting, maxWait - timeSinceLastCall) : timeWaiting;
    };
    
    const shouldInvoke = (time) => {
        const timeSinceLastCall = time - lastCallTime;
        return lastCallTime === null || timeSinceLastCall >= wait || timeSinceLastCall < 0;
    };
    
    const timerExpired = () => {
        const time = Date.now();
        if (shouldInvoke(time)) {
            return trailingEdge(time);
        }
        timeoutId = startTimer(timerExpired, remainingWait(time));
        return result;
    };
    
    const trailingEdge = (time) => {
        timeoutId = null;
        if (maxTimeoutId) {
            cancelTimer(maxTimeoutId);
            maxTimeoutId = null;
        }
        if (trailing && lastArgs) {
            return invokeFunc(time);
        }
        lastArgs = null;
        lastThis = null;
        return result;
    };
    
    const cancel = () => {
        if (timeoutId !== null) {
            cancelTimer(timeoutId);
        }
        if (maxTimeoutId !== null) {
            cancelTimer(maxTimeoutId);
        }
        lastCallTime = null;
        lastArgs = null;
        lastThis = null;
        timeoutId = null;
        maxTimeoutId = null;
    };
    
    const flush = () => {
        if (timeoutId === null) {
            return result;
        }
        return trailingEdge(Date.now());
    };
    
    const pending = () => {
        return timeoutId !== null;
    };
    
    const debounced = function(...args) {
        const time = Date.now();
        const isInvoking = shouldInvoke(time);
        
        lastArgs = args;
        lastThis = this;
        
        if (isInvoking && timeoutId === null) {
            return leadingEdge(time);
        }
        
        if (maxWait !== null && maxTimeoutId === null) {
            maxTimeoutId = startTimer(() => {
                if (trailing && lastArgs) {
                    invokeFunc(Date.now());
                }
                cancel();
            }, maxWait);
        }
        
        if (timeoutId === null) {
            timeoutId = startTimer(timerExpired, wait);
        }
        
        return result;
    };
    
    debounced.cancel = cancel;
    debounced.flush = flush;
    debounced.pending = pending;
    
    return debounced;
}

/**
 * Throttle function - limits execution rate
 * @param {Function} func - Function to throttle
 * @param {number} wait - Minimum time between calls in milliseconds
 * @param {Object} options - Options
 * @returns {Function} - Throttled function
 */
export function throttle(func, wait, options = {}) {
    const { leading = true, trailing = true } = options;
    return debounce(func, wait, { leading, trailing, maxWait: wait });
}

/**
 * Request animation frame throttle for smooth animations
 * @param {Function} func - Function to throttle
 * @returns {Function} - RAF-throttled function
 */
export function rafThrottle(func) {
    let rafId = null;
    let lastArgs = null;
    
    const throttled = function(...args) {
        lastArgs = args;
        
        if (rafId === null) {
            rafId = requestAnimationFrame(() => {
                func.apply(this, lastArgs);
                rafId = null;
                lastArgs = null;
            });
        }
    };
    
    throttled.cancel = () => {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
            lastArgs = null;
        }
    };
    
    return throttled;
}

/**
 * Memoize function results
 * @param {Function} func - Function to memoize
 * @param {Function} resolver - Optional cache key resolver
 * @returns {Function} - Memoized function
 */
export function memoize(func, resolver = null) {
    const cache = new Map();
    
    const memoized = function(...args) {
        const key = resolver ? resolver(...args) : JSON.stringify(args);
        
        if (cache.has(key)) {
            return cache.get(key);
        }
        
        const result = func.apply(this, args);
        cache.set(key, result);
        return result;
    };
    
    memoized.cache = cache;
    memoized.clear = () => cache.clear();
    
    return memoized;
}

/**
 * Batch function calls
 * @param {Function} func - Function to batch
 * @param {number} wait - Batch window in milliseconds
 * @returns {Function} - Batched function
 */
export function batch(func, wait = 0) {
    let batched = [];
    let timeoutId = null;
    
    const flush = () => {
        if (batched.length > 0) {
            const items = batched.slice();
            batched = [];
            func(items);
        }
    };
    
    const batchedFn = function(item) {
        batched.push(item);
        
        if (timeoutId === null) {
            timeoutId = setTimeout(() => {
                flush();
                timeoutId = null;
            }, wait);
        }
    };
    
    batchedFn.flush = flush;
    batchedFn.cancel = () => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        batched = [];
    };
    
    return batchedFn;
}

/**
 * Lazy initialization wrapper
 * @param {Function} initializer - Initialization function
 * @returns {Function} - Lazy initializer
 */
export function lazy(initializer) {
    let value = null;
    let initialized = false;
    
    return function() {
        if (!initialized) {
            value = initializer();
            initialized = true;
        }
        return value;
    };
}

/**
 * Create a simple cache with TTL
 * @param {number} ttl - Time to live in milliseconds
 * @returns {Object} - Cache object
 */
export function createCache(ttl = 60000) {
    const cache = new Map();
    
    return {
        get(key) {
            const item = cache.get(key);
            if (!item) return null;
            
            if (Date.now() > item.expiry) {
                cache.delete(key);
                return null;
            }
            
            return item.value;
        },
        
        set(key, value) {
            cache.set(key, {
                value,
                expiry: Date.now() + ttl
            });
        },
        
        has(key) {
            return this.get(key) !== null;
        },
        
        delete(key) {
            cache.delete(key);
        },
        
        clear() {
            cache.clear();
        },
        
        size() {
            return cache.size;
        }
    };
}

/**
 * Performance Monitoring Utilities
 * Track metrics for user experience optimization
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            pageLoads: [],
            apiCalls: [],
            errors: []
        };
        this.isEnabled = import.meta.env.PROD;
    }

    // Track page load performance
    trackPageLoad(pageName, duration) {
        if (!this.isEnabled) return;
        
        this.metrics.pageLoads.push({
            page: pageName,
            duration,
            timestamp: Date.now()
        });

        // Keep last 50 records
        if (this.metrics.pageLoads.length > 50) {
            this.metrics.pageLoads.shift();
        }

        // Log in development
        if (import.meta.env.DEV) {
        }
    }

    // Track API call performance
    trackApiCall(endpoint, duration, success = true) {
        if (!this.isEnabled) return;
        
        this.metrics.apiCalls.push({
            endpoint,
            duration,
            success,
            timestamp: Date.now()
        });

        // Keep last 100 records
        if (this.metrics.apiCalls.length > 100) {
            this.metrics.apiCalls.shift();
        }

        // Log slow API calls
        if (duration > 3000) {
            console.warn(`[Performance] Slow API call to "${endpoint}": ${duration.toFixed(2)}ms`);
        }
    }

    // Track errors
    trackError(type, message, context = {}) {
        this.metrics.errors.push({
            type,
            message,
            context,
            timestamp: Date.now()
        });

        // Keep last 100 records
        if (this.metrics.errors.length > 100) {
            this.metrics.errors.shift();
        }

        // Log errors
        console.error(`[Performance] Error [${type}]:`, message, context);
    }

    // Track custom metrics
    trackMetric(name, value, metadata = {}) {
        if (!this.isEnabled) return;

        const metric = {
            name,
            value,
            metadata,
            timestamp: Date.now()
        };

        // Store in metrics (create array if doesn't exist)
        if (!this.metrics.custom) {
            this.metrics.custom = [];
        }

        this.metrics.custom.push(metric);

        // Keep last 200 custom metrics
        if (this.metrics.custom.length > 200) {
            this.metrics.custom.shift();
        }

        // Log in development
        if (import.meta.env.DEV) {
        }
    }

    // Track custom events
    trackEvent(name, metadata = {}) {
        if (!this.isEnabled) return;

        const event = {
            name,
            metadata,
            timestamp: Date.now()
        };

        // Store in metrics (create array if doesn't exist)
        if (!this.metrics.events) {
            this.metrics.events = [];
        }

        this.metrics.events.push(event);

        // Keep last 200 events
        if (this.metrics.events.length > 200) {
            this.metrics.events.shift();
        }

        // Log in development
        if (import.meta.env.DEV) {
        }
    }

    // Get metrics summary
    getSummary() {
        const pageLoads = this.metrics.pageLoads;
        const apiCalls = this.metrics.apiCalls;
        const errors = this.metrics.errors;

        return {
            pageLoads: {
                count: pageLoads.length,
                avgDuration: pageLoads.length > 0
                    ? pageLoads.reduce((sum, p) => sum + p.duration, 0) / pageLoads.length
                    : 0
            },
            apiCalls: {
                count: apiCalls.length,
                avgDuration: apiCalls.length > 0
                    ? apiCalls.reduce((sum, a) => sum + a.duration, 0) / apiCalls.length
                    : 0,
                successRate: apiCalls.length > 0
                    ? apiCalls.filter(a => a.success).length / apiCalls.length * 100
                    : 100
            },
            errors: {
                count: errors.length,
                byType: errors.reduce((acc, e) => {
                    acc[e.type] = (acc[e.type] || 0) + 1;
                    return acc;
                }, {})
            }
        };
    }

    // Clear all metrics
    clear() {
        this.metrics = {
            pageLoads: [],
            apiCalls: [],
            errors: []
        };
    }
}

// Export singleton instance
export const perfMonitor = new PerformanceMonitor();

export default {
    debounce,
    throttle,
    rafThrottle,
    memoize,
    batch,
    lazy,
    createCache,
    perfMonitor
};
