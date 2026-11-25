import { cookies } from 'next/headers';
import { accessConfigured, issueSession, passwordMatches, SESSION_COOKIE, SESSION_SECONDS } from '@/lib/personal/access.mjs';

export const runtime = 'nodejs';
export const maxDuration = 10;

function sameOrigin(request) {
  // Next.js may construct request.url with an internal hostname behind a proxy.
  // Compare the browser origin with the public Host header, preserving its port.
  try {
    const origin = new URL(request.headers.get('origin'));
    return ['https:', 'http:'].includes(origin.protocol) && origin.host === request.headers.get('host');
  } catch { return false; }
}
export async function POST(request) {
  if (!sameOrigin(request)) return Response.json({ error: 'İstek kaynağı geçersiz.' }, { status: 403 });
  if (!accessConfigured()) return Response.json({ error: 'Sunucuda STUDIO_PASSWORD (en az 12 karakter) ve STUDIO_SESSION_SECRET (en az 32 karakter) tanımlayın.' }, { status: 503 });
  let data;
  try {
    if (!request.body) throw new Error('Missing body');
    const reader = request.body.getReader();
    const chunks = []; let size = 0;
    try {
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        size += value.byteLength;
        if (size > 2048) { await reader.cancel(); return Response.json({ error: 'Giriş isteği çok büyük.' }, { status: 413 }); }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    data = JSON.parse(await new Blob(chunks).text());
  } catch { return Response.json({ error: 'Geçersiz istek.' }, { status: 400 }); }
  if (!await passwordMatches(data?.password, process.env.STUDIO_PASSWORD)) return Response.json({ error: 'Parola yanlış.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await issueSession(process.env.STUDIO_SESSION_SECRET), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: SESSION_SECONDS,
  });
  return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
export async function DELETE(request) {
  if (!sameOrigin(request)) return Response.json({ error: 'İstek kaynağı geçersiz.' }, { status: 403 });
  (await cookies()).delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
