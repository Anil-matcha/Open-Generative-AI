import { NextResponse } from 'next/server';

export async function GET(request) {
  // This endpoint is called after liveness verification completes
  // The browser/H5 redirect happens automatically
  console.log('[face-callback] GET request received');

  return NextResponse.json({ ok: true });
}

export async function POST(request) {
  console.log('[face-callback] POST request received');

  try {
    const body = await request.json();
    console.log('[face-callback] body:', body);
  } catch {}

  return NextResponse.json({ ok: true });
}
