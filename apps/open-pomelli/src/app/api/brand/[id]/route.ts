import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const row = await prisma.brandDNA.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(row);
}

const PatchSchema = z.object({
  brandName: z.string().optional(),
  industry: z.string().optional(),
  tagline: z.string().optional(),
  valueProposition: z.string().optional(),
  targetAudience: z.string().optional(),
  imageryStyle: z.string().optional(),
  layoutStyle: z.string().optional(),
  logoUrl: z.string().nullable().optional(),
  toneOfVoice: z.array(z.string()).optional(),
  brandPersonality: z.array(z.string()).optional(),
  keyMessages: z.array(z.string()).optional(),
  fonts: z.array(z.string()).optional(),
  primaryColors: z.array(z.string()).optional(),
  secondaryColors: z.array(z.string()).optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v === undefined) continue;
    data[k] = Array.isArray(v) ? JSON.stringify(v) : v;
  }

  const updated = await prisma.brandDNA.update({ where: { id }, data });
  return NextResponse.json({ ok: true, id: updated.id });
}
