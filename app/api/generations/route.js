/**
 * app/api/generations/route.js
 * GET  — lista gerações (com filtros de projeto e tipo)
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/requireAuth';
import { getGenerations } from '@/lib/db-projects';

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
