import { NextResponse } from 'next/server';

const store = global._mf_workflows ?? (global._mf_workflows = new Map());
const runStore = global._mf_runs ?? (global._mf_runs = new Map());

const MEMEFAST = 'https://memefast.top';

function genId() { return `wf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }

function emptyWorkflow(id) {
    return { workflow_id: id, id, name: 'Untitled', nodes: [], edges: [], created_at: new Date().toISOString() };
}

const VIDEO_MODELS = new Set([
    'video-passthrough',
    'doubao-seedance-1-0-lite-i2v-250428', 'doubao-seedance-1-0-lite-t2v-250428',
    'doubao-seedance-1-0-pro-250528', 'doubao-seedance-1-0-pro-fast-251015',
    'doubao-seedance-1-5-pro-251215',
    'veo3.1', 'veo3.1-fast', 'veo3.1-pro', 'veo3.1-4k',
    'veo_3_1', 'veo_3_1-fast', 'veo_3_1-4K',
    'sora-2',
    'grok-video-3', 'grok-video-3-10s',
    'kling-video', 'kling-video-extend', 'kling-omni-video', 'kling-avatar-image2video',
    'happyhorse-1.0-t2v', 'happyhorse-1.0-i2v', 'happyhorse-1.0-r2v', 'happyhorse-1.0-video-edit',
    'mj_video',
    'pixverse-video', 'pixverse-modify', 'pixverse-restyle', 'pixverse-lipsync',
    'pixverse-multi-transition', 'pixverse-mimic',
    'wan2.5-i2v-preview', 'wan2.6-i2v',
    'vidu2.0', 'viduq2', 'viduq2-pro', 'viduq2-turbo',
    'viduq3', 'viduq3-pro', 'viduq3-turbo', 'viduq3-mix',
]);

const TEXT_MODELS = new Set(['text-passthrough', 'any-llm', 'openrouter-vision', 'gpt-5-nano', 'gpt-5-mini']);

const AUDIO_MODELS = new Set([
    'audio-passthrough',
    'MiniMax-Voice-Clone', 'MiniMax-Voice-Design',
    'speech-02-hd', 'speech-02-turbo',
    'speech-2.6-hd', 'speech-2.6-turbo',
    'speech-2.8-hd', 'speech-2.8-turbo',
    'tts-1', 'tts-1-hd',
    'vidu-tts', 'qwen3-tts-flash',
]);

async function generateImage(apiKey, model, params) {
    const size = (params.width && params.height) ? `${params.width}x${params.height}` : '1024x1024';
    const body = { model, prompt: params.prompt || '', n: 1, size, response_format: 'url' };
    const imgInput = params.image_url || params.images_list?.[0];
    if (imgInput) body.image_url = imgInput;

    const res = await fetch(`${MEMEFAST}/v1/images/generations`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText);
        throw new Error(`Image API ${res.status}: ${txt.slice(0, 300)}`);
    }
    const data = await res.json();
    const item = data.data?.[0];
    const url = item?.url || (item?.b64_json ? `data:image/png;base64,${item.b64_json}` : '') || data.url || '';
    return [{ type: 'image_url', value: url }];
}

async function generateText(apiKey, model, params) {
    const messages = params.image_url
        ? [{ role: 'user', content: [
              { type: 'image_url', image_url: { url: params.image_url } },
              { type: 'text', text: params.prompt || '' }
          ]}]
        : [{ role: 'user', content: params.prompt || '' }];
    const res = await fetch(`${MEMEFAST}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model === 'text-passthrough' ? 'gpt-4o-mini' : model, messages, max_tokens: 4096 }),
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText);
        throw new Error(`Text API ${res.status}: ${txt.slice(0, 200)}`);
    }
    const data = await res.json();
    return [{ type: 'text', value: data.choices?.[0]?.message?.content || '' }];
}

