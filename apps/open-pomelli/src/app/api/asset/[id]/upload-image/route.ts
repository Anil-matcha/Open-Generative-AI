import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { muapi } from "@/lib/muapi";

export const maxDuration = 120;

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) return NextResponse.json({ error: "asset not found" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing file" }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const filename = file.name || `upload-${Date.now()}.png`;
  const contentType = file.type || "application/octet-stream";

  try {
    const url = await muapi.uploadFile(buf, filename, contentType);
    await prisma.asset.update({ where: { id }, data: { imageUrl: url } });
    return NextResponse.json({ imageUrl: url });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
