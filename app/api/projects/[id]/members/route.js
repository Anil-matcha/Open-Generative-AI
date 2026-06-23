import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/requireAuth';
import { getProjectById, getProjectMembers, addProjectMember, removeProjectMember, updateMemberRole } from '@/lib/db-projects';
import { getUserByEmail } from '@/lib/db';

export async function GET(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  const { id } = await params;
  const project = getProjectById(parseInt(id), user.uid);
  if (!project) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
  const members = getProjectMembers(parseInt(id));
  return NextResponse.json(members);
}

export async function POST(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  const { id } = await params;
  const project = getProjectById(parseInt(id), user.uid);
  if (!project) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
  if (project.my_role !== 'owner') return NextResponse.json({ error: 'Apenas o dono pode convidar membros' }, { status: 403 });
  const { email, role = 'viewer' } = await request.json();
  if (!email) return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 });
  const targetUser = getUserByEmail(email.toLowerCase().trim());
  if (!targetUser) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
  if (targetUser.id === user.uid) return NextResponse.json({ error: 'Você já é o dono do projeto' }, { status: 400 });
  addProjectMember(parseInt(id), targetUser.id, role);
  return NextResponse.json({ ok: true, userName: targetUser.name });
}

export async function PATCH(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  const { id } = await params;
  const project = getProjectById(parseInt(id), user.uid);
  if (!project || project.my_role !== 'owner') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  const { userId, role } = await request.json();
  updateMemberRole(parseInt(id), userId, role);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  const { id } = await params;
  const project = getProjectById(parseInt(id), user.uid);
  if (!project) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
  const { userId } = await request.json();
  if (project.my_role !== 'owner' && userId !== user.uid) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  removeProjectMember(parseInt(id), userId);
  return NextResponse.json({ ok: true });
}
