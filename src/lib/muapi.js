// src/lib/muapi.js
export class HuggingFaceClient {
    constructor() {
        this.baseUrl = "https://aerovortex-open-generative.hf.space";
    }

    async generateImage(params) {
        const url = `${this.baseUrl}/run/predict`;
        const payload = { data: [params.prompt] };

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(await response.text());
        const result = await response.json();
        return { ...result, url: result.data?.[0] };
    }

    async generateVideo(params) {
        const url = `${this.baseUrl}/run/predict`;
        const payload = { data: [params.prompt] };

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(await response.text());
        const result = await response.json();
        return { ...result, url: result.data?.[0] };
    }
}

export const muapi = new HuggingFaceClient();
