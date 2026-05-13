import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { CampaignConcept } from "@/lib/campaign-generator";
import { CAMPAIGN_GOALS } from "@/lib/campaign-generator";
import { ConceptsPanel, type ExistingAsset } from "./concepts";

function parseConcepts(s: string | null): CampaignConcept[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { brand: true, assets: { orderBy: { createdAt: "asc" } } },
  });
  if (!campaign) notFound();

  const concepts = parseConcepts(campaign.concepts);
  const goalLabel = CAMPAIGN_GOALS.find((g) => g.value === campaign.goal)?.label ?? campaign.goal;

  const assetsByConcept: Record<number, ExistingAsset[]> = {};
  for (const a of campaign.assets) {
    let conceptIndex = 0;
    let platformId: string | null = null;
    try {
      const meta = JSON.parse(a.variants ?? "{}");
      if (typeof meta.conceptIndex === "number") conceptIndex = meta.conceptIndex;
      if (typeof meta.platformId === "string") platformId = meta.platformId;
    } catch {}
    (assetsByConcept[conceptIndex] ??= []).push({
      id: a.id,
      platformId,
      platform: a.platform,
      format: a.format,
      imageUrl: a.imageUrl,
      headline: a.headline,
      body: a.body,
      cta: a.cta,
    });
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-neutral-500">Campaign</p>
          <h1 className="mt-1 text-3xl font-semibold">{goalLabel}</h1>
          <p className="mt-1 text-sm text-neutral-400">
            For{" "}
            <Link href={`/brand/${campaign.brand.id}`} className="text-white hover:underline">
              {campaign.brand.brandName || campaign.brand.url}
            </Link>
            {campaign.prompt && <> — “{campaign.prompt}”</>}
          </p>
        </div>
        <Link
          href={`/brand/${campaign.brand.id}/campaigns/new`}
          className="rounded-lg border border-neutral-700 px-3 py-2 text-sm hover:border-neutral-500"
        >
          New campaign
        </Link>
      </div>

      {concepts.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6 text-sm text-neutral-400">
          No concepts were saved for this campaign. Try regenerating.
        </div>
      ) : (
        <ConceptsPanel
          campaignId={campaign.id}
          concepts={concepts}
          initialAssets={assetsByConcept}
        />
      )}

      <p className="mt-12 text-xs text-neutral-500">
        Phase 4 — pick a concept, choose platforms, generate. Logo (when present) is passed as a reference image to nano-banana-edit.
      </p>
    </main>
  );
}