async function generateVideo(apiKey, model, params) {
    const res = await fetch(`${MEMEFAST}/v1/video/create`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model, prompt: params.prompt || '',
            image_url: params.image_url,
            duration: params.duration || 5,
            aspect_ratio: params.aspect_ratio || '16:9',
        }),
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText);
        throw new Error(`Video API ${res.status}: ${txt.slice(0, 300)}`);
    }
    const data = await res.json();
    const taskId = data.task_id || data.id;
    if (!taskId) return [{ type: 'video_url', value: data.url || data.video_url || '' }];

    for (let i = 0; i < 120; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const poll = await fetch(`${MEMEFAST}/v1/video/task/${taskId}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        if (!poll.ok) continue;
        const pData = await poll.json();
        const st = (pData.status || '').toLowerCase();
        if (st === 'completed' || st === 'succeeded' || st === 'success') {
            return [{ type: 'video_url', value: pData.url || pData.video_url || pData.output?.url || '' }];
        }
        if (st === 'failed' || st === 'error') throw new Error(pData.error || 'Video generation failed');
    }
    throw new Error('Video generation timed out');
}

async function generateAudio(apiKey, model, params) {
    const res = await fetch(`${MEMEFAST}/v1/audio/speech`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, input: params.prompt || '', voice: params.voice || 'alloy' }),
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText);
        throw new Error(`Audio API ${res.status}: ${txt.slice(0, 200)}`);
    }
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('audio') || ct.includes('octet-stream')) {
        const buf = await res.arrayBuffer();
        const b64 = Buffer.from(buf).toString('base64');
        return [{ type: 'audio_url', value: `data:audio/mp3;base64,${b64}` }];
    }
    const data = await res.json();
    return [{ type: 'audio_url', value: data.url || data.audio_url || '' }];
}

async function runNode(runId, nodeId, model, params, apiKey) {
    try {
        let outputs;
        // Passthroughs
        if (model === 'image-passthrough') outputs = [{ type: 'image_url', value: params.image_url || '' }];
        else if (model === 'video-passthrough') outputs = [{ type: 'video_url', value: params.video_url || '' }];
        else if (model === 'audio-passthrough') outputs = [{ type: 'audio_url', value: params.audio_url || '' }];
        else if (model === 'text-passthrough') outputs = [{ type: 'text', value: params.prompt || '' }];
        // Generation
        else if (VIDEO_MODELS.has(model)) outputs = await generateVideo(apiKey, model, params);
        else if (TEXT_MODELS.has(model)) outputs = await generateText(apiKey, model, params);
        else if (AUDIO_MODELS.has(model)) outputs = await generateAudio(apiKey, model, params);
        else outputs = await generateImage(apiKey, model, params);

        runStore.set(runId, {
            status: 'completed',
            nodes: { [nodeId]: [{ status: 'succeeded', result: { outputs } }] },
        });
    } catch (err) {
        console.error(`Node run error [${nodeId}]:`, err.message);
        runStore.set(runId, {
            status: 'failed',
            nodes: { [nodeId]: [{ status: 'failed', result: { outputs: [{ type: 'error', value: err.message }] } }] },
        });
    }
}

function getNodeSchemas() {
    const F = {
        prompt:      { type: "string", title: "Prompt", description: "Describe what you want to generate", examples: [""] },
        width:       { type: "int", title: "Width", default: 1024, minValue: 256, maxValue: 4096, step: 64 },
        height:      { type: "int", title: "Height", default: 1024, minValue: 256, maxValue: 4096, step: 64 },
        aspect_ratio:{ enum: ["1:1","16:9","9:16","4:3","3:4","21:9"], type: "string", title: "Aspect Ratio", default: "1:1" },
        quality:     { enum: ["standard","hd"], type: "string", title: "Quality", default: "standard" },
        images_list: { type: "array", title: "Input Images", field: "images_list", maxItems: 5, description: "Images to edit or use as reference", examples: [] },
        image_url:   { type: "string", title: "Image URL", field: "image", description: "URL of the input image", examples: [] },
        video_url:   { type: "string", title: "Video URL", field: "video", description: "URL of the input video", examples: [] },
        audio_url:   { type: "string", title: "Audio URL", field: "audio", description: "URL of the input audio", examples: [] },
        duration:    { type: "int", title: "Duration (sec)", default: 5, minValue: 3, maxValue: 30, step: 1 },
        ar_video:    { enum: ["16:9","9:16","1:1","4:3"], type: "string", title: "Aspect Ratio", default: "16:9" },
        voice:       { enum: ["alloy","echo","fable","onyx","nova","shimmer"], type: "string", title: "Voice", default: "alloy" },
    };

    const ms = (props) => ({ input_schema: { schemas: { input_data: { properties: props } } } });

    const T = {
        t2i:    ms({ prompt: F.prompt, aspect_ratio: F.aspect_ratio }),
        t2iQ:   ms({ prompt: F.prompt, aspect_ratio: F.aspect_ratio, quality: F.quality }),
        t2iWH:  ms({ prompt: F.prompt, width: F.width, height: F.height }),
        i2i:    ms({ prompt: F.prompt, images_list: F.images_list }),
        imgRef: ms({ prompt: F.prompt, image_url: F.image_url }),
        imgPass:ms({ image_url: F.image_url }),
        vidPass:ms({ video_url: F.video_url }),
        audPass:ms({ audio_url: F.audio_url }),
        t2v:    ms({ prompt: F.prompt, duration: F.duration, aspect_ratio: { ...F.ar_video } }),
        i2v:    ms({ prompt: F.prompt, image_url: F.image_url, duration: F.duration }),
        vidEdit:ms({ prompt: F.prompt, video_url: F.video_url }),
        lipsync:ms({ video_url: F.video_url, audio_url: F.audio_url }),
        vision: ms({ prompt: F.prompt, image_url: F.image_url }),
        txtPass:ms({ prompt: { type: "string", title: "Text", description: "Enter your text", examples: [""] } }),
        speech: ms({ prompt: F.prompt, voice: F.voice }),
        tts:    ms({ prompt: F.prompt }),
    };

    return {
        categories: {
            image: {
                models: {
                    "image-passthrough":              T.imgPass,
                    // OpenAI Image
                    "gpt-image-2":                    T.t2iQ,
                    "gpt-image-1.5":                  T.t2iQ,
                    "gpt-image-1":                    T.t2iQ,
                    "gpt-image-1-mini":               T.t2i,
                    "dall-e-3":                       T.t2i,
                    // Flux
                    "flux-2-pro":                     T.t2i,
                    "flux-1.1-pro":                   T.t2i,
                    "flux.1-kontext-pro":             T.i2i,
                    // ByteDance Seedream
                    "doubao-seedream-5-0-260128":      T.t2i,
                    "doubao-seedream-4-5-251128":      T.t2i,
                    "doubao-seedream-4-0-250828":      T.t2i,
                    "doubao-seedream-3-0-t2i-250415":  T.t2i,
                    // Qwen Image
                    "qwen-image-max":                 T.t2i,
                    "qwen-image-2.0-2026-03-03":      T.t2i,
                    "qwen-image-edit-2509":           T.i2i,
                    // z-image
                    "z-image-turbo":                  T.t2i,
                    // Kling Image
                    "kling-image":                    T.t2i,
                    "kling-omni-image":               T.i2i,
                    // Grok Image
                    "grok-4.2-image":                 T.t2i,
                    "grok-4.1-image":                 T.t2i,
                    "grok-4-image":                   T.t2i,
                    "grok-imagine-image":             T.t2i,
                    "grok-imagine-image-pro":         T.imgRef,
                    // Midjourney
                    "mj_imagine":                     T.t2i,
                    "mj_edits":                       T.i2i,
                    "mj_inpaint":                     T.i2i,
                    "mj_variation":                   T.imgRef,
                    // Wan Image
                    "wan2.7-image-pro":               T.t2iWH,
                    // Gemini Image
                    "gemini-3.1-flash-image-preview": T.t2i,
                    "gemini-3-pro-image-preview":     T.t2i,
                    "gemini-2.5-flash-image":         T.t2i,
                }
            },
            video: {
                models: {
                    "video-passthrough":                    T.vidPass,
                    // ByteDance Seedance
                    "doubao-seedance-1-5-pro-251215":       T.t2v,
                    "doubao-seedance-1-0-pro-fast-251015":  T.t2v,
                    "doubao-seedance-1-0-pro-250528":       T.t2v,
                    "doubao-seedance-1-0-lite-t2v-250428":  T.t2v,
                    "doubao-seedance-1-0-lite-i2v-250428":  T.i2v,
                    // Google Veo
                    "veo3.1-pro":    T.t2v,
                    "veo3.1-4k":     T.t2v,
                    "veo3.1":        T.t2v,
                    "veo3.1-fast":   T.t2v,
                    "veo_3_1":       T.t2v,
                    "veo_3_1-fast":  T.t2v,
                    // OpenAI Sora
                    "sora-2": T.t2v,
                    // Grok Video
                    "grok-video-3":     T.t2v,
                    "grok-video-3-10s": T.t2v,
                    // Kling Video
                    "kling-omni-video":         T.t2v,
                    "kling-video":              T.t2v,
                    "kling-video-extend":       T.i2v,
                    "kling-avatar-image2video": T.i2v,
                    // Happyhorse
                    "happyhorse-1.0-t2v":        T.t2v,
                    "happyhorse-1.0-i2v":        T.i2v,
                    "happyhorse-1.0-r2v":        T.i2v,
                    "happyhorse-1.0-video-edit": T.vidEdit,
                    // Midjourney Video
                    "mj_video": T.t2v,
                    // Pixverse
                    "pixverse-video":            T.t2v,
                    "pixverse-modify":           T.vidEdit,
                    "pixverse-restyle":          T.vidEdit,
                    "pixverse-lipsync":          T.lipsync,
                    "pixverse-mimic":            T.i2v,
                    // Wan Video
                    "wan2.6-i2v":           T.i2v,
                    "wan2.5-i2v-preview":   T.i2v,
                    // Vidu Video
                    "vidu2.0":      T.t2v,
                    "viduq3-turbo": T.t2v,
                    "viduq3-pro":   T.t2v,
                    "viduq3":       T.t2v,
                    "viduq2-turbo": T.t2v,
                    "viduq2-pro":   T.t2v,
                    "viduq2":       T.t2v,
                }
            },
            text: {
                models: {
                    "text-passthrough":  T.txtPass,
                    "any-llm":           T.vision,
                    "openrouter-vision": T.vision,
                    "gpt-5-nano":        T.vision,
                    "gpt-5-mini":        T.vision,
                }
            },
            audio: {
                models: {
                    "audio-passthrough":    T.audPass,
                    "speech-2.8-hd":        T.speech,
                    "speech-2.8-turbo":     T.speech,
                    "speech-2.6-hd":        T.speech,
                    "speech-2.6-turbo":     T.speech,
                    "speech-02-hd":         T.speech,
                    "speech-02-turbo":      T.speech,
                    "tts-1-hd":             T.speech,
                    "tts-1":                T.speech,
                    "MiniMax-Voice-Design": T.tts,
                    "qwen3-tts-flash":      T.tts,
                    "vidu-tts":             T.tts,
                }
            },
        }
    };
}

export async function GET(request, { params }) {
    const { path = [] } = await params;

    if (path[0] === 'get-workflow-def') {
        const id = path[1];
        const wf = store.get(id) || {};
        return NextResponse.json({
            workflow_id: id, id, name: wf.name || 'Untitled Workflow',
            data: { nodes: wf.nodes || [] },
            edges: wf.edges || [],
            is_owner: true, is_published: false, is_template: false,
            show_temp_button: false, run_id: null, category: 'General',
        });
    }

    if (path[1] === 'node-schemas') {
        return NextResponse.json(getNodeSchemas());
    }

    if (path[0] === 'run' && path[2] === 'status') {
        const run = runStore.get(path[1]);
        if (!run) return NextResponse.json({ status: 'processing', nodes: {} });
        return NextResponse.json(run);
    }

    // GET /api/workflow/debug-models?key=...
    if (path[0] === 'debug-models') {
        const { searchParams } = new URL(request.url);
        const cookieKey = request.headers.get('cookie')?.match(/muapi_key=([^;]+)/)?.[1] || '';
        const apiKey = searchParams.get('key')
            || request.headers.get('authorization')?.replace('Bearer ', '')
            || cookieKey
            || '';
        try {
            const r = await fetch(`${MEMEFAST}/v1/models`, {
                headers: { 'Authorization': `Bearer ${apiKey}` },
            });
            const data = await r.json();
            const ids = (data.data || []).map(m => m.id).sort();
            return NextResponse.json({ ok: r.ok, status: r.status, count: ids.length, models: ids });
        } catch (e) {
            return NextResponse.json({ ok: false, error: e.message });
        }
    }

    const id = path[0];
    if (!id) return NextResponse.json([]);
    return NextResponse.json(store.get(id) || emptyWorkflow(id));
}

export async function POST(request, { params }) {
    const { path = [] } = await params;
    let body = {};
    try { body = await request.json(); } catch {}

    if (path[0] === 'create' || path.length === 0) {
        const id = body.workflow_id || genId();
        const wf = {
            workflow_id: id, id,
            name: body.name || 'Untitled Workflow',
            nodes: body.data?.nodes || [],
            edges: body.edges || [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        store.set(id, wf);
        return NextResponse.json(wf);
    }

    if (path[1] === 'run') {
        const runId = genId();
        return NextResponse.json({ run_id: runId, status: 'completed', result: {} });
    }

    if (path[1] === 'node' && path[3] === 'run') {
        const nodeId = path[2];
        const runId = body.run_id || genId();
        const apiKey = request.headers.get('authorization')?.replace('Bearer ', '') || '';
        const model = body.model || '';
        const params = body.params || {};
        runNode(runId, nodeId, model, params, apiKey).catch(() => {});
        return NextResponse.json({ run_id: runId, status: 'processing' });
    }

    if (['publish', 'template', 'update-category', 'thumbnail'].includes(path[1])) {
        return NextResponse.json({ success: true });
    }

    if (path[0] === 'architect') {
        return NextResponse.json({ request_id: genId(), status: 'completed', result: {} });
    }

    if (path[0] === 'poll-architect') {
        return NextResponse.json({ status: 'completed', result: {} });
    }

    const id = path[0];
    const existing = store.get(id) || emptyWorkflow(id);
    const updated = { ...existing, ...body, workflow_id: id, id, updated_at: new Date().toISOString() };
    store.set(id, updated);
    return NextResponse.json(updated);
}

export async function PUT(request, { params }) {
    return POST(request, { params });
}

export async function DELETE(request, { params }) {
    const { path = [] } = await params;
    store.delete(path[0]);
    return NextResponse.json({ success: true });
}
