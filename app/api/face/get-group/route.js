import { NextResponse } from 'next/server';
import { callVolcOpenAPI } from '../../_lib/volc-sign.js';

const VOLC_AK = process.env.VOLC_ACCESS_KEY;
const VOLC_SK = process.env.VOLC_SECRET_KEY;

export async function POST(request) {
  try {
    if (!VOLC_AK || !VOLC_SK) {
      return NextResponse.json({ error: 'VOLC ключи не настроены' }, { status: 500 });
    }

    const { bytedToken } = await request.json();
    if (!bytedToken) {
      return NextResponse.json({ error: 'bytedToken required' }, { status: 400 });
    }

    try {
      const result = await callVolcOpenAPI({
        accessKeyId: VOLC_AK,
        secretAccessKey: VOLC_SK,
        action: 'GetVisualValidateResult',
        version: '2024-01-01',
        body: { BytedToken: bytedToken, ProjectName: 'default' },
      });

      if (result?.GroupId) {
        return NextResponse.json({ groupId: result.GroupId });
      }

      return NextResponse.json({ pending: true });
    } catch (innerErr) {
      // Если верификация еще не завершена
      console.warn('[get-group] pending/err:', innerErr.message);
      return NextResponse.json({ pending: true });
    }
  } catch (err) {
    console.error('[get-group] error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
