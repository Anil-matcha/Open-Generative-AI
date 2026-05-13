"use client";

import { useState } from "react";
import Link from "next/link";
import { DEFAULT_PROMPTS, type SourceType } from "@/lib/animate";

export type AnimationItem = {
  id: string;
  sourceImageUrl: string;
  videoUrl: string | null;
  prompt: string;
  duration: number;
  resolution: string;
  sourceType: string;
  status: "running" | "done" | "error";
  error?: string;
};

export function Animator({
  initialImage,
  initialPrompt,
  initialSourceType,
  initialSourceId,
  initialBrandId,
  initialAnimations,
}: {
  initialImage: string | null;
  initialPrompt: string;
  initialSourceType: SourceType;
  initialSourceId: string | null;
  initialBrandId: string | null;
  initialAnimations: AnimationItem[];
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(initialImage);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [duration, setDuration] = useState(5);
  const [resolution, setResolution] = useState<"480p" | "720p" | "1080p">("720p");
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anims, setAnims] = useState<AnimationItem[]>(initialAnimations);

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/animate/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ? JSON.stringify(json.error) : `HTTP ${res.status}`);
      setImageUrl(json.url);
    } catch (e) {
      setError(String(e));
    } finally {
      setUploading(false);
    }
  }

  async function generate() {
    if (!imageUrl || generating) return;
    setGenerating(true);
    setError(null);
    const tempId = `tmp-${Date.now()}`;
    setAnims((a) => [
      {
        id: tempId,
        sourceImageUrl: imageUrl,
        videoUrl: null,
        prompt,
        duration,
        resolution,
        sourceType: initialSourceType,
        status: "running",
      },
      ...a,
    ]);
    try {
      const res = await fetch("/api/animate/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceImageUrl: imageUrl,
          sourceType: initialSourceType,
          sourceId: initialSourceId,
          brandId: initialBrandId,
          prompt,
          duration,
          resolution,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ? JSON.stringify(json.error) : `HTTP ${res.status}`);
      setAnims((a) =>
        a.map((x) =>
          x.id === tempId
            ? {
                id: json.id,
                sourceImageUrl: json.sourceImageUrl,
                videoUrl: json.videoUrl,
                prompt: json.prompt,
                duration: json.duration,
                resolution: json.resolution,
                sourceType: json.sourceType,
                status: "done",
              }
            : x,
        ),
      );
    } catch (e) {
      setAnims((a) => a.map((x) => (x.id === tempId ? { ...x, status: "error", error: String(e) } : x)));
      setError(String(e));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-neutral-500">Animate</p>
          <h1 className="mt-1 text-3xl font-semibold">Image to short video</h1>
          <p className="mt-1 text-sm text-neutral-400">
            seedance-lite-i2v · 3–12s · 480p / 720p / 1080p
          </p>
        </div>
        <Link href="/" className="text-sm text-neutral-400 hover:text-white">
          ← Home
        </Link>
      </div>

      <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[20rem_1fr]">
        <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
          <p className="text-[10px] uppercase tracking-wider text-neutral-500">Source frame</p>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt="source"
              className="aspect-square w-full rounded border border-neutral-800 object-contain"
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded border border-dashed border-neutral-800 text-xs text-neutral-500">
              No frame
            </div>
          )}
          <label className="block">
            <span className="block w-full cursor-pointer rounded-lg bg-white py-2 text-center text-sm font-medium text-black hover:bg-neutral-200">
              {uploading ? "Uploading…" : imageUrl ? "Replace" : "Upload frame"}
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
          <p className="text-[11px] text-neutral-500">
            The video aspect ratio matches the source image. For 9:16 stories, upload or pick a 9:16 frame.
          </p>
        </div>

        <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-wider text-neutral-500">
              Motion prompt
            </span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
          </label>

          <div className="flex flex-wrap gap-1">
            {(Object.keys(DEFAULT_PROMPTS) as SourceType[]).map((t) => (
              <button
                key={t}
                onClick={() => setPrompt(DEFAULT_PROMPTS[t])}
                className="rounded border border-neutral-800 bg-neutral-950 px-2 py-1 text-[10px] text-neutral-400 hover:border-neutral-600 hover:text-white"
              >
                Use default ({t})
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-4">
            <label className="flex flex-1 items-center gap-3 text-xs">
              <span className="text-neutral-500">Duration</span>
              <input
                type="range"
                min={3}
                max={12}
                step={1}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="flex-1 accent-white"
              />
              <span className="font-mono text-neutral-300">{duration}s</span>
            </label>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-neutral-500">Resolution</span>
              {(["480p", "720p", "1080p"] as const).map((r) => (
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
          </div>

          {error && (
            <div className="rounded border border-red-900 bg-red-950/50 p-2 text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={generate}
              disabled={!imageUrl || generating || !prompt.trim()}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200 disabled:opacity-50"
            >
              {generating ? "Rendering…" : "Animate"}
            </button>
          </div>
        </div>
      </section>

      <section>
        <p className="mb-3 text-xs uppercase tracking-wider text-neutral-500">Renders</p>
        {anims.length === 0 ? (
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6 text-sm text-neutral-500">
            No animations yet. Pick a frame above and animate it.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {anims.map((a) => (
              <AnimCard key={a.id} a={a} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function AnimCard({ a }: { a: AnimationItem }) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900">
      {a.videoUrl ? (
        <video
          src={a.videoUrl}
          poster={a.sourceImageUrl}
          controls
          loop
          muted
          playsInline
          className="block w-full"
        />
      ) : (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={a.sourceImageUrl} alt="" className="block w-full opacity-60" />
          <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-300">
            {a.status === "running" ? "rendering…" : a.status === "error" ? "error" : "—"}
          </div>
        </div>
      )}
      <div className="space-y-0.5 p-2 text-[11px]">
        <p className="text-neutral-500">
          {a.sourceType} · {a.duration}s · {a.resolution}
        </p>
        <p className="line-clamp-2 text-neutral-300">{a.prompt}</p>
        {a.error && <p className="text-red-400">{a.error.slice(0, 100)}</p>}
        {a.videoUrl && (
          <a href={a.videoUrl} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-white">
            Open ↗
          </a>
        )}
      </div>
    </div>
  );
}
