"use client";

import { useMemo, useState } from "react";

export default function AssetLibraryClient({ filters, assets }) {
  const [activeType, setActiveType] = useState("all");

  const visibleAssets = useMemo(() => {
    if (activeType === "all") {
      return assets;
    }

    return assets.filter((asset) => asset.assetType === activeType);
  }, [activeType, assets]);

  const totalCount = assets.length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="资产类型筛选">
        <button
          type="button"
          aria-pressed={activeType === "all"}
          onClick={() => setActiveType("all")}
          className={`rounded-md border px-2.5 py-1 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d9ff00] ${
            activeType === "all"
              ? "border-[#d9ff00]/60 bg-[#d9ff00] text-black"
              : "border-white/10 bg-white/[0.04] text-white/55 hover:border-white/25 hover:text-white"
          }`}
        >
          全部 · {totalCount}
        </button>
        {filters.map((type) => (
          <button
            key={type.id}
            type="button"
            aria-pressed={activeType === type.id}
            onClick={() => setActiveType(type.id)}
            className={`rounded-md border px-2.5 py-1 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d9ff00] ${
              activeType === type.id
                ? "border-[#d9ff00]/60 bg-[#d9ff00] text-black"
                : "border-white/10 bg-white/[0.04] text-white/55 hover:border-white/25 hover:text-white"
            }`}
            title={type.description}
          >
            {type.label} · {type.count}
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/40">
        <span>当前显示 {visibleAssets.length} / {totalCount} 个 accepted 资产</span>
        <span>按可用性分数降序</span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {visibleAssets.map((slot) => (
          <div
            key={slot.name}
            className="rounded-lg border border-white/10 bg-black/35 p-4 transition hover:border-[#d9ff00]/35"
          >
            {slot.preview ? (
              <img
                src={slot.preview}
                alt={`${slot.name} 预览`}
                className="mb-4 aspect-video w-full rounded-md border border-[#d9ff00]/25 object-cover"
              />
            ) : null}
            <div className="mb-3 flex items-center justify-between gap-3">
              <span
                className={`rounded-md px-2 py-1 text-xs font-bold ${
                  slot.status === "已生成"
                    ? "bg-emerald-400/10 text-emerald-300"
                    : "bg-white/[0.06] text-white/40"
                }`}
              >
                {slot.status}
              </span>
              <span className="rounded-md border border-white/10 px-2 py-1 text-xs text-white/40">
                {slot.type}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div className="font-mono text-sm font-bold text-[#d9ff00]">
                {slot.name}
              </div>
              <div className="rounded-md bg-[#d9ff00]/10 px-2 py-1 text-xs font-black text-[#d9ff00]">
                {slot.usability}
              </div>
            </div>
            <p className="mt-2 text-sm leading-6 text-white/55">{slot.purpose}</p>
            <p className="mt-3 text-xs text-white/35">source: {slot.source}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {slot.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-white/10 px-1.5 py-0.5 text-[11px] text-white/35"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
