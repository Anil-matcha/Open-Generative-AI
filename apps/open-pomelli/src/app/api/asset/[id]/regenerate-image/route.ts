import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getPlatform } from "@/lib/platforms";
import { regenerateImage } from "@/lib/asset-generator";
import type { CampaignConcept } from "@/lib/campaign-generator";

const Body = z.object({ noText: z.boolean().optional() });

export const maxDuration = 300;

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });

  const asset = await prisma.asset.findUnique({
    where: { id },
    include: { campaign: { include: { brand: true } } },
  });
  if (!asset) return NextResponse.json({ error: "asset not found" }, { status: 404 });

  let conceptIndex = 0;
  let platformId: string | null = null;
  try {
    const meta = JSON.parse(asset.variants ?? "{}");
    if (typeof meta.conceptIndex === "number") conceptIndex = meta.conceptIndex;
    if (typeof meta.platformId === "string") platformId = meta.platformId;
  } catch {}

  const spec = platformId ? getPlatform(platformId) : undefined;
  if (!spec) return NextResponse.json({ error: "asset has no platform spec" }, { status: 400 });

  let concepts: CampaignConcept[] = [];
  try {
    const v = JSON.parse(asset.campaign.concepts ?? "[]");
    if (Array.isArray(v)) concepts = v;
  } catch {}
  const concept = concepts[conceptIndex];
  if (!concept) return NextResponse.json({ error: "concept not found" }, { status: 400 });

  try {
    const url = await regenerateImage(
      asset.campaign.brand,
      concept,
      spec,
      asset.headline ?? concept.hook,
      { noText: parsed.data.noText },
    );
    if (!url) return NextResponse.json({ error: "image generation returned no url" }, { status: 502 });
    await prisma.asset.update({ where: { id }, data: { imageUrl: url } });
    return NextResponse.json({ imageUrl: url });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
