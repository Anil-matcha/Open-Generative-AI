import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { POSITIONS, SIZES, ALIGNS } from "@/lib/layout";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const a = await prisma.asset.findUnique({ where: { id } });
  if (!a) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(a);
}

const TextBlockSchema = z.object({
  text: z.string(),
  position: z.enum(POSITIONS),
  size: z.enum(SIZES),
  color: z.string(),
  fontFamily: z.string(),
  align: z.enum(ALIGNS),
  bg: z.string().nullable().optional(),
});

const PatchSchema = z.object({
  headline: z.string().optional(),
  body: z.string().optional(),
  cta: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  layout: z
    .object({ headline: TextBlockSchema, body: TextBlockSchema, cta: TextBlockSchema })
    .optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });

  const existing = await prisma.asset.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (parsed.data.headline !== undefined) data.headline = parsed.data.headline;
  if (parsed.data.body !== undefined) data.body = parsed.data.body;
  if (parsed.data.cta !== undefined) data.cta = parsed.data.cta;
  if (parsed.data.imageUrl !== undefined) data.imageUrl = parsed.data.imageUrl;

  if (parsed.data.layout) {
    let meta: Record<string, unknown> = {};
    try {
      const v = JSON.parse(existing.variants ?? "{}");
      if (v && typeof v === "object" && !Array.isArray(v)) meta = v as Record<string, unknown>;
    } catch {}
    meta.layout = parsed.data.layout;
    data.variants = JSON.stringify(meta);
  }

  const updated = await prisma.asset.update({ where: { id }, data });
  return NextResponse.json({ ok: true, id: updated.id });
}
