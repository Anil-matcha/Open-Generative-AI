import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/requireAuth';
import { getProjectById, updateProject, deleteProject, getProjectMembers, getProjectStats } from '@/lib/db-projects';

export async function GET(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  const { id } = await params;
  const project = getProjectById(parseInt(id), user.uid);
  if (!project) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
  const members = getProjectMembers(parseInt(id));
  const stats = getProjectStats(parseInt(id));
  return NextResponse.json({ ...project, members, stats });
}

export async function PATCH(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  const { id } = await params;
  const project = getProjectById(parseInt(id), user.uid);
  if (!project) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
  if (project.my_role !== 'owner' && project.my_role !== 'editor') {
    return NextResponse.json({ error: 'Sem permissão para editar' }, { status: 403 });
  }
  const body = await request.json();
  updateProject(parseInt(id), user.uid, body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  const { id } = await params;
  const project = getProjectById(parseInt(id), user.uid);
  if (!project) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
  if (project.my_role !== 'owner') {
    return NextResponse.json({ error: 'Apenas o dono pode deletar o projeto' }, { status: 403 });
  }
  deleteProject(parseInt(id), user.uid);
  return NextResponse.json({ ok: true });
}
