/**
 * Compatibility shim — redirects legacy src/lib/muapi.js consumers
 * to the canonical packages/studio/src/muapi.js API client.
 *
 * The legacy code uses a class-based pattern:
 *   import { muapi } from '../lib/muapi.js';
 *   muapi.generateImage({ model: 'flux-dev', prompt: '...' })
 *
 * The canonical API uses functional exports with apiKey as first param:
 *   import { generateImage } from 'studio';
 *   generateImage(apiKey, { model: 'flux-dev', prompt: '...' })
 *
 * This shim bridges both patterns. New code should import directly from 'studio'.
 *
 * @deprecated Use `import { generateImage, ... } from 'studio'` instead.
 */

import {
    generateImage as _generateImage,
    generateI2I as _generateI2I,
    generateVideo as _generateVideo,
    generateI2V as _generateI2V,
    processV2V as _processV2V,
    processLipSync as _processLipSync,
    generateAudio as _generateAudio,
    uploadFile as _uploadFile,
    getUserBalance as _getUserBalance,
} from '../../packages/studio/src/muapi.js';

function getApiKey() {
    // Legacy key resolution: window global first, then localStorage
    if (typeof window !== 'undefined') {
        return window.__MUAPI_KEY__ || localStorage.getItem('muapi_key') || '';
    }
    return '';
}

/**
 * Legacy MuapiClient-compatible wrapper.
 * Maps old class-based API to new functional API.
 */
export const muapi = {
    /**
     * Generate an image (text-to-image or image-to-image).
     * @param {Object} params — { model, prompt, aspect_ratio, image_url, ... }
     * @returns {Promise<{ url: string, request_id: string, ... }>}
     */
    async generateImage(params = {}) {
        const apiKey = getApiKey();
        if (params.image_url) {
            return _generateI2I(apiKey, params);
        }
        return _generateImage(apiKey, params);
    },

    /**
     * Generate a video (text-to-video or image-to-video).
     * @param {Object} params
     */
    async generateVideo(params = {}) {
        const apiKey = getApiKey();
        if (params.image_url) {
            return _generateI2V(apiKey, params);
        }
        return _generateVideo(apiKey, params);
    },

    /** Process video-to-video transformations */
    async processV2V(params = {}) {
        return _processV2V(getApiKey(), params);
    },

    /** Process lip sync generation */
    async processLipSync(params = {}) {
        return _processLipSync(getApiKey(), params);
    },

    /** Generate audio/music */
    async generateAudio(params = {}) {
        return _generateAudio(getApiKey(), params);
    },

    /** Upload a file and return hosted URL */
    async uploadFile(file, onProgress) {
        return _uploadFile(getApiKey(), file, onProgress);
    },

    /** Get account balance */
    async getUserBalance() {
        return _getUserBalance(getApiKey());
    },
};

export default muapi;
