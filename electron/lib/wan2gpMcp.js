// Remote Wan2GP engine: WanGP's MCP server (API v1, Streamable HTTP), started with
//   python wgp.py --mcp --mcp-api-version 1 --mcp-transport streamable-http --mcp-host 0.0.0.0 --mcp-port 7866
// and reached at http://<host>:7866/mcp. Gradio's UI endpoints are not an API —
// this is the only remote surface WanGP documents (docs/API.md → "MCP Server").

const PROTOCOL_VERSION = '2025-06-18';
const POLL_INTERVAL_MS = 2000;

function normalizeMcpUrl(url) {
    const trimmed = (url || '').trim().replace(/\/+$/, '');
    if (!trimmed) return '';
    return /\/mcp$/.test(trimmed) ? trimmed : `${trimmed}/mcp`;
}

function parseRpcResponse(text, contentType, id) {
    if ((contentType || '').includes('text/event-stream')) {
        const messages = text.split('\n')
            .filter(l => l.startsWith('data:'))
            .map(l => l.slice(5).trim())
            .filter(Boolean)
            .map(d => JSON.parse(d));
        return messages.find(m => m.id === id) || null;
    }
    return text ? JSON.parse(text) : null;
}

// WanGP phase names (shared/api.py `_normalize_phase`) → app progress status.
// Unknown phases fall back to 'working' so the UI shows WanGP's own status text.
const PHASE_STATUS = {
    loading_model: 'loading',
    encoding_text: 'encoding',
    inference: 'generating',
    inference_stage_1: 'generating',
    inference_stage_2: 'generating',
    inference_stage_3: 'generating',
    decoding: 'decoding',
    downloading_output: 'saving',
};

// Map a WanGP job progress event onto the app's progress shape.
function toProgressEvent(event) {
    const data = event?.data || {};
    if (event?.kind !== 'progress' || typeof data.progress !== 'number') return null;
    const status = PHASE_STATUS[String(data.phase || '')] || 'working';
    return {
        status,
        progress: Math.max(0, Math.min(1, data.progress / 100)),
        step: data.current_step ?? undefined,
        totalSteps: data.total_steps ?? undefined,
        message: data.status || undefined,
    };
}

