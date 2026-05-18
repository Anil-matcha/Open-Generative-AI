import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Billing disabled in standalone mode" }, { status: 404 });
}
