import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DnaEditor, type EditableDNA } from "./editor";
import { CAMPAIGN_GOALS } from "@/lib/campaign-generator";

function parseList(s: string | null): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export default async function BrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [dna, campaigns] = await Promise.all([
    prisma.brandDNA.findUnique({ where: { id } }),
    prisma.campaign.findMany({
      where: { brandId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);
  if (!dna) notFound();

  const initial: EditableDNA = {
    brandName: dna.brandName ?? "",
    industry: dna.industry ?? "",
    tagline: dna.tagline ?? "",
    valueProposition: dna.valueProposition ?? "",
    targetAudience: dna.targetAudience ?? "",
    imageryStyle: dna.imageryStyle ?? "",
    layoutStyle: dna.layoutStyle ?? "",
    logoUrl: dna.logoUrl ?? null,
    screenshotUrl: dna.screenshotUrl ?? null,
    toneOfVoice: parseList(dna.toneOfVoice),
    brandPersonality: parseList(dna.brandPersonality),
    keyMessages: parseList(dna.keyMessages),
    fonts: parseList(dna.fonts),
    primaryColors: parseList(dna.primaryColors),
    secondaryColors: parseList(dna.secondaryColors),
  };

  return (
    <>
      <DnaEditor id={dna.id} sourceUrl={dna.url} initial={initial} />
      {campaigns.length > 0 && (
        <section className="mx-auto mb-12 max-w-4xl px-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-300">
            Past campaigns
          </h2>
          <ul className="divide-y divide-neutral-900 rounded-xl border border-neutral-800 bg-neutral-950">
            {campaigns.map((c) => {
              const label = CAMPAIGN_GOALS.find((g) => g.value === c.goal)?.label ?? c.goal;
              return (
                <li key={c.id}>
                  <Link
                    href={`/campaign/${c.id}`}
                    className="flex items-center justify-between px-4 py-3 text-sm hover:bg-neutral-900"
                  >
                    <span>
                      <span className="font-medium">{label}</span>
                      {c.prompt && (
                        <span className="ml-2 text-neutral-500">— {c.prompt}</span>
                      )}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {c.createdAt.toLocaleDateString()}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}
