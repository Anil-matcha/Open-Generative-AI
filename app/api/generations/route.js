/**
 * app/api/generations/route.js
 * GET  — list generations (with project & type filters)
 * POST — save a completed generation to the DB (called by the Studio shell
 *        after each successful MuAPI generation)
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/requireAuth';
import { getGenerations, saveGeneration } from '@/lib/db-projects';

export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId') || null;
  const type = searchParams.get('type') || 'all';
  const limit = parseInt(searchParams.get('limit') || '60');
  const offset = parseInt(searchParams.get('offset') || '0');

  const generations = getGenerations({
    userId: user.uid,
    projectId,
    type,
    limit,
    offset,
  });

  return NextResponse.json(generations);
}

export async function POST(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const body = await request.json();
  const { projectId, type, prompt, model, outputUrl, thumbnailUrl, params, creditsUsed } = body || {};

  if (!outputUrl) {
    return NextResponse.json({ error: 'outputUrl é obrigatório' }, { status: 400 });
  }

  // If a projectId is provided, verify the user has access to it
  if (projectId) {
    const { getProjectById } = await import('@/lib/db-projects');
    const project = getProjectById(parseInt(projectId), user.uid);
    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado ou sem acesso' }, { status: 403 });
    }
  }

  const result = saveGeneration({
    userId: user.uid,
    projectId: projectId ? parseInt(projectId) : null,
    type: type || 'image',
    prompt: prompt || '',
    model: model || '',
    outputUrl,
    thumbnailUrl: thumbnailUrl || outputUrl,
    params: params || {},
    creditsUsed: creditsUsed || 0,
  });

  return NextResponse.json({ id: result.lastInsertRowid, ok: true });
}
