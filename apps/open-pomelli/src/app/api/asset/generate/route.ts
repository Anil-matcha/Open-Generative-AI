import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getPlatform } from "@/lib/platforms";
import { generateAsset } from "@/lib/asset-generator";
import { saveGeneratedAsset } from "@/lib/assets/assetActions";
import type { CampaignConcept } from "@/lib/campaign-generator";

const Body = z.object({
  campaignId: z.string().min(1),
  conceptIndex: z.number().int().min(0),
  platformId: z.string().min(1),
});

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { campaignId, conceptIndex, platformId } = parsed.data;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { brand: true },
  });
  if (!campaign) return NextResponse.json({ error: "campaign not found" }, { status: 404 });

  const spec = getPlatform(platformId);
  if (!spec) return NextResponse.json({ error: "unknown platform" }, { status: 400 });

  let concepts: CampaignConcept[] = [];
  try {
    const v = JSON.parse(campaign.concepts ?? "[]");
    if (Array.isArray(v)) concepts = v;
  } catch {}
  const concept = concepts[conceptIndex];
  if (!concept) return NextResponse.json({ error: "concept index out of range" }, { status: 400 });

  try {
    const result = await generateAsset(campaign.brand, concept, spec);

    // Save to universal asset pipeline (non-blocking)
    try {
      await saveGeneratedAsset('image', {
        title: `${spec.platform} ad - ${concept.headline?.substring(0, 30) || 'Untitled'}`,
        media: { url: result.imageUrl },
        metadata: {
          platform: spec.platform,
          format: spec.format,
          aspect: spec.aspect,
          headline: result.headline,
          body: result.body,
          cta: result.cta,
          campaignId: campaignId,
          conceptIndex: conceptIndex
        }
      }, 'open-pomelli');
    } catch (err) {
      console.warn('[Asset Pipeline] Failed to save asset:', err.message);
    }

    const saved = await prisma.asset.create({
      data: {
        campaignId,
        platform: spec.platform,
        format: spec.format,
        imageUrl: result.imageUrl,
        headline: result.headline,
        body: result.body,
        cta: result.cta,
        variants: JSON.stringify({ conceptIndex, platformId: spec.id, aspect: spec.aspect }),
      },
    });
    return NextResponse.json({
      id: saved.id,
      platformId: spec.id,
      imageUrl: saved.imageUrl,
      headline: saved.headline,
      body: saved.body,
      cta: saved.cta,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
