import { NextRequest, NextResponse } from "next/server";
import { muapi } from "@/lib/muapi";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing file" }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const filename = file.name || `frame-${Date.now()}.png`;
  const contentType = file.type || "application/octet-stream";

  try {
    const url = await muapi.uploadFile(buf, filename, contentType);
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
