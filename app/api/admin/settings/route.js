/**
 * app/api/admin/settings/route.js
 * GET  — fetch settings (master key masked)
 * POST — update settings
 */
import { NextResponse } from 'next/server';
import { getSetting, setSetting, getGlobalStats } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAuth';

export async function GET(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const masterKey = getSetting('muapi_master_key') || '';
  const stats = getGlobalStats();

  return NextResponse.json({
    masterKeySet: masterKey.length > 0,
    masterKeyPreview: masterKey ? masterKey.slice(0, 6) + '••••••••••••' : '',
    stats,
  });
}

export async function POST(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { muapiMasterKey } = await request.json();

  if (muapiMasterKey !== undefined) {
    setSetting('muapi_master_key', muapiMasterKey.trim());
  }

  return NextResponse.json({ ok: true });
}
