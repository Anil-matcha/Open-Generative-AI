"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { processLipSync, uploadFile } from "../muapi.js";
import {
  lipsyncModels,
  imageLipSyncModels,
  videoLipSyncModels,
  getLipSyncModelById,
  getResolutionsForLipSyncModel,
} from "../models.js";

// ---------------------------------------------------------------------------
// Upload button states
// ---------------------------------------------------------------------------
const UPLOAD_STATE = {
  IDLE: "idle",
  UPLOADING: "uploading",
  READY: "ready",
};

function MediaPickerButton({
  accept,
  label,
  icon,
  onUpload,
  onClear,
  uploadState,
  progress,
  fileName,
  previewUrl,
  isVideo,
  apiKey,
}) {
  const inputRef = useRef(null);

  const handleClick = (e) => {
    e.stopPropagation();
    if (uploadState === UPLOAD_STATE.READY) {
      onClear();
      return;
    }
    inputRef.current?.click();
  };

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    await onUpload(file);
  };

  const borderClass =
    uploadState === UPLOAD_STATE.READY
      ? "border-primary/60 bg-primary/5"
      : "border-white/[0.03] bg-white/[0.03] hover:bg-white/[0.06] hover:border-primary/40";

  return (
    <button
      type="button"
      title={
        uploadState === UPLOAD_STATE.READY
          ? `${fileName} — click to clear`
          : `Upload ${label.toLowerCase()} file`
      }
      onClick={handleClick}
      className={`flex-shrink-0 w-10 h-10 rounded-full border transition-all flex items-center justify-center relative overflow-hidden group ${borderClass}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />

      {/* Idle state */}
      {uploadState === UPLOAD_STATE.IDLE && (
        <div className="flex flex-col items-center justify-center gap-1 w-full h-full">
          {icon}
        </div>
      )}

      {/* Uploading indicator */}
      {uploadState === UPLOAD_STATE.UPLOADING && (
        <div className="flex flex-col items-center justify-center w-full h-full absolute inset-0 bg-black/80 z-20 backdrop-blur-[2px]">
          <svg className="w-8 h-8 -rotate-90">
            <circle
              cx="16"
              cy="16"
              r="14"
              stroke="currentColor"
              strokeWidth="2"
              fill="transparent"
              className="text-white/10"
            />
            <circle
              cx="16"
              cy="16"
              r="14"
              stroke="currentColor"
              strokeWidth="2"
              fill="transparent"
              strokeDasharray={88}
              strokeDashoffset={88 - (88 * progress) / 100}
              className="text-primary transition-all duration-300"
            />
          </svg>
          <span className="absolute text-[9px] font-black text-primary leading-none">
            {progress}%
          </span>
        </div>
      )}

      {/* Ready state */}
      {uploadState === UPLOAD_STATE.READY && (
        <div className="flex flex-col items-center justify-center gap-1 w-full h-full absolute inset-0 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-all">
          {previewUrl ? (
            isVideo ? (
              <video
                src={previewUrl}
                className="w-full h-full object-cover"
                muted
              />
            ) : (
              <img
                src={previewUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center w-full px-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary mb-0.5">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
              <span className="text-[7px] font-black text-primary uppercase truncate w-full text-center">
                {fileName?.split('.').pop() || "AUD"}
              </span>
            </div>
          )}
        </div>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Inline dropdown
// ---------------------------------------------------------------------------
function Dropdown({ isOpen, items, selectedId, onSelect, onClose, anchorRef }) {
  const dropRef = useRef(null);
  const [style, setStyle] = useState({});

  useEffect(() => {
    if (!isOpen || !anchorRef?.current || !dropRef.current) return;

    const rect = anchorRef.current.getBoundingClientRect();
    const ddHeight = dropRef.current.offsetHeight;
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;

    let top, bottom, maxHeight;
    if (spaceBelow >= ddHeight || spaceBelow >= spaceAbove) {
      top = rect.bottom + 8;
      bottom = "auto";
      maxHeight = Math.max(150, spaceBelow - 8);
    } else {
      top = "auto";
      bottom = window.innerHeight - rect.top + 8;
      maxHeight = Math.max(150, spaceAbove - 8);
    }
    const left = Math.min(rect.left, window.innerWidth - 220);
    setStyle({ top, bottom, left, maxHeight });
  }, [isOpen, anchorRef]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (
        !dropRef.current?.contains(e.target) &&
        !anchorRef?.current?.contains(e.target)
      ) {
        onClose();
      }
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropRef}
      style={{
        position: "fixed",
        zIndex: 100,
        overflowY: "auto",
        ...style,
      }}
      className="bg-[#111] border border-white/10 rounded-lg shadow-3xl p-2 custom-scrollbar w-[calc(100vw-3rem)] max-w-xs"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            onSelect(item);
            onClose();
          }}
          className={`w-full text-left px-4 py-2 rounded text-sm transition-all hover:bg-white/10 ${
            item.id === selectedId
              ? "text-primary font-bold bg-primary/5"
              : "text-white font-medium"
          }`}
        >
          <div>{item.name}</div>
          {item.description && (
            <div className="text-xs text-muted mt-0.5">
              {item.description.slice(0, 60)}...
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// History sidebar thumbnail
// ---------------------------------------------------------------------------
function HistoryThumb({ entry, isActive, onSelect, onDownload }) {
  return (
    <div
      onClick={onSelect}
      className={`relative group/thumb cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-300 ${
        isActive
          ? "border-primary shadow-glow"
          : "border-white/10 hover:border-white/30"
      }`}
    >
      <video
        src={entry.url}
        preload="metadata"
        muted
        className="w-full aspect-square object-cover"
      />
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDownload(entry);
          }}
          className="p-1.5 bg-primary rounded-lg text-black hover:scale-110 transition-transform"
          title="Download"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SVG icons
// ---------------------------------------------------------------------------
const MicIcon = ({
  className = "text-muted group-hover:text-primary transition-colors",
}) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
  >
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
  </svg>
);

const VideoIcon = ({
  className = "text-muted group-hover:text-primary transition-colors",
}) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
  >
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function LipSyncStudio({
  apiKey,
  onGenerationComplete,
  historyItems,
  droppedFiles,
  onFilesHandled,
}) {
  const PERSIST_KEY = "hg_lipsync_studio_persistent";

  // ── Mode & model state ──────────────────────────────────────────────────
  const [inputMode, setInputMode] = useState("image"); // 'image' | 'video'

  const currentModels =
    inputMode === "image" ? imageLipSyncModels : videoLipSyncModels;
  const firstModel = currentModels[0];

  const [selectedModelId, setSelectedModelId] = useState(firstModel?.id ?? "");
  const [selectedResolution, setSelectedResolution] = useState(
    firstModel?.inputs?.resolution?.default ?? "480p",
  );

  // ── Upload state ────────────────────────────────────────────────────────
  const [imageState, setImageState] = useState(UPLOAD_STATE.IDLE);
  const [imageName, setImageName] = useState("");
  const [imageUrl, setImageUrl] = useState(null);

  const [videoState, setVideoState] = useState(UPLOAD_STATE.IDLE);
  const [videoName, setVideoName] = useState("");
  const [videoUrl, setVideoUrl] = useState(null);

  const [audioState, setAudioState] = useState(UPLOAD_STATE.IDLE);
  const [audioName, setAudioName] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);

  // ── Individual progress states ──
  const [imageProgress, setImageProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);

  // ── Prompt ──────────────────────────────────────────────────────────────
  const [prompt, setPrompt] = useState("");

  // ── Generation / UI state ───────────────────────────────────────────────
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [fullscreenUrl, setFullscreenUrl] = useState(null);
  const [view, setView] = useState("input"); // 'input' | 'result'
  const [activeResultUrl, setActiveResultUrl] = useState(null);

  // ── History ─────────────────────────────────────────────────────────────
  // If historyItems prop is provided, use it; otherwise use internal state.
  const [internalHistory, setInternalHistory] = useState([]);
  const history = historyItems ?? internalHistory;
  const [activeHistoryIdx, setActiveHistoryIdx] = useState(0);

  // ── Dropdown state ──────────────────────────────────────────────────────
  const [openDropdown, setOpenDropdown] = useState(null); // 'model' | 'resolution' | null
  const modelBtnRef = useRef(null);
  const resolutionBtnRef = useRef(null);

  // ── Video ref for result ────────────────────────────────────────────────
  const resultVideoRef = useRef(null);
  const hasRestored = useRef(false);

  // ── Persistence: Load ────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PERSIST_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.inputMode) setInputMode(data.inputMode);
        if (data.selectedModelId) setSelectedModelId(data.selectedModelId);
        if (data.selectedResolution) setSelectedResolution(data.selectedResolution);
        if (data.imageUrl) {
          setImageUrl(data.imageUrl);
          setImageState(UPLOAD_STATE.READY);
        }
        if (data.videoUrl) {
          setVideoUrl(data.videoUrl);
          setVideoState(UPLOAD_STATE.READY);
        }
        if (data.audioUrl) {
          setAudioUrl(data.audioUrl);
          setAudioState(UPLOAD_STATE.READY);
        }
        if (data.imageName) setImageName(data.imageName);
        if (data.videoName) setVideoName(data.videoName);
        if (data.audioName) setAudioName(data.audioName);
        if (data.prompt) setPrompt(data.prompt);
        if (data.internalHistory) setInternalHistory(data.internalHistory);
      }
    } catch (err) {
      console.warn("Failed to load LipSyncStudio persistence:", err);
    } finally {
      hasRestored.current = true;
    }
  }, []);

  // ── Persistence: Save ────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const state = {
          inputMode,
          selectedModelId,
          selectedResolution,
          imageUrl,
          imageName,
          videoUrl,
          videoName,
          audioUrl,
          audioName,
          prompt,
          internalHistory,
        };
        localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
      } catch (err) {
        console.warn("Failed to save LipSyncStudio persistence:", err);
      }
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [
    inputMode,
    selectedModelId,
    selectedResolution,
    imageUrl,
    imageName,
    videoUrl,
    videoName,
    audioUrl,
    audioName,
    prompt,
    internalHistory,
  ]);

  // ── Derived model info ──────────────────────────────────────────────────
  const selectedModel = lipsyncModels.find((m) => m.id === selectedModelId);
  const resolutionOptions = getResolutionsForLipSyncModel(selectedModelId);
  const showResolution = resolutionOptions.length > 0;
  const showPrompt = !!selectedModel?.hasPrompt;

  // ── Sync model when mode changes ────────────────────────────────────────
  useEffect(() => {
    if (hasRestored.current) return;
    const models =
      inputMode === "image" ? imageLipSyncModels : videoLipSyncModels;
    const first = models[0];
    if (!first) return;
    setSelectedModelId(first.id);
    setSelectedResolution(first.inputs?.resolution?.default ?? "480p");
  }, [inputMode]);

  // ── Upload handlers ─────────────────────────────────────────────────────
  const handleImageUpload = useCallback(
    async (file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert("Image exceeds 10MB limit.");
        return;
      }
      setImageState(UPLOAD_STATE.UPLOADING);
      setImageProgress(0);
      try {
        const url = await uploadFile(apiKey, file, (pct) => {
          setImageProgress(pct);
        });
        setImageUrl(url);
        setImageName(file.name);
        setImageState(UPLOAD_STATE.READY);
      } catch (err) {
        setImageState(UPLOAD_STATE.IDLE);
        alert(`Image upload failed: ${err.message}`);
      } finally {
        setImageProgress(0);
      }
    },
    [apiKey],
  );

  const handleVideoPick = useCallback(
    async (file) => {
      if (file.size > 50 * 1024 * 1024) {
        alert("Video exceeds 50MB limit.");
        return;
      }
      setVideoState(UPLOAD_STATE.UPLOADING);
      setVideoProgress(0);
      try {
        const url = await uploadFile(apiKey, file, (pct) => {
          setVideoProgress(pct);
        });
        setVideoUrl(url);
        setVideoName(file.name);
        setVideoState(UPLOAD_STATE.READY);
      } catch (err) {
        setVideoState(UPLOAD_STATE.IDLE);
        alert(`Video upload failed: ${err.message}`);
      } finally {
        setVideoProgress(0);
      }
    },
    [apiKey],
  );

  const handleAudioPick = useCallback(
    async (file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert("Audio file exceeds 10MB limit.");
        return;
      }
      setAudioState(UPLOAD_STATE.UPLOADING);
      setAudioProgress(0);
      try {
        const url = await uploadFile(apiKey, file, (pct) => {
          setAudioProgress(pct);
        });
        setAudioUrl(url);
        setAudioName(file.name);
        setAudioState(UPLOAD_STATE.READY);
      } catch (err) {
        setAudioState(UPLOAD_STATE.IDLE);
        alert(`Audio upload failed: ${err.message}`);
      } finally {
        setAudioProgress(0);
      }
    },
    [apiKey],
  );

  // ── Handle Dropped Files ────────────────────────────────────────────────
  useEffect(() => {
    if (droppedFiles && droppedFiles.length > 0) {
      const imageFiles = droppedFiles.filter(f => f.type.startsWith('image/'));
      const videoFiles = droppedFiles.filter(f => f.type.startsWith('video/'));
      const audioFiles = droppedFiles.filter(f => f.type.startsWith('audio/'));
      
      if (audioFiles.length > 0) {
        handleAudioPick(audioFiles[0]);
      } else if (videoFiles.length > 0) {
        switchToVideo();
        handleVideoPick(videoFiles[0]);
      } else if (imageFiles.length > 0) {
        switchToImage();
        handleImageUpload(imageFiles[0]);
      }
      onFilesHandled?.();
    }
  }, [droppedFiles, onFilesHandled, handleAudioPick, handleVideoPick, handleImageUpload]);

  // ── Mode toggle ─────────────────────────────────────────────────────────
  const switchToImage = () => {
    if (inputMode === "image") return;
    setInputMode("image");
    setVideoUrl(null);
    setVideoState(UPLOAD_STATE.IDLE);
    setVideoName("");
  };

  const switchToVideo = () => {
    if (inputMode === "video") return;
    setInputMode("video");
    setImageUrl(null);
    setImageState(UPLOAD_STATE.IDLE);
    setImageName("");
  };

  // ── Model selection ─────────────────────────────────────────────────────
  const handleModelSelect = (model) => {
    setSelectedModelId(model.id);
    const resolutions = getResolutionsForLipSyncModel(model.id);
    if (resolutions.length > 0) {
      setSelectedResolution(
        model.inputs?.resolution?.default ?? resolutions[0],
      );
    }
  };

  // ── History helpers ─────────────────────────────────────────────────────
  const addToInternalHistory = useCallback((entry) => {
    setInternalHistory((prev) => [entry, ...prev].slice(0, 30));
  }, []);

  const downloadFile = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
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
  };

  // ── Generation ──────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!audioUrl) {
      alert("Please upload an audio file first.");
      return;
    }
    if (inputMode === "image" && !imageUrl) {
      alert("Please upload a portrait image first.");
      return;
    }
    if (inputMode === "video" && !videoUrl) {
      alert("Please upload a source video first.");
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);

    try {
      const lipsyncParams = {
        model: selectedModelId,
        audio_url: audioUrl,
      };
      if (inputMode === "image") lipsyncParams.image_url = imageUrl;
      else lipsyncParams.video_url = videoUrl;
      if (prompt && selectedModel?.hasPrompt) lipsyncParams.prompt = prompt;
      if (showResolution) lipsyncParams.resolution = selectedResolution;
      if (selectedModel?.hasSeed) lipsyncParams.seed = -1;

      const res = await processLipSync(apiKey, lipsyncParams);

      if (!res?.url) throw new Error("No video URL returned by API");

      const genId = res.id || Date.now().toString();
      const entry = {
        id: genId,
        url: res.url,
        prompt,
        model: selectedModelId,
        timestamp: new Date().toISOString(),
      };

      if (!historyItems) addToInternalHistory(entry);

      setActiveResultUrl(res.url);
      setActiveHistoryIdx(0);
      setView("result");

      if (onGenerationComplete) {
        onGenerationComplete({
          url: res.url,
          model: selectedModelId,
          prompt,
          type: "lipsync",
        });
      }
    } catch (e) {
      console.error("[LipSyncStudio]", e);
      setGenerateError(e.message?.slice(0, 80) ?? "Unknown error");
      setTimeout(() => setGenerateError(null), 4000);
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Reset to input view ─────────────────────────────────────────────────
  const handleNew = () => {
    setView("input");
    setActiveResultUrl(null);
    setPrompt("");
    setImageUrl(null);
    setImageState(UPLOAD_STATE.IDLE);
    setImageName("");
    setVideoUrl(null);
    setVideoState(UPLOAD_STATE.IDLE);
    setVideoName("");
    setAudioUrl(null);
    setAudioState(UPLOAD_STATE.IDLE);
    setAudioName("");
  };

  // ── Media status labels ─────────────────────────────────────────────────
  const mediaStatusText =
    inputMode === "image"
      ? imageState === UPLOAD_STATE.READY
        ? `✓ ${imageName}`
        : "No image"
      : videoState === UPLOAD_STATE.READY
        ? `✓ ${videoName}`
        : "No video";
  const mediaStatusClass =
    (inputMode === "image" ? imageState : videoState) === UPLOAD_STATE.READY
      ? "text-primary"
      : "text-muted";

  const audioStatusText =
    audioState === UPLOAD_STATE.READY ? `✓ ${audioName}` : "No audio";
  const audioStatusClass =
    audioState === UPLOAD_STATE.READY ? "text-primary" : "text-muted";

  const hasHistory = history.length > 0;

  // ── Dropdown item lists ─────────────────────────────────────────────────
  const modelDropdownItems = currentModels;
  const resolutionDropdownItems = resolutionOptions.map((r) => ({
    id: r,
    name: r,
  }));

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-app-bg relative overflow-hidden">
      
      {/* ── CENTRAL GALLERY AREA ── */}
      <div className="flex-1 w-full max-w-7xl mx-auto overflow-y-auto custom-scrollbar pb-40 lg:pb-32 px-2">
        {history.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pt-4 animate-fade-in-up">
            {history.map((entry, idx) => (
              <div
                key={entry.id || idx}
                className="relative group rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col"
              >
                <video
                  src={entry.url}
                  className="w-full aspect-video object-cover bg-black/40 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setFullscreenUrl(entry.url)}
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
                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    title="Fullscreen"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFullscreenUrl(entry.url);
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
                    title="Download"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadFile(entry.url, `lipsync-${entry.id || idx}.mp4`);
                    }}
                    className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                  </button>
                </div>

                {/* Details */}
                <div className="p-3 bg-black/80 backdrop-blur-sm border-t border-white/5 flex-1 flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20 whitespace-nowrap">
                      {entry.model?.name || entry.model || "Lip Sync"}
                    </span>
                    {entry.resolution && (
                      <span className="text-[10px] text-white/40">{entry.resolution}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in-up transition-all duration-700 min-h-[50vh]">
            <div className="mb-12 relative group">
              <div className="absolute inset-0 bg-primary/10 blur-[120px] rounded-full opacity-30 group-hover:opacity-60 transition-opacity duration-1000" />
              <div className="relative w-24 h-24 md:w-32 md:h-32 bg-white/[0.02] rounded-[2rem] flex items-center justify-center border border-white/[0.05] overflow-hidden backdrop-blur-sm">
                <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10 relative z-10 transition-transform duration-500 group-hover:scale-110">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary opacity-80">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </div>
                <div className="absolute top-4 right-4 text-[10px] text-primary/40 animate-pulse">🎙</div>
              </div>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-4 text-center px-4">
              <span className="text-white/40 font-medium">START CREATING WITH</span><br />
              <span className="text-white">LIP SYNC</span>
            </h1>
            <p className="text-white/40 text-sm md:text-base font-medium tracking-wide text-center max-w-lg leading-relaxed">
              Animate portraits or sync lips to audio with AI
            </p>
          </div>
        )}
      </div>

      {/* ── BOTTOM PROMPT BAR ── */}
      <div className="absolute bottom-4 w-full max-w-[95%] lg:max-w-4xl z-40 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
        <div className="w-full bg-[#0a0a0a]/80 backdrop-blur-3xl rounded-md border border-white/10 p-4 flex flex-col gap-2 shadow-2xl">
          {/* Mode toggle row */}
          <div className="flex items-center gap-2 px-3">
            <button
              type="button"
              onClick={switchToImage}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all border ${
                inputMode === "image"
                  ? "border-primary/60 bg-primary/5 text-primary"
                  : "border-white/[0.03] bg-white/[0.03] text-white/40 hover:border-white/20 hover:text-white"
              }`}
            >
              🖼 Portrait Image
            </button>
            <button
              type="button"
              onClick={switchToVideo}
              className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all border ${
                inputMode === "video"
                  ? "border-primary/60 bg-primary/5 text-primary"
                  : "border-white/[0.03] bg-white/[0.03] text-white/40 hover:border-white/20 hover:text-white"
              }`}
            >
              🎬 Video
            </button>
          </div>

          {/* Uploads row */}
          <div className="flex items-center gap-2 px-1">
            <div className="flex items-center gap-2">
              {/* Image picker — only in image mode */}
              {inputMode === "image" && (
                <MediaPickerButton
                  accept="image/*"
                  label="Image"
                  icon={
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-white/40 group-hover:text-primary transition-colors"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  }
                  onUpload={handleImageUpload}
                  onClear={() => {
                    setImageUrl(null);
                    setImageState(UPLOAD_STATE.IDLE);
                    setImageName("");
                  }}
                  uploadState={imageState}
                  progress={imageProgress}
                  fileName={imageName}
                  previewUrl={imageUrl}
                  isVideo={false}
                  apiKey={apiKey}
                />
              )}

              {/* Video picker — only in video mode */}
              {inputMode === "video" && (
                <MediaPickerButton
                  accept="video/*"
                  label="Video"
                  icon={
                    <VideoIcon className="text-white/40 group-hover:text-primary transition-colors" />
                  }
                  onUpload={handleVideoPick}
                  onClear={() => {
                    setVideoUrl(null);
                    setVideoState(UPLOAD_STATE.IDLE);
                    setVideoName("");
                  }}
                  uploadState={videoState}
                  progress={videoProgress}
                  fileName={videoName}
                  previewUrl={videoUrl}
                  isVideo={true}
                  apiKey={apiKey}
                />
              )}

              {/* Audio picker — always visible */}
              <MediaPickerButton
                accept="audio/*"
                label="Audio"
                icon={
                  <MicIcon className="text-white/40 group-hover:text-primary transition-colors" />
                }
                onUpload={handleAudioPick}
                onClear={() => {
                  setAudioUrl(null);
                  setAudioState(UPLOAD_STATE.IDLE);
                  setAudioName("");
                }}
                uploadState={audioState}
                progress={audioProgress}
                fileName={audioName}
                previewUrl={null}
                isVideo={false}
                apiKey={apiKey}
              />
            </div>

            {/* Prompt textarea */}
            {showPrompt && (
              <div className="flex-1 flex flex-col">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe speech style..."
                  className="w-full bg-transparent border-none text-white text-sm placeholder:text-white/10 focus:outline-none resize-none pt-1 leading-relaxed min-h-[40px] max-h-[150px] md:max-h-[250px] overflow-y-auto custom-scrollbar disabled:opacity-40"
                  rows={1}
                />
              </div>
            )}
          </div>

          {/* Bottom controls row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-white/[0.03] relative">
            <div className="flex items-center gap-2 px-1">
              {/* Model selector */}
              <div className="relative">
                <button
                  ref={modelBtnRef}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdown(
                      openDropdown === "model" ? null : "model",
                    );
                  }}
                  className="flex items-center gap-2 px-2 py-1.5 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                >
                  <div className="w-3.5 h-3.5 bg-[#d9ff00] rounded-sm flex items-center justify-center">
                    <span className="text-[9px] font-black text-black">
                      S
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-white/70 group-hover:text-[#d9ff00] transition-colors">
                    {selectedModel?.name ?? "Select model"}
                  </span>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                <Dropdown
                  isOpen={openDropdown === "model"}
                  items={modelDropdownItems}
                  selectedId={selectedModelId}
                  onSelect={handleModelSelect}
                  onClose={() => setOpenDropdown(null)}
                  anchorRef={modelBtnRef}
                />
              </div>

              {/* Resolution selector */}
              {showResolution && (
                <div className="relative">
                  <button
                    ref={resolutionBtnRef}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdown(
                        openDropdown === "resolution" ? null : "resolution",
                      );
                    }}
                    className="flex items-center gap-2 px-2 py-1.5 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                  >
                    <span className="text-xs font-semibold text-white/70 group-hover:text-[#d9ff00] transition-colors">
                      {selectedResolution}
                    </span>
                  </button>
                  <Dropdown
                    isOpen={openDropdown === "resolution"}
                    items={resolutionDropdownItems}
                    selectedId={selectedResolution}
                    onSelect={(item) => setSelectedResolution(item.id)}
                    onClose={() => setOpenDropdown(null)}
                    anchorRef={resolutionBtnRef}
                  />
                </div>
              )}
            </div>

            {/* Generate button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-[#d9ff00] text-black px-4 py-2 rounded-md font-medium text-sm hover:bg-[#e5ff33] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg shadow-[#d9ff00]/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin inline-block text-black">
                    ◌
                  </span>{" "}
                  Generating...
                </>
              ) : generateError ? (
                `Error: ${generateError}`
              ) : (
                <>
                  <span>Sync Lip</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── FULLSCREEN MEDIA MODAL ── */}
      {fullscreenUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fade-in"
          onClick={() => setFullscreenUrl(null)}
        >
          <button
            type="button"
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors border border-white/10"
            onClick={(e) => {
              e.stopPropagation();
              setFullscreenUrl(null);
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <video 
            src={fullscreenUrl} 
            controls 
            autoPlay 
            loop 
            className="max-w-[95vw] max-h-[95vh] rounded-2xl shadow-2xl object-contain animate-scale-up" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
