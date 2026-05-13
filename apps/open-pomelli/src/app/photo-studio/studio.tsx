"use client";

import { useState } from "react";
import Link from "next/link";
import { PHOTO_CATEGORIES, type PhotoCategory, type PhotoStyle } from "@/lib/photo-styles";

type Shot = {
  id: string;
  imageUrl: string | null;
  styleLabel: string;
  category: string;
  styleId: string;
  status: "running" | "done" | "error";
  error?: string;
};

const CONCURRENCY = 2;

export function PhotoStudio({
  brandId,
  brandName,
  initialShots,
}: {
  brandId: string | null;
  brandName: string | null;
  initialShots: Shot[];
}) {
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeCat, setActiveCat] = useState<string>(PHOTO_CATEGORIES[0].id);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [prompt, setPrompt] = useState("");
  const [resolution, setResolution] = useState<"1k" | "2k" | "4k">("2k");
  const [generating, setGenerating] = useState(false);
  const [shots, setShots] = useState<Shot[]>(initialShots);
  const [error, setError] = useState<string | null>(null);

  const category: PhotoCategory =
    PHOTO_CATEGORIES.find((c) => c.id === activeCat) ?? PHOTO_CATEGORIES[0];

  function toggleStyle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      const key = `${activeCat}/${id}`;
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/photo-studio/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ? JSON.stringify(json.error) : `HTTP ${res.status}`);
      setProductImageUrl(json.url);
    } catch (e) {
      setError(String(e));
    } finally {
      setUploading(false);
    }
  }

  async function generateOne(category: string, style: PhotoStyle): Promise<void> {
    const tempId = `tmp-${category}-${style.id}-${Date.now()}`;
    setShots((s) => [
      { id: tempId, imageUrl: null, styleLabel: style.label, category, styleId: style.id, status: "running" },
      ...s,
    ]);
    try {
      const res = await fetch("/api/photo-studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productImageUrl,
          category,
          styleId: style.id,
          prompt: prompt.trim() || null,
          brandId,
          resolution,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ? JSON.stringify(json.error) : `HTTP ${res.status}`);
      setShots((s) =>
        s.map((x) =>
          x.id === tempId
            ? {
                id: json.id,
                imageUrl: json.imageUrl,
                styleLabel: json.styleLabel,
                category: json.category,
                styleId: json.styleId,
                status: "done",
              }
            : x,
        ),
      );
    } catch (e) {
      setShots((s) =>
        s.map((x) => (x.id === tempId ? { ...x, status: "error", error: String(e) } : x)),
      );
    }
  }

  async function generateAll() {
    if (!productImageUrl || selected.size === 0 || generating) return;
    setGenerating(true);
    setError(null);
    const queue: { category: string; style: PhotoStyle }[] = [];
    for (const key of selected) {
      const [catId, styleId] = key.split("/");
      const cat = PHOTO_CATEGORIES.find((c) => c.id === catId);
      const style = cat?.styles.find((s) => s.id === styleId);
      if (cat && style) queue.push({ category: cat.id, style });
    }
    let cursor = 0;
    async function worker() {
      while (cursor < queue.length) {
        const job = queue[cursor++];
        await generateOne(job.category, job.style);
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => worker()));
    setGenerating(false);
    setSelected(new Set());
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-neutral-500">Photo Studio</p>
          <h1 className="mt-1 text-3xl font-semibold">Product photography</h1>
          {brandName && (
            <p className="mt-1 text-sm text-neutral-400">
              Brand context: <span className="text-white">{brandName}</span>
            </p>
          )}
        </div>
        <Link href="/" className="text-sm text-neutral-400 hover:text-white">
          ← Home
        </Link>
      </div>

      <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[20rem_1fr]">
        <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
          <p className="text-[10px] uppercase tracking-wider text-neutral-500">Product image</p>
          {productImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={productImageUrl}
              alt="product"
              className="aspect-square w-full rounded border border-neutral-800 object-contain"
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded border border-dashed border-neutral-800 text-xs text-neutral-500">
              No product image
            </div>
          )}
          <label className="block">
            <span className="block w-full cursor-pointer rounded-lg bg-white py-2 text-center text-sm font-medium text-black hover:bg-neutral-200">
              {uploading ? "Uploading…" : productImageUrl ? "Replace" : "Upload product"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
                e.currentTarget.value = "";
              }}
              disabled={uploading}
            />
          </label>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
          <div className="flex flex-wrap gap-1.5">
            {PHOTO_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  activeCat === c.id
                    ? "border-white bg-neutral-900"
                    : "border-neutral-800 bg-neutral-950 hover:border-neutral-700"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-neutral-500">{category.description}</p>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {category.styles.map((s) => {
              const key = `${category.id}/${s.id}`;
              const isSelected = selected.has(key);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleStyle(s.id)}
                  className={`rounded-lg border p-3 text-left transition ${
                    isSelected
                      ? "border-white bg-neutral-900"
                      : "border-neutral-800 bg-neutral-950 hover:border-neutral-700"
                  }`}
                >
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] text-neutral-500">{s.prompt}</p>
                  <p className="mt-2 text-[10px] uppercase tracking-wider text-neutral-600">
                    {s.aspect}
                  </p>
                </button>
              );
            })}
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            placeholder="Optional direction (e.g. 'autumn tones, single product, no humans')"
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-neutral-500">Resolution</span>
              {(["1k", "2k", "4k"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setResolution(r)}
                  className={`rounded border px-2 py-1 ${
                    resolution === r
                      ? "border-white bg-neutral-900"
                      : "border-neutral-800 bg-neutral-950 hover:border-neutral-700"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <button
              onClick={generateAll}
              disabled={!productImageUrl || selected.size === 0 || generating}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200 disabled:opacity-50"
            >
              {generating
                ? "Generating…"
                : productImageUrl
                  ? `Generate ${selected.size || ""} shot${selected.size === 1 ? "" : "s"}`
                  : "Upload a product first"}
            </button>
          </div>
        </div>
      </section>

      <section>
        <p className="mb-3 text-xs uppercase tracking-wider text-neutral-500">Results</p>
        {shots.length === 0 ? (
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6 text-sm text-neutral-500">
            No shots yet. Upload a product and pick a style.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {shots.map((s) => (
              <ShotCard key={s.id} shot={s} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function ShotCard({ shot }: { shot: Shot }) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900">
      {shot.imageUrl ? (
        <a href={shot.imageUrl} target="_blank" rel="noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shot.imageUrl} alt={shot.styleLabel} className="block w-full" />
        </a>
      ) : (
        <div className="flex aspect-square w-full items-center justify-center text-xs text-neutral-500">
          {shot.status === "running" ? "rendering…" : shot.status === "error" ? "error" : "—"}
        </div>
      )}
      <div className="space-y-0.5 p-2 text-[11px]">
        <p className="font-medium text-neutral-200">{shot.styleLabel}</p>
        <p className="text-neutral-500">{shot.category}</p>
        {shot.error && <p className="text-red-400">{shot.error.slice(0, 100)}</p>}
        {shot.imageUrl && (
          <Link
            href={`/animate?image=${encodeURIComponent(shot.imageUrl)}&sourceType=photoshoot&sourceId=${shot.id}`}
            className="text-[10px] text-neutral-400 hover:text-white"
          >
            Animate →
          </Link>
        )}
      </div>
    </div>
  );
}
