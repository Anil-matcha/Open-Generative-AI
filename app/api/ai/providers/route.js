import { NextResponse } from 'next/server';
import { listProviders, providerHealth } from '../../../../lib/ai/providers';

export async function GET() {
  return NextResponse.json({ providers: listProviders(), health: await providerHealth() });
}
