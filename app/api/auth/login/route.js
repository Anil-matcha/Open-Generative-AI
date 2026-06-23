/**
 * app/api/auth/login/route.js
 */
import { NextResponse } from 'next/server';
import { getUserByEmail, createSession, getDb } from '@/lib/db';
import { verifyPassword, generateSessionId, sessionExpiresAt, buildSessionCookie } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha obrigatórios' }, { status: 400 });
    }

    const user = getUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    if (!user.active) {
      return NextResponse.json({ error: 'Conta desativada. Contate o administrador.' }, { status: 403 });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    // Update last_login
    getDb().prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);

    // Create session
    const sessionId = generateSessionId();
    const expiresAt = sessionExpiresAt(7);
    createSession(sessionId, user.id, expiresAt);

    const response = NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });

    response.headers.set('Set-Cookie', buildSessionCookie(sessionId));
    return response;
  } catch (err) {
    console.error('[Login]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
