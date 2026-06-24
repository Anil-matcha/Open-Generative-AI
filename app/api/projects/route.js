import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/requireAuth';
import { getProjectsForUser, getProjectsCostForUser, createProject } from '@/lib/db-projects';

export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  const projects = getProjectsForUser(user.uid);
  const costMap = getProjectsCostForUser(user.uid);
  const enriched = projects.map(p => ({
    ...p,
    cost: costMap.get(p.id) || { total: 0, byType: {} },
  }));
  return NextResponse.json(enriched);
}

export async function POST(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  const { name, description, color } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Nome do projeto é obrigatório' }, { status: 400 });
  }
  const result = createProject({
    ownerId: user.uid,
    name: name.trim(),
    description: description?.trim() || '',
    color: color || '#7F77DD',
  });
  return NextResponse.json({ id: result.lastInsertRowid, ok: true });
}
