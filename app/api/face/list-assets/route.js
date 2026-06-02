import { NextResponse } from 'next/server';
import { callVolcOpenAPI } from '../../_lib/volc-sign.js';

const VOLC_AK = process.env.VOLC_ACCESS_KEY;
const VOLC_SK = process.env.VOLC_SECRET_KEY;

// List the user's existing ARK face/character assets so they can be picked
// without registering a new face every time.
export async function POST(request) {
  try {
    if (!VOLC_AK || !VOLC_SK) {
      return NextResponse.json({ error: 'VOLC ключи не настроены' }, { status: 500 });
    }

    const { groupId } = await request.json().catch(() => ({}));

    const result = await callVolcOpenAPI({
      accessKeyId: VOLC_AK,
      secretAccessKey: VOLC_SK,
      action: 'ListAsset',
      version: '2024-01-01',
      body: {
        ProjectName: 'default',
        PageSize: 100,
        PageNumber: 1,
        ...(groupId ? { GroupId: groupId } : {}),
      },
    });

    // ARK list responses vary in shape — normalize defensively.
    const raw = result?.Items || result?.Assets || result?.List || result?.Result || [];
    const assets = (Array.isArray(raw) ? raw : [])
      .map((a) => ({
        id: a.Id || a.AssetId || a.id,
        name: a.Name || a.name || '',
        status: a.Status || a.status || '',
        type: a.AssetType || a.assetType || '',
      }))
      .filter((a) => a.id);

    return NextResponse.json({ assets });
  } catch (err) {
    console.error('[list-assets] error:', err.message);
    // Don't hard-fail the UI — the user can still paste an asset id manually.
    return NextResponse.json({ assets: [], error: err.message });
  }
}
