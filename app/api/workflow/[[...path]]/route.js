import { NextResponse } from 'next/server';

const store = global._mf_workflows ?? (global._mf_workflows = new Map());
const runStore = global._mf_runs ?? (global._mf_runs = new Map());

const MEMEFAST = 'https://memefast.top';

function genId() { return `wf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }

function emptyWorkflow(id) {
    return { workflow_id: id, id, name: 'Untitled', nodes: [], edges: [], created_at: new Date().toISOString() };
}

// Video model IDs (need /v1/video/create endpoint)
const VIDEO_MODELS = new Set([
    'video-passthrough','seedance-lite-i2v','seedance-lite-t2v','seedance-pro-t2v','seedance-pro-i2v',
    'seedance-pro-t2v-fast','seedance-pro-i2v-fast','seedance-v1.5-pro-i2v','seedance-v1.5-pro-t2v',
    'seedance-v1.5-pro-i2v-fast','seedance-v1.5-pro-t2v-fast','seedance-v1.5-pro-video-extend',
    'seedance-v1.5-pro-video-extend-fast','veo3.1-image-to-video','veo3.1-text-to-video',
    'veo3.1-fast-image-to-video','veo3.1-fast-text-to-video','wan2.2-text-to-video',
    'wan2.2-image-to-video','wan2.2-5b-fast-t2v','wan2.2-animate','wan2.2-edit-video',
    'wan2.2-spicy-image-to-video','wan2.2-spicy-video-extend','wan2.5-text-to-video',
    'wan2.5-image-to-video','wan2.5-text-to-video-fast','wan2.5-image-to-video-fast',
    'wan2.6-text-to-video','wan2.6-image-to-video','openai-sora','openai-sora-2-text-to-video',
    'openai-sora-2-image-to-video','openai-sora-2-pro-text-to-video','openai-sora-2-pro-image-to-video',
    'kling-v2.5-turbo-pro-t2v','kling-v2.5-turbo-pro-i2v','kling-v2.5-turbo-std-i2v',
    'kling-v2.6-pro-t2v','kling-v2.6-pro-i2v','kling-v2.6-pro-motion-control',
    'kling-o1-text-to-video','kling-o1-image-to-video','kling-o1-video-edit',
    'kling-o1-video-edit-fast','kling-o1-reference-to-video','kling-o1-standard-image-to-video',
    'kling-o1-standard-reference-to-video','kling-o1-standard-video-edit',
    'grok-imagine-text-to-video','grok-imagine-image-to-video','hunyuan-text-to-video',
    'hunyuan-fast-text-to-video','hunyuan-image-to-video','midjourney-v7-image-to-video',
    'vidu-q2-turbo-start-end-video','vidu-q2-pro-start-end-video','vidu-q2-reference',
    'luma-modify-video','luma-flash-reframe',
]);

const TEXT_MODELS = new Set(['text-passthrough','any-llm','openrouter-vision','gpt-5-nano','gpt-5-mini']);
const AUDIO_MODELS = new Set(['audio-passthrough','suno-create-music','suno-extend-music','suno-remix-music','minimax-voice-clone','minimax-speech-2.6-hd','minimax-speech-2.6-turbo']);

async function generateImage(apiKey, model, params) {
    const size = (params.width && params.height)
        ? `${params.width}x${params.height}`
        : '1024x1024';
    const res = await fetch(`${MEMEFAST}/v1/images/generations`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt: params.prompt || '', n: 1, size, response_format: 'url' })
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText);
        throw new Error(`Image API ${res.status}: ${txt.slice(0, 200)}`);
    }
    const data = await res.json();
    const url = data.data?.[0]?.url || data.url || '';
    return [{ type: 'image_url', value: url }];
}

async function generateText(apiKey, model, params) {
    const messages = [];
    if (params.image_url) {
        messages.push({ role: 'user', content: [
            { type: 'image_url', image_url: { url: params.image_url } },
            { type: 'text', text: params.prompt || '' }
        ]});
    } else {
        messages.push({ role: 'user', content: params.prompt || '' });
    }
    const res = await fetch(`${MEMEFAST}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model === 'text-passthrough' ? 'gpt-4o-mini' : model, messages, max_tokens: 4096 })
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText);
        throw new Error(`Text API ${res.status}: ${txt.slice(0, 200)}`);
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    return [{ type: 'text', value: text }];
}

