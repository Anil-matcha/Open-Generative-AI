/**
 * lib/auth.js
 * Password hashing with bcrypt and session token generation.
 * Sessions are stored in SQLite (no JWT needed — simpler & more revocable).
 */

import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function generateSessionId() {
  return randomBytes(32).toString('hex');
}

export function sessionExpiresAt(days = 7) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().replace('T', ' ').split('.')[0];
}

/**
 * Read session cookie from a Next.js request.
 */
export function getSessionCookie(request) {
  return request.cookies.get('admin_session')?.value || null;
}

/**
 * Build a Set-Cookie header string for the session.
 */
export function buildSessionCookie(sessionId, maxAgeDays = 7) {
  const maxAge = maxAgeDays * 24 * 60 * 60;
  return `admin_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookie() {
  return `admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
