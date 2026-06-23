/**
 * lib/requireAuth.js
 * Used by API route handlers to validate session and return user.
 * Also provides requireAdmin for admin-only endpoints.
 */

import { getSession, getSetting, updateUser } from './db.js';
import { getSessionCookie } from './auth.js';
import { NextResponse } from 'next/server';

/**
 * Validates the session cookie and returns { user, masterKey }.
 * Returns a 401 NextResponse if invalid.
 */
export async function requireAuth(request) {
  const sessionId = getSessionCookie(request);
  if (!sessionId) {
    return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };
  }

  const session = getSession(sessionId);
  if (!session) {
    return { error: NextResponse.json({ error: 'Session expired' }, { status: 401 }) };
  }

  if (!session.active) {
    return { error: NextResponse.json({ error: 'Account disabled' }, { status: 403 }) };
  }

  const masterKey = getSetting('muapi_master_key');

  return { user: session, masterKey };
}

/**
 * Like requireAuth but also enforces admin role.
 */
export async function requireAdmin(request) {
  const result = await requireAuth(request);
  if (result.error) return result;
  if (result.user.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return result;
}

/**
 * Update last_login timestamp for a user.
 */
export function touchLastLogin(userId) {
  try {
    const { getDb } = require('./db.js');
    getDb().prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(userId);
  } catch (_) {}
}