function createMcpClient(url, { fetchImpl = fetch } = {}) {
    const endpoint = normalizeMcpUrl(url);
    let sessionId = null;
    let nextId = 1;
    let initialized = null;

    async function rpc(method, params, { notify = false, signal } = {}) {
        const body = notify ? { jsonrpc: '2.0', method, params } : { jsonrpc: '2.0', id: nextId++, method, params };
        const res = await fetchImpl(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json, text/event-stream',
                'MCP-Protocol-Version': PROTOCOL_VERSION,
                ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {}),
            },
            body: JSON.stringify(body),
            signal,
        });
        const sid = res.headers.get('mcp-session-id');
        if (sid) sessionId = sid;
        const text = await res.text();
        if (!res.ok) throw new Error(`Wan2GP MCP HTTP ${res.status}: ${text.slice(0, 200)}`);
        if (notify) return null;
        const msg = parseRpcResponse(text, res.headers.get('content-type'), body.id);
        if (!msg) throw new Error(`Wan2GP MCP returned no response to ${method}`);
        if (msg.error) throw new Error(`Wan2GP MCP error: ${msg.error.message || JSON.stringify(msg.error)}`);
        return msg.result;
    }

    function ensureInitialized() {
        if (!initialized) {
            initialized = (async () => {
                const result = await rpc('initialize', {
                    protocolVersion: PROTOCOL_VERSION,
                    capabilities: {},
                    clientInfo: { name: 'open-generative-ai', version: '2' },
                });
                await rpc('notifications/initialized', {}, { notify: true });
                return result;
            })().catch((err) => { initialized = null; throw err; });
        }
        return initialized;
    }

    async function callTool(name, args, { signal } = {}) {
        await ensureInitialized();
        const result = await rpc('tools/call', { name, arguments: args }, { signal });
        const payload = result.structuredContent ?? (result.content || []).map(c => c.text).join('\n');
        if (result.isError) throw new Error(typeof payload === 'string' ? payload : JSON.stringify(payload));
        return payload;
    }

    async function probe() {
        const info = await ensureInitialized();
        const tools = await rpc('tools/list', {});
        const names = new Set((tools.tools || []).map(t => t.name));
        if (!names.has('wangp_generate') || !names.has('wangp_get_job')) {
            throw new Error('This MCP server does not expose WanGP generation tools (start it with --mcp-api-version 1).');
        }
        return { server: info.serverInfo?.name || 'WanGP', version: info.serverInfo?.version || 'unknown' };
    }

    // status: 'available' (weights on disk) | 'missing' (downloads on first use) | 'unknown-model'
    async function modelAvailability(modelType) {
        try {
            const r = await callTool('wangp_get_model_availability', { model_type: modelType });
            return r.status || (r.available ? 'available' : 'missing');
        } catch (err) {
            if (/Unknown model_type/i.test(err.message)) return 'unknown-model';
            throw err;
        }
    }

    function transferUrl(relative) {
        return new URL(relative, endpoint).toString();
    }

    async function uploadImage({ name, bytes, mime }) {
        const slot = await callTool('wangp_create_gallery_upload', { filename: name || 'start.png' });
        const res = await fetchImpl(transferUrl(slot.upload_url), {
            method: 'PUT',
            headers: { 'Content-Type': mime || 'application/octet-stream' },
            body: bytes,
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body.media_id) throw new Error(`Wan2GP upload failed: HTTP ${res.status} ${body.detail || ''}`.trim());
        return body.media_id;
    }

    async function download(mediaId) {
        const slot = await callTool('wangp_create_gallery_download', { media_id: mediaId });
        const res = await fetchImpl(transferUrl(slot.download_url));
        if (!res.ok) throw new Error(`Wan2GP download failed: HTTP ${res.status}`);
        return { filename: slot.filename, bytes: Buffer.from(await res.arrayBuffer()) };
    }

    // Submit and poll until the job is done. Resolves the first generated
    // gallery item ({ media_id, media_type, filename }).
    async function generate(settings, { onProgress, onJobId, signal } = {}) {
        const job = await callTool('wangp_generate', { source: settings, wait: false, event_limit: 0 }, { signal });
        const jobId = job.job_id;
        if (!jobId) throw new Error('Wan2GP did not return a job id');
        onJobId?.(jobId);

        let snapshot = job;
        let lastKey = '';
        let maxProgress = 0;
        while (!snapshot.done) {
            if (signal?.aborted) throw new Error('Generation cancelled');
            await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
            snapshot = await callTool('wangp_get_job', { job_id: jobId, event_limit: 20 });
            const latest = (snapshot.events || []).map(toProgressEvent).filter(Boolean).pop();
            // Post-processing phases restart their own percentage; keep the bar monotonic.
            if (latest && latest.progress >= maxProgress) {
                maxProgress = latest.progress;
                const key = `${latest.status}:${latest.step}:${Math.round(latest.progress * 100)}`;
                if (key !== lastKey) { lastKey = key; onProgress?.(latest); }
            }
        }

        const result = snapshot.result || {};
        if (result.cancelled) throw new Error('Generation cancelled');
        if (!result.success) {
            const errors = (result.errors || []).map(e => e.message || JSON.stringify(e)).join('\n');
            throw new Error(`Wan2GP generation failed${errors ? `:\n${errors}` : ''}`);
        }
        const item = (result.gallery_items || [])[0];
        if (!item?.media_id) throw new Error('Wan2GP finished without a gallery item to download');
        return item;
    }

    async function cancel(jobId) {
        if (jobId) await callTool('wangp_cancel_job', { job_id: jobId });
    }

    return { endpoint, probe, modelAvailability, uploadImage, download, generate, cancel };
}

module.exports = { createMcpClient, normalizeMcpUrl, toProgressEvent };
