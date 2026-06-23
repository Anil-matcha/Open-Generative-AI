/**
 * app/api/auth/logout/route.js
 */
import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/db';
import { getSessionCookie, clearSessionCookie } from '@/lib/auth';

export async function POST(request) {
  const sessionId = getSessionCookie(request);
  if (sessionId) deleteSession(sessionId);

  const response = NextResponse.json({ ok: true });
  response.headers.set('Set-Cookie', clearSessionCookie());
  return response;
}
