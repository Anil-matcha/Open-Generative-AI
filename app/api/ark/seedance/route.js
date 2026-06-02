import { NextResponse } from 'next/server';
import { createHmac, createHash } from 'crypto';

// Volcano Ark video generation (Seedance 2.0) — called directly, bypassing Memefast.
// Auth: long-lived Ark API Key (Bearer). Set ARK_API_KEY in env.
// Load balancing: round-robin across several inference endpoints (ep-...), set as a
// comma-separated list in ARK_SEEDANCE_ENDPOINTS. Falls back to the model id.

const ARK_BASE = 'https://ark.cn-beijing.volces.com/api/v3';
const ARK_API_KEY = process.env.ARK_API_KEY || '';

// TOS — used to mirror generated videos so they survive CDN expiry.
const TOS_ENDPOINT = process.env.TOS_ENDPOINT || '';
const TOS_BUCKET   = process.env.TOS_BUCKET   || '';
const TOS_REGION   = process.env.TOS_REGION   || 'cn-beijing';
const TOS_AK       = process.env.TOS_ACCESS_KEY || '';
const TOS_SK       = process.env.TOS_SECRET_KEY || '';
const TOS_ENABLED  = !!(TOS_ENDPOINT && TOS_BUCKET && TOS_AK && TOS_SK);

function sha256hex(data) { return createHash('sha256').update(data).digest('hex'); }
function hmac(key, data)  { return createHmac('sha256', key).update(data).digest(); }

async function tosUpload(key, buffer, contentType) {
  if (!TOS_ENABLED) return null;
  try {
    const now = new Date();
    const iso = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const date = iso.slice(0, 8);
    const host = `${TOS_BUCKET}.${TOS_ENDPOINT}`;
    const payloadHash = sha256hex(buffer);
    const canonHeaders = `content-length:${buffer.length}\ncontent-type:${contentType}\nhost:${host}\nx-tos-content-sha256:${payloadHash}\nx-tos-date:${iso}\n`;
    const signedHeaders = 'content-length;content-type;host;x-tos-content-sha256;x-tos-date';
    const canonical = `PUT\n/${key}\n\n${canonHeaders}\n${signedHeaders}\n${payloadHash}`;
    const scope = `${date}/${TOS_REGION}/tos/request`;
    const strToSign = `TOS4-HMAC-SHA256\n${iso}\n${scope}\n${sha256hex(canonical)}`;
    const sigKey = hmac(hmac(hmac(hmac(TOS_SK, date), TOS_REGION), 'tos'), 'request');
    const sig = createHmac('sha256', sigKey).update(strToSign).digest('hex');
    const auth = `TOS4-HMAC-SHA256 Credential=${TOS_AK}/${scope}, SignedHeaders=${signedHeaders}, Signature=${sig}`;
    const res = await fetch(`https://${host}/${key}`, {
      method: 'PUT',
      headers: {
        Authorization: auth,
        'Content-Type': contentType,
        'Content-Length': String(buffer.length),
        'X-Tos-Content-Sha256': payloadHash,
        'X-Tos-Date': iso,
      },
      body: buffer,
    });
    if (!res.ok) { console.error('TOS upload failed:', res.status, await res.text().catch(() => '')); return null; }
    return `https://${host}/${key}`;
  } catch (e) { console.error('TOS upload error:', e.message); return null; }
}

// Download an Ark CDN video and mirror it to TOS. Falls back to the original URL on any error.
async function mirrorVideoToTOS(arkUrl) {
  if (!arkUrl || !TOS_ENABLED) return arkUrl;
  const tosHost = `${TOS_BUCKET}.${TOS_ENDPOINT}`;
  if (arkUrl.startsWith(`https://${tosHost}`)) return arkUrl;
  try {
    const r = await fetch(arkUrl);
    if (!r.ok) return arkUrl;
    const buf = Buffer.from(await r.arrayBuffer());
    const ct = r.headers.get('content-type') || 'video/mp4';
    const ext = ct.includes('webm') ? 'webm' : ct.includes('mov') ? 'mov' : 'mp4';
    const key = `videos/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
    return (await tosUpload(key, buf, ct)) || arkUrl;
  } catch { return arkUrl; }
}

function parseEndpoints(envVal, fallback) {
  const list = (envVal || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
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
const STD_MODEL_ID = 'doubao-seedance-2-0-260128';

// Per-pool round-robin index, seeded randomly so concurrent cold serverless
// instances don't all start on the same endpoint.
const rrIndex = {
  full: Math.floor(Math.random() * Math.max(1, FULL_ENDPOINTS.length)),
  fast: Math.floor(Math.random() * Math.max(1, FAST_ENDPOINTS.length)),
};
function pickEndpoint(fast) {
  const pool = fast ? FAST_ENDPOINTS : FULL_ENDPOINTS;
  const key = fast ? 'fast' : 'full';
  if (pool.length === 0) return null;
  const ep = pool[rrIndex[key] % pool.length];
  rrIndex[key] = (rrIndex[key] + 1) % pool.length;
  return ep;
}

function buildContent({ prompt, image_url, image_urls, video_url, audio_url }) {
  const content = [];
  if (prompt) content.push({ type: 'text', text: prompt });

  // Collect images: single image_url and/or an array of image_urls (1-9 refs).
  const images = [];
  if (image_url) images.push(image_url);
  if (Array.isArray(image_urls)) images.push(...image_urls.filter(Boolean));

  // image(s) + (video or audio) → multimodal reference scenario → role: reference_image.
  // A single image with no other media → first-frame I2V (no role field, per Ark docs).
  const hasRefMedia = !!(video_url || audio_url);
  const multiImage = images.length > 1;
  images.forEach((u) => {
    const item = { type: 'image_url', image_url: { url: u } };
    if (hasRefMedia || multiImage) item.role = 'reference_image';
    content.push(item);
  });
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
      image_urls,
      video_url,
      audio_url,
      resolution,
      ratio,
      duration,
      generate_audio = true,
    } = body;

    const content = buildContent({ prompt, image_url, image_urls, video_url, audio_url });
    if (content.length === 0) {
      return NextResponse.json({ error: 'Empty content' }, { status: 400 });
    }

    // Round-robin within the matching pool; fall back to the bare model id if a
    // pool is empty.
    const model = pickEndpoint(fast) || (fast ? FAST_MODEL_ID : STD_MODEL_ID);

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
// On success, mirrors the Ark CDN video to TOS for permanent storage.
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
    const arkUrl = data.content?.video_url || data.video_url || null;

    // Mirror to TOS on success so the video survives CDN expiry and is accessible.
    const url = (status === 'succeeded' && arkUrl)
      ? await mirrorVideoToTOS(arkUrl)
      : arkUrl;

    return NextResponse.json({ status, url, error: data.error?.message || null });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
