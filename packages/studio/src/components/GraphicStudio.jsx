"use client";

import React, { useState } from "react";
import DesignAgentStudio from "./DesignAgentStudio";
import ImageStudio from "./ImageStudio";
import LayersStudio from "./LayersStudio";

const MODES = [
  { id: "canvas", label: "Creative Canvas", description: "Conversational design and asset-aware editing" },
  { id: "image", label: "Generate & Edit", description: "Image generation, uploads, drawing, text, shapes, undo, and redo" },
  { id: "layers", label: "Layers", description: "Layer decomposition and advanced composition" },
];

export default function GraphicStudio({
  apiKey,
  initialAsset,
  droppedFiles,
  onFilesHandled,
  onGenerationStart,
  onGenerationEnd,
  onGenerationComplete,
  onGenerationError,
  isHeaderVisible,
  onToggleHeader,
}) {
  const [mode, setMode] = useState("canvas");
  const shared = {
    apiKey,
    droppedFiles,
    onFilesHandled,
    onGenerationStart,
    onGenerationEnd,
    onGenerationComplete,
    onGenerationError,
    isHeaderVisible,
    onToggleHeader,
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#050506] text-white">
      <header className="flex shrink-0 flex-col gap-3 border-b border-white/[0.07] bg-[#09090b] px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/70">Graphic Studio</p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight">One workspace, existing design engines</h1>
        </div>
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-white/[0.08] bg-black/30 p-1">
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              title={item.description}
              className={`shrink-0 rounded-lg px-3 py-2 text-[11px] font-bold transition ${
                mode === item.id ? "bg-cyan-300 text-black" : "text-white/45 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <div className="shrink-0 border-b border-cyan-300/10 bg-cyan-300/[0.045] px-4 py-2 text-[11px] leading-5 text-cyan-100/65 lg:px-6">
        Creative Canvas now uses the owner-authenticated Creator server adapter. No MuAPI provider credential is copied into browser storage. Legacy Generate &amp; Edit operations remain isolated where they still require BYOK.
      </div>

      <div className="min-h-0 flex-1">
        {mode === "canvas" && <DesignAgentStudio {...shared} />}
        {mode === "image" && <ImageStudio {...shared} initialAsset={initialAsset} />}
        {mode === "layers" && <LayersStudio {...shared} />}
      </div>
    </div>
  );
}
