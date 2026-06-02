import { NextResponse } from 'next/server';
import { callVolcOpenAPI } from '../../_lib/volc-sign.js';

const VOLC_AK = process.env.VOLC_ACCESS_KEY;
const VOLC_SK = process.env.VOLC_SECRET_KEY;

export async function POST(request) {
  try {
    if (!VOLC_AK || !VOLC_SK) {
      return NextResponse.json({ error: 'VOLC ключи не настроены' }, { status: 500 });
    }

    const { callbackUrl } = await request.json();
    const cb = callbackUrl || `${new URL(request.url).origin}/api/face/callback`;

    const result = await callVolcOpenAPI({
      accessKeyId: VOLC_AK,
      secretAccessKey: VOLC_SK,
      action: 'CreateVisualValidateSession',
      version: '2024-01-01',
      body: { CallbackURL: cb, ProjectName: 'default' },
    });

    const h5Link = result.H5Link;
    const bytedToken = result.BytedToken;

    return NextResponse.json({
      h5Link,
      shortUrl: h5Link, // можно добавить укорочение ссылки позже
      bytedToken,
    });
  } catch (err) {
    console.error('[create-session] error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
