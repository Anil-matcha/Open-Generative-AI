"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import { processLipSync, uploadFile } from "../muapi.js";
import { formatErrorMessage } from "../utils/formatError.js";
import { scopedPersistKey, migrateLegacyPersistKey } from "../persistKey.js";
import MobileGenerationActions, {
  GenerationCopyButtons,
} from "./MobileGenerationActions.jsx";
import {
  lipsyncModels,
  imageLipSyncModels,
  videoLipSyncModels,
  getLipSyncModelById,
  getResolutionsForLipSyncModel,
} from "../models.js";
import {
  PROMPT_CONTROL_LABEL_CLASS,
  PromptAction,
  PromptChevronIcon,
  PromptComposer,
  PromptControls,
  PromptFooter,
  PromptMenuItem,
  PromptMenuList,
  PromptPopover,
  PromptPopoverHeader,
  PromptQualityIcon,
  PromptSegmentedControl,
  PromptSegmentOption,
  PromptTextarea,
  promptControlClassName,
  promptMediaButtonClassName,
} from "./prompt/PromptComposer.jsx";

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

  return (
    <button
      type="button"
      title={
        uploadState === UPLOAD_STATE.READY
          ? `${fileName} — click to clear`
          : `Upload ${label.toLowerCase()} file`
      }
      onClick={handleClick}
      className={promptMediaButtonClassName({
        active: uploadState === UPLOAD_STATE.READY,
      })}
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
function Dropdown({
  isOpen,
  title,
  items,
  selectedId,
  onSelect,
  onClose,
  anchorRef,
  className = "",
}) {
  const dropRef = useRef(null);

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
    <PromptPopover
      ref={dropRef}
      className={className}
      onClick={(e) => e.stopPropagation()}
    >
      <PromptPopoverHeader>{title}</PromptPopoverHeader>
      <PromptMenuList>
      {items.map((item) => (
        <PromptMenuItem
          key={item.id}
          selected={item.id === selectedId}
          description={
            item.description
              ? `${item.description.slice(0, 60)}${
                  item.description.length > 60 ? "..." : ""
                }`
              : undefined
          }
          onClick={() => {
            onSelect(item);
            onClose();
          }}
        >
          {item.name}
        </PromptMenuItem>
      ))}
      </PromptMenuList>
    </PromptPopover>
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
  onGenerationStart,
  onGenerationEnd,
  onGenerationComplete,
  onGenerationError,
  historyItems,
  droppedFiles,
  onFilesHandled,
}) {
  const LEGACY_PERSIST_KEY = "hg_lipsync_studio_persistent";
  const PERSIST_KEY = scopedPersistKey(LEGACY_PERSIST_KEY, apiKey);
  useEffect(() => {
    migrateLegacyPersistKey(LEGACY_PERSIST_KEY, PERSIST_KEY);
  }, [PERSIST_KEY]);

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
  const textareaRef = useRef(null);

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

  const handlePromptInput = (e) => {
    setPrompt(e.target.value);
  };

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
    const first = imageLipSyncModels[0];
    if (first) {
      setSelectedModelId(first.id);
      setSelectedResolution(first.inputs?.resolution?.default ?? "480p");
    }
  };

  const switchToVideo = () => {
    if (inputMode === "video") return;
    setInputMode("video");
    setImageUrl(null);
    setImageState(UPLOAD_STATE.IDLE);
    setImageName("");
    const first = videoLipSyncModels[0];
    if (first) {
      setSelectedModelId(first.id);
      setSelectedResolution(first.inputs?.resolution?.default ?? "480p");
    }
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

    onGenerationStart?.();
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
      const errMsg = formatErrorMessage(e, "Lip sync generation failed");
      if (onGenerationError) onGenerationError(errMsg);
      else toast.error(errMsg);
    } finally {
      setIsGenerating(false);
      onGenerationEnd?.();
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
                className="relative group rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col cursor-pointer"
                onClick={() => setFullscreenUrl(entry.url)}
              >
                <video
                  src={entry.url}
                  className="w-full aspect-video object-cover bg-black/40 hover:opacity-80 transition-opacity"
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
                <div className="absolute top-2 right-2 hidden md:flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GenerationCopyButtons
                    prompt={entry.prompt}
                    onCopyError={onGenerationError}
                  />
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
                  <button
                    type="button"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Are you sure you want to delete this generated item?")) {
                        setInternalHistory(prev => prev.filter((_, i) => i !== idx));
                      }
                    }}
                    className="p-2 bg-black/60 backdrop-blur-md rounded-full text-red-400 hover:bg-red-500 hover:text-white transition-all border border-white/10"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
                <MobileGenerationActions
                  prompt={entry.prompt}
                  onCopyError={onGenerationError}
                  actions={[
                    {
                      kind: "download",
                      label: "Download",
                      onSelect: () =>
                        downloadFile(entry.url, `lipsync-${entry.id || idx}.mp4`),
                    },
                    {
                      kind: "delete",
                      label: "Delete",
                      danger: true,
                      onSelect: () => {
                        if (confirm("Are you sure you want to delete this generated item?")) {
                          setInternalHistory((prev) => prev.filter((_, i) => i !== idx));
                        }
                      },
                    },
                  ]}
                />

                {/* Details */}
                <div className="p-3 bg-black/80 backdrop-blur-sm border-t border-white/5 flex-1 flex flex-col justify-between gap-2">
                  {entry.prompt && (
                    <p className="text-white/70 text-xs line-clamp-2 leading-relaxed" title={entry.prompt}>
                      {entry.prompt}
                    </p>
                  )}
                  <div className="flex items-center justify-between flex-wrap gap-1 mt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20 whitespace-nowrap">
                        Lip Sync
                      </span>
                      {entry.resolution && (
                        <span className="text-[10px] text-white/40">{entry.resolution}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in-up transition-all duration-700 min-h-[50vh]">
            {/* Overlapping floating cards */}
            <div className="flex items-center justify-center gap-1.5 md:gap-3 mb-10 select-none scale-90 sm:scale-100">
              <div className="w-18 h-22 sm:w-24 sm:h-28 rounded-2xl border border-white/10 shadow-2xl -rotate-[12deg] transform hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden bg-white/[0.01] flex-shrink-0">
                <img
                  src="https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/sdxl-image.avif"
                  alt="Creative asset 1"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-18 h-22 sm:w-24 sm:h-28 rounded-2xl border border-white/10 shadow-2xl -rotate-[4deg] transform hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden bg-white/[0.01] -ml-3 sm:-ml-4 flex-shrink-0">
                <img
                  src="https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/chroma-image.avif"
                  alt="Creative asset 2"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-18 h-18 sm:w-24 sm:h-24 rounded-full border border-white/10 shadow-2xl rotate-[6deg] transform hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden bg-white/[0.01] -ml-3 sm:-ml-4 flex-shrink-0">
                <img
                  src="https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/neta-lumina.avif"
                  alt="Creative asset 3"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-18 h-22 sm:w-24 sm:h-28 rounded-2xl border border-white/10 shadow-2xl rotate-[12deg] transform hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden bg-white/[0.01] -ml-3 sm:-ml-4 flex-shrink-0">
                <img
                  src="https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/perfect-pony-xl.avif"
                  alt="Creative asset 4"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-center px-4 flex flex-col items-center">
              <span className="text-white font-black uppercase text-xl sm:text-3xl tracking-wide mb-1 opacity-90">START CREATING WITH</span>
              <span className="text-[#22d3ee] font-black uppercase text-2xl sm:text-4xl sm:mt-1 tracking-tight">
                LIP SYNC STUDIO
              </span>
            </h1>
            <p className="text-white/40 text-xs sm:text-sm font-medium tracking-wide text-center max-w-lg leading-relaxed px-4">
              Sync any voice with any face video to create premium talking avatars and videos.
            </p>
          </div>
        )}
      </div>

      {/* ── BOTTOM PROMPT BAR ── */}
      <PromptComposer>
          {/* Mode toggle row */}
          <div className="flex items-center px-1">
            <PromptSegmentedControl>
            <PromptSegmentOption
              type="button"
              onClick={switchToImage}
              selected={inputMode === "image"}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
              Portrait Image
            </PromptSegmentOption>
            <PromptSegmentOption
              type="button"
              onClick={switchToVideo}
              selected={inputMode === "video"}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="2" y="5" width="15" height="14" rx="2" />
                <path d="m17 10 5-3v10l-5-3" />
              </svg>
              Video
            </PromptSegmentOption>
            </PromptSegmentedControl>
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
                      className="text-white/40 group-hover:text-[#22d3ee] transition-colors"
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
                    <VideoIcon className="text-white/40 group-hover:text-[#22d3ee] transition-colors" />
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
                  <MicIcon className="text-white/40 group-hover:text-[#22d3ee] transition-colors" />
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
            <div className="flex-1 flex flex-col">
              <PromptTextarea
                ref={textareaRef}
                value={prompt}
                onChange={handlePromptInput}
                placeholder="Describe speech style..."
              />
            </div>
          </div>

          {/* Bottom controls row */}
          <PromptFooter>
            <PromptControls>
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
                  className={promptControlClassName({
                    active: openDropdown === "model",
                  })}
                >
                  <div className="w-3.5 h-3.5 bg-[#22d3ee] rounded-sm flex items-center justify-center">
                    <span className="text-[9px] font-black text-black">
                      S
                    </span>
                  </div>
                  <span className={PROMPT_CONTROL_LABEL_CLASS}>
                    {selectedModel?.name ?? "Select model"}
                  </span>
                  <PromptChevronIcon />
                </button>
                <Dropdown
                  isOpen={openDropdown === "model"}
                  title="Model"
                  items={modelDropdownItems}
                  selectedId={selectedModelId}
                  onSelect={handleModelSelect}
                  onClose={() => setOpenDropdown(null)}
                  anchorRef={modelBtnRef}
                  className="w-80 max-w-[calc(100vw-3rem)]"
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
                    className={promptControlClassName({
                      active: openDropdown === "resolution",
                    })}
                  >
                    <PromptQualityIcon />
                    <span className={PROMPT_CONTROL_LABEL_CLASS}>
                      {selectedResolution}
                    </span>
                  </button>
                  <Dropdown
                    isOpen={openDropdown === "resolution"}
                    title="Resolution"
                    items={resolutionDropdownItems}
                    selectedId={selectedResolution}
                    onSelect={(item) => setSelectedResolution(item.id)}
                    onClose={() => setOpenDropdown(null)}
                    anchorRef={resolutionBtnRef}
                  />
                </div>
              )}
            </PromptControls>

            {/* Generate button */}
            <PromptAction
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin inline-block text-black">
                    ◌
                  </span>{" "}
                  Generating...
                </>
              ) : (
                <>
                  <span>Sync Lip</span>
                </>
              )}
            </PromptAction>
          </PromptFooter>
      </PromptComposer>

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
      <Toaster position="top-right" containerStyle={{ zIndex: 99999 }} toastOptions={{ duration: 5000, style: { background: '#18181b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '13px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', maxWidth: '440px', wordBreak: 'break-word', whiteSpace: 'pre-wrap', padding: '12px 16px' } }} />
    </div>
  );
}
