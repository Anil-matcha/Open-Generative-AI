/**
 * app/api/v1/[[...path]]/route.js
 *
 * Replaces the original proxy with one that:
 * 1. Validates session
 * 2. Injects master MuAPI key (never exposed to client)
 * 3. Deducts credits from user on successful generation
 * 4. Logs usage
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/requireAuth';
import { deductCredits, logUsage, getUserById, getDb } from '@/lib/db';

const MUAPI_BASE = 'https://api.muapi.ai';

// Approximate credit cost per endpoint (adjust to match your MuAPI pricing)
const ENDPOINT_COSTS = {
  'predictions': 1,         // image generation ~1 credit
  'video':       5,         // video generation ~5 credits
  'lipsync':     3,
  'clipping':    2,
  'default':     1,
};

function getCostForPath(path) {
  const lower = path.toLowerCase();
  if (lower.includes('video') || lower.includes('kling') || lower.includes('wan') || lower.includes('seedance')) return ENDPOINT_COSTS.video;
  if (lower.includes('lipsync') || lower.includes('lip')) return ENDPOINT_COSTS.lipsync;
  if (lower.includes('clipping')) return ENDPOINT_COSTS.clipping;
  return ENDPOINT_COSTS.default;
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

  // Check credits before making the API call (for POST/generation requests)
  const cost = getCostForPath(path);
  const isGeneration = method === 'POST' && !path.includes('predictions/') && !path.includes('balance');

  if (isGeneration && user.credits < cost) {
    return NextResponse.json(
      { error: `Créditos insuficientes. Disponível: ${user.credits.toFixed(1)}, necessário: ${cost}` },
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
