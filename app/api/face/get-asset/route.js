import { NextResponse } from 'next/server';
import { callVolcOpenAPI } from '../../_lib/volc-sign.js';

const VOLC_AK = process.env.VOLC_ACCESS_KEY;
const VOLC_SK = process.env.VOLC_SECRET_KEY;

export async function POST(request) {
  try {
    if (!VOLC_AK || !VOLC_SK) {
      return NextResponse.json({ error: 'VOLC ключи не настроены' }, { status: 500 });
    }

    const { assetId } = await request.json();
    if (!assetId) {
      return NextResponse.json({ error: 'assetId required' }, { status: 400 });
    }

    const result = await callVolcOpenAPI({
      accessKeyId: VOLC_AK,
      secretAccessKey: VOLC_SK,
      action: 'GetAsset',
      version: '2024-01-01',
      body: { Id: assetId, ProjectName: 'default' },
    });

    return NextResponse.json({ status: result.Status, assetId: result.Id });
  } catch (err) {
    console.error('[get-asset] error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
