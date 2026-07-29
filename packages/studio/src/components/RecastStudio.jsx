"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import { processRecast, uploadFile } from "../muapi.js";
import { formatErrorMessage } from "../utils/formatError.js";
import { scopedPersistKey, migrateLegacyPersistKey } from "../persistKey.js";
import MobileGenerationActions, {
  GenerationCopyButtons,
} from "./MobileGenerationActions.jsx";
import {
  recastModels,
  getRecastModelById,
  getAspectRatiosForRecastModel,
} from "../models.js";
import {
  PROMPT_CONTROL_LABEL_CLASS,
  PromptAspectRatioIcon,
  PromptAction,
  PromptChevronIcon,
  PromptComposer,
  PromptControls,
  PromptFooter,
  PromptMenuItem,
  PromptMenuList,
  PromptPopover,
  PromptPopoverHeader,
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
            icon
          )}
        </div>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Assets history dropdown
// ---------------------------------------------------------------------------
function AssetsDropdown({
  videos,
  images,
  results,
  onSelectVideo,
  onSelectImage,
  onSelectResultAsVideo,
  onDeleteAsset,
  setFullscreenUrl,
  onClose,
  anchorRef,
}) {
  const [activeTab, setActiveTab] = useState("videos"); // 'videos' | 'images' | 'results'
  const dropRef = useRef(null);

  useEffect(() => {
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
  }, [onClose, anchorRef]);

  const items = activeTab === "videos" ? videos : activeTab === "images" ? images : results;

  return (
    <PromptPopover
      ref={dropRef}
      className="w-80 max-h-80 overflow-hidden flex flex-col gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <PromptPopoverHeader className="mb-0">Asset Library</PromptPopoverHeader>
      {/* Tabs */}
      <div className="flex border-b border-white/5 pb-1">
        {["videos", "images", "results"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-center py-1 text-xs font-bold capitalize transition-colors ${
              activeTab === tab
                ? "text-[#22d3ee] border-b border-[#22d3ee]"
                : "text-white/40 hover:text-white/80"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Items list */}
      <div className="overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-1.5 min-h-[180px] max-h-60">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-10 text-xs text-white/20">
            No assets found
          </div>
        ) : (
          items.map((item, idx) => (
            <div
              key={idx}
              onClick={() => {
                if (activeTab === "videos") {
                  onSelectVideo(item.url, item.name);
                } else if (activeTab === "images") {
                  onSelectImage(item.url, item.name);
                } else {
                  onSelectResultAsVideo(item.url, item.name);
                }
              }}
              className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/5 hover:border-white/10 transition-all gap-2 group/item cursor-pointer"
            >
              {/* Media Preview Thumbnail */}
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 relative">
                {activeTab === "images" ? (
                  <img
                    src={item.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    loop
                  />
                )}
                {/* Enlarge preview overlay */}
                <button
                  type="button"
                  title="Enlarge preview"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFullscreenUrl(item.url);
                  }}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover/item:opacity-100 flex items-center justify-center transition-opacity text-white hover:text-[#22d3ee]"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </button>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col">
                <span className="text-xs text-white/95 font-semibold truncate" title={item.name}>
                  {item.name}
                </span>
                <span className="text-[9px] text-white/30 truncate mt-0.5">
                  {new Date(item.timestamp || Date.now()).toLocaleDateString()}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="text-xs text-black font-black px-2.5 py-1 bg-[#22d3ee] rounded-md hover:bg-[#22d3ee]/90 transition-colors"
                >
                  Use
                </button>
                <button
                  type="button"
                  title="Delete from Library"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAsset(activeTab, item.url);
                  }}
                  className="p-1.5 text-white/30 hover:text-red-500 rounded hover:bg-white/5 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </PromptPopover>
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
          description={item.description?.slice(0, 75)}
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
// SVG icons
// ---------------------------------------------------------------------------
const VideoIcon = ({
  className = "text-white/40 group-hover:text-primary transition-colors",
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

const ImageIcon = ({
  className = "text-white/40 group-hover:text-primary transition-colors",
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
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function RecastStudio({
  apiKey,
  onGenerationStart,
  onGenerationEnd,
  onGenerationComplete,
  onGenerationError,
  historyItems,
  droppedFiles,
  onFilesHandled,
}) {
  const LEGACY_PERSIST_KEY = "hg_recast_studio_persistent";
  const PERSIST_KEY = scopedPersistKey(LEGACY_PERSIST_KEY, apiKey);
  useEffect(() => {
    migrateLegacyPersistKey(LEGACY_PERSIST_KEY, PERSIST_KEY);
  }, [PERSIST_KEY]);

  // ── Model state ───────────────────────────────────────────────────────────
  const firstModel = recastModels[0];
  const [selectedModelId, setSelectedModelId] = useState(firstModel?.id ?? "");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(
    firstModel?.inputs?.aspect_ratio?.default ?? "16:9",
  );

  // ── Upload state ──────────────────────────────────────────────────────────
  const [videoState, setVideoState] = useState(UPLOAD_STATE.IDLE);
  const [videoName, setVideoName] = useState("");
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoProgress, setVideoProgress] = useState(0);

  const [imageState, setImageState] = useState(UPLOAD_STATE.IDLE);
  const [imageName, setImageName] = useState("");
  const [imageUrl, setImageUrl] = useState(null);
  const [imageProgress, setImageProgress] = useState(0);

  // ── Prompt ────────────────────────────────────────────────────────────────
  const [prompt, setPrompt] = useState("");

  // ── Character Orientation ─────────────────────────────────────────────────
  const [characterOrientation, setCharacterOrientation] = useState("image");

  // ── Assets Library ────────────────────────────────────────────────────────
  const [assetVideos, setAssetVideos] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("hg_recast_studio_assets");
        if (stored) {
          const data = JSON.parse(stored);
          return data.videos || [];
        }
      } catch (err) {}
    }
    return [];
  });

  const [assetImages, setAssetImages] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("hg_recast_studio_assets");
        if (stored) {
          const data = JSON.parse(stored);
          return data.images || [];
        }
      } catch (err) {}
    }
    return [];
  });

  const [assetResults, setAssetResults] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("hg_recast_studio_assets");
        if (stored) {
          const data = JSON.parse(stored);
          return data.results || [];
        }
      } catch (err) {}
    }
    return [];
  });

  // ── Generation / UI state ─────────────────────────────────────────────────
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [fullscreenUrl, setFullscreenUrl] = useState(null);

  // ── History ───────────────────────────────────────────────────────────────
  const [internalHistory, setInternalHistory] = useState([]);
  const history = historyItems ?? internalHistory;

  // ── Dropdown state ────────────────────────────────────────────────────────
  const [openDropdown, setOpenDropdown] = useState(null); // 'model' | 'aspect' | 'orientation' | 'assets' | null
  const modelBtnRef = useRef(null);
  const aspectBtnRef = useRef(null);
  const orientationBtnRef = useRef(null);
  const assetsBtnRef = useRef(null);
  const textareaRef = useRef(null);
  const hasRestored = useRef(false);

  // ── Persistence: Load ──────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PERSIST_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.selectedModelId) setSelectedModelId(data.selectedModelId);
        if (data.selectedAspectRatio) setSelectedAspectRatio(data.selectedAspectRatio);
        if (data.characterOrientation) setCharacterOrientation(data.characterOrientation);
        if (data.videoUrl) {
          setVideoUrl(data.videoUrl);
          setVideoState(UPLOAD_STATE.READY);
        }
        if (data.imageUrl) {
          setImageUrl(data.imageUrl);
          setImageState(UPLOAD_STATE.READY);
        }
        if (data.videoName) setVideoName(data.videoName);
        if (data.imageName) setImageName(data.imageName);
        if (data.prompt) setPrompt(data.prompt);
        if (data.internalHistory) setInternalHistory(data.internalHistory);
      }
    } catch (err) {
      console.warn("Failed to load RecastStudio persistence:", err);
    } finally {
      hasRestored.current = true;
    }
  }, []);

  // ── Save Assets ────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(
        "hg_recast_studio_assets",
        JSON.stringify({
          videos: assetVideos,
          images: assetImages,
          results: assetResults,
        })
      );
    } catch (err) {
      console.warn("Failed to save RecastStudio assets:", err);
    }
  }, [assetVideos, assetImages, assetResults]);

  const handleDeleteAsset = (tab, url) => {
    if (tab === "videos") {
      setAssetVideos((prev) => prev.filter((item) => item.url !== url));
    } else if (tab === "images") {
      setAssetImages((prev) => prev.filter((item) => item.url !== url));
    } else {
      setAssetResults((prev) => prev.filter((item) => item.url !== url));
    }
  };

  // ── Persistence: Save ──────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          PERSIST_KEY,
          JSON.stringify({
            selectedModelId,
            selectedAspectRatio,
            characterOrientation,
            videoUrl,
            videoName,
            imageUrl,
            imageName,
            prompt,
            internalHistory,
          }),
        );
      } catch (err) {
        console.warn("Failed to save RecastStudio persistence:", err);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [
    selectedModelId,
    selectedAspectRatio,
    characterOrientation,
    videoUrl,
    videoName,
    imageUrl,
    imageName,
    prompt,
    internalHistory,
  ]);

  // ── Derived model info ──────────────────────────────────────────────────────
  const selectedModel = getRecastModelById(selectedModelId);
  const aspectOptions = getAspectRatiosForRecastModel(selectedModelId);
  const showAspect = aspectOptions.length > 0;
  const showPrompt = !!selectedModel?.hasPrompt;

  // ── Upload handlers ─────────────────────────────────────────────────────────
  const handleVideoPick = useCallback(
    async (file) => {
      if (file.size > 50 * 1024 * 1024) {
        alert("Video exceeds 50MB limit.");
        return;
      }
      setVideoState(UPLOAD_STATE.UPLOADING);
      setVideoProgress(0);
      try {
        const url = await uploadFile(apiKey, file, (pct) => setVideoProgress(pct));
        setVideoUrl(url);
        setVideoName(file.name);
        setVideoState(UPLOAD_STATE.READY);

        // Add to assets
        setAssetVideos((prev) => {
          const exists = prev.some((item) => item.url === url);
          if (exists) return prev;
          return [{ url, name: file.name, timestamp: new Date().toISOString() }, ...prev].slice(0, 30);
        });
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

  const handleImageUpload = useCallback(
    async (file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert("Image exceeds 10MB limit.");
        return;
      }
      setImageState(UPLOAD_STATE.UPLOADING);
      setImageProgress(0);
      try {
        const url = await uploadFile(apiKey, file, (pct) => setImageProgress(pct));
        setImageUrl(url);
        setImageName(file.name);
        setImageState(UPLOAD_STATE.READY);

        // Add to assets
        setAssetImages((prev) => {
          const exists = prev.some((item) => item.url === url);
          if (exists) return prev;
          return [{ url, name: file.name, timestamp: new Date().toISOString() }, ...prev].slice(0, 30);
        });
      } catch (err) {
        setImageState(UPLOAD_STATE.IDLE);
        alert(`Image upload failed: ${err.message}`);
      } finally {
        setImageProgress(0);
      }
    },
    [apiKey],
  );

  // ── Handle Dropped Files ────────────────────────────────────────────────────
  useEffect(() => {
    if (droppedFiles && droppedFiles.length > 0) {
      const imageFiles = droppedFiles.filter((f) => f.type.startsWith("image/"));
      const videoFiles = droppedFiles.filter((f) => f.type.startsWith("video/"));
      if (videoFiles.length > 0) handleVideoPick(videoFiles[0]);
      if (imageFiles.length > 0) handleImageUpload(imageFiles[0]);
      onFilesHandled?.();
    }
  }, [droppedFiles, onFilesHandled, handleVideoPick, handleImageUpload]);

  // ── Model selection ─────────────────────────────────────────────────────────
  const handleModelSelect = (model) => {
    setSelectedModelId(model.id);
    const ratios = getAspectRatiosForRecastModel(model.id);
    if (ratios.length > 0) {
      setSelectedAspectRatio(model.inputs?.aspect_ratio?.default ?? ratios[0]);
    }
  };

  // ── History helpers ─────────────────────────────────────────────────────────
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

  // ── Generation ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!videoUrl) {
      alert("Please upload a source video first.");
      return;
    }
    if (!imageUrl) {
      alert("Please upload a character image first.");
      return;
    }

    onGenerationStart?.();
    setIsGenerating(true);
    setGenerateError(null);

    try {
      const params = {
        model: selectedModelId,
        video_url: videoUrl,
        image_url: imageUrl,
      };
      if (showAspect) params.aspect_ratio = selectedAspectRatio;
      if (prompt && selectedModel?.hasPrompt) params.prompt = prompt;
      if (selectedModelId === "kling-v3.0-pro-recast") {
        params.character_orientation = characterOrientation;
      }

      const res = await processRecast(apiKey, params);

      if (!res?.url) throw new Error("No video URL returned by API");

      const genId = res.id || Date.now().toString();
      const entry = {
        id: genId,
        url: res.url,
        prompt,
        model: selectedModel?.name || selectedModelId,
        timestamp: new Date().toISOString(),
      };

      if (!historyItems) addToInternalHistory(entry);

      // Add to assets
      setAssetResults((prev) => {
        const url = res.url;
        const name = prompt ? (prompt.slice(0, 20) + "...") : `Result ${new Date().toLocaleTimeString()}`;
        const exists = prev.some((item) => item.url === url);
        if (exists) return prev;
        return [{ url, name, timestamp: new Date().toISOString() }, ...prev].slice(0, 30);
      });

      if (onGenerationComplete) {
        onGenerationComplete({
          url: res.url,
          model: selectedModelId,
          prompt,
          type: "recast",
        });
      }
    } catch (e) {
      console.error("[RecastStudio]", e);
      const errMsg = formatErrorMessage(e, "Body swap generation failed");
      if (onGenerationError) onGenerationError(errMsg);
      else toast.error(errMsg);
    } finally {
      setIsGenerating(false);
      onGenerationEnd?.();
    }
  };

  // ── Dropdown item lists ─────────────────────────────────────────────────────
  const aspectDropdownItems = aspectOptions.map((r) => ({ id: r, name: r }));

  // ── Render ────────────────────────────────────────────────────────────────
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
                      downloadFile(entry.url, `bodyswap-${entry.id || idx}.mp4`);
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
                        downloadFile(entry.url, `bodyswap-${entry.id || idx}.mp4`),
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
                    <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20 whitespace-nowrap">
                      Body Swap
                    </span>
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
                BODY SWAP STUDIO
              </span>
            </h1>
            <p className="text-white/40 text-xs sm:text-sm font-medium tracking-wide text-center max-w-lg leading-relaxed px-4">
              Swap the character in any video dynamically by choosing a video clip and a target character image.
            </p>
          </div>
        )}
      </div>

      {/* ── BOTTOM PROMPT BAR ── */}
      <PromptComposer>
          {/* Uploads row */}
          <div className="flex items-center gap-2 px-1">
            <div className="flex items-center gap-2">
              {/* Source video */}
              <MediaPickerButton
                accept="video/*"
                label="Video"
                icon={<VideoIcon className="text-white/40 group-hover:text-[#22d3ee] transition-colors" />}
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
              />

              {/* Character image */}
              <MediaPickerButton
                accept="image/*"
                label="Character image"
                icon={<ImageIcon className="text-white/40 group-hover:text-[#22d3ee] transition-colors" />}
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
              />
            </div>

            {/* Prompt textarea */}
            <div className="flex-1 flex flex-col">
              <PromptTextarea
                ref={textareaRef}
                value={prompt}
                onChange={handlePromptInput}
                placeholder="Optional — describe the motion or scene..."
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
                    setOpenDropdown(openDropdown === "model" ? null : "model");
                  }}
                  className={promptControlClassName({
                    active: openDropdown === "model",
                  })}
                >
                  <div className="w-3.5 h-3.5 bg-[#22d3ee] rounded-sm flex items-center justify-center">
                    <span className="text-[9px] font-black text-black">R</span>
                  </div>
                  <span className={PROMPT_CONTROL_LABEL_CLASS}>
                    {selectedModel?.name ?? "Select model"}
                  </span>
                  <PromptChevronIcon />
                </button>
                <Dropdown
                  isOpen={openDropdown === "model"}
                  title="Model"
                  items={recastModels}
                  selectedId={selectedModelId}
                  onSelect={handleModelSelect}
                  onClose={() => setOpenDropdown(null)}
                  anchorRef={modelBtnRef}
                  className="w-80 max-w-[calc(100vw-2rem)]"
                />
              </div>

              {/* Aspect ratio selector */}
              {showAspect && (
                <div className="relative">
                  <button
                    ref={aspectBtnRef}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdown(openDropdown === "aspect" ? null : "aspect");
                    }}
                    className={promptControlClassName({
                      active: openDropdown === "aspect",
                    })}
                  >
                    <PromptAspectRatioIcon />
                    <span className={PROMPT_CONTROL_LABEL_CLASS}>
                      {selectedAspectRatio}
                    </span>
                    <PromptChevronIcon />
                  </button>
                  <Dropdown
                    isOpen={openDropdown === "aspect"}
                    title="Aspect Ratio"
                    items={aspectDropdownItems}
                    selectedId={selectedAspectRatio}
                    onSelect={(item) => setSelectedAspectRatio(item.id)}
                    onClose={() => setOpenDropdown(null)}
                    anchorRef={aspectBtnRef}
                  />
                </div>
              )}

              {/* Character Orientation selector */}
              {selectedModelId === "kling-v3.0-pro-recast" && (
                <div className="relative">
                  <button
                    ref={orientationBtnRef}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdown(openDropdown === "orientation" ? null : "orientation");
                    }}
                    className={promptControlClassName({
                      active: openDropdown === "orientation",
                    })}
                  >
                    <span className="text-xs font-semibold text-current opacity-50 group-hover:opacity-100 transition-opacity">
                      Orientation:
                    </span>
                    <span className="text-xs font-semibold text-current capitalize">
                      {characterOrientation}
                    </span>
                    <PromptChevronIcon />
                  </button>
                  <Dropdown
                    isOpen={openDropdown === "orientation"}
                    title="Orientation"
                    items={[
                      { id: "image", name: "Image", description: "Use image orientation (Max 10s video)" },
                      { id: "video", name: "Video", description: "Use video orientation (Max 30s video)" },
                    ]}
                    selectedId={characterOrientation}
                    onSelect={(item) => setCharacterOrientation(item.id)}
                    onClose={() => setOpenDropdown(null)}
                    anchorRef={orientationBtnRef}
                    className="w-64"
                  />
                </div>
              )}

              {/* Assets Library selector */}
              <div className="relative">
                <button
                  ref={assetsBtnRef}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdown(openDropdown === "assets" ? null : "assets");
                  }}
                  className={promptControlClassName({
                    active: openDropdown === "assets",
                  })}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-white/50 group-hover:text-[#22d3ee] transition-colors"
                  >
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  <span className="text-xs font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors">
                    Library
                  </span>
                  <PromptChevronIcon />
                </button>
                {openDropdown === "assets" && (
                  <AssetsDropdown
                    videos={assetVideos}
                    images={assetImages}
                    results={assetResults}
                    onSelectVideo={(url, name) => {
                      setVideoUrl(url);
                      setVideoName(name || "Selected Video");
                      setVideoState(UPLOAD_STATE.READY);
                      setOpenDropdown(null);
                    }}
                    onSelectImage={(url, name) => {
                      setImageUrl(url);
                      setImageName(name || "Selected Image");
                      setImageState(UPLOAD_STATE.READY);
                      setOpenDropdown(null);
                    }}
                    onSelectResultAsVideo={(url, name) => {
                      setVideoUrl(url);
                      setVideoName(name || "Result Video");
                      setVideoState(UPLOAD_STATE.READY);
                      setOpenDropdown(null);
                    }}
                    onDeleteAsset={handleDeleteAsset}
                    setFullscreenUrl={setFullscreenUrl}
                    onClose={() => setOpenDropdown(null)}
                    anchorRef={assetsBtnRef}
                  />
                )}
              </div>
            </PromptControls>

            {/* Generate button */}
            <PromptAction
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin inline-block text-black">◌</span>{" "}
                  Swapping...
                </>
              ) : (
                <span>Swap Body</span>
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
          {(() => {
            const isImg = fullscreenUrl.match(/\.(jpeg|jpg|gif|png|webp|avif)/i) || 
                          fullscreenUrl.includes("/ai-images/") || 
                          fullscreenUrl.includes("image") || 
                          fullscreenUrl.startsWith("data:image");
            return isImg ? (
              <img
                src={fullscreenUrl}
                alt="Fullscreen Preview"
                className="max-w-[95vw] max-h-[95vh] rounded-2xl shadow-2xl object-contain animate-scale-up"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <video
                src={fullscreenUrl}
                controls
                autoPlay
                loop
                className="max-w-[95vw] max-h-[95vh] rounded-2xl shadow-2xl object-contain animate-scale-up"
                onClick={(e) => e.stopPropagation()}
              />
            );
          })()}
        </div>
      )}
      <Toaster position="top-right" containerStyle={{ zIndex: 99999 }} toastOptions={{ duration: 5000, style: { background: '#18181b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '13px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', maxWidth: '440px', wordBreak: 'break-word', whiteSpace: 'pre-wrap', padding: '12px 16px' } }} />
    </div>
  );
}
