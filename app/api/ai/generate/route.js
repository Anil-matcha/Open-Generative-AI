import { NextResponse } from 'next/server';
import { generate } from '../../../../lib/ai/providers';

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body?.task || !body?.prompt) {
      return NextResponse.json({ error: 'task and prompt are required' }, { status: 400 });
    }

    const result = await generate(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
