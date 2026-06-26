/**
 * app/api/v1/[[...path]]/route.js
 *
 * Replaces the original proxy with one that:
 * 1. Validates session
 * 2. Injects master MuAPI key (never exposed to client)
 * 3. Estimates cost from MuAPI before generation
 * 4. Deducts credits from user on successful generation (real cost, not fixed)
 * 5. Logs usage
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/requireAuth';
import { deductCredits, logUsage, getUserById, getDb } from '@/lib/db';

const MUAPI_BASE = 'https://api.muapi.ai';

// Fallback costs (USD) — used only if MuAPI estimate-cost endpoint fails.
// Credits = USD 1:1 (admin places N credits = user can spend $N).
const FALLBACK_COSTS = {
  'video':       5,
  'lipsync':     3,
  'clipping':    2,
  'default':     1,
};

function fallbackCostForPath(path) {
  const lower = path.toLowerCase();
  if (lower.includes('video') || lower.includes('kling') || lower.includes('wan') || lower.includes('seedance')) return FALLBACK_COSTS.video;
  if (lower.includes('lipsync') || lower.includes('lip')) return FALLBACK_COSTS.lipsync;
  if (lower.includes('clipping')) return FALLBACK_COSTS.clipping;
  return FALLBACK_COSTS.default;
}

// Resolve the actual cost of a generation by calling MuAPI estimate-cost.
// Returns USD cost (number), or null if endpoint couldn't determine it.
async function getRealCost({ masterKey, model, body }) {
  if (!model) return null;
  try {
    let params = {};
    try {
      const text = new TextDecoder().decode(body);
      if (text) params = JSON.parse(text);
    } catch { /* non-JSON body, skip */ }
    const res = await fetch(`${MUAPI_BASE}/api/v1/models/${model}/estimate-cost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': masterKey },
      body: JSON.stringify(params),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data.cost === 'number' && data.cost >= 0) return data.cost;
    return null;
  } catch {
    return null;
  }
}

async function proxyRequest(request, params) {
  const { user, masterKey, error } = await requireAuth(request);
  if (error) return error;

  if (!masterKey) {
    return NextResponse.json(
      { error: 'MuAPI master key não configurada. Contate o administrador.' },
      { status: 503 }
    );
  }

  const slug = await params;
  const pathSegments = slug.path || [];
  const path = pathSegments.join('/');
  const { search } = new URL(request.url);
  const targetUrl = `${MUAPI_BASE}/api/v1/${path}${search}`;

  const method = request.method;
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('connection');
  headers.delete('cookie');
  // Inject master key
  headers.set('x-api-key', masterKey);

  let body = undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    body = await request.arrayBuffer();
  }

  const isGeneration = method === 'POST' && !path.includes('predictions/') && !path.includes('balance');

  // Resolve real cost BEFORE the generation call (so we can validate credits).
  // MuAPI uses {model: 'seedance-2-i2v'} or {model: 'seedance-2-vip-omni-reference-4k'}
  // for estimate-cost — pass it through unchanged.
  let cost = isGeneration ? fallbackCostForPath(path) : 0;
  if (isGeneration) {
    const model = (() => {
      try {
        const text = new TextDecoder().decode(body);
        if (!text) return null;
        const parsed = JSON.parse(text);
        return parsed?.model || null;
      } catch { return null; }
    })();
    const real = await getRealCost({ masterKey, model, body });
    if (real !== null) cost = real;
  }

  if (isGeneration && user.credits < cost) {
    return NextResponse.json(
      { error: `Créditos insuficientes. Disponível: ${user.credits.toFixed(2)}, necessário: ${cost.toFixed(2)}` },
      { status: 402 }
    );
  }
  if (isGeneration && user.credit_limit != null && user.credits >= user.credit_limit) {
    return NextResponse.json(
      { error: `Limite de créditos atingido (${user.credit_limit}). Aguarde recarga.` },
      { status: 402 }
    );
  }

  try {
    const upstream = await fetch(targetUrl, { method, headers, body });
    const contentType = upstream.headers.get('Content-Type') || 'application/json';
    const buffer = await upstream.arrayBuffer();

    // Deduct credits on success (2xx) for generation calls
    if (isGeneration && upstream.status >= 200 && upstream.status < 300) {
      try {
        deductCredits(user.uid, cost);
        logUsage(user.uid, 'generation', cost, path);
      } catch (creditErr) {
        console.warn('[Credits]', creditErr.message);
      }
    }

    return new NextResponse(buffer, {
      status: upstream.status,
      headers: { 'Content-Type': contentType },
    });
  } catch (err) {
    console.error('[Proxy v1]', err);
    return NextResponse.json({ error: 'Erro ao conectar com MuAPI' }, { status: 502 });
  }
}

export const GET = (req, { params }) => proxyRequest(req, params);
export const POST = (req, { params }) => proxyRequest(req, params);
export const DELETE = (req, { params }) => proxyRequest(req, params);
export const PUT = (req, { params }) => proxyRequest(req, params);
