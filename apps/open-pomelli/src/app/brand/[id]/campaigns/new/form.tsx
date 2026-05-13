"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CAMPAIGN_GOALS, type CampaignGoal } from "@/lib/campaign-generator";

export function NewCampaignForm({ brandId }: { brandId: string }) {
  const [goal, setGoal] = useState<CampaignGoal>("product_launch");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/campaign/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, goal, prompt: prompt.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ? JSON.stringify(json.error) : `HTTP ${res.status}`);
      router.push(`/campaign/${json.id}`);
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <span className="mb-3 block text-xs uppercase tracking-wider text-neutral-500">Goal</span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CAMPAIGN_GOALS.map((g) => {
            const selected = g.value === goal;
            return (
              <label
                key={g.value}
                className={`cursor-pointer rounded-lg border p-3 transition ${
                  selected
                    ? "border-white bg-neutral-900"
                    : "border-neutral-800 bg-neutral-950 hover:border-neutral-700"
                }`}
              >
                <input
                  type="radio"
                  name="goal"
                  value={g.value}
                  checked={selected}
                  onChange={() => setGoal(g.value)}
                  className="sr-only"
                />
                <div className="text-sm font-medium">{g.label}</div>
                <div className="mt-0.5 text-xs text-neutral-500">{g.description}</div>
              </label>
            );
          })}
        </div>
      </div>

      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-wider text-neutral-500">
          Custom direction (optional)
        </span>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="e.g. focus on the new pricing tier, target indie devs, summer angle"
          className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />
      </label>

      {error && (
        <div className="rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-white px-5 py-3 font-medium text-black hover:bg-neutral-200 disabled:opacity-50"
        >
          {loading ? "Generating concepts…" : "Generate 4 concepts"}
        </button>
      </div>
    </form>
  );
}
