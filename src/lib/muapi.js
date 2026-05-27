import { getModelById, getVideoModelById, getI2IModelById, getI2VModelById, getV2VModelById, getLipSyncModelById } from './models.js';

export class MuapiClient {
    constructor() {
        // Ideally user provides this in settings
        this.baseUrl = import.meta.env.DEV ? '' : 'https://api.muapi.ai';
    }

    getKey() {
        const key = window.__MUAPI_KEY__ || localStorage.getItem('muapi_key');
        if (!key) throw new Error('API Key missing. Please set it in Settings.');
        return key;
    }

    /**
     * Generates an image (Text-to-Image or Image-to-Image)
     * @param {Object} params
     * @param {string} params.model
     * @param {string} params.prompt
     * @param {string} params.negative_prompt
     * @param {string} params.aspect_ratio
     * @param {number} params.steps
     * @param {number} params.guidance_scale
     * @param {number} params.seed
     * @param {string} [params.image_url] - If present, treats as Image-to-Image
     */
    async generateImage(params) {
        const key = this.getKey();

        // Resolve endpoint from model definition
        const modelInfo = getModelById(params.model);
        const endpoint = modelInfo?.endpoint || params.model;
        const url = `${this.baseUrl}/api/v1/${endpoint}`;

        // Build payload matching the API's expected format
        const finalPayload = {
            prompt: params.prompt,
        };

        // Aspect ratio (send as string, the API handles it)
        if (params.aspect_ratio) {
            finalPayload.aspect_ratio = params.aspect_ratio;
        }

        // Resolution
        if (params.resolution) {
            finalPayload.resolution = params.resolution;
        }

        // Quality (used by seedream and similar models)
        if (params.quality) {
            finalPayload.quality = params.quality;
        }

        // Image-to-Image
        if (params.image_url) {
            finalPayload.image_url = params.image_url;
            finalPayload.strength = params.strength || 0.6;
        } else {
            finalPayload.image_url = null;
        }

        // Optional params if supported by model
        if (params.seed && params.seed !== -1) {
            finalPayload.seed = params.seed;
        }

        console.log('[Muapi] Requesting:', url);
        console.log('[Muapi] Payload:', finalPayload);

        try {
            // Step 1: Submit the task
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': key
                },
                body: JSON.stringify(finalPayload)
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error('[Muapi] API Error Body:', errText);
                throw new Error(`API Request Failed: ${response.status} ${response.statusText} - ${errText.slice(0, 100)}`);
            }

            const submitData = await response.json();
            console.log('[Muapi] Submit Response:', submitData);

            // Extract request_id for polling
            const requestId = submitData.request_id || submitData.id;
            if (!requestId) {
                // Some endpoints return the result directly
                return submitData;
            }

            // Notify caller of requestId so they can persist it before polling begins
            if (params.onRequestId) params.onRequestId(requestId);

            // Step 2: Poll for results
            console.log('[Muapi] Polling for results, request_id:', requestId);
            const result = await this.pollForResult(requestId, key);

