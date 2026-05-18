import { NextResponse } from "next/server";

export async function GET() {
  // Return empty array if Supabase not configured (standalone mode)
  return NextResponse.json([]);
}
