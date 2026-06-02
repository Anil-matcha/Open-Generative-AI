import { NextResponse } from 'next/server';

// Volcano Ark video generation (Seedance 2.0) — called directly, bypassing Memefast.
// Auth: long-lived Ark API Key (Bearer). Set ARK_API_KEY in env.
// Load balancing: round-robin across several inference endpoints (ep-...), set as a
// comma-separated list in ARK_SEEDANCE_ENDPOINTS. Falls back to the model id.

const ARK_BASE = 'https://ark.cn-beijing.volces.com/api/v3';
const ARK_API_KEY = process.env.ARK_API_KEY || '';

// Endpoint pool for the standard Seedance 2.0 (260128). Overridable via env.
const DEFAULT_ENDPOINTS = [
  'ep-20260529025832-p9qqk',
  'ep-20260529025809-nv5bv',
  'ep-20260529025745-7qpzf',
  'ep-20260529025647-5xbjq',
  'ep-20260529022549-pwx2w',
];
const ENDPOINTS = (process.env.ARK_SEEDANCE_ENDPOINTS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const SEEDANCE_ENDPOINTS = ENDPOINTS.length > 0 ? ENDPOINTS : DEFAULT_ENDPOINTS;

const FAST_MODEL_ID = 'doubao-seedance-2-0-fast-260128';
const STD_MODEL_ID = 'doubao-seedance-2-0-260128';

// Round-robin index. Per serverless instance; seeded randomly so concurrent
// cold instances don't all start on the same endpoint.
let rrIndex = Math.floor(Math.random() * SEEDANCE_ENDPOINTS.length);
function pickEndpoint() {
  const ep = SEEDANCE_ENDPOINTS[rrIndex % SEEDANCE_ENDPOINTS.length];
  rrIndex = (rrIndex + 1) % SEEDANCE_ENDPOINTS.length;
  return ep;
}

function buildContent({ prompt, image_url, video_url, audio_url }) {
  const content = [];
  if (prompt) content.push({ type: 'text', text: prompt });

  // image + (video or audio) → multimodal reference scenario (mutually exclusive
  // with first-frame). image-only → first frame i2v.
  const hasRefMedia = !!(video_url || audio_url);
  if (image_url) {
    content.push({
      type: 'image_url',
      image_url: { url: image_url },
      role: hasRefMedia ? 'reference_image' : 'first_frame',
    });
  }
  if (video_url) {
    content.push({ type: 'video_url', video_url: { url: video_url }, role: 'reference_video' });
  }
  if (audio_url) {
    content.push({ type: 'audio_url', audio_url: { url: audio_url }, role: 'reference_audio' });
  }
  return content;
}

// POST /api/ark/seedance — submit a generation task, returns { taskId, endpoint }
export async function POST(request) {
  if (!ARK_API_KEY) {
    return NextResponse.json({ error: 'ARK_API_KEY not configured' }, { status: 503 });
  }
  try {
    const body = await request.json();
    const {
      fast = false,
      prompt = '',
      image_url,
      video_url,
      audio_url,
      resolution,
      ratio,
      duration,
      generate_audio = true,
    } = body;

    const content = buildContent({ prompt, image_url, video_url, audio_url });
    if (content.length === 0) {
      return NextResponse.json({ error: 'Empty content' }, { status: 400 });
    }

    // fast variant uses its own model id (the endpoint pool is for the std 260128).
    const model = fast ? FAST_MODEL_ID : (SEEDANCE_ENDPOINTS.length > 0 ? pickEndpoint() : STD_MODEL_ID);

    const payload = { model, content, generate_audio, watermark: false };
    if (resolution) payload.resolution = resolution;
    if (ratio) payload.ratio = ratio;
    if (duration != null && duration !== '') payload.duration = Number(duration);

    const r = await fetch(`${ARK_BASE}/contents/generations/tasks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ARK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return NextResponse.json(
        { error: data?.error?.message || data?.message || `Ark error ${r.status}` },
        { status: r.status },
      );
    }
    return NextResponse.json({ taskId: data.id, endpoint: model });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET /api/ark/seedance?taskId=... — poll a task, returns { status, url }
export async function GET(request) {
  if (!ARK_API_KEY) {
    return NextResponse.json({ error: 'ARK_API_KEY not configured' }, { status: 503 });
  }
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');
  if (!taskId) return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });

  try {
    const r = await fetch(`${ARK_BASE}/contents/generations/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${ARK_API_KEY}` },
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return NextResponse.json(
        { error: data?.error?.message || data?.message || `Ark error ${r.status}` },
        { status: r.status },
      );
    }
    const status = data.status || 'running';
    const url = data.content?.video_url || data.video_url || null;
    return NextResponse.json({ status, url, error: data.error?.message || null });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
