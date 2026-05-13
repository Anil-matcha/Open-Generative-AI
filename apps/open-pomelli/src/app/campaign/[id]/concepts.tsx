"use client";

import { useState } from "react";
import Link from "next/link";
import { PLATFORMS } from "@/lib/platforms";
import type { CampaignConcept } from "@/lib/campaign-generator";

export type ExistingAsset = {
  id: string;
  platformId: string | null;
  platform: string;
  format: string;
  imageUrl: string | null;
  headline: string | null;
  body: string | null;
  cta: string | null;
};

type Generation = {
  platformId: string;
  status: "queued" | "running" | "done" | "error";
  asset?: ExistingAsset;
  error?: string;
};

const CONCURRENCY = 3;

export function ConceptsPanel({
  campaignId,
  concepts,
  initialAssets,
}: {
  campaignId: string;
  concepts: CampaignConcept[];
  initialAssets: Record<number, ExistingAsset[]>;
}) {
  const [assetsByConcept, setAssetsByConcept] = useState(initialAssets);

  function appendAsset(conceptIndex: number, asset: ExistingAsset) {
    setAssetsByConcept((prev) => ({
      ...prev,
      [conceptIndex]: [...(prev[conceptIndex] ?? []), asset],
    }));
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {concepts.map((c, i) => (
        <ConceptCard
          key={i}
          campaignId={campaignId}
          conceptIndex={i}
          concept={c}
          existing={assetsByConcept[i] ?? []}
          onAssetCreated={(a) => appendAsset(i, a)}
        />
      ))}
    </div>
  );
}

function ConceptCard({
  campaignId,
  conceptIndex,
  concept,
  existing,
  onAssetCreated,
}: {
  campaignId: string;
  conceptIndex: number;
  concept: CampaignConcept;
  existing: ExistingAsset[];
  onAssetCreated: (a: ExistingAsset) => void;
}) {
  const [open, setOpen] = useState(false);
  const recommended = new Set(concept.recommended_platforms);
  const [selected, setSelected] = useState<Set<string>>(() => {
    const s = new Set<string>();
    for (const p of PLATFORMS) {
      if (recommended.has(p.platform) || recommended.has(p.id)) s.add(p.id);
    }
    if (s.size === 0) PLATFORMS.forEach((p) => s.add(p.id));
    return s;
  });
  const [gens, setGens] = useState<Record<string, Generation>>({});
  const [running, setRunning] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function generateOne(platformId: string): Promise<void> {
    setGens((prev) => ({ ...prev, [platformId]: { platformId, status: "running" } }));
    try {
      const res = await fetch("/api/asset/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, conceptIndex, platformId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ? JSON.stringify(json.error) : `HTTP ${res.status}`);
      const asset: ExistingAsset = {
        id: json.id,
        platformId,
        platform: PLATFORMS.find((p) => p.id === platformId)?.platform ?? platformId,
        format: PLATFORMS.find((p) => p.id === platformId)?.format ?? "",
        imageUrl: json.imageUrl,
        headline: json.headline,
        body: json.body,
        cta: json.cta,
      };
      onAssetCreated(asset);
      setGens((prev) => ({ ...prev, [platformId]: { platformId, status: "done", asset } }));
    } catch (e) {
      setGens((prev) => ({ ...prev, [platformId]: { platformId, status: "error", error: String(e) } }));
    }
  }

  async function generateAll() {
    if (selected.size === 0 || running) return;
    setRunning(true);
    const queue = [...selected];
    setGens(Object.fromEntries(queue.map((id) => [id, { platformId: id, status: "queued" as const }])));

    let cursor = 0;
    async function worker() {
      while (cursor < queue.length) {
        const id = queue[cursor++];
        await generateOne(id);
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => worker()));
    setRunning(false);
  }

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-950 p-5">
      <header>
        <h2 className="text-lg font-semibold">{concept.title}</h2>
        <p className="mt-1 text-sm text-neutral-400">{concept.theme}</p>
      </header>

      <div className="space-y-2 text-sm">
        <Row label="Hook" value={concept.hook} />
        <Row label="Key message" value={concept.key_message} />
        <Row label="CTA" value={concept.cta} />
        <Row label="Tone" value={concept.tone_notes} />
        <Row label="Visual" value={concept.visual_direction} />
      </div>

      {existing.length > 0 && (
        <div className="mt-2">
          <p className="mb-2 text-[10px] uppercase tracking-wider text-neutral-500">
            Generated assets ({existing.length})
          </p>
          <div className="grid grid-cols-2 gap-2">
            {existing.map((a) => (
              <AssetThumb key={a.id} asset={a} />
            ))}
          </div>
        </div>
      )}

      {Object.values(gens).some((g) => g.status === "running" || g.status === "queued" || g.status === "error") && (
        <div className="space-y-1">
          {Object.values(gens).map((g) => (
            <ProgressRow key={g.platformId} gen={g} />
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-xs text-neutral-400 hover:text-white"
        >
          {open ? "Hide platforms" : "Generate assets →"}
        </button>
      </div>

      {open && (
        <div className="space-y-2 rounded-lg border border-neutral-800 bg-neutral-900 p-3">
          <p className="text-[10px] uppercase tracking-wider text-neutral-500">Platforms</p>
          <div className="grid grid-cols-1 gap-1.5">
            {PLATFORMS.map((p) => (
              <label key={p.id} className="flex cursor-pointer items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={selected.has(p.id)}
                  onChange={() => toggle(p.id)}
                  className="accent-white"
                  disabled={running}
                />
                <span className={selected.has(p.id) ? "" : "text-neutral-500"}>{p.label}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-neutral-500">{selected.size} selected</span>
            <button
              onClick={generateAll}
              disabled={running || selected.size === 0}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-neutral-200 disabled:opacity-50"
            >
              {running ? "Generating…" : `Generate ${selected.size}`}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function ProgressRow({ gen }: { gen: Generation }) {
  const platform = PLATFORMS.find((p) => p.id === gen.platformId);
  const color =
    gen.status === "running"
      ? "text-yellow-400"
      : gen.status === "done"
        ? "text-emerald-400"
        : gen.status === "error"
          ? "text-red-400"
          : "text-neutral-500";
  return (
    <div className="flex items-center justify-between text-xs">
      <span>{platform?.label ?? gen.platformId}</span>
      <span className={color}>
        {gen.status === "running" ? "rendering…" : gen.status}
        {gen.error && ` — ${gen.error.slice(0, 80)}`}
      </span>
    </div>
  );
}

function AssetThumb({ asset }: { asset: ExistingAsset }) {
  const platform = asset.platformId ? PLATFORMS.find((p) => p.id === asset.platformId) : null;
  return (
    <Link
      href={`/asset/${asset.id}/edit`}
      className="block overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 transition hover:border-neutral-600"
    >
      {asset.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={asset.imageUrl} alt={asset.headline ?? ""} className="block w-full" />
      ) : (
        <div className="flex aspect-square items-center justify-center text-xs text-neutral-600">no image</div>
      )}
      <div className="space-y-0.5 p-2 text-[11px]">
        <p className="text-neutral-500">{platform?.label ?? `${asset.platform} / ${asset.format}`}</p>
        {asset.headline && <p className="font-medium text-neutral-200">{asset.headline}</p>}
        {asset.cta && <p className="text-neutral-400">{asset.cta}</p>}
        <p className="pt-1 text-[10px] text-neutral-500">Edit →</p>
      </div>
    </Link>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</span>
      <p className="mt-0.5 text-sm leading-snug text-neutral-200">{value}</p>
    </div>
  );
}
