import { securityService } from './services/SecurityService.js';

/**
 * Analytics and Event Tracking
 * Lightweight analytics implementation (replace with your preferred analytics service)
 */

// Event types for tracking
const EVENT_TYPES = {
    PAGE_VIEW: 'page_view',
    GENERATION_START: 'generation_start',
    GENERATION_COMPLETE: 'generation_complete',
    GENERATION_ERROR: 'generation_error',
    BUTTON_CLICK: 'button_click',
    SETTINGS_CHANGE: 'settings_change',
    ERROR: 'error'
};

class Analytics {
    constructor() {
        this.enabled = import.meta.env.VITE_ENABLE_ANALYTICS === 'true' && import.meta.env.PROD;
        this.queue = [];
        this.sessionId = this.generateSessionId();
        this.sessionStart = Date.now();
        // Initialize userId asynchronously
        this.initializeUserId();
    }

    async initializeUserId() {
        this.userId = await this.getUserId();
    }

    generateSessionId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    async getUserId() {
        // Use a hash of the API key or generate an anonymous ID
        const key = await securityService.getDecryptedKey();
        if (key) {
            let hash = 0;
            for (let i = 0; i < key.length; i++) {
                hash = ((hash << 5) - hash) + key.charCodeAt(i);
                hash |= 0;
            }
            return `user_${Math.abs(hash).toString(36)}`;
        }
        return `anon_${Math.random().toString(36).substr(2, 9)}`;
    }

    track(eventType, properties = {}) {
        if (!this.enabled) {
            if (import.meta.env.DEV) {
                console.log(`[Analytics] ${eventType}`, properties);
            }
            return;
        }

        const event = {
            type: eventType,
            properties: {
                ...properties,
                url: window.location.pathname,
                referrer: document.referrer,
                userAgent: navigator.userAgent,
                sessionId: this.sessionId,
                userId: this.userId
            },
            timestamp: Date.now()
        };

        // Add to queue for batch sending
        this.queue.push(event);

        // Flush if queue is large
        if (this.queue.length >= 10) {
            this.flush();
        }

        // Development logging
        if (import.meta.env.DEV) {
            console.log(`[Analytics] ${eventType}`, properties);
        }
    }

    // Flush queue to analytics endpoint
    async flush() {
        if (this.queue.length === 0) return;

        const events = [...this.queue];
        this.queue = [];

        try {
            // Replace with your analytics endpoint
            // await fetch('/api/analytics', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ events })
            // });
            
            // For now, just log in development
            if (import.meta.env.DEV) {
                console.log('[Analytics] Flushed events:', events);
            }
        } catch (error) {
            // Re-add events to queue on failure
            this.queue.unshift(...events);
            console.error('[Analytics] Flush failed:', error);
        }
    }

    // Convenience methods
    trackPageView(page) {
        this.track(EVENT_TYPES.PAGE_VIEW, { page });
    }

    trackGeneration(model, type, params = {}) {
        this.track(EVENT_TYPES.GENERATION_START, { model, type, ...params });
    }

    trackGenerationComplete(model, type, duration, success = true) {
        this.track(EVENT_TYPES.GENERATION_COMPLETE, { 
            model, 
            type, 
            duration,
            success 
        });
    }

    trackGenerationError(model, type, error) {
        this.track(EVENT_TYPES.GENERATION_ERROR, { 
            model, 
            type, 
            error: error.message || String(error) 
        });
    }

    trackButtonClick(buttonId, page) {
        this.track(EVENT_TYPES.BUTTON_CLICK, { buttonId, page });
    }

    trackError(errorType, message, context = {}) {
        this.track(EVENT_TYPES.ERROR, { errorType, message, ...context });
    }

    // Session duration tracking
    getSessionDuration() {
        return Date.now() - this.sessionStart;
    }

    // Flush on page unload
    sendBeacon() {
        if (this.queue.length > 0 && navigator.sendBeacon) {
            const data = JSON.stringify({ events: this.queue });
            navigator.sendBeacon('/api/analytics', data);
        }
    }
}

export const analytics = new Analytics();

// Listen for pageview events from router
window.addEventListener('pageview', (e) => {
    analytics.trackPageView(e.detail.page);
});

// Flush on page unload
window.addEventListener('beforeunload', () => {
    analytics.sendBeacon();
});

// Periodic flush every 30 seconds
setInterval(() => analytics.flush(), 30000);

// Export for manual tracking
window.analytics = analytics;
