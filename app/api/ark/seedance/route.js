import { NextResponse } from 'next/server';
import { createHmac, createHash } from 'crypto';

// Volcano Ark video generation (Seedance 2.0) for the Studio — called directly,
// bypassing Memefast. Mirrors the proven workflow-builder flow: the server
// submits the task, polls it to completion, and mirrors the result into TOS, all
// within one request (maxDuration = 300). The browser makes a single POST and
// gets back the final, permanent video URL.
//
// Auth: long-lived Ark API Key (Bearer). Set ARK_API_KEY in env.
// Load balancing: round-robin across several inference endpoints (ep-...), set as
// comma-separated lists in ARK_SEEDANCE_ENDPOINTS / ARK_SEEDANCE_FAST_ENDPOINTS.

export const maxDuration = 300; // Vercel Pro: allow up to 5min for long generations

const ARK_BASE = 'https://ark.cn-beijing.volces.com/api/v3';
const ARK_API_KEY = process.env.ARK_API_KEY || '';

// TOS — used to mirror generated videos so they survive CDN expiry / CORS.
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
    const iso = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
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

// Download the finished Ark CDN video and mirror it to TOS. Falls back to the
// original URL on any error (so the user still gets a playable link).
async function maybeUploadVideoToTOS(videoUrl) {
  if (!videoUrl || !TOS_ENABLED) return videoUrl;
  const tosHost = `${TOS_BUCKET}.${TOS_ENDPOINT}`;
  if (videoUrl.startsWith(`https://${tosHost}`)) return videoUrl;
  try {
    const r = await fetch(videoUrl);
    if (!r.ok) return videoUrl;
    const buf = Buffer.from(await r.arrayBuffer());
    const ct = r.headers.get('content-type') || 'video/mp4';
    const ext = ct.includes('webm') ? 'webm' : ct.includes('mov') ? 'mov' : 'mp4';
    const key = `videos/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
    return (await tosUpload(key, buf, ct)) || videoUrl;
  } catch { return videoUrl; }
}

// Mirror a base64 data URL (or any source) into TOS — Ark cannot accept data URLs
// as input references, so resolve them to public URLs first.
async function maybeUploadToTOS(dataUrl) {
  if (!dataUrl || !TOS_ENABLED || !dataUrl.startsWith('data:')) return dataUrl;
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
  if (!m) return dataUrl;
  const ct = m[1];
  const buf = Buffer.from(m[2], 'base64');
  const ext = (ct.split('/')[1] || 'bin').split('+')[0];
  const key = `ref/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
  return (await tosUpload(key, buf, ct)) || dataUrl;
}

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

// POST /api/ark/seedance — submit, poll to completion, mirror to TOS, return { url, id }.
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
    } = body;

    // Ark needs public HTTP URLs — it cannot accept base64 data URLs. Resolve any.
    const resolvePublic = async (u) => {
      if (!u || typeof u !== 'string') return undefined;
      if (!u.startsWith('data:')) return u;
      const up = await maybeUploadToTOS(u);
      return (up && !up.startsWith('data:')) ? up : undefined;
    };

    // Collect reference images (single image_url and/or array of image_urls, 1-9).
    const rawImages = [];
    if (image_url) rawImages.push(image_url);
    if (Array.isArray(image_urls)) rawImages.push(...image_urls.filter(Boolean));
    const images = (await Promise.all(rawImages.map(resolvePublic))).filter(Boolean);
    const vUrl = await resolvePublic(video_url);
    const aUrl = await resolvePublic(audio_url);

    // Build content. A lone first image with no other media → first frame (I2V);
    // otherwise it's a multimodal reference scenario.
    const hasRefMedia = !!(vUrl || aUrl);
    const multiImage = images.length > 1;
    const content = [{ type: 'text', text: prompt || '' }];
    images.forEach((u) => {
      content.push({
        type: 'image_url',
        image_url: { url: u },
        role: hasRefMedia || multiImage ? 'reference_image' : 'first_frame',
      });
    });
    if (vUrl) content.push({ type: 'video_url', video_url: { url: vUrl }, role: 'reference_video' });
    if (aUrl) content.push({ type: 'audio_url', audio_url: { url: aUrl }, role: 'reference_audio' });

    // Round-robin within the matching pool; fall back to the bare model id.
    const model = pickEndpoint(fast) || (fast ? FAST_MODEL_ID : STD_MODEL_ID);

    const payload = { model, content, watermark: false };
    if (resolution) {
      let res = String(resolution).toLowerCase();
      if (fast && res === '1080p') res = '720p'; // Fast caps at 720p
      payload.resolution = res;
    }
    if (ratio) payload.ratio = ratio;
    if (duration != null && duration !== '') {
      payload.duration = Math.max(4, Math.min(15, Number(duration) || 5));
    }
    if (aUrl) payload.generate_audio = true;

    const submitRes = await fetch(`${ARK_BASE}/contents/generations/tasks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ARK_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!submitRes.ok) {
      const txt = await submitRes.text().catch(() => submitRes.statusText);
      return NextResponse.json({ error: `Ark submit ${submitRes.status}: ${txt.slice(0, 300)}` }, { status: submitRes.status });
    }
    const submitData = await submitRes.json();
    const taskId = submitData.id || submitData.task_id;
    if (!taskId) {
      return NextResponse.json({ error: 'Ark: no task id in response' }, { status: 502 });
    }

    // Poll for up to ~290s (58 attempts × 5s), within the 300s maxDuration.
    for (let i = 0; i < 58; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const pollRes = await fetch(`${ARK_BASE}/contents/generations/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${ARK_API_KEY}` },
      });
      if (!pollRes.ok) continue;
      const p = await pollRes.json();
      const st = String(p.status || '').toLowerCase();
      if (st === 'succeeded' || st === 'completed' || st === 'success') {
        const arkUrl = p.content?.video_url || p.video_url;
        if (!arkUrl) return NextResponse.json({ error: 'Ark succeeded but no video URL' }, { status: 502 });
        const finalUrl = await maybeUploadVideoToTOS(arkUrl);
        return NextResponse.json({ url: finalUrl, id: taskId, endpoint: model });
      }
      if (st === 'failed' || st === 'error' || st === 'expired' || st === 'cancelled') {
        return NextResponse.json(
          { error: p.error?.message || p.error || p.message || 'Ark video generation failed' },
          { status: 502 },
        );
      }
    }
    return NextResponse.json({ error: 'Ark video generation timed out' }, { status: 504 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
