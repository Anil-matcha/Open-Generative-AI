import { NextResponse } from 'next/server';

// Volcano Ark video generation (Seedance 2.0) — called directly, bypassing Memefast.
// Auth: long-lived Ark API Key (Bearer). Set ARK_API_KEY in env.
// Load balancing: round-robin across several inference endpoints (ep-...), set as a
// comma-separated list in ARK_SEEDANCE_ENDPOINTS. Falls back to the model id.
//
// Architecture: submit-and-poll from the BROWSER to avoid hanging long HTTP connections.
//   POST /api/ark/seedance         → submit task, returns { taskId, endpoint }
//   GET  /api/ark/seedance?taskId= → poll status, returns { status, url }
// Each request is short-lived (< 2s), so no Vercel timeout issues.

const ARK_BASE = 'https://ark.cn-beijing.volces.com/api/v3';
const ARK_API_KEY = process.env.ARK_API_KEY || '';

function parseEndpoints(envVal, fallback) {
  const list = (envVal || '').split(',').map((s) => s.trim()).filter(Boolean);
  return list.length > 0 ? list : fallback;
}

// Two separate endpoint pools — Seedance 2.0 (full) and Seedance 2.0 Fast.
// Each is round-robin load-balanced. Override via env (comma-separated ep- ids):
//   ARK_SEEDANCE_ENDPOINTS       — full (Doubao-Seedance-2.0)
//   ARK_SEEDANCE_FAST_ENDPOINTS  — fast (Doubao-Seedance-2.0-fast)
const FULL_ENDPOINTS = parseEndpoints(process.env.ARK_SEEDANCE_ENDPOINTS, [
  'ep-20260529025832-p9qqk',
  'ep-20260529025809-nv5bv',
  'ep-20260529025745-7qpzf',
  'ep-20260529025647-5xbjq',
  'ep-20260529022549-pwx2w',
]);
const FAST_ENDPOINTS = parseEndpoints(process.env.ARK_SEEDANCE_FAST_ENDPOINTS, [
  'ep-20260602191805-lkvlm',
  'ep-20260602191309-2d24d',
  'ep-20260602191215-9dpxn',
  'ep-20260602191152-xctn2',
  'ep-20260602190812-pqwdx',
]);

const FAST_MODEL_ID = 'doubao-seedance-2-0-fast-260128';
const STD_MODEL_ID  = 'doubao-seedance-2-0-260128';

// Per-pool round-robin index, seeded randomly so concurrent cold serverless
// instances don't all start on the same endpoint.
const rrIndex = {
  full: Math.floor(Math.random() * Math.max(1, FULL_ENDPOINTS.length)),
  fast: Math.floor(Math.random() * Math.max(1, FAST_ENDPOINTS.length)),
};
function pickEndpoint(fast) {
  const pool = fast ? FAST_ENDPOINTS : FULL_ENDPOINTS;
  const key  = fast ? 'fast' : 'full';
  if (pool.length === 0) return null;
  const ep = pool[rrIndex[key] % pool.length];
  rrIndex[key] = (rrIndex[key] + 1) % pool.length;
  return ep;
}

function buildContent({ prompt, image_url, image_urls, video_url, video_urls, audio_url, audio_urls }) {
  const content = [];
  if (prompt) content.push({ type: 'text', text: prompt });

  const images = [];
  if (image_url) images.push(image_url);
  if (Array.isArray(image_urls)) images.push(...image_urls.filter(Boolean));

  const videos = [];
  if (video_url) videos.push(video_url);
  if (Array.isArray(video_urls)) videos.push(...video_urls.filter(Boolean));

  const audios = [];
  if (audio_url) audios.push(audio_url);
  if (Array.isArray(audio_urls)) audios.push(...audio_urls.filter(Boolean));

  // Single image with no other media → first-frame I2V (no role, per Ark docs).
  // Multiple images or image + video/audio → multimodal reference (role: reference_image).
  const hasRefMedia = videos.length > 0 || audios.length > 0;
  const multiImage  = images.length > 1;
  images.forEach((u) => {
    const item = { type: 'image_url', image_url: { url: u } };
    if (hasRefMedia || multiImage) item.role = 'reference_image';
    content.push(item);
  });
  videos.forEach((u) => content.push({ type: 'video_url', video_url: { url: u }, role: 'reference_video' }));
  audios.forEach((u) => content.push({ type: 'audio_url', audio_url: { url: u }, role: 'reference_audio' }));
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
      image_urls,
      video_url,
      video_urls,
      audio_url,
      audio_urls,
      resolution,
      ratio,
      duration,
      generate_audio = true,
    } = body;

    const content = buildContent({ prompt, image_url, image_urls, video_url, video_urls, audio_url, audio_urls });
    if (content.length === 0) {
      return NextResponse.json({ error: 'Empty content' }, { status: 400 });
    }

    const model = pickEndpoint(fast) || (fast ? FAST_MODEL_ID : STD_MODEL_ID);

    const payload = { model, content, generate_audio, watermark: false };
    if (resolution) {
      let res = String(resolution).toLowerCase();
      if (fast && res === '1080p') res = '720p'; // Fast caps at 720p
      payload.resolution = res;
    }
    if (ratio) payload.ratio = ratio;
    if (duration != null && duration !== '') payload.duration = Math.max(4, Math.min(15, Number(duration) || 5));

    const r = await fetch(`${ARK_BASE}/contents/generations/tasks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ARK_API_KEY}`, 'Content-Type': 'application/json' },
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