async function generateVideo(apiKey, model, params) {
    const res = await fetch(`${MEMEFAST}/v1/video/create`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt: params.prompt || '', image_url: params.image_url, duration: params.duration || 5, aspect_ratio: params.aspect_ratio || '16:9' })
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText);
        throw new Error(`Video API ${res.status}: ${txt.slice(0, 200)}`);
    }
    const data = await res.json();
    const taskId = data.task_id || data.id;
    if (!taskId) {
        const url = data.url || data.video_url || '';
        return [{ type: 'video_url', value: url }];
    }
    // Poll for result
    for (let i = 0; i < 120; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const poll = await fetch(`${MEMEFAST}/v1/video/task/${taskId}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!poll.ok) continue;
        const pData = await poll.json();
        const status = (pData.status || '').toLowerCase();
        if (status === 'completed' || status === 'succeeded' || status === 'success') {
            const url = pData.url || pData.video_url || pData.output?.url || pData.data?.url || '';
            return [{ type: 'video_url', value: url }];
        }
        if (status === 'failed' || status === 'error') throw new Error(pData.error || 'Video generation failed');
    }
    throw new Error('Video generation timed out');
}

async function runNode(runId, nodeId, model, params, apiKey) {
    try {
        let outputs;
        if (VIDEO_MODELS.has(model)) {
            outputs = await generateVideo(apiKey, model, params);
        } else if (TEXT_MODELS.has(model)) {
            outputs = await generateText(apiKey, model, params);
        } else {
            // Default to image
            outputs = await generateImage(apiKey, model, params);
        }
        runStore.set(runId, {
            status: 'completed',
            nodes: { [nodeId]: [{ status: 'succeeded', result: { outputs } }] }
        });
    } catch (err) {
        console.error(`Node run error [${nodeId}]:`, err.message);
        runStore.set(runId, {
            status: 'failed',
            nodes: { [nodeId]: [{ status: 'failed', result: { outputs: [{ type: 'error', value: err.message }] } }] }
        });
    }
}

function getNodeSchemas() {
    const F = {
        prompt: { type: "string", title: "Prompt", description: "Describe what you want to generate", examples: [""] },
        width: { type: "int", title: "Width", default: 1024, minValue: 256, maxValue: 4096, step: 64 },
        height: { type: "int", title: "Height", default: 1024, minValue: 256, maxValue: 4096, step: 64 },
        aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4", "21:9", "9:21"], type: "string", title: "Aspect Ratio", default: "1:1" },
        quality: { enum: ["standard", "high"], type: "string", title: "Quality", default: "standard" },
        images_list: { type: "array", title: "Input Images", field: "images_list", maxItems: 5, description: "Images to edit or use as reference", examples: [] },
        image_url: { type: "string", title: "Image URL", field: "image", description: "URL of the input image", examples: [] },
        video_url: { type: "string", title: "Video URL", field: "video", description: "URL of the input video", examples: [] },
        audio_url: { type: "string", title: "Audio URL", field: "audio", description: "URL of the input audio", examples: [] },
        duration: { type: "int", title: "Duration (sec)", default: 5, minValue: 3, maxValue: 30, step: 1 },
        resolution: { enum: ["480p", "720p", "1080p"], type: "string", title: "Resolution", default: "720p" },
        camera_fixed: { type: "boolean", title: "Camera Fixed", description: "Keep the camera in a fixed position", default: false },
        ar_video: { enum: ["16:9", "9:16", "1:1", "4:3"], type: "string", title: "Aspect Ratio", default: "16:9" },
    };

    const ms = (props) => ({ input_schema: { schemas: { input_data: { properties: props } } } });

    const T = {
        t2i:    ms({ prompt: F.prompt, aspect_ratio: F.aspect_ratio, quality: F.quality }),
        t2iWH:  ms({ prompt: F.prompt, width: F.width, height: F.height }),
        i2i:    ms({ prompt: F.prompt, images_list: F.images_list, width: F.width, height: F.height }),
        imgPass: ms({ image_url: F.image_url }),
        vidPass: ms({ video_url: F.video_url }),
        audPass: ms({ audio_url: F.audio_url }),
        t2v:    ms({ prompt: F.prompt, duration: F.duration, aspect_ratio: { ...F.ar_video } }),
        i2v:    ms({ prompt: F.prompt, image_url: F.image_url, duration: F.duration, camera_fixed: F.camera_fixed }),
        t2vRes: ms({ prompt: F.prompt, resolution: F.resolution, duration: F.duration, aspect_ratio: { ...F.ar_video } }),
        i2vRes: ms({ prompt: F.prompt, image_url: F.image_url, resolution: F.resolution, duration: F.duration, camera_fixed: F.camera_fixed }),
        vidEdit: ms({ prompt: F.prompt, video_url: F.video_url }),
        text:   ms({ prompt: F.prompt }),
        vision: ms({ prompt: F.prompt, image_url: F.image_url }),
        txtPass: ms({ prompt: { type: "string", title: "Prompt", description: "Enter your text", examples: [""] } }),
        music:  ms({
            prompt: F.prompt,
            style: { type: "string", title: "Music Style", description: "Genre/style (e.g. Classical, Jazz, Electronic)", default: "Cinematic", format: "text" },
            instrumental: { type: "boolean", title: "Instrumental", description: "Generate music without vocals", default: true },
            model: { enum: ["V5", "V4", "V3"], type: "string", title: "Model Version", default: "V5" },
        }),
        speech: ms({
            prompt: F.prompt,
            voice: { enum: ["alloy", "echo", "fable", "onyx", "nova", "shimmer"], type: "string", title: "Voice", default: "alloy" },
        }),
    };

    return {
        categories: {
            image: {
                models: {
                    "image-passthrough": T.imgPass,
                    "gpt-image-1.5": T.t2i,
                    "nano-banana": T.t2i,
                    "nano-banana-edit": T.i2i,
                    "nano-banana-pro": T.t2i,
                    "nano-banana-pro-edit": T.i2i,
                    "flux-schnell": T.t2i,
                    "flux-2-dev": T.t2i,
                    "flux-2-dev-edit": T.i2i,
                    "flux-2-flex": T.t2i,
                    "flux-2-flex-edit": T.i2i,
                    "flux-2-pro": T.t2i,
                    "flux-2-pro-edit": T.i2i,
                    "bytedance-seedream-v4": T.t2i,
                    "bytedance-seedream-edit-v4": T.i2i,
                    "bytedance-seedream-v4.5": ms({ prompt: F.prompt, aspect_ratio: F.aspect_ratio, quality: { enum: ["standard", "high"], type: "string", title: "Quality", default: "high" } }),
                    "bytedance-seedream-v4.5-edit": T.i2i,
                    "wan2.5-text-to-image": T.t2iWH,
                    "wan2.5-image-edit": T.i2i,
                    "wan2.6-text-to-image": T.t2iWH,
                    "wan2.6-image-edit": T.i2i,
                    "qwen-image": T.t2i,
                    "qwen-image-edit-2511": T.i2i,
                    "qwen-image-edit": T.i2i,
                    "qwen-image-edit-plus": T.i2i,
                    "qwen-image-edit-plus-lora": T.i2i,
                    "z-image-turbo": T.t2i,
                    "chroma-image": T.t2i,
                    "kling-o1-text-to-image": T.t2i,
                    "kling-o1-edit-image": T.i2i,
                    "grok-imagine-text-to-image": T.t2i,
                    "hunyuan-image-2.1": T.t2i,
                    "hunyuan-image-3.0": T.t2i,
                    "google-imagen4": T.t2i,
                    "google-imagen4-fast": T.t2i,
                    "google-imagen4-ultra": T.t2i,
                    "midjourney-v7-text-to-image": T.t2i,
                    "midjourney-v7-image-to-image": T.i2i,
                    "midjourney-v7-omni-reference": T.i2i,
                    "midjourney-v7-style-reference": T.i2i,
                    "vidu-q2-text-to-image": T.t2i,
                    "vidu-q2-reference-to-image": T.i2i,
                }
            },
            video: {
                models: {
                    "video-passthrough": T.vidPass,
                    "seedance-lite-i2v": T.i2vRes,
                    "seedance-lite-t2v": T.t2vRes,
                    "seedance-pro-t2v": T.t2vRes,
                    "seedance-pro-i2v": T.i2vRes,
                    "seedance-pro-t2v-fast": T.t2vRes,
                    "seedance-pro-i2v-fast": T.i2vRes,
                    "seedance-v1.5-pro-i2v": T.i2vRes,
                    "seedance-v1.5-pro-t2v": T.t2vRes,
                    "seedance-v1.5-pro-i2v-fast": T.i2vRes,
                    "seedance-v1.5-pro-t2v-fast": T.t2vRes,
                    "seedance-v1.5-pro-video-extend": T.i2v,
                    "seedance-v1.5-pro-video-extend-fast": T.i2v,
                    "veo3.1-image-to-video": T.i2v,
                    "veo3.1-text-to-video": T.t2v,
                    "veo3.1-fast-image-to-video": T.i2v,
                    "veo3.1-fast-text-to-video": T.t2v,
                    "wan2.2-text-to-video": T.t2v,
                    "wan2.2-image-to-video": T.i2v,
                    "wan2.2-5b-fast-t2v": T.t2v,
                    "wan2.2-animate": T.i2v,
                    "wan2.2-edit-video": T.vidEdit,
                    "wan2.2-spicy-image-to-video": T.i2v,
                    "wan2.2-spicy-video-extend": T.i2v,
                    "wan2.5-text-to-video": T.t2v,
                    "wan2.5-image-to-video": T.i2v,
                    "wan2.5-text-to-video-fast": T.t2v,
                    "wan2.5-image-to-video-fast": T.i2v,
                    "wan2.6-text-to-video": T.t2v,
                    "wan2.6-image-to-video": T.i2v,
                    "openai-sora": T.t2v,
                    "openai-sora-2-text-to-video": T.t2v,
                    "openai-sora-2-image-to-video": T.i2v,
                    "openai-sora-2-pro-text-to-video": T.t2v,
                    "openai-sora-2-pro-image-to-video": T.i2v,
                    "kling-v2.5-turbo-pro-t2v": T.t2v,
                    "kling-v2.5-turbo-pro-i2v": T.i2v,
                    "kling-v2.5-turbo-std-i2v": T.i2v,
                    "kling-v2.6-pro-t2v": T.t2v,
                    "kling-v2.6-pro-i2v": T.i2v,
                    "kling-v2.6-pro-motion-control": T.i2v,
                    "kling-o1-text-to-video": T.t2v,
                    "kling-o1-image-to-video": T.i2v,
                    "kling-o1-video-edit": T.vidEdit,
                    "kling-o1-video-edit-fast": T.vidEdit,
                    "kling-o1-reference-to-video": T.i2v,
                    "kling-o1-standard-image-to-video": T.i2v,
                    "kling-o1-standard-reference-to-video": T.i2v,
                    "kling-o1-standard-video-edit": T.vidEdit,
                    "grok-imagine-text-to-video": T.t2v,
                    "grok-imagine-image-to-video": T.i2v,
                    "hunyuan-text-to-video": T.t2v,
                    "hunyuan-fast-text-to-video": T.t2v,
                    "hunyuan-image-to-video": T.i2v,
                    "midjourney-v7-image-to-video": T.i2v,
                    "vidu-q2-turbo-start-end-video": T.i2v,
                    "vidu-q2-pro-start-end-video": T.i2v,
                    "vidu-q2-reference": T.i2v,
                    "luma-modify-video": T.vidEdit,
                    "luma-flash-reframe": T.vidEdit,
                }
            },
            text: {
                models: {
                    "text-passthrough": T.txtPass,
                    "any-llm": T.vision,
                    "openrouter-vision": T.vision,
                    "gpt-5-nano": T.vision,
                    "gpt-5-mini": T.vision,
                }
            },
            audio: {
                models: {
                    "audio-passthrough": T.audPass,
                    "suno-create-music": T.music,
                    "suno-extend-music": T.music,
                    "suno-remix-music": T.music,
                    "minimax-voice-clone": T.speech,
                    "minimax-speech-2.6-hd": T.speech,
                    "minimax-speech-2.6-turbo": T.speech,
                }
            },
        }
    };
}

export async function GET(request, { params }) {
    const { path = [] } = await params;

    // GET /api/workflow/get-workflow-def/{id}
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

    // GET /api/workflow/{id}/node-schemas
    if (path[1] === 'node-schemas') {
        return NextResponse.json(getNodeSchemas());
    }

    // GET /api/workflow/run/{runId}/status
    if (path[0] === 'run' && path[2] === 'status') {
        const runId = path[1];
        const run = runStore.get(runId);
        if (!run) return NextResponse.json({ status: 'processing', nodes: {} });
        return NextResponse.json(run);
    }

    // GET /api/workflow/{id}
    const id = path[0];
    if (!id) return NextResponse.json([]);
    const wf = store.get(id) || emptyWorkflow(id);
    return NextResponse.json(wf);
}

export async function POST(request, { params }) {
    const { path = [] } = await params;

    let body = {};
    try { body = await request.json(); } catch {}

    // POST /api/workflow/create
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

    // POST /api/workflow/{id}/run
    if (path[1] === 'run') {
        const runId = genId();
        return NextResponse.json({ run_id: runId, status: 'completed', result: {} });
    }

    // POST /api/workflow/{id}/node/{nodeId}/run
    if (path[1] === 'node' && path[3] === 'run') {
        const nodeId = path[2];
        const runId = body.run_id || genId();
        const apiKey = request.headers.get('authorization')?.replace('Bearer ', '') || '';
        const model = body.model || '';
        const params = body.params || {};
        // Start async generation, don't await
        runNode(runId, nodeId, model, params, apiKey).catch(() => {});
        return NextResponse.json({ run_id: runId, status: 'processing' });
    }

    // POST /api/workflow/{id}/publish|template|update-category|thumbnail
    if (['publish', 'template', 'update-category', 'thumbnail'].includes(path[1])) {
        return NextResponse.json({ success: true });
    }

    // POST /api/workflow/architect
    if (path[0] === 'architect') {
        const reqId = genId();
        return NextResponse.json({ request_id: reqId, status: 'completed', result: {} });
    }

    // POST /api/workflow/poll-architect/{id}/result
    if (path[0] === 'poll-architect') {
        return NextResponse.json({ status: 'completed', result: {} });
    }

    // Generic save/update
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
