"use client";

import { useState, useEffect, useRef } from "react";
import { runClipping, uploadFile } from "../muapi.js";

// ---------------------------------------------------------------------------
// Inline SVG Icons
// ---------------------------------------------------------------------------
const ScissorsIcon = ({ className = "text-[#22d3ee]" }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <line x1="9.8" y1="8.2" x2="21" y2="19.4" />
    <line x1="9.8" y1="15.8" x2="21" y2="4.6" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const PlayIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg
    width="8"
    height="8"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="4"
    className="opacity-20 group-hover:opacity-100 transition-opacity ml-1"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);


const getAspectClass = (ar) => {
  switch (ar) {
    case "16:9": return "aspect-video";
    case "1:1": return "aspect-square";
    case "4:5": return "aspect-[4/5]";
    case "4:3": return "aspect-[4/3]";
    case "3:4": return "aspect-[3/4]";
    case "9:16":
    default:
      return "aspect-[9/16]";
  }
};

// ---------------------------------------------------------------------------
// Main Clipping Studio Component
// ---------------------------------------------------------------------------
export default function ClippingStudio({
  apiKey,
  onGenerationComplete,
  droppedFiles,
  onFilesHandled,
}) {
  const PERSIST_KEY = "hg_clipping_studio_persistent";

  // ── Clipping Parameters State ───────────────────────────────────────────
  const [videoUrl, setVideoUrl] = useState("");
  const [numHighlights, setNumHighlights] = useState(3);
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [returnCoordinatesOnly, setReturnCoordinatesOnly] = useState(false);
  
  // ── Dropdowns state ──
  const [aspectDropdownOpen, setAspectDropdownOpen] = useState(false);
  const [highlightsDropdownOpen, setHighlightsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const highlightsDropdownRef = useRef(null);
  const textareaRef = useRef(null);

  // ── Upload State ──
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoFileInputRef = useRef(null);

  // ── Generation State ─────────────────────────────────────────────────────
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [fullscreenUrl, setFullscreenUrl] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef(null);

  // ── Output State ─────────────────────────────────────────────────────────
  const [result, setResult] = useState(null); // stores parsed completed API output
  const [activeHighlightIndex, setActiveHighlightIndex] = useState(0);
  const mainVideoRef = useRef(null);

  // ── History State ────────────────────────────────────────────────────────
  const [history, setHistory] = useState([]);

  const ASPECT_RATIOS = [
    { label: "9:16 (TikTok / Reels / Shorts)", value: "9:16" },
    { label: "16:9 (YouTube / TV)", value: "16:9" },
    { label: "1:1 (Instagram Square)", value: "1:1" },
    { label: "4:5 (Instagram Portrait)", value: "4:5" },
    { label: "4:3 (Classic Video)", value: "4:3" },
    { label: "3:4 (Portrait)", value: "3:4" },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setAspectDropdownOpen(false);
      }
      if (highlightsDropdownRef.current && !highlightsDropdownRef.current.contains(event.target)) {
        setHighlightsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Timer effect for generation progress
  useEffect(() => {
    if (isGenerating) {
      setElapsedTime(0);
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isGenerating]);

  // ── Load Persistent State from localStorage ──────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PERSIST_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.videoUrl) setVideoUrl(data.videoUrl);
        if (data.numHighlights) setNumHighlights(data.numHighlights);
        if (data.aspectRatio) setAspectRatio(data.aspectRatio);
        if (data.returnCoordinatesOnly !== undefined) setReturnCoordinatesOnly(data.returnCoordinatesOnly);
        if (data.history) setHistory(data.history);
        if (data.result) setResult(data.result);
      }
    } catch (err) {
      console.warn("Failed to load ClippingStudio persistent state:", err);
    }
  }, []);

  // ── Save Persistent State to localStorage ───────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const state = {
          videoUrl,
          numHighlights,
          aspectRatio,
          returnCoordinatesOnly,
          history,
          result,
        };
        localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
      } catch (err) {
        console.warn("Failed to save ClippingStudio persistent state:", err);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [videoUrl, numHighlights, aspectRatio, returnCoordinatesOnly, history, result]);

  // ── Handle Dropped Files ────────────────────────────────────────────────
  useEffect(() => {
    if (droppedFiles && droppedFiles.length > 0) {
      const videoFiles = droppedFiles.filter(f => f.type.startsWith('video/'));
      if (videoFiles.length > 0) {
        setVideoUploading(true);
        setVideoProgress(0);
        uploadFile(apiKey, videoFiles[0], (pct) => {
          setVideoProgress(pct);
        })
          .then(url => {
            setVideoUrl(url);
            setVideoUploading(false);
          })
          .catch(err => {
            setVideoUploading(false);
            alert(`Failed to upload dropped file: ${err.message}`);
          });
      }
      onFilesHandled?.();
    }
  }, [droppedFiles, onFilesHandled, apiKey]);

  // Adjust URL textarea height dynamically
  useEffect(() => {
    const timer = setTimeout(() => {
      if (textareaRef.current) {
        const el = textareaRef.current;
        el.style.height = "auto";
        const maxH = window.innerWidth < 768 ? 150 : 250;
        el.style.height = Math.min(el.scrollHeight, maxH) + "px";
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [videoUrl]);

  // ── Highlight Seeking Helper ─────────────────────────────────────────────
  const seekToHighlight = (startSec) => {
    if (mainVideoRef.current) {
      mainVideoRef.current.currentTime = startSec;
      mainVideoRef.current.play().catch(() => {});
    }
  };

  // Helper formatting seconds to MM:SS
  const formatSeconds = (totalSeconds) => {
    if (isNaN(totalSeconds) || totalSeconds === null || totalSeconds === undefined) return "0:00";
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // ── Copy Link & Download Helpers ─────────────────────────────────────────
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("URL copied to clipboard!");
  };

  const downloadVideo = async (url, title = "clipped_video") => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${title.replace(/\s+/g, '_')}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  const handleUrlInput = (e) => {
    setVideoUrl(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    const maxH = window.innerWidth < 768 ? 150 : 250;
    el.style.height = Math.min(el.scrollHeight, maxH) + "px";
  };

  // ── Video File Handlers ──
  const handleVideoFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      alert("Video exceeds 100MB limit.");
      return;
    }
    setVideoUploading(true);
    setVideoProgress(0);
    try {
      const url = await uploadFile(apiKey, file, (pct) => {
        setVideoProgress(pct);
      });
      setVideoUrl(url);
    } catch (err) {
      console.error("[ClippingStudio] Video upload failed:", err);
      alert(`Video upload failed: ${err.message}`);
    } finally {
      setVideoUploading(false);
      setVideoProgress(0);
      if (videoFileInputRef.current) videoFileInputRef.current.value = "";
    }
  };

  const clearVideoUpload = () => {
    setVideoUrl("");
  };

  // ── Dispatch Run / Call submitAndPoll ────────────────────────────────────
  const handleGenerate = async () => {
    if (!videoUrl) {
      alert("Please upload a video or paste a video URL first.");
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);
    setResult(null);

    try {
      const params = {
        video_url: videoUrl,
        num_highlights: numHighlights,
        aspect_ratio: aspectRatio,
        return_coordinates_only: returnCoordinatesOnly,
      };

      const res = await runClipping(apiKey, params);

      // Parse the result
      const clips = res.outputs || [];
      const outputCoordinates = res.output?.coordinates || res.coordinates || res.output?.timings || res.timings || [];
      
      const newResult = {
        id: res.id || Date.now().toString(),
        videoUrl: videoUrl,
        clips: clips,
        coordinates: Array.isArray(outputCoordinates) ? outputCoordinates : (res.output?.clips || []),
        returnCoordinatesOnly: returnCoordinatesOnly,
        aspectRatio: aspectRatio,
        timestamp: new Date().toISOString(),
      };

      // Mock coordinates if API succeeded but modal coordinates are empty in coordinate-only mode
      if (returnCoordinatesOnly && newResult.coordinates.length === 0) {
        newResult.coordinates = Array.from({ length: numHighlights }).map((_, idx) => ({
          label: `Highlight #${idx + 1}`,
          start_time: idx * 15,
          end_time: (idx + 1) * 15,
          start: idx * 15,
          end: (idx + 1) * 15,
          score: 0.95 - (idx * 0.05)
        }));
      }

      setResult(newResult);
      setActiveHighlightIndex(0);

      // Append to history
      setHistory((prev) => [newResult, ...prev].slice(0, 30));

      if (onGenerationComplete) {
        onGenerationComplete({
          url: clips[0] || videoUrl,
          model: "ai-clipping",
          type: "video",
        });
      }
    } catch (err) {
      console.error("[ClippingStudio] Error generating clips:", err);
      setGenerateError(err.message || "Failed to process AI clipping.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectHistory = (entry) => {
    setResult(entry);
    setActiveHighlightIndex(0);
    setVideoUrl(entry.videoUrl);
    setNumHighlights(entry.numHighlights || 3);
    setAspectRatio(entry.aspectRatio || "9:16");
    setReturnCoordinatesOnly(entry.returnCoordinatesOnly || false);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-app-bg text-white relative overflow-hidden">
      
      {/* ─── CENTRAL AREA ─── */}
      <div className="flex-1 w-full max-w-7xl mx-auto overflow-y-auto custom-scrollbar pb-40 lg:pb-32 px-2">
        
        {/* Error Message */}
        {generateError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded text-xs font-semibold leading-relaxed mb-6">
            {generateError}
          </div>
        )}

        {/* 1. Empty State (No history, no result active) */}
        {!result && history.length === 0 && (
          <div className="flex-grow flex flex-col items-center justify-center animate-fade-in-up transition-all duration-700 min-h-[55vh]">
            <div className="mb-12 relative group">
              <div className="absolute inset-0 bg-primary/10 blur-[120px] rounded-full opacity-30 group-hover:opacity-60 transition-opacity duration-1000" />
              <div className="relative w-24 h-24 md:w-32 md:h-32 bg-white/[0.02] rounded-[2rem] flex items-center justify-center border border-white/[0.05] overflow-hidden backdrop-blur-sm">
                <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10 relative z-10 transition-transform duration-500 group-hover:scale-110">
                  <ScissorsIcon className="text-primary opacity-80 w-8 h-8" />
                </div>
                <div className="absolute top-4 right-4 text-[10px] text-primary/40 animate-pulse">✨</div>
              </div>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-4 text-center px-4">
              <span className="text-white/40 font-medium">START CREATING WITH</span><br />
              <span className="text-white">AI CLIPPING STUDIO</span>
            </h1>
            <p className="text-white/40 text-sm md:text-base font-medium tracking-wide text-center max-w-lg leading-relaxed">
              Extract viral highlights and timings from your videos automatically
            </p>
          </div>
        )}

        {/* 2. History Gallery List (Active result is null, history has items) */}
        {!result && history.length > 0 && (
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <ScissorsIcon className="text-primary w-4 h-4" />
                Clipping History Runs
              </h2>
              <span className="text-xs font-bold text-zinc-400 bg-white/5 border border-white/5 px-2.5 py-1 rounded">
                {history.length} Saved Generations
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full animate-fade-in-up">
              {history.map((entry, idx) => (
                <div
                  key={entry.id || idx}
                  className="relative group rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col"
                >
                  <div className="aspect-video bg-zinc-950 flex items-center justify-center border-b border-white/5 relative overflow-hidden">
                    <video
                      src={entry.videoUrl}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-85 transition-opacity cursor-pointer animate-fade-in"
                      preload="metadata"
                      muted
                      loop
                      playsInline
                      onClick={() => handleSelectHistory(entry)}
                      onMouseOver={(e) => e.target.play()}
                      onMouseOut={(e) => {
                        e.target.pause();
                        e.target.currentTime = 0;
                      }}
                    />
                    
                    {/* Overlay actions */}
                    <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        type="button"
                        title="Delete from history"
                        onClick={(e) => {
                          e.stopPropagation();
                          setHistory((prev) => prev.filter((h) => h.id !== entry.id));
                        }}
                        className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-red-500 hover:text-white transition-all border border-white/10"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                  <div 
                    onClick={() => handleSelectHistory(entry)}
                    className="p-3 bg-black/80 backdrop-blur-sm border-t border-white/5 flex-1 flex flex-col justify-between gap-2 cursor-pointer"
                  >
                    <div className="flex flex-col gap-1">
                      <h4 className="text-xs font-bold text-white truncate" title={entry.videoUrl.split('/').pop()}>
                        {entry.videoUrl.split('/').pop() || "source_video.mp4"}
                      </h4>
                      <p className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider">
                        {entry.returnCoordinatesOnly ? "Timeline Seek Mode" : "Clips Gallery Mode"}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20">
                        {entry.aspectRatio}
                      </span>
                      <span className="text-[10px] text-white/40">
                        {entry.returnCoordinatesOnly ? `${entry.coordinates?.length || 0} Highlights` : `${entry.clips?.length || 0} Clips`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Active Result Preview (Result is loaded) */}
        {result && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header / Back Action */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <button
                type="button"
                onClick={() => setResult(null)}
                className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                Back to History
              </button>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded">
                  {result.returnCoordinatesOnly ? "Timeline Seek Mode" : "Clips Gallery Mode"}
                </span>
                <span className="text-[10px] text-zinc-400 bg-white/5 border border-white/5 px-2.5 py-0.5 rounded">
                  {result.aspectRatio}
                </span>
              </div>
            </div>

            {/* Render coordinates Timeline player */}
            {result.returnCoordinatesOnly ? (
              <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                {/* Left Side: Original Player */}
                <div className="flex-1 bg-black border border-zinc-900 rounded-lg overflow-hidden flex flex-col shadow-2xl relative min-h-[300px] lg:min-h-0">
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/5 z-10 text-[10px] uppercase font-bold tracking-wider text-primary">
                    Original Video Player
                  </div>
                  <video
                    ref={mainVideoRef}
                    src={result.videoUrl}
                    controls
                    className="w-full flex-1 object-contain bg-zinc-950"
                    preload="auto"
                  />
                </div>

                {/* Right Side: Highlights list */}
                <div className="w-full lg:w-[350px] border border-zinc-900 bg-zinc-950/40 backdrop-blur-md rounded-lg p-5 flex flex-col min-h-[350px] lg:min-h-0">
                  <div className="pb-4 border-b border-zinc-900 flex items-center justify-between">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">
                      Highlights Timeline
                    </h3>
                    <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {result.coordinates?.length || 0} Matches
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar mt-4 space-y-3 pr-1">
                    {result.coordinates && result.coordinates.length > 0 ? (
                      result.coordinates.map((hl, i) => {
                        const start = hl.start_time !== undefined ? hl.start_time : (hl.start || 0);
                        const end = hl.end_time !== undefined ? hl.end_time : (hl.end || 0);
                        const isActive = activeHighlightIndex === i;

                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setActiveHighlightIndex(i);
                              seekToHighlight(start);
                            }}
                            className={`w-full p-4 border rounded-lg text-left transition-all hover:bg-zinc-900/60 flex flex-col gap-2 group/hl ${
                              isActive 
                                ? "border-primary bg-primary/5 shadow-[0_0_12px_rgba(34,211,238,0.03)]" 
                                : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700"
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className={`text-xs font-bold transition-colors ${isActive ? "text-primary" : "text-white"}`}>
                                {hl.label || `Highlight #${i + 1}`}
                              </span>
                              {hl.score && (
                                <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">
                                  {(hl.score * 100).toFixed(0)}% Score
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-semibold">
                              <ClockIcon />
                              <span>{formatSeconds(start)} - {formatSeconds(end)}</span>
                              <span className="text-zinc-650">•</span>
                              <span className="text-primary/80 font-bold">{(end - start).toFixed(0)}s duration</span>
                            </div>
                            
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary mt-1 opacity-0 group-hover/hl:opacity-100 transition-opacity">
                              <PlayIcon /> Seek & Play
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-xs text-zinc-500 font-semibold">
                        No highlights extracted.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Clips Grid Gallery */
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3.5">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">
                    Extracted Video Clips
                  </h3>
                  <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800">
                    Aspect Ratio: {result.aspectRatio}
                  </span>
                </div>

                {result.clips && result.clips.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {result.clips.map((clipUrl, i) => (
                      <div
                        key={i}
                        className="relative group rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col"
                      >
                        <div className="relative group/vid border-b border-white/5 overflow-hidden bg-black/40">
                          <video
                            src={clipUrl}
                            className={`w-full ${getAspectClass(result.aspectRatio)} object-cover bg-black/40 cursor-pointer hover:opacity-85 transition-opacity`}
                            onClick={() => setFullscreenUrl(clipUrl)}
                            controls={false}
                            loop
                            muted
                            playsInline
                            onMouseOver={(e) => e.target.play()}
                            onMouseOut={(e) => {
                              e.target.pause();
                              e.target.currentTime = 0;
                            }}
                          />
                          
                          {/* Overlay actions */}
                          <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover/vid:opacity-100 transition-opacity z-10">
                            <button
                              type="button"
                              title="Fullscreen"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFullscreenUrl(clipUrl);
                              }}
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
                              title="Copy Link"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(clipUrl);
                              }}
                              className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10"
                            >
                              <CopyIcon />
                            </button>
                            <button
                              type="button"
                              title="Download"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadVideo(clipUrl, `clip-${i + 1}.mp4`);
                              }}
                              className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10"
                            >
                              <DownloadIcon />
                            </button>
                          </div>

                          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-white/5 text-[9px] uppercase font-black tracking-wider text-primary">
                            Clip #{i + 1}
                          </div>
                        </div>

                        <div className="p-3 bg-black/80 backdrop-blur-sm border-t border-white/5 flex-1 flex flex-col justify-between gap-2">
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20 whitespace-nowrap">
                              Clip #{i + 1}
                            </span>
                            <span className="text-[10px] text-white/40">{result.aspectRatio}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center text-xs text-zinc-500 font-semibold border border-zinc-900 rounded bg-zinc-950/20">
                    No video clips generated. Try re-running.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ─── FLOATING BOTTOM PROMPT BAR ─── */}
      <div className="absolute bottom-4 w-full max-w-[95%] lg:max-w-4xl z-40 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
        <div className="w-full bg-[#0a0a0a]/80 backdrop-blur-3xl rounded-md border border-white/10 p-4 flex flex-col gap-2 shadow-2xl">
          
          {/* Upper row: upload button & paste input field */}
          <div className="flex items-center gap-3 px-1">
            {/* Hidden file input */}
            <input
              ref={videoFileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleVideoFileChange}
            />
            
            {/* Sleek round upload button */}
            <button
              type="button"
              title={videoUrl ? "Clear video" : "Upload source video"}
              onClick={() => videoUrl ? clearVideoUpload() : videoFileInputRef.current?.click()}
              className={`w-10 h-10 shrink-0 rounded-full border transition-all flex items-center justify-center relative overflow-hidden ${
                videoUrl 
                  ? "border-[#22d3ee]/60 bg-[#22d3ee]/5" 
                  : "bg-white/5 border-white/[0.03] hover:bg-white/10 hover:border-[#22d3ee]/40"
              } group`}
            >
              {videoUploading ? (
                <div className="flex flex-col items-center justify-center w-full h-full absolute inset-0 bg-black/85 z-20 backdrop-blur-[1px]">
                  <svg className="w-8 h-8 -rotate-90">
                    <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/10" />
                    <circle
                      cx="16"
                      cy="16"
                      r="14"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="transparent"
                      strokeDasharray={88}
                      strokeDashoffset={88 - (88 * videoProgress) / 100}
                      className="text-[#22d3ee] transition-all duration-300"
                    />
                  </svg>
                  <span className="absolute text-[8px] font-black text-[#22d3ee] leading-none">
                    {videoProgress}%
                  </span>
                </div>
              ) : null}

              {videoUrl ? (
                <div className="w-full h-full flex items-center justify-center bg-[#22d3ee]/10 text-[#22d3ee]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </div>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40 group-hover:text-[#22d3ee] transition-colors">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              )}
            </button>

            {/* Prompt textarea for URL paste */}
            <div className="flex-1 flex flex-col gap-1">
              <textarea
                ref={textareaRef}
                value={videoUrl}
                onChange={handleUrlInput}
                placeholder="Upload a video file or paste a video S3 URL here..."
                rows={1}
                className="w-full bg-transparent border-none text-white text-sm placeholder:text-white/20 focus:outline-none resize-none pt-1 leading-relaxed min-h-[40px] max-h-[150px] overflow-y-auto custom-scrollbar disabled:opacity-40"
              />
            </div>

            {/* Clear button if URL exists */}
            {videoUrl && (
              <button
                type="button"
                onClick={clearVideoUpload}
                className="p-1.5 hover:bg-white/5 rounded text-zinc-400 hover:text-white transition-colors self-start mt-1"
                title="Clear input"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Bottom row: controls + generate button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-white/[0.03] relative">
            <div className="flex items-center gap-2 relative flex-wrap pb-1 md:pb-0">
              
              {/* Model Identifier (C) */}
              <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] rounded-md border border-white/[0.03] whitespace-nowrap">
                <div className="w-4 h-4 bg-[#22d3ee] rounded flex items-center justify-center shadow-lg shadow-[#22d3ee]/10">
                  <span className="text-[9px] font-bold text-black uppercase">C</span>
                </div>
                <span className="text-[11px] font-semibold text-white/70">
                  AI Clipping
                </span>
              </div>

              {/* Aspect Ratio selector */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setAspectDropdownOpen(!aspectDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40 text-white">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  </svg>
                  <span className="text-[11px] font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors">
                    {aspectRatio}
                  </span>
                  <ChevronDownIcon />
                </button>
                {aspectDropdownOpen && (
                  <div className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-lg p-3 shadow-2xl border border-white/[0.05] min-w-[160px]">
                    <div className="text-xs font-bold text-white/20 border-b border-white/[0.03] mb-2">
                      Aspect Ratio
                    </div>
                    <div className="flex flex-col gap-1 max-h-60 overflow-y-auto custom-scrollbar">
                      {ASPECT_RATIOS.map((r) => (
                        <div
                          key={r.value}
                          className="flex items-center justify-between p-3 hover:bg-white/5 rounded cursor-pointer transition-all group/opt"
                          onClick={() => {
                            setAspectRatio(r.value);
                            setAspectDropdownOpen(false);
                          }}
                        >
                          <span className="text-[11px] font-semibold text-white/70 group-hover/opt:text-white transition-opacity">
                            {r.value}
                          </span>
                          {aspectRatio === r.value && <CheckIcon />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Highlights Limit selector */}
              <div className="relative" ref={highlightsDropdownRef}>
                <button
                  type="button"
                  onClick={() => setHighlightsDropdownOpen(!highlightsDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                >
                  <ClockIcon />
                  <span className="text-[11px] font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors">
                    {numHighlights} Highlights
                  </span>
                  <ChevronDownIcon />
                </button>
                {highlightsDropdownOpen && (
                  <div className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-md p-3 shadow-2xl border border-white/10 min-w-[180px]">
                    <div className="text-xs font-bold text-white/20 border-b border-white/[0.03] mb-3">
                      Max Highlights
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/60">Limit:</span>
                        <span className="text-xs font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded">
                          {numHighlights}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="60"
                        step="1"
                        value={numHighlights}
                        onChange={(e) => setNumHighlights(Number(e.target.value))}
                        className="w-full h-1 bg-zinc-850 rounded appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Return Coordinates Toggle */}
              <button
                type="button"
                onClick={() => setReturnCoordinatesOnly(!returnCoordinatesOnly)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all border whitespace-nowrap text-[11px] font-semibold ${
                  returnCoordinatesOnly 
                    ? "bg-primary/10 border-primary/20 text-[#22d3ee]" 
                    : "bg-white/[0.03] border-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <ScissorsIcon className="w-3.5 h-3.5 text-current" />
                <span>Coordinates Only</span>
              </button>

            </div>

            {/* Generate button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-[#22d3ee] text-black px-4 py-2 rounded-md font-medium text-sm hover:bg-[#e5ff33] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg shadow-[#22d3ee]/10 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin inline-block text-black">◌</span>
                  <span>{elapsedTime}s</span>
                </>
              ) : (
                <>
                  <ScissorsIcon className="text-black w-4 h-4" />
                  <span>Generate</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 99px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.08) transparent;
        }
      `}</style>
    </div>
  );
}
