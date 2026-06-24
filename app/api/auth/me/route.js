/**
 * app/api/auth/me/route.js
 * Returns the current user from session (used by client to hydrate auth state).
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/requireAuth';

export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  return NextResponse.json({
    id: user.uid,
    name: user.name,
    email: user.email,
    role: user.role,
    credits: user.credits,
    credit_limit: user.credit_limit ?? null,
  });
}
