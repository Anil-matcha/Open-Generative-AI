/**
 * app/api/admin/users/route.js
 * GET  /api/admin/users          — list all users
 * POST /api/admin/users          — create new user
 */
import { NextResponse } from 'next/server';
import { getAllUsers, createUser } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAuth';
import { hashPassword } from '@/lib/auth';

export async function GET(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const users = getAllUsers();
  return NextResponse.json(users);
}

export async function POST(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { name, email, password, role = 'user', credits = 0 } = await request.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: 'name, email e password são obrigatórios' }, { status: 400 });
  }

  const hashed = await hashPassword(password);

  try {
    const result = createUser({
      name,
      email: email.toLowerCase().trim(),
      password: hashed,
      role,
      credits: parseFloat(credits) || 0,
    });
    return NextResponse.json({ id: result.lastInsertRowid, ok: true });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 });
    }
    throw err;
  }
}
