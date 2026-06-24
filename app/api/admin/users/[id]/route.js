/**
 * app/api/admin/users/[id]/route.js
 * PATCH  — update user fields (name, email, active, role)
 * DELETE — remove user
 */
import { NextResponse } from 'next/server';
import { getUserById, updateUser, deleteUser, adjustCredits, setUserPassword, logUsage } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAuth';
import { hashPassword } from '@/lib/auth';

export async function PATCH(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  const user = getUserById(parseInt(id));
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

  // Handle credit adjustment separately
  if (typeof body.creditDelta === 'number') {
    adjustCredits(user.id, body.creditDelta);
    // Log the credit change
    const label = body.creditDelta > 0 ? 'credit_add' : 'credit_deduct';
    logUsage(user.id, label, Math.abs(body.creditDelta), 'admin_panel');
  }

  // Handle password reset
  if (body.password) {
    const hashed = await hashPassword(body.password);
    setUserPassword(user.id, hashed);
  }

  // Update regular fields
  const fields = {};
  if (body.name !== undefined) fields.name = body.name;
  if (body.email !== undefined) fields.email = body.email.toLowerCase().trim();
  if (body.active !== undefined) fields.active = body.active ? 1 : 0;
  if (body.role !== undefined) fields.role = body.role;
  if (body.credit_limit !== undefined) fields.credit_limit = body.credit_limit == null || body.credit_limit === '' ? null : parseFloat(body.credit_limit);

  if (Object.keys(fields).length > 0) {
    updateUser(user.id, fields);
  }

  return NextResponse.json({ ok: true, user: getUserById(user.id) });
}

export async function DELETE(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { id } = await params;
  const user = getUserById(parseInt(id));
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
  if (user.role === 'admin') return NextResponse.json({ error: 'Não é possível remover administradores' }, { status: 400 });

  deleteUser(user.id);
  return NextResponse.json({ ok: true });
}
