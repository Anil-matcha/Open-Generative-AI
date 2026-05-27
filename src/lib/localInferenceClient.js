// Frontend client for local inference — wraps window.localAI (Electron IPC).
// Two providers live behind the same surface:
//   - sd.cpp: bundled engine, downloads weights to disk, runs locally
//   - wan2gp: user-run Gradio server, generation is remote HTTP
// Provider is read off the model entry's `provider` field.

import { getLocalModelById } from './localModels.js';

export const isLocalAIAvailable = () => typeof window !== 'undefined' && !!window.localAI?.isElectron;

class LocalInferenceClient {
    // ── sd.cpp APIs ───────────────────────────────────────────────────────
    async getBinaryStatus() {
        if (!isLocalAIAvailable()) return { exists: false };
        return window.localAI.getBinaryStatus();
    }
    async downloadBinary() {
        if (!isLocalAIAvailable()) throw new Error('Local AI only available in the desktop app.');
        return window.localAI.downloadBinary();
    }
    async downloadModel(modelId) {
        if (!isLocalAIAvailable()) throw new Error('Local AI only available in the desktop app.');
        return window.localAI.downloadModel(modelId);
    }
    async downloadAuxiliary(auxKey) {
        if (!isLocalAIAvailable()) throw new Error('Local AI only available in the desktop app.');
        return window.localAI.downloadAuxiliary(auxKey);
    }
    async deleteModel(modelId) {
        if (!isLocalAIAvailable()) throw new Error('Local AI only available in the desktop app.');
        return window.localAI.deleteModel(modelId);
    }

    // ── Wan2GP APIs ───────────────────────────────────────────────────────
    async getWan2gpConfig() {
        if (!isLocalAIAvailable()) return { url: '' };
        return window.localAI.wan2gp.getConfig();
    }
    async setWan2gpUrl(url) {
        if (!isLocalAIAvailable()) throw new Error('Local AI only available in the desktop app.');
        return window.localAI.wan2gp.setUrl(url);
    }
    async probeWan2gp(url) {
        if (!isLocalAIAvailable()) return { ok: false, error: 'Not in desktop app' };
        return window.localAI.wan2gp.probe(url);
    }
    // Pushes a File/Blob to the configured Wan2GP server's /upload endpoint
    // and returns { url, path }. URL is a previewable HTTP link; the provider
    // also remembers the path so a subsequent generate(params.image=url) call
    // can rehydrate it as a Gradio file descriptor.
    async uploadFileToWan2gp(file) {
        if (!isLocalAIAvailable()) throw new Error('Local AI only available in the desktop app.');
        const buf = await file.arrayBuffer();
        return window.localAI.wan2gp.uploadFile({
            name: file.name,
            type: file.type,
            bytes: new Uint8Array(buf),
        });
    }

    // ── Unified model list (both providers merged) ────────────────────────
    async listModels() {
        if (!isLocalAIAvailable()) return [];
        const [sdcpp, wan2gp] = await Promise.all([
            window.localAI.listModels(),
            window.localAI.wan2gp.listModels().catch(() => []),
        ]);
        return [
            ...sdcpp.map(m => ({ ...m, provider: m.provider || 'sdcpp' })),
            ...wan2gp,
        ];
    }

    // ── Provider-aware generate ───────────────────────────────────────────
    async generate(params) {
        if (!isLocalAIAvailable()) throw new Error('Local AI only available in the desktop app.');
        const model = getLocalModelById(params.model);
        if (model?.provider === 'wan2gp') {
            return window.localAI.wan2gp.generate(params);
        }
        return window.localAI.generate(params);
    }

    cancelGeneration() {
        if (!isLocalAIAvailable()) return;
        // Ask both — only the running one reacts.
        window.localAI.cancelGeneration();
        window.localAI.wan2gp.cancelGeneration();
    }

    /**
     * Subscribe to generation progress events.
     * sd.cpp emits { step, totalSteps, progress, status }.
     * Wan2GP emits { progress, status }.
     */
    onProgress(callback) {
        if (!isLocalAIAvailable()) return () => {};
        return window.localAI.onProgress(callback);
    }

    onDownloadProgress(callback) {
        if (!isLocalAIAvailable()) return () => {};
        return window.localAI.onDownloadProgress(callback);
    }
}

export const localAI = new LocalInferenceClient();
