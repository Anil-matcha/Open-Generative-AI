import { NextResponse } from 'next/server';

// Seedance 2.0 video for the Workflow builder — routed through the SAME hosted
// MuAPI backend the Studio uses (api.muapi.ai), instead of calling Volcano ARK
// directly. The Studio is reliable precisely because MuAPI manages the ARK task
// server-side and the client only does short submit + poll requests; the direct
// ARK path left workflow nodes stuck on "GENERATING…" when a task never reached
// "succeeded".
//
// Architecture (submit-and-poll from the BROWSER, each request < 2s):
//   POST /api/muapi/video          → submit task, returns { requestId }
//   GET  /api/muapi/video?id=...   → poll status,  returns { status, url }
//
// Auth: the user's MuAPI key, read from the `muapi_key` cookie or the
// Authorization/x-api-key header — exactly how the workflow /run route resolves
// it. MuAPI expects the key in the `x-api-key` header.

const MUAPI_BASE = 'https://api.muapi.ai';

function resolveKey(request) {
  const cookieKey = request.headers.get('cookie')?.match(/muapi_key=([^;]+)/)?.[1] || '';
  const authKey = request.headers.get('authorization')?.replace('Bearer ', '') || '';
  const headerKey = request.headers.get('x-api-key') || '';
  return authKey || headerKey || cookieKey || '';
}

// POST /api/muapi/video — submit a Seedance generation, returns { requestId }.
export async function POST(request) {
  const key = resolveKey(request);
  if (!key) {
    return NextResponse.json({ error: 'MuAPI key missing — войдите в аккаунт' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { model, prompt, image_url, aspect_ratio, resolution, duration } = body;
    if (!model) {
      return NextResponse.json({ error: 'Missing model' }, { status: 400 });
    }

    // Mirror MuapiClient.generateVideo/generateI2V: only send fields that exist.
    const payload = {};
    if (prompt) payload.prompt = prompt;
    if (image_url) payload.image_url = image_url;
    if (aspect_ratio) payload.aspect_ratio = aspect_ratio;
    if (resolution) payload.resolution = resolution;
    if (duration != null && duration !== '') payload.duration = duration;

    const r = await fetch(`${MUAPI_BASE}/api/v1/${model}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key },
      body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return NextResponse.json(
        { error: data?.error || data?.message || `MuAPI error ${r.status}` },
        { status: r.status },
      );
    }

    const requestId = data.request_id || data.id;
    // Some endpoints return a finished result directly (no polling needed).
    const directUrl = data.outputs?.[0] || data.url || data.output?.url || null;
    if (!requestId && !directUrl) {
      return NextResponse.json({ error: 'MuAPI: no request_id in response' }, { status: 502 });
    }
    return NextResponse.json({ requestId: requestId || null, url: directUrl });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET /api/muapi/video?id=... — poll a task, returns { status, url }.
export async function GET(request) {
  const key = resolveKey(request);
  if (!key) {
    return NextResponse.json({ error: 'MuAPI key missing — войдите в аккаунт' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  try {
    const r = await fetch(`${MUAPI_BASE}/api/v1/predictions/${id}/result`, {
      headers: { 'Content-Type': 'application/json', 'x-api-key': key },
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      // 5xx is transient — let the browser keep polling.
      return NextResponse.json(
        { status: r.status >= 500 ? 'running' : 'failed', error: data?.error || data?.message || `MuAPI error ${r.status}` },
        { status: 200 },
      );
    }
    const status = String(data.status || 'running').toLowerCase();
    const url = data.outputs?.[0] || data.url || data.output?.url || null;
    return NextResponse.json({ status, url, error: data.error || null });
  } catch (e) {
    // Network blip — keep the browser polling rather than failing the run.
    return NextResponse.json({ status: 'running', error: e.message }, { status: 200 });
  }
}
