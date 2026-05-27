"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { runMotionGraphics, runMotionGraphicsEdit } from "../muapi.js";

// ── helpers ───────────────────────────────────────────────────────────────────
async function downloadFile(url, filename) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, "_blank");
  }
}

const formatTime = (s) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// ── icons ─────────────────────────────────────────────────────────────────────
const CheckSvg = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="4">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ── Dropdown helper ───────────────────────────────────────────────────────────
function DropdownItem({ label, selected, onClick }) {
  return (
    <div
      className="flex items-center justify-between p-3.5 hover:bg-white/5 rounded cursor-pointer transition-all group"
      onClick={onClick}
    >
      <span className="text-xs font-bold text-white opacity-80 group-hover:opacity-100">
        {label}
      </span>
      {selected && <CheckSvg />}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function VibeMotionStudio({ apiKey }) {
  const PERSIST_KEY = "hg_vibe_motion_studio_persistent";

  // ── Params ────────────────────────────────────────────────────────────────
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState(6);

  // ── Edit mode ─────────────────────────────────────────────────────────────
  const [editMode, setEditMode] = useState(false);
  const [editSourceId, setEditSourceId] = useState(null);  // request_id of source

  // ── Dropdown open state ───────────────────────────────────────────────────
  const [openDropdown, setOpenDropdown] = useState(null); // "ar" | "dur" | "source"
  const containerRef = useRef(null);
  const textareaRef = useRef(null);

  // ── Generation state ──────────────────────────────────────────────────────
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef(null);
  const pendingRequestId = useRef(null);

  // ── History ───────────────────────────────────────────────────────────────
  const [history, setHistory] = useState([]);
  const [fullscreenUrl, setFullscreenUrl] = useState(null);

  // ── Load from localStorage ─────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PERSIST_KEY) || "[]");
      if (Array.isArray(saved)) {
        // Strip any wrongly-persisted canEdit:false flags from old bug — restore all entries as remixable
        const restored = saved.map((h) => {
          const { canEdit, ...rest } = h;
          return rest; // canEdit is only an in-memory hint, never persisted
        });
        setHistory(restored);
      }
    } catch (_) {}
  }, []);

  const saveHistory = useCallback((items) => {
    setHistory(items);
    // Strip canEdit from persisted data — it is an in-memory hint only
    const stripped = items.map(({ canEdit, ...rest }) => rest);
    try { localStorage.setItem(PERSIST_KEY, JSON.stringify(stripped)); } catch (_) {}
  }, []);

  // ── Close dropdowns on outside click ─────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Timer ─────────────────────────────────────────────────────────────────
  const startTimer = () => {
    setElapsedTime(0);
    timerRef.current = setInterval(() => setElapsedTime((t) => t + 1), 1000);
  };
  const stopTimer = () => { clearInterval(timerRef.current); timerRef.current = null; };
  useEffect(() => () => stopTimer(), []);

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setGenerateError(null);
    startTimer();
    try {
      let result;
      if (editMode) {
        result = await runMotionGraphicsEdit(apiKey, {
          request_id: editSourceId,
          edit_prompt: prompt.trim(),
          aspect_ratio: aspectRatio,
          duration_seconds: duration,
          onRequestId: (id) => { pendingRequestId.current = id; },
        });
      } else {
        result = await runMotionGraphics(apiKey, {
          prompt: prompt.trim(),
          aspect_ratio: aspectRatio,
          duration_seconds: duration,
          onRequestId: (id) => { pendingRequestId.current = id; },
        });
      }

      const videoUrl = result?.output?.video || result?.url || result?.outputs?.[0];
      const requestId = result?.id || result?.request_id || pendingRequestId.current;

      const entry = {
        id: requestId || Date.now().toString(),
        requestId,
        url: videoUrl,
        prompt: prompt.trim(),
        aspectRatio,
        duration,
        mode: editMode ? "edit" : "generate",
        sourceId: editMode ? editSourceId : null,
        timestamp: new Date().toISOString(),
        // Mark as editable — only generations created with saved animation code can be remixed
        canEdit: true,
      };

      const next = [entry, ...history].slice(0, 30);
      saveHistory(next);
    } catch (err) {
      // Detect the backend's "animation code not saved" limitation
      const raw = err.message || "";
      const isStaleEdit =
        raw.includes("animation code") ||
        raw.includes("does not have saved") ||
        raw.includes("Original generation does not");

      if (isStaleEdit) {
        // Known backend limitation — warn only (not error), keep console clean
        console.warn("[VibeMotionStudio] Remix unavailable:", raw.slice(0, 120));
        setGenerateError(
          "This generation can't be remixed — the animation code wasn't saved server-side. " +
          "Generate a new motion graphic first, then remix that result."
        );
        // Exit edit mode WITHOUT persisting canEdit:false — let user retry after refresh
        setEditMode(false);
        setEditSourceId(null);
      } else {
        console.error("[VibeMotionStudio]", err);
        setGenerateError(raw.slice(0, 120) || "Generation failed");
      }
      setTimeout(() => setGenerateError(null), 10000);
    } finally {
      setGenerating(false);
      stopTimer();
    }
  }, [apiKey, prompt, editMode, editSourceId, aspectRatio, duration, history, saveHistory]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleGenerate();
  };

  const toggleDropdown = (type) => (e) => {
    e.stopPropagation();
    setOpenDropdown((prev) => (prev === type ? null : type));
  };

  const ASPECT_RATIOS = ["16:9", "9:16", "1:1"];
  const DURATION_OPTIONS = [5, 6, 8, 10, 12, 15, 20, 25, 30];

  // Show all entries with a requestId as editable UNLESS they are explicitly marked canEdit:false
  // (entries loaded from localStorage without the flag are treated as optimistically editable)
  const editSources = history.filter((h) => h.requestId && h.canEdit !== false);
  const sourceEntry = editSources.find((h) => h.requestId === editSourceId);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col items-center justify-center bg-app-bg relative overflow-hidden"
    >
      {/* ── Fullscreen overlay ── */}
      {fullscreenUrl && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
          onClick={() => setFullscreenUrl(null)}
        >
          <video
            src={fullscreenUrl}
            autoPlay loop controls
            className="max-h-[90vh] max-w-[90vw] rounded shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors text-3xl font-light leading-none"
            onClick={() => setFullscreenUrl(null)}
          >×</button>
        </div>
      )}

      {/* ── GALLERY AREA ── */}
      <div className="flex-1 w-full max-w-7xl mx-auto overflow-y-auto custom-scrollbar pb-40 lg:pb-32 px-2">
        {generating && (
          /* ── Loading card at top of grid ── */
          <div className="w-full pt-6 flex justify-center animate-fade-in-up">
            <div className="flex flex-col items-center gap-4 py-16">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-2 border-violet-500/20 animate-ping" />
                <div className="absolute inset-2 rounded-full border-2 border-[#22d3ee]/30 animate-spin" />
                <div className="absolute inset-4 rounded-full border-2 border-violet-400/50 animate-[spin_1.5s_linear_infinite_reverse]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400 animate-pulse">
                    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                  </svg>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-white/80 font-semibold text-sm">
                  {editMode ? "Remixing motion graphics…" : "Generating motion graphics…"}
                </span>
                <span className="text-white/30 text-xs">React/Remotion rendering on Modal</span>
              </div>
              <div className="flex items-center gap-2 text-white/30 text-xs bg-white/[0.03] px-4 py-1.5 rounded-full border border-white/[0.05]">
                <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/>
                  <path d="M12 2a10 10 0 0 1 10 10"/>
                </svg>
                {formatTime(elapsedTime)}
              </div>
            </div>
          </div>
        )}

        {!generating && history.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pt-4 animate-fade-in-up">
            {history.map((entry, idx) => (
              <div
                key={entry.id || idx}
                className="relative group rounded overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col"
              >
                {/* Video thumbnail */}
                <video
                  src={entry.url}
                  className="w-full aspect-video object-cover bg-black/40 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setFullscreenUrl(entry.url)}
                  controls={false}
                  loop
                  muted
                  playsInline
                  onMouseOver={(e) => e.target.play()}
                  onMouseOut={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                />

                {/* ── Mode tag (top-left) ── */}
                <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm border ${
                  entry.mode === "edit"
                    ? "bg-[#22d3ee]/20 text-[#22d3ee] border-[#22d3ee]/30"
                    : "bg-violet-600/30 text-violet-300 border-violet-500/30"
                }`}>
                  {entry.mode === "edit" ? "✏ Edit" : "✦ Generated"}
                </div>

                {/* ── Hover overlay actions ── */}
                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    title="Fullscreen"
                    onClick={(e) => { e.stopPropagation(); setFullscreenUrl(entry.url); }}
                    className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="15 3 21 3 21 9" />
                      <polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    title="Download"
                    onClick={(e) => { e.stopPropagation(); downloadFile(entry.url, `motion-${entry.id || idx}.mp4`); }}
                    className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                  </button>
                  {entry.requestId && entry.canEdit !== false ? (
                    <button
                      type="button"
                      title="Remix this generation"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditMode(true);
                        setEditSourceId(entry.requestId);
                        setPrompt("");
                        setTimeout(() => textareaRef.current?.focus(), 50);
                      }}
                      className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-[#22d3ee] hover:text-black transition-all border border-white/10"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  ) : entry.requestId && entry.canEdit === false ? (
                    /* Legacy generation — animation code not saved by API, remix not available */
                    <div
                      title="Legacy generation — remix not available. Generate a new motion graphic to enable editing."
                      className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white/20 border border-white/5 cursor-not-allowed"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                  ) : null}
                </div>

                {/* ── Card footer: prompt + metadata ── */}
                <div className="p-3 bg-black/80 backdrop-blur-sm border-t border-white/5 flex-1 flex flex-col justify-between gap-2">
                  <p className="text-white/70 text-xs line-clamp-3 leading-relaxed" title={entry.prompt}>
                    {entry.prompt || "No prompt"}
                  </p>
                  <div className="flex items-center justify-between mt-1 flex-wrap gap-1">
                    <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20 whitespace-nowrap">
                      motion-graphics{entry.mode === "edit" ? "-edit" : ""}
                    </span>
                    <div className="flex gap-2">
                      {entry.aspectRatio && (
                        <span className="text-[10px] text-white/40">{entry.aspectRatio}</span>
                      )}
                      {entry.duration && (
                        <span className="text-[10px] text-white/40">{entry.duration}s</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !generating ? (
          /* ── Empty State ── */
          <div className="flex flex-col items-center justify-center h-full animate-fade-in-up transition-all duration-700 min-h-[50vh]">
            <div className="mb-12 relative group">
              <div className="absolute inset-0 bg-primary/10 blur-[120px] rounded-full opacity-30 group-hover:opacity-60 transition-opacity duration-1000" />
              <div className="relative w-24 h-24 md:w-32 md:h-32 bg-white/[0.02] rounded flex items-center justify-center border border-white/[0.05] overflow-hidden backdrop-blur-sm">
                <div className="w-16 h-16 bg-primary/5 rounded flex items-center justify-center border border-primary/10 relative z-10 transition-transform duration-500 group-hover:scale-110">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary opacity-80">
                    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                  </svg>
                </div>
                <div className="absolute top-4 right-4 text-[10px] text-primary/40 animate-pulse">✨</div>
              </div>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-4 text-center px-4">
              <span className="text-white/40 font-medium">START CREATING WITH</span><br />
              <span className="text-white">VIBE MOTION</span>
            </h1>
            <p className="text-white/40 text-sm md:text-base font-medium tracking-wide text-center max-w-lg leading-relaxed">
              Generate animated motion graphics from a text prompt — kinetic typography, data charts, logo reveals and more
            </p>
          </div>
        ) : null}
      </div>

      {/* ── BOTTOM PROMPT BAR — matches VideoStudio exactly ── */}
      <div className="absolute bottom-4 w-full max-w-[95%] lg:max-w-4xl z-40 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
        <div className="w-full bg-[#0a0a0a]/80 backdrop-blur-3xl rounded-md border border-white/10 p-4 flex flex-col gap-2 shadow-2xl">

          {/* ── Edit mode banner ── */}
          {editMode && (
            <div className="flex items-center gap-2 px-3 py-1.5 mx-0 bg-[#22d3ee]/5 border border-[#22d3ee]/10 rounded text-[10px] text-[#22d3ee]/80 font-medium tracking-tight">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              <span>
                {sourceEntry
                  ? `Editing: "${sourceEntry.prompt?.slice(0, 50)}${sourceEntry.prompt?.length > 50 ? "…" : ""}"`
                  : "Select a source generation from the gallery"}
              </span>
              <button
                onClick={() => { setEditMode(false); setEditSourceId(null); setPrompt(""); }}
                className="ml-auto text-[#22d3ee]/40 hover:text-[#22d3ee] transition-colors text-base leading-none"
              >×</button>
            </div>
          )}

          {/* ── Textarea row ── */}
          <div className="flex items-center gap-2 px-1">
            {/* Mode toggle pill */}
            <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.05] rounded-full p-0.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => { setEditMode(false); setEditSourceId(null); }}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                  !editMode ? "bg-[#22d3ee] text-black shadow" : "text-white/40 hover:text-white/70"
                }`}
              >
                Generate
              </button>
              <button
                type="button"
                onClick={() => setEditMode(true)}
                disabled={editSources.length === 0}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                  editMode ? "bg-[#22d3ee] text-black shadow" : "text-white/40 hover:text-white/70"
                }`}
              >
                Edit
              </button>
            </div>

            {/* Prompt textarea */}
            <div className="flex-1 flex flex-col gap-1">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  editMode
                    ? "Describe what to change — 'change background to dark navy, make bars gold, add particles…'"
                    : "Describe the motion graphic — 'Animated sales dashboard with glowing bar charts and rising numbers'"
                }
                rows={1}
                className="w-full bg-transparent border-none text-white text-sm placeholder:text-white/10 focus:outline-none resize-none pt-1 leading-relaxed min-h-[40px] max-h-[150px] md:max-h-[250px] overflow-y-auto custom-scrollbar"
              />
            </div>
          </div>

          {/* ── Error banner ── */}
          {generateError && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {generateError}
            </div>
          )}

          {/* ── Controls row: dropdowns + generate button ── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-white/[0.03] relative">
            <div className="flex items-center gap-2 relative flex-wrap pb-1 md:pb-0">

              {/* ── Aspect Ratio dropdown ── */}
              <div className="relative">
                <button
                  type="button"
                  onClick={toggleDropdown("ar")}
                  className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                >
                  <div className="w-4 h-4 bg-[#22d3ee] rounded flex items-center justify-center shadow-lg shadow-[#22d3ee]/10">
                    <span className="text-[9px] font-bold text-black uppercase">A</span>
                  </div>
                  <span className="text-[11px] font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors">
                    {aspectRatio}
                  </span>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="opacity-20 group-hover:opacity-100 transition-opacity ml-1">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
                {openDropdown === "ar" && (
                  <div className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-lg p-3 shadow-2xl border border-white/[0.05] min-w-[140px]">
                    <div className="text-xs font-bold text-white/20 border-b border-white/[0.03] mb-2">Aspect Ratio</div>
                    <div className="flex flex-col gap-1">
                      {ASPECT_RATIOS.map((ar) => (
                        <div
                          key={ar}
                          className="flex items-center justify-between p-3 hover:bg-white/5 rounded cursor-pointer transition-all group/opt"
                          onClick={() => { setAspectRatio(ar); setOpenDropdown(null); }}
                        >
                          <span className="text-[11px] font-semibold text-white/70 group-hover/opt:text-white transition-opacity">{ar}</span>
                          {aspectRatio === ar && <CheckSvg />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Duration dropdown ── */}
              <div className="relative">
                <button
                  type="button"
                  onClick={toggleDropdown("dur")}
                  className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                >
                  <div className="w-4 h-4 bg-[#22d3ee] rounded flex items-center justify-center shadow-lg shadow-[#22d3ee]/10">
                    <span className="text-[9px] font-bold text-black uppercase">T</span>
                  </div>
                  <span className="text-[11px] font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors">
                    {duration}s
                  </span>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="opacity-20 group-hover:opacity-100 transition-opacity ml-1">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
                {openDropdown === "dur" && (
                  <div className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-md p-3 shadow-2xl border border-white/10 min-w-[140px] max-h-52 overflow-y-auto custom-scrollbar">
                    <div className="text-xs font-bold text-white/20 border-b border-white/[0.03] mb-2">Duration</div>
                    <div className="flex flex-col gap-1">
                      {DURATION_OPTIONS.map((d) => (
                        <div
                          key={d}
                          className="flex items-center justify-between p-2 hover:bg-white/5 rounded-md cursor-pointer transition-all group/opt"
                          onClick={() => { setDuration(d); setOpenDropdown(null); }}
                        >
                          <span className="text-xs font-semibold text-white/70 group-hover/opt:text-white">{d}s</span>
                          {duration === d && <CheckSvg />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Edit source picker dropdown — only shown in edit mode */}
              {editMode && editSources.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={toggleDropdown("source")}
                    className="flex items-center gap-2 px-3 py-2 bg-[#22d3ee]/[0.04] hover:bg-[#22d3ee]/[0.08] rounded-md transition-all border border-[#22d3ee]/[0.08] group whitespace-nowrap"
                  >
                    <div className="w-4 h-4 bg-[#22d3ee]/20 rounded flex items-center justify-center border border-[#22d3ee]/30">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-[#22d3ee]/70 group-hover:text-[#22d3ee] transition-colors max-w-[120px] truncate">
                      {sourceEntry ? `Source: ${sourceEntry.prompt?.slice(0, 20)}…` : "Pick source…"}
                    </span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-30 flex-shrink-0">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                  {openDropdown === "source" && (
                    <div className="absolute bottom-[calc(100%+12px)] left-0 z-50 w-64 bg-[#0a0a0a] rounded-lg p-3 shadow-2xl border border-white/[0.05] max-h-64 overflow-y-auto custom-scrollbar">
                      <div className="text-xs font-bold text-white/20 border-b border-white/[0.03] mb-2">Source Generation</div>
                      <div className="flex flex-col gap-1">
                        {editSources.map((src) => (
                          <div
                            key={src.requestId}
                            className="flex items-center gap-3 p-2 hover:bg-white/5 rounded cursor-pointer transition-all group/opt"
                            onClick={() => { setEditSourceId(src.requestId); setOpenDropdown(null); }}
                          >
                            <div className="w-10 h-7 rounded overflow-hidden bg-black/40 flex-shrink-0 border border-white/5">
                              <video src={src.url} className="w-full h-full object-cover" muted playsInline />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] text-white/70 truncate leading-tight group-hover/opt:text-white">{src.prompt}</p>
                              <p className="text-[9px] text-white/30 mt-0.5">{src.aspectRatio} · {src.duration}s</p>
                            </div>
                            {editSourceId === src.requestId && <CheckSvg />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <span className="text-[10px] text-white/20 hidden sm:block ml-2">Ctrl+Enter to run</span>
            </div>

            {/* ── Generate Button — matches VideoStudio exactly ── */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || !prompt.trim() || (editMode && !editSourceId)}
              className="bg-[#22d3ee] text-black px-4 py-2 rounded-md font-medium text-sm hover:bg-[#e5ff33] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg shadow-[#22d3ee]/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <span className="animate-spin inline-block text-black">◌</span>{" "}
                  {editMode ? "Remixing..." : "Generating..."}
                </>
              ) : generateError ? (
                `Error: ${generateError.slice(0, 40)}…`
              ) : editMode ? (
                <span>Remix</span>
              ) : (
                <span>Generate</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
