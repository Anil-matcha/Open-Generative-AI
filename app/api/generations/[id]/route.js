/**
 * app/api/generations/[id]/route.js
 * PATCH  — mover para outro projeto
 * DELETE — apagar geração
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/requireAuth';
import { getGenerationById, moveGeneration, deleteGeneration } from '@/lib/db-projects';

export async function PATCH(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  const { projectId } = await request.json();

  const gen = getGenerationById(parseInt(id), user.uid);
  if (!gen) return NextResponse.json({ error: 'Geração não encontrada' }, { status: 404 });

  moveGeneration(parseInt(id), user.uid, projectId || null);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  const gen = getGenerationById(parseInt(id), user.uid);
  if (!gen) return NextResponse.json({ error: 'Geração não encontrada' }, { status: 404 });

  deleteGeneration(parseInt(id), user.uid);
  return NextResponse.json({ ok: true });
}
