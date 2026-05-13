"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/brand/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ? JSON.stringify(json.error) : `HTTP ${res.status}`);
      router.push(`/brand/${json.id}`);
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-8 px-6">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Pomelli Local</h1>
        <p className="mt-3 text-neutral-400">
          Paste any website URL. We extract the brand DNA and generate on-brand campaigns — locally.
        </p>
      </div>

      <form onSubmit={submit} className="flex w-full gap-2">
        <input
          type="url"
          required
          placeholder="https://your-website.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 outline-none placeholder:text-neutral-500 focus:border-neutral-400"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !url}
          className="rounded-lg bg-white px-5 py-3 font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50"
        >
          {loading ? "Extracting…" : "Analyze"}
        </button>
      </form>

      {error && <div className="w-full rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-300">{error}</div>}

      <div className="flex gap-4 text-xs text-neutral-400">
        <Link href="/photo-studio" className="hover:text-white">
          Photo Studio →
        </Link>
        <Link href="/animate" className="hover:text-white">
          Animate →
        </Link>
      </div>
    </main>
  );
}
