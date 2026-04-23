/**
 * Structured Logging Utility
 * Provides consistent, configurable logging across the application
 */

// Log levels with numeric values for filtering
const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    FATAL: 4
};

// Current log level (can be configured via environment)
const currentLevel = import.meta.env.VITE_LOG_LEVEL 
    ? LOG_LEVELS[import.meta.env.VITE_LOG_LEVEL.toUpperCase()] ?? LOG_LEVELS.INFO
    : LOG_LEVELS.INFO;

// Log storage for debugging (limited size)
const LOG_STORAGE_KEY = 'app_logs';
const MAX_LOG_ENTRIES = 1000;

// Sensitive keys that should be redacted in logs
const SENSITIVE_KEYS = ['password', 'token', 'key', 'secret', 'api_key', 'apiKey', 'authorization'];

/**
 * Redact sensitive information from objects
 * @param {any} data - Data to redact
 * @returns {any} - Redacted data
 */
function redactSensitive(data) {
    if (typeof data !== 'object' || data === null) {
        return data;
    }
    
    if (Array.isArray(data)) {
        return data.map(item => redactSensitive(item));
    }
    
    const redacted = {};
    for (const [key, value] of Object.entries(data)) {
        if (SENSITIVE_KEYS.some(sensitive => key.toLowerCase().includes(sensitive))) {
            redacted[key] = '[REDACTED]';
        } else if (typeof value === 'object') {
            redacted[key] = redactSensitive(value);
        } else {
            redacted[key] = value;
        }
    }
    return redacted;
}

/**
 * Format log entry for console output
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 * @returns {string} - Formatted log string
 */
function formatLogEntry(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;
    
    if (Object.keys(context).length === 0) {
        return `${prefix} ${message}`;
    }
    
    return `${prefix} ${message} | ${JSON.stringify(redactSensitive(context))}`;
}

/**
 * Store log entry in localStorage for debugging
 * @param {Object} entry - Log entry
 */
function storeLogEntry(entry) {
    try {
        const stored = JSON.parse(localStorage.getItem(LOG_STORAGE_KEY) || '[]');
        stored.push(entry);
        
        // Keep only the last MAX_LOG_ENTRIES
        if (stored.length > MAX_LOG_ENTRIES) {
            stored.splice(0, stored.length - MAX_LOG_ENTRIES);
        }
        
        localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(stored));
    } catch {
        // Silently fail if localStorage is not available
    }
}

/**
 * Create a log entry object
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 * @param {Error} error - Optional error object
 * @returns {Object} - Log entry
 */
function createLogEntry(level, message, context = {}, error = null) {
    return {
        timestamp: new Date().toISOString(),
        level,
        message,
        context: redactSensitive(context),
        error: error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
        } : null,
        url: window.location.href,
        userAgent: navigator.userAgent
    };
}

/**
 * Main logging function
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 * @param {Error} error - Optional error object
 */
function log(level, message, context = {}, error = null) {
    const levelValue = LOG_LEVELS[level] ?? LOG_LEVELS.INFO;
    
    // Skip if below current log level
    if (levelValue < currentLevel) {
        return;
    }
    
    const entry = createLogEntry(level, message, context, error);
    
    // Console output based on level
    const formatted = formatLogEntry(level, message, context);
    
    switch (level) {
        case 'DEBUG':
            break;
        case 'INFO':
            break;
        case 'WARN':
            console.warn(formatted);
            if (error) console.warn(error);
            break;
        case 'ERROR':
        case 'FATAL':
            console.error(formatted);
            if (error) console.error(error);
            break;
        default:
    }
    
    // Store for debugging
    storeLogEntry(entry);
    
    // Send to external service if configured
    if (import.meta.env.VITE_ERROR_TRACKING_DSN && levelValue >= LOG_LEVELS.ERROR) {
        sendToErrorTracking(entry);
    }
}

/**
 * Send error to external tracking service
 * @param {Object} entry - Log entry
 */
async function sendToErrorTracking(entry) {
    try {
        // Implement integration with error tracking service
        // Example: Sentry, LogRocket, etc.
        const dsn = import.meta.env.VITE_ERROR_TRACKING_DSN;
        if (!dsn) return;
        
        // Placeholder for actual implementation
    } catch {
        // Silently fail - don't break the app for logging issues
    }
}

// Exported logger API
export const logger = {
    /**
     * Log debug message
     * @param {string} message - Log message
     * @param {Object} context - Additional context
     */
    debug(message, context = {}) {
        log('DEBUG', message, context);
    },
    
    /**
     * Log info message
     * @param {string} message - Log message
     * @param {Object} context - Additional context
     */
    info(message, context = {}) {
        log('INFO', message, context);
    },
    
    /**
     * Log warning message
     * @param {string} message - Log message
     * @param {Object} context - Additional context
     * @param {Error} error - Optional error
     */
    warn(message, context = {}, error = null) {
        log('WARN', message, context, error);
    },
    
    /**
     * Log error message
     * @param {string} message - Log message
     * @param {Object} context - Additional context
     * @param {Error} error - Optional error
     */
    error(message, context = {}, error = null) {
        log('ERROR', message, context, error);
    },
    
    /**
     * Log fatal error message
     * @param {string} message - Log message
     * @param {Object} context - Additional context
     * @param {Error} error - Optional error
     */
    fatal(message, context = {}, error = null) {
        log('FATAL', message, context, error);
    },
    
    /**
     * Create a scoped logger with preset context
     * @param {string} scope - Scope name
     * @param {Object} defaultContext - Default context for all logs
     * @returns {Object} - Scoped logger
     */
    scope(scope, defaultContext = {}) {
        return {
            debug: (message, ctx = {}) => log('DEBUG', message, { ...defaultContext, scope, ...ctx }),
            info: (message, ctx = {}) => log('INFO', message, { ...defaultContext, scope, ...ctx }),
            warn: (message, ctx = {}, error = null) => log('WARN', message, { ...defaultContext, scope, ...ctx }, error),
            error: (message, ctx = {}, error = null) => log('ERROR', message, { ...defaultContext, scope, ...ctx }, error),
            fatal: (message, ctx = {}, error = null) => log('FATAL', message, { ...defaultContext, scope, ...ctx }, error)
        };
    },
    
    /**
     * Get stored logs for debugging
     * @param {Object} filters - Optional filters
     * @returns {Array} - Log entries
     */
    getLogs(filters = {}) {
        try {
            let logs = JSON.parse(localStorage.getItem(LOG_STORAGE_KEY) || '[]');
            
            if (filters.level) {
                logs = logs.filter(log => log.level === filters.level);
            }
            
            if (filters.since) {
                const since = new Date(filters.since).getTime();
                logs = logs.filter(log => new Date(log.timestamp).getTime() >= since);
            }
            
            return logs;
        } catch {
            return [];
        }
    },
    
    /**
     * Clear stored logs
     */
    clearLogs() {
        try {
            localStorage.removeItem(LOG_STORAGE_KEY);
        } catch {
            // Silently fail
        }
    }
};

export default logger;
