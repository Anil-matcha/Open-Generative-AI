import { NextResponse } from 'next/server';
import { getApiKeyFromSession } from '@/lib/getSessionKey';

export async function POST(request) {
  const apiKey = getApiKeyFromSession(request);
  if (!apiKey) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { model, ...params } = await request.json();
  if (!model) return NextResponse.json({ error: 'Model required' }, { status: 400 });

  try {
    const res = await fetch(`https://api.muapi.ai/api/v1/models/${model}/estimate-cost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao estimar custo' }, { status: 502 });
  }
}