            // Normalize: extract image URL from outputs array
            const imageUrl = result.outputs?.[0] || result.url || result.output?.url;
            console.log('[Muapi] Image URL:', imageUrl);
            return { ...result, url: imageUrl };

        } catch (error) {
            console.error("Muapi Client Error:", error);
            throw error;
        }
    }

    /**
     * Polls the predictions endpoint until the result is ready.
     * @param {string} requestId - The request ID from the submit response
     * @param {string} key - The API key
     * @param {number} maxAttempts - Maximum polling attempts (default 60 = ~2 min)
     * @param {number} interval - Polling interval in ms (default 2000)
     */
    async pollForResult(requestId, key, maxAttempts = 60, interval = 2000) {
        const pollUrl = `${this.baseUrl}/api/v1/predictions/${requestId}/result`;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, interval));

            console.log(`[Muapi] Polling attempt ${attempt}/${maxAttempts}...`);

            try {
                const response = await fetch(pollUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': key
                    }
                });

                if (!response.ok) {
                    const errText = await response.text();
                    console.warn(`[Muapi] Poll error (${response.status}):`, errText);
                    // Continue polling on non-fatal errors
                    if (response.status >= 500) continue;
                    throw new Error(`Poll Failed: ${response.status} - ${errText.slice(0, 100)}`);
                }

                const data = await response.json();
                console.log('[Muapi] Poll Response:', data);

                const status = data.status?.toLowerCase();

                if (status === 'completed' || status === 'succeeded' || status === 'success') {
                    return data;
                }

                if (status === 'failed' || status === 'error') {
                    throw new Error(`Generation failed: ${data.error || 'Unknown error'}`);
                }

                // Otherwise (processing, pending, etc.) keep polling
            } catch (error) {
                if (attempt === maxAttempts) throw error;
                console.warn('[Muapi] Poll attempt failed, retrying...', error.message);
            }
        }

        throw new Error('Generation timed out after polling.');
    }

    async generateVideo(params) {
        const key = this.getKey();

        const modelInfo = getVideoModelById(params.model);
        const endpoint = modelInfo?.endpoint || params.model;
        const url = `${this.baseUrl}/api/v1/${endpoint}`;

        const finalPayload = {};

        if (params.prompt) finalPayload.prompt = params.prompt;
        if (params.request_id) finalPayload.request_id = params.request_id;
        if (params.aspect_ratio) finalPayload.aspect_ratio = params.aspect_ratio;
        if (params.duration) finalPayload.duration = params.duration;
        if (params.resolution) finalPayload.resolution = params.resolution;
        if (params.quality) finalPayload.quality = params.quality;
        if (params.mode) finalPayload.mode = params.mode;
        if (params.image_url) finalPayload.image_url = params.image_url;

        console.log('[Muapi] Video Request:', url);
        console.log('[Muapi] Video Payload:', finalPayload);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': key
                },
                body: JSON.stringify(finalPayload)
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error('[Muapi] API Error Body:', errText);
                throw new Error(`API Request Failed: ${response.status} ${response.statusText} - ${errText.slice(0, 100)}`);
            }

            const submitData = await response.json();
            console.log('[Muapi] Video Submit Response:', submitData);

            const requestId = submitData.request_id || submitData.id;
            if (!requestId) return submitData;

            if (params.onRequestId) params.onRequestId(requestId);

            console.log('[Muapi] Polling for video results, request_id:', requestId);
            const result = await this.pollForResult(requestId, key, 900, 2000);

            const videoUrl = result.outputs?.[0] || result.url || result.output?.url;
            console.log('[Muapi] Video URL:', videoUrl);
            return { ...result, url: videoUrl };

        } catch (error) {
            console.error("Muapi Video Client Error:", error);
            throw error;
        }
    }

    /**
     * Generates an image using an Image-to-Image model.
     * The model's imageField determines which payload key receives the uploaded image URL.
     * @param {Object} params
     * @param {string} params.model - i2iModel id
     * @param {string} params.image_url - The uploaded reference image URL
     * @param {string} [params.prompt] - Optional text prompt
     * @param {string} [params.aspect_ratio]
     * @param {string} [params.resolution]
     */
    async generateI2I(params) {
        const key = this.getKey();
        const modelInfo = getI2IModelById(params.model);
        const endpoint = modelInfo?.endpoint || params.model;
        const url = `${this.baseUrl}/api/v1/${endpoint}`;

        const finalPayload = {};

        // Only include prompt if the model supports it and one was provided
        finalPayload.prompt = params.prompt || '';

        // Place the uploaded image(s) in the correct field for this model
        const imageField = modelInfo?.imageField || 'image_url';
        const imagesList = params.images_list?.length > 0 ? params.images_list : (params.image_url ? [params.image_url] : null);
        if (imagesList) {
            if (imageField === 'images_list') {
                finalPayload.images_list = imagesList;
            } else {
                finalPayload[imageField] = imagesList[0];
            }
        }

        if (params.aspect_ratio) finalPayload.aspect_ratio = params.aspect_ratio;
        if (params.resolution) finalPayload.resolution = params.resolution;
        if (params.quality) finalPayload.quality = params.quality;

        console.log('[Muapi] I2I Request:', url);
        console.log('[Muapi] I2I Payload:', finalPayload);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': key },
                body: JSON.stringify(finalPayload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`API Request Failed: ${response.status} ${response.statusText} - ${errText.slice(0, 100)}`);
            }

            const submitData = await response.json();
            console.log('[Muapi] I2I Submit Response:', submitData);

            const requestId = submitData.request_id || submitData.id;
            if (!requestId) return submitData;

            if (params.onRequestId) params.onRequestId(requestId);

            const result = await this.pollForResult(requestId, key);
            const imageUrl = result.outputs?.[0] || result.url || result.output?.url;
            console.log('[Muapi] I2I Result URL:', imageUrl);
            return { ...result, url: imageUrl };
        } catch (error) {
            console.error('Muapi I2I Error:', error);
            throw error;
        }
    }

    /**
     * Generates a video using an Image-to-Video model.
     * @param {Object} params
     * @param {string} params.model - i2vModel id
     * @param {string} params.image_url - The uploaded start frame image URL
     * @param {string} [params.prompt]
     * @param {string} [params.aspect_ratio]
     * @param {string} [params.resolution]
     * @param {number} [params.duration]
     * @param {string} [params.quality]
     */
    async generateI2V(params) {
        const key = this.getKey();
        const modelInfo = getI2VModelById(params.model);
        const endpoint = modelInfo?.endpoint || params.model;
        const url = `${this.baseUrl}/api/v1/${endpoint}`;

        const finalPayload = {};

        if (params.prompt) finalPayload.prompt = params.prompt;

        // Place image in the correct field for this model
        const imageField = modelInfo?.imageField || 'image_url';
        if (params.image_url) {
            if (imageField === 'images_list') {
                finalPayload.images_list = [params.image_url];
            } else {
                finalPayload[imageField] = params.image_url;
            }
        }

        // Optional end-frame image — only for models declaring lastImageField.
        // Server-side param name varies (last_image vs end_image_url).
        const lastImageField = modelInfo?.lastImageField;
        if (lastImageField && params.last_image) {
            finalPayload[lastImageField] = params.last_image;
        }

        if (params.aspect_ratio) finalPayload.aspect_ratio = params.aspect_ratio;
        if (params.duration) finalPayload.duration = params.duration;
        if (params.resolution) finalPayload.resolution = params.resolution;
        if (params.quality) finalPayload.quality = params.quality;
        if (params.mode) finalPayload.mode = params.mode;
        if (params.name) finalPayload.name = params.name;

        console.log('[Muapi] I2V Request:', url);
        console.log('[Muapi] I2V Payload:', finalPayload);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': key },
                body: JSON.stringify(finalPayload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`API Request Failed: ${response.status} ${response.statusText} - ${errText.slice(0, 100)}`);
            }

            const submitData = await response.json();
            console.log('[Muapi] I2V Submit Response:', submitData);

            const requestId = submitData.request_id || submitData.id;
            if (!requestId) return submitData;

            if (params.onRequestId) params.onRequestId(requestId);

            const result = await this.pollForResult(requestId, key, 900, 2000);
            const videoUrl = result.outputs?.[0] || result.url || result.output?.url;
            console.log('[Muapi] I2V Result URL:', videoUrl);
            return { ...result, url: videoUrl };
        } catch (error) {
            console.error('Muapi I2V Error:', error);
            throw error;
        }
    }

    /**
     * Uploads a file to muapi and returns the hosted URL.
     * @param {File} file - The image file to upload
     * @returns {Promise<string>} The hosted URL of the uploaded file
     */
    async uploadFile(file) {
        const key = this.getKey();
        const url = `${this.baseUrl}/api/v1/upload_file`;

        const formData = new FormData();
        formData.append('file', file);

        console.log('[Muapi] Uploading file:', file.name);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'x-api-key': key },
            body: formData
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`File upload failed: ${response.status} - ${errText.slice(0, 100)}`);
        }

        const data = await response.json();
        console.log('[Muapi] Upload response:', data);

        const fileUrl = data.url || data.file_url || data.data?.url;
        if (!fileUrl) throw new Error('No URL returned from file upload');
        return fileUrl;
    }

    /**
     * Processes a video through a Video-to-Video model.
     * Single-input tools (e.g. watermark remover) only need `video_url`.
     * Motion-control models additionally need `image_url` and (often) `prompt`.
     * @param {Object} params
     * @param {string} params.model - v2vModel id
     * @param {string} params.video_url - The uploaded video URL
     * @param {string} [params.image_url] - Reference image URL (motion-control models)
     * @param {string} [params.prompt] - Motion description (motion-control models)
     */
    async processV2V(params) {
        const key = this.getKey();
        const modelInfo = getV2VModelById(params.model);
        const endpoint = modelInfo?.endpoint || params.model;
        const url = `${this.baseUrl}/api/v1/${endpoint}`;

        const videoField = modelInfo?.videoField || 'video_url';
        const finalPayload = { [videoField]: params.video_url };

        if (modelInfo?.imageField && params.image_url) {
            finalPayload[modelInfo.imageField] = params.image_url;
        }
        if (modelInfo?.hasPrompt && params.prompt) {
            finalPayload.prompt = params.prompt;
        }

        console.log('[Muapi] V2V Request:', url);
        console.log('[Muapi] V2V Payload:', finalPayload);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': key },
                body: JSON.stringify(finalPayload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`API Request Failed: ${response.status} ${response.statusText} - ${errText.slice(0, 100)}`);
            }

            const submitData = await response.json();
            console.log('[Muapi] V2V Submit Response:', submitData);

            const requestId = submitData.request_id || submitData.id;
            if (!requestId) return submitData;

            if (params.onRequestId) params.onRequestId(requestId);

            const result = await this.pollForResult(requestId, key, 900, 2000);
            const videoUrl = result.outputs?.[0] || result.url || result.output?.url;
            console.log('[Muapi] V2V Result URL:', videoUrl);
            return { ...result, url: videoUrl };
        } catch (error) {
            console.error('Muapi V2V Error:', error);
            throw error;
        }
    }

    /**
     * Processes lipsync / speech-to-video generation.
     * Supports image+audio → video and video+audio → video models.
     * @param {Object} params
     * @param {string} params.model - lipsyncModel id
     * @param {string} [params.image_url] - Portrait image URL (image-based models)
     * @param {string} [params.video_url] - Source video URL (video-based models)
     * @param {string} params.audio_url - Audio file URL
     * @param {string} [params.prompt] - Optional prompt (for models that support it)
     * @param {string} [params.resolution] - Output resolution
     * @param {number} [params.seed] - Optional seed (-1 for random)
     * @param {Function} [params.onRequestId] - Called when request_id is received
     */
    async processLipSync(params) {
        const key = this.getKey();
        const modelInfo = getLipSyncModelById(params.model);
        const endpoint = modelInfo?.endpoint || params.model;
        const url = `${this.baseUrl}/api/v1/${endpoint}`;

        const finalPayload = {};

        if (params.audio_url) finalPayload.audio_url = params.audio_url;
        if (params.image_url) finalPayload.image_url = params.image_url;
        if (params.video_url) finalPayload.video_url = params.video_url;
        if (modelInfo?.hasPrompt) finalPayload.prompt = params.prompt || '';
        if (params.resolution) finalPayload.resolution = params.resolution;
        if (params.seed !== undefined && params.seed !== -1) finalPayload.seed = params.seed;

        console.log('[Muapi] LipSync Request:', url);
        console.log('[Muapi] LipSync Payload:', finalPayload);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': key },
                body: JSON.stringify(finalPayload)
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error('[Muapi] LipSync API Error:', errText);
                throw new Error(`API Request Failed: ${response.status} ${response.statusText} - ${errText.slice(0, 100)}`);
            }

            const submitData = await response.json();
            console.log('[Muapi] LipSync Submit Response:', submitData);

            const requestId = submitData.request_id || submitData.id;
            if (!requestId) return submitData;

            if (params.onRequestId) params.onRequestId(requestId);

            const result = await this.pollForResult(requestId, key, 900, 2000);
            const videoUrl = result.outputs?.[0] || result.url || result.output?.url;
            console.log('[Muapi] LipSync Result URL:', videoUrl);
            return { ...result, url: videoUrl };
        } catch (error) {
            console.error('Muapi LipSync Error:', error);
            throw error;
        }
    }

    getDimensionsFromAR(ar) {
        // Base unit 1024 (Flux standard)
        switch (ar) {
            case '1:1': return [1024, 1024];
            case '16:9': return [1280, 720]; // 1024*1024 area approx
            case '9:16': return [720, 1280];
            case '4:3': return [1152, 864];
            case '3:2': return [1216, 832];
            case '21:9': return [1536, 640];
            default: return [1024, 1024];
        }
    }
}

export const muapi = new MuapiClient();
