// src/lib/muapi.js
export class HuggingFaceClient {
    constructor() {
        // Use your Hugging Face Space runtime endpoint
        this.baseUrl = "https://aerovortex-open-generative.hf.space";
    }

    /**
     * Generate an image using Hugging Face Space
     * @param {Object} params
     * @param {string} params.prompt
     */
    async generateImage(params) {
        const url = `${this.baseUrl}/run/predict`;

        const payload = {
            data: [params.prompt]
        };

        console.log('[HF] Image Request:', url);
        console.log('[HF] Payload:', payload);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`HF Request Failed: ${response.status} ${response.statusText} - ${errText.slice(0, 100)}`);
            }

            const result = await response.json();
            console.log('[HF] Image Response:', result);

            // Hugging Face returns outputs in result.data
            const imageUrl = result.data?.[0];
            return { ...result, url: imageUrl };

        } catch (error) {
            console.error("HF Image Client Error:", error);
            throw error;
        }
    }

    /**
     * Generate a video using Hugging Face Space
     * @param {Object} params
     * @param {string} params.prompt
     */
    async generateVideo(params) {
        const url = `${this.baseUrl}/run/predict`;

        const payload = {
            data: [params.prompt]
        };

        console.log('[HF] Video Request:', url);
        console.log('[HF] Video Payload:', payload);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`HF Video Request Failed: ${response.status} ${response.statusText} - ${errText.slice(0, 100)}`);
            }

            const result = await response.json();
            console.log('[HF] Video Response:', result);

            const videoUrl = result.data?.[0];
            return { ...result, url: videoUrl };

        } catch (error) {
            console.error("HF Video Client Error:", error);
            throw error;
        }
    }
}

export const hfClient = new HuggingFaceClient();
