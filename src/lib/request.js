/**
 * Enhanced Request Utilities
 * Provides fetch wrapper with retry, timeout, and error handling
 */

import { perfMonitor } from './performance.js';

/**
 * Fetch with timeout
 */
export async function fetchWithTimeout(url, options = {}, timeout = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error(`Request timed out after ${timeout}ms`);
        }
        throw error;
    }
}

/**
 * Fetch with automatic retry for transient failures
 */
export async function fetchWithRetry(url, options = {}, retries = 3, retryDelay = 1000) {
    const startTime = performance.now();
    let lastError;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetchWithTimeout(url, options);
            
            // Don't retry on client errors (4xx)
            if (response.status >= 400 && response.status < 500) {
                return response;
            }
            
            // Retry on server errors (5xx) or network issues
            if (response.status >= 500) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            // Track successful API call
            const duration = performance.now() - startTime;
            perfMonitor.trackApiCall(url, duration, response.status);
            
            return response;
            
        } catch (error) {
            lastError = error;
            
            // Don't retry on abort
            if (error.name === 'AbortError') {
                throw error;
            }
            
            // Don't retry on client errors
            if (error.message?.includes('Client error') || error.message?.includes('Invalid')) {
                throw error;
            }
            
            // Wait before retry with exponential backoff
            if (attempt < retries) {
                const delay = retryDelay * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    // Track failed API call
    const duration = performance.now() - startTime;
    perfMonitor.trackApiCall(url, duration, 0);
    
    throw lastError;
}

/**
 * Parse JSON response with error handling
 */
export async function parseResponse(response) {
    const contentType = response.headers.get('content-type');
    
    if (!contentType?.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON response, got: ${text.slice(0, 100)}`);
    }
    
    const data = await response.json();
    
    // Check for API-level errors
    if (data.error) {
        throw new Error(data.error);
    }
    
    return data;
}

/**
 * Generic GET request
 */
export async function get(url, options = {}) {
    const response = await fetchWithRetry(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    });
    
    if (!response.ok) {
        const error = await response.text().catch(() => response.statusText);
        throw new Error(`GET ${url} failed: ${response.status} ${error}`);
    }
    
    return parseResponse(response);
}

/**
 * Generic POST request
 */
export async function post(url, body, options = {}) {
    const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        body: JSON.stringify(body),
        ...options
    });
    
    if (!response.ok) {
        const error = await response.text().catch(() => response.statusText);
        throw new Error(`POST ${url} failed: ${response.status} ${error}`);
    }
    
    return parseResponse(response);
}

/**
 * Upload file with progress tracking
 */
export async function uploadFile(url, file, onProgress, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
                const percent = (e.loaded / e.total) * 100;
                onProgress(percent);
            }
        });
        
        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    resolve(data);
                } catch {
                    resolve(xhr.responseText);
                }
            } else {
                reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
            }
        });
        
        xhr.addEventListener('error', () => {
            reject(new Error('Upload failed: Network error'));
        });
        
        xhr.addEventListener('abort', () => {
            reject(new Error('Upload aborted'));
        });
        
        xhr.open('POST', url);
        
        // Set headers
        if (options.headers) {
            Object.entries(options.headers).forEach(([key, value]) => {
                xhr.setRequestHeader(key, value);
            });
        }
        
        xhr.send(formData);
    });
}

/**
 * Download file with progress tracking
 */
export async function downloadFile(url, filename, onProgress, options = {}) {
    const response = await fetchWithTimeout(url, {
        method: 'GET',
        ...options
    });
    
    if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
    }
    
    const contentLength = response.headers.get('content-length');
    const total = parseInt(contentLength, 10);
    let loaded = 0;
    
    const reader = response.body.getReader();
    const chunks = [];
    
    while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        loaded += value.length;
        
        if (onProgress && total) {
            onProgress((loaded / total) * 100);
        }
    }
    
    const blob = new Blob(chunks);
    const urlBlob = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = urlBlob;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(urlBlob);
    
    return true;
}
