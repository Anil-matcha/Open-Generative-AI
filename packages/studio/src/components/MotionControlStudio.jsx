"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import { processMotionControl, uploadFile } from "../muapi.js";
import { formatErrorMessage } from "../utils/formatError.js";
import { scopedPersistKey, migrateLegacyPersistKey } from "../persistKey.js";
import MobileGenerationActions, {
  GenerationCopyButtons,
} from "./MobileGenerationActions.jsx";
import {
  motionControlModels,
  getMotionControlModelById,
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
  PromptDurationIcon,
  PromptSegmentedControl,
  PromptSegmentOption,
  PromptTextarea,
  promptControlClassName,
  promptMediaButtonClassName,
} from "./prompt/PromptComposer.jsx";
import en from "../messages/en/motionControlStudio.json";
import zh from "../messages/zh/motionControlStudio.json";
import { resolveCopy } from "../i18nUtils";

// ── Helpers ──────────────────────────────────────────────────────────────────
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

// ── Upload Button States ──────────────────────────────────────────────────────
const UPLOAD_STATE = {
  IDLE: "idle",
  UPLOADING: "uploading",
  READY: "ready",
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const VideoIcon = ({ className = "text-white/40 group-hover:text-[#22d3ee] transition-colors" }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

const ImageIcon = ({ className = "text-white/40 group-hover:text-[#22d3ee] transition-colors" }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const SlidersIcon = ({ className = "text-white/50 group-hover:text-[#22d3ee] transition-colors" }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);

const AudioIcon = ({ enabled, className = "" }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    {enabled ? (
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    ) : (
      <line x1="23" y1="9" x2="17" y2="15" />
    )}
  </svg>
);

// ── Reference Video Circular Picker ──────────────────────────────────────────
function VideoMediaButton({
  onUpload,
  onClear,
  uploadState,
  progress,
  fileName,
  previewUrl,
  copy,
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    if (uploadState === UPLOAD_STATE.READY) {
      onClear();
      return;
    }
    inputRef.current?.click();
  };

  const handleFiles = async (files) => {
    const fileList = Array.from(files || []);
    const file = fileList.find((f) => f.type.startsWith("video/")) ?? fileList[0];
    if (!file) return;
    await onUpload(file);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
      }}
      title={
        uploadState === UPLOAD_STATE.READY
          ? copy.titles.clickToClear.replace("{fileName}", fileName || copy.defaults.selectedVideo)
          : copy.titles.uploadVideo
      }
      className={promptMediaButtonClassName({
        active: uploadState === UPLOAD_STATE.READY,
        className: isDragging
          ? "border-[#22d3ee] bg-[#22d3ee]/20 ring-2 ring-[#22d3ee]/50 scale-105"
          : uploadState === UPLOAD_STATE.READY
          ? "border-[#22d3ee] ring-1 ring-[#22d3ee]/40"
          : "",
      })}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (files?.length) handleFiles(files);
          e.target.value = "";
        }}
      />

      {uploadState === UPLOAD_STATE.IDLE && (
        <div className="flex flex-col items-center justify-center gap-0.5 w-full h-full">
          <VideoIcon />
        </div>
      )}

      {uploadState === UPLOAD_STATE.UPLOADING && (
        <div className="flex flex-col items-center justify-center w-full h-full absolute inset-0 bg-black/80 z-20 backdrop-blur-[2px]">
          <svg className="w-8 h-8 -rotate-90">
            <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/10" />
            <circle
              cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="transparent"
              strokeDasharray={88} strokeDashoffset={88 - (88 * progress) / 100}
              className="text-[#22d3ee] transition-all duration-300"
            />
          </svg>
          <span className="absolute text-[9px] font-black text-[#22d3ee] leading-none">
            {progress}%
          </span>
        </div>
      )}

      {uploadState === UPLOAD_STATE.READY && (
        <div className="flex items-center justify-center w-full h-full absolute inset-0 bg-[#22d3ee]/10 rounded-full group-hover:bg-red-500/20 transition-all">
          {previewUrl ? (
            <video src={previewUrl} className="w-full h-full object-cover rounded-full" muted playsInline />
          ) : (
            <VideoIcon className="text-[#22d3ee]" />
          )}
          {/* Clear hover icon */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 font-bold text-base transition-opacity">
            ×
          </div>
        </div>
      )}
    </button>
  );
}

// ── Characters Multi-Image Button & Thumbnail Overlay ────────────────────────
function CharacterImagesMediaButton({
  images,
  maxImages,
  onAddImage,
  onRemoveImage,
  isUploading,
  progress,
  copy,
}) {
  const inputRef = useRef(null);
  const [showList, setShowList] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!showList) return;
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) setShowList(false);
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [showList]);

  const handleFiles = async (files) => {
    const fileList = Array.from(files || []).filter((f) => f.type.startsWith("image/"));
    for (const file of fileList) {
      if (images.length >= maxImages) break;
      await onAddImage(file);
    }
  };

  return (
    <div ref={containerRef} className="relative flex items-center gap-1.5">
      {/* Primary Media Circle */}
      <button
        type="button"
        onClick={() => {
          if (images.length === 0) {
            inputRef.current?.click();
          } else {
            setShowList(!showList);
          }
        }}
        title={
          images.length > 0
            ? `${images.length} ${copy.labels.characterImages} — click to manage`
            : copy.titles.uploadImage
        }
        className={promptMediaButtonClassName({
          active: images.length > 0,
          className: images.length > 0 ? "border-[#22d3ee] ring-1 ring-[#22d3ee]/40" : "",
        })}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {images.length === 0 && !isUploading && (
          <div className="flex flex-col items-center justify-center gap-0.5 w-full h-full">
            <ImageIcon />
          </div>
        )}

        {isUploading && (
          <div className="flex flex-col items-center justify-center w-full h-full absolute inset-0 bg-black/80 z-20 backdrop-blur-[2px]">
            <span className="animate-spin text-xs text-[#22d3ee]">◌</span>
          </div>
        )}

        {images.length > 0 && (
          <div className="w-full h-full relative rounded-full overflow-hidden">
            <img src={images[images.length - 1].url} alt="" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 inset-x-0 bg-black/75 text-[9px] font-black text-[#22d3ee] text-center leading-3">
              {images.length}
            </div>
          </div>
        )}
      </button>

      {/* Quick Add Button if images already exist */}
      {images.length > 0 && images.length < maxImages && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          title={copy.titles.uploadImage}
          className="w-6 h-6 rounded-full bg-white/[0.04] border border-white/10 hover:border-[#22d3ee]/50 hover:bg-[#22d3ee]/10 text-white/50 hover:text-[#22d3ee] flex items-center justify-center text-xs transition-colors"
        >
          +
        </button>
      )}

      {/* Manage Images Popover */}
      {showList && images.length > 0 && (
        <PromptPopover className="w-72 p-3 flex flex-col gap-2.5 z-50">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="text-xs font-bold text-white">
              {copy.labels.characterImages} ({images.length}/{maxImages})
            </span>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-[11px] font-bold text-[#22d3ee] hover:underline"
            >
              + {copy.labels.addImage}
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-0.5">
            {images.map((img, idx) => (
              <div key={idx} className="relative group w-14 h-14 rounded-xl overflow-hidden border border-white/10 bg-black/50">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveImage(idx);
                  }}
                  title={copy.titles.removeImage}
                  className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 font-bold text-base transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </PromptPopover>
      )}
    </div>
  );
}

// ── Asset Library Popover ─────────────────────────────────────────────────────
function AssetsDropdown({
  videos,
  images,
  results,
  onSelectVideo,
  onSelectImage,
  onDeleteAsset,
  setFullscreenUrl,
  onClose,
  anchorRef,
  copy,
}) {
  const [activeTab, setActiveTab] = useState("videos");
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (!dropRef.current?.contains(e.target) && !anchorRef?.current?.contains(e.target)) {
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
      className="w-80 sm:w-96 max-w-[calc(100vw-2rem)] max-h-96 overflow-hidden flex flex-col gap-2.5 z-50 p-3.5"
      onClick={(e) => e.stopPropagation()}
    >
      <PromptPopoverHeader className="mb-0">
        {copy.assetLibrary.header}
      </PromptPopoverHeader>

      {/* Styled Tabs */}
      <div className="flex bg-white/[0.04] p-1 rounded-xl gap-1 border border-white/[0.06]">
        {["videos", "images", "results"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1 text-xs font-bold rounded-lg capitalize transition-all ${
              activeTab === tab
                ? "bg-[#22d3ee] text-black shadow-sm"
                : "text-white/50 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            {copy.assetLibrary.tabs[tab]}
          </button>
        ))}
      </div>

      {/* Items list */}
      <div className="overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-2 min-h-[160px] max-h-64 pr-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-10 text-xs text-white/30">
            {copy.assetLibrary.empty}
          </div>
        ) : (
          items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/10 transition-all gap-2.5 group/item"
            >
              <div className="w-11 h-11 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 relative border border-white/10">
                {activeTab === "images" ? (
                  <img src={item.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <video src={item.url} className="w-full h-full object-cover" muted playsInline loop />
                )}
                <button
                  type="button"
                  title={copy.titles.enlargePreview}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFullscreenUrl(item.url);
                  }}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover/item:opacity-100 flex items-center justify-center transition-opacity text-white hover:text-[#22d3ee]"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 min-w-0 flex flex-col">
                <span className="text-xs text-white/95 font-semibold truncate" title={item.name}>
                  {item.name}
                </span>
                <span className="text-[10px] text-white/40 truncate mt-0.5">
                  {new Date(item.timestamp || Date.now()).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {activeTab === "images" ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectImage(item.url, item.name);
                    }}
                    className="text-[11px] text-black font-black px-2.5 py-1 bg-[#22d3ee] rounded-md hover:bg-[#22d3ee]/90 transition-colors whitespace-nowrap shadow-sm"
                  >
                    {copy.buttons.useAsImage}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectVideo(item.url, item.name);
                    }}
                    className="text-[11px] text-black font-black px-2.5 py-1 bg-[#22d3ee] rounded-md hover:bg-[#22d3ee]/90 transition-colors whitespace-nowrap shadow-sm"
                  >
                    {copy.buttons.useAsVideo}
                  </button>
                )}

                <button
                  type="button"
                  title={copy.titles.deleteFromLibrary}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAsset(activeTab, item.url);
                  }}
                  className="p-1.5 text-white/30 hover:text-red-400 rounded-md hover:bg-white/5 transition-colors"
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

// ── Generic Menu Dropdown ─────────────────────────────────────────────────────
function MenuDropdown({
  isOpen,
  title,
  items,
  selectedId,
  onSelect,
  onClose,
  anchorRef,
  className = "w-64",
}) {
  const dropRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (!dropRef.current?.contains(e.target) && !anchorRef?.current?.contains(e.target)) {
        onClose();
      }
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return (
    <PromptPopover ref={dropRef} className={className} onClick={(e) => e.stopPropagation()}>
      <PromptPopoverHeader>{title}</PromptPopoverHeader>
      <PromptMenuList>
        {items.map((item) => (
          <PromptMenuItem
            key={item.id}
            selected={item.id === selectedId}
            description={item.description?.slice(0, 80)}
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

// ── Main Component ────────────────────────────────────────────────────────────
export default function MotionControlStudio({
  apiKey,
  onGenerationStart,
  onGenerationEnd,
  onGenerationComplete,
  onGenerationError,
  droppedFiles,
  onFilesHandled,
  locale = "en",
}) {
  const copy = resolveCopy(en, zh, locale);
  const LEGACY_PERSIST_KEY = "hg_motion_control_studio_persistent";
  const PERSIST_KEY = scopedPersistKey(LEGACY_PERSIST_KEY, apiKey);

  useEffect(() => {
    migrateLegacyPersistKey(LEGACY_PERSIST_KEY, PERSIST_KEY);
  }, [PERSIST_KEY]);

  // ── Mode: 'motion_transfer' | 'objects_swap' ────────────────────────────────
  const [mode, setMode] = useState("motion_transfer");

  // ── Model Selection ─────────────────────────────────────────────────────────
  const [selectedModelId, setSelectedModelId] = useState("seedance-2.5-motion-control");
  const selectedModel = getMotionControlModelById(selectedModelId) || motionControlModels[0];

  const maxImagesAllowed = selectedModel.maxImages || 30;
  const maxDurationAllowed = selectedModel.maxDuration || 30;
  const availableAspectRatios = selectedModel.aspectRatios || ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"];

  // ── Parameters ──────────────────────────────────────────────────────────────
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState(5);
  const [quality, setQuality] = useState("high"); // for seedance-2.0
  const [highBitrate, setHighBitrate] = useState(false); // for seedance-2.5
  const [generateAudio, setGenerateAudio] = useState(false);
  const [seed, setSeed] = useState(-1);

  // Sync parameters when switching model
  useEffect(() => {
    if (duration > maxDurationAllowed) {
      setDuration(maxDurationAllowed);
    }
    if (!availableAspectRatios.includes(aspectRatio)) {
      setAspectRatio(availableAspectRatios[0] || "16:9");
    }
  }, [selectedModelId, maxDurationAllowed, availableAspectRatios, duration, aspectRatio]);

  // ── Media Inputs ────────────────────────────────────────────────────────────
  const [videoState, setVideoState] = useState(UPLOAD_STATE.IDLE);
  const [videoName, setVideoName] = useState("");
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoProgress, setVideoProgress] = useState(0);

  const [characterImages, setCharacterImages] = useState([]); // [{ url, name }]
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);

  // ── Popovers & UI Refs ──────────────────────────────────────────────────────
  const [openDropdown, setOpenDropdown] = useState(null); // 'model' | 'aspect' | 'duration' | 'options' | 'assets'
  const modelBtnRef = useRef(null);
  const aspectBtnRef = useRef(null);
  const durationBtnRef = useRef(null);
  const optionsBtnRef = useRef(null);
  const assetsBtnRef = useRef(null);
  const textareaRef = useRef(null);

  // ── Generation State ────────────────────────────────────────────────────────
  const [isGenerating, setIsGenerating] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef(null);
  const pendingRequestId = useRef(null);

  // ── History & Gallery ───────────────────────────────────────────────────────
  const [history, setHistory] = useState([]);
  const [fullscreenUrl, setFullscreenUrl] = useState(null);

  // ── Asset Library Storage ───────────────────────────────────────────────────
  const [assetVideos, setAssetVideos] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("hg_motion_control_assets");
        if (stored) return JSON.parse(stored).videos || [];
      } catch {}
    }
    return [];
  });

  const [assetImages, setAssetImages] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("hg_motion_control_assets");
        if (stored) return JSON.parse(stored).images || [];
      } catch {}
    }
    return [];
  });

  const [assetResults, setAssetResults] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("hg_motion_control_assets");
        if (stored) return JSON.parse(stored).results || [];
      } catch {}
    }
    return [];
  });

  const saveAssets = (v, i, r) => {
    try {
      localStorage.setItem(
        "hg_motion_control_assets",
        JSON.stringify({ videos: v, images: i, results: r })
      );
    } catch {}
  };

  const handleAddVideoAsset = (url, name) => {
    setAssetVideos((prev) => {
      if (prev.some((a) => a.url === url)) return prev;
      const updated = [{ url, name, timestamp: Date.now() }, ...prev];
      saveAssets(updated, assetImages, assetResults);
      return updated;
    });
  };

  const handleAddImageAsset = (url, name) => {
    setAssetImages((prev) => {
      if (prev.some((a) => a.url === url)) return prev;
      const updated = [{ url, name, timestamp: Date.now() }, ...prev];
      saveAssets(assetVideos, updated, assetResults);
      return updated;
    });
  };

  const handleAddResultAsset = (url, name) => {
    setAssetResults((prev) => {
      if (prev.some((a) => a.url === url)) return prev;
      const updated = [{ url, name, timestamp: Date.now() }, ...prev];
      saveAssets(assetVideos, assetImages, updated);
      return updated;
    });
  };

  const handleDeleteAsset = (type, url) => {
    if (type === "videos") {
      setAssetVideos((prev) => {
        const u = prev.filter((a) => a.url !== url);
        saveAssets(u, assetImages, assetResults);
        return u;
      });
    } else if (type === "images") {
      setAssetImages((prev) => {
        const u = prev.filter((a) => a.url !== url);
        saveAssets(assetVideos, u, assetResults);
        return u;
      });
    } else {
      setAssetResults((prev) => {
        const u = prev.filter((a) => a.url !== url);
        saveAssets(assetVideos, assetImages, u);
        return u;
      });
    }
  };

  // ── Load / Save History ─────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PERSIST_KEY) || "[]");
      if (Array.isArray(saved)) setHistory(saved);
    } catch {}
  }, [PERSIST_KEY]);

  const saveHistory = (items) => {
    setHistory(items);
    try {
      localStorage.setItem(PERSIST_KEY, JSON.stringify(items));
    } catch {}
  };

  // ── Video Upload ────────────────────────────────────────────────────────────
  const handleUploadVideo = async (file) => {
    if (file.size > 100 * 1024 * 1024) {
      toast.error(copy.errors.videoTooLarge);
      return;
    }
    setVideoState(UPLOAD_STATE.UPLOADING);
    setVideoName(file.name);
    setVideoProgress(0);

    try {
      const url = await uploadFile(apiKey, file, setVideoProgress);
      setVideoUrl(url);
      setVideoState(UPLOAD_STATE.READY);
      handleAddVideoAsset(url, file.name);
    } catch (err) {
      setVideoState(UPLOAD_STATE.IDLE);
      setVideoName("");
      setVideoUrl(null);
      toast.error(copy.errors.videoUploadFailed.replace("{message}", formatErrorMessage(err)));
    }
  };

  const handleClearVideo = () => {
    setVideoState(UPLOAD_STATE.IDLE);
    setVideoName("");
    setVideoUrl(null);
    setVideoProgress(0);
  };

  // ── Character Images Upload ─────────────────────────────────────────────────
  const handleAddImage = async (file) => {
    if (characterImages.length >= maxImagesAllowed) {
      toast.error(copy.errors.maxImagesExceeded.replace("{max}", String(maxImagesAllowed)));
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error(copy.errors.imageTooLarge);
      return;
    }
    setIsImageUploading(true);
    setImageProgress(0);

    try {
      const url = await uploadFile(apiKey, file, setImageProgress);
      setCharacterImages((prev) => [...prev, { url, name: file.name }]);
      handleAddImageAsset(url, file.name);
    } catch (err) {
      toast.error(copy.errors.imageUploadFailed.replace("{message}", formatErrorMessage(err)));
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleRemoveImage = (index) => {
    setCharacterImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  // ── Dropped Files Handling ──────────────────────────────────────────────────
  useEffect(() => {
    if (!droppedFiles || droppedFiles.length === 0) return;
    const files = Array.from(droppedFiles);

    const videoFile = files.find((f) => f.type.startsWith("video/"));
    if (videoFile) handleUploadVideo(videoFile);

    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    imageFiles.forEach((imgFile) => handleAddImage(imgFile));

    onFilesHandled?.();
  }, [droppedFiles, onFilesHandled]);

  // ── Handle Generation ───────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!videoUrl) {
      toast.error(copy.errors.missingVideo);
      return;
    }
    if (characterImages.length === 0) {
      toast.error(copy.errors.missingImages);
      return;
    }

    setIsGenerating(true);
    setElapsedTime(0);
    timerRef.current = setInterval(() => setElapsedTime((t) => t + 1), 1000);
    onGenerationStart?.();

    try {
      const params = {
        model: selectedModelId,
        mode: mode,
        video_url: videoUrl,
        images_list: characterImages.map((i) => i.url),
        prompt: prompt.trim(),
        aspect_ratio: aspectRatio,
        duration: duration,
        quality: quality,
        high_bitrate: highBitrate,
        generate_audio: generateAudio,
        seed: seed,
        onRequestId: (rid) => {
          pendingRequestId.current = rid;
        },
      };

      const result = await processMotionControl(apiKey, params);
      const outputUrl =
        result.url ||
        result.outputs?.[0] ||
        (Array.isArray(result.output) ? result.output[0] : result.output?.url);

      if (!outputUrl) {
        throw new Error("No output video URL was returned by provider.");
      }

      const newEntry = {
        id: result.request_id || pendingRequestId.current || `mc-${Date.now()}`,
        url: outputUrl,
        prompt: prompt.trim() || (mode === "objects_swap" ? "Objects Swap" : "Motion Transfer"),
        mode: mode,
        model: selectedModel.name,
        duration: duration,
        aspectRatio: aspectRatio,
        timestamp: Date.now(),
      };

      saveHistory([newEntry, ...history]);
      handleAddResultAsset(outputUrl, `motion-${newEntry.id}.mp4`);
      onGenerationComplete?.(newEntry);
      toast.success("Motion control video generated successfully!");
    } catch (err) {
      const msg = formatErrorMessage(err) || copy.errors.generationFailed;
      toast.error(msg);
      onGenerationError?.(msg);
    } finally {
      clearInterval(timerRef.current);
      setIsGenerating(false);
      onGenerationEnd?.();
    }
  };

  // Model compact display label for button
  const modelShortName = selectedModelId === "seedance-2.5-motion-control" ? "Seedance 2.5" : "Seedance 2.0";

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#030303] relative overflow-hidden">
      <Toaster position="top-right" />

      {/* ── CENTRAL GALLERY AREA ── */}
      <div className="flex-1 w-full max-w-7xl mx-auto overflow-y-auto custom-scrollbar pb-40 lg:pb-32 px-3">
        {history.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pt-4 animate-fade-in-up">
            {history.map((entry, idx) => (
              <div
                key={entry.id || idx}
                className="relative group rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl hover:border-[#22d3ee]/50 transition-all duration-300 flex flex-col cursor-pointer"
                onClick={() => setFullscreenUrl(entry.url)}
              >
                <video
                  src={entry.url}
                  className="w-full aspect-video object-cover bg-black/40 hover:opacity-90 transition-opacity"
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

                {/* Overlay actions on hover */}
                <div className="absolute top-2 right-2 hidden md:flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <GenerationCopyButtons
                    prompt={entry.prompt}
                    onCopyError={onGenerationError}
                  />
                  <button
                    type="button"
                    title={copy.buttons.download}
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadFile(entry.url, `motion-control-${entry.id || idx}.mp4`);
                    }}
                    className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-[#22d3ee] hover:text-black transition-all border border-white/10"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    title={copy.buttons.useAsVideo}
                    onClick={(e) => {
                      e.stopPropagation();
                      setVideoUrl(entry.url);
                      setVideoName(copy.defaults.selectedVideo);
                      setVideoState(UPLOAD_STATE.READY);
                      toast.success("Loaded video as reference motion!");
                    }}
                    className="p-2 bg-black/60 backdrop-blur-md rounded-full text-[#22d3ee] hover:bg-[#22d3ee] hover:text-black transition-all border border-white/10"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="17 1 21 5 17 9" />
                      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                      <polyline points="7 23 3 19 7 15" />
                      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    title={copy.buttons.delete}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(copy.confirm.deleteGenerated)) {
                        saveHistory(history.filter((_, i) => i !== idx));
                      }
                    }}
                    className="p-2 bg-black/60 backdrop-blur-md rounded-full text-red-400 hover:bg-red-500 hover:text-white transition-all border border-white/10"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>

                <MobileGenerationActions
                  prompt={entry.prompt}
                  onCopyError={onGenerationError}
                  actions={[
                    {
                      kind: "download",
                      label: copy.buttons.download,
                      onSelect: () => downloadFile(entry.url, `motion-control-${entry.id || idx}.mp4`),
                    },
                    {
                      kind: "delete",
                      label: copy.buttons.delete,
                      danger: true,
                      onSelect: () => {
                        if (confirm(copy.confirm.deleteGenerated)) {
                          saveHistory(history.filter((_, i) => i !== idx));
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
                    <span className="text-[10px] font-bold text-[#22d3ee] px-2 py-0.5 bg-[#22d3ee]/10 rounded border border-[#22d3ee]/20 whitespace-nowrap">
                      {entry.mode === "objects_swap" ? copy.badges.objectsSwap : copy.badges.motionTransfer}
                    </span>
                    <span className="text-[10px] text-white/40">
                      {entry.duration ? `${entry.duration}s • ` : ""}
                      {entry.aspectRatio || "16:9"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in-up transition-all duration-700 min-h-[50vh] relative">
            {/* Ambient background glow */}
            <div className="absolute w-96 h-96 bg-[#22d3ee]/5 rounded-full blur-3xl pointer-events-none -z-10" />

            {/* Visual Overlapping Cards */}
            <div className="flex items-center justify-center gap-2 md:gap-4 mb-8 select-none scale-90 sm:scale-100">
              <div className="w-20 h-24 sm:w-26 sm:h-32 rounded-2xl border border-white/10 shadow-2xl -rotate-[12deg] transform hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden bg-white/[0.01] flex-shrink-0">
                <img src="https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/sdxl-image.avif" alt="" className="w-full h-full object-cover" />
              </div>
              <div className="w-20 h-24 sm:w-26 sm:h-32 rounded-2xl border border-white/10 shadow-2xl -rotate-[4deg] transform hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden bg-white/[0.01] -ml-4 flex-shrink-0">
                <img src="https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/chroma-image.avif" alt="" className="w-full h-full object-cover" />
              </div>
              <div className="w-20 h-20 sm:w-26 sm:h-26 rounded-full border border-white/10 shadow-2xl rotate-[6deg] transform hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden bg-white/[0.01] -ml-4 flex-shrink-0">
                <img src="https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/neta-lumina.avif" alt="" className="w-full h-full object-cover" />
              </div>
              <div className="w-20 h-24 sm:w-26 sm:h-32 rounded-2xl border border-white/10 shadow-2xl rotate-[12deg] transform hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden bg-white/[0.01] -ml-4 flex-shrink-0">
                <img src="https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/perfect-pony-xl.avif" alt="" className="w-full h-full object-cover" />
              </div>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight mb-3 text-center px-4 flex flex-col items-center">
              <span className="text-white/60 uppercase text-xs sm:text-sm font-bold tracking-widest mb-1.5">
                {copy.empty.titleLine1}
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#22d3ee] to-white font-black uppercase tracking-tight">
                {copy.empty.titleLine2}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-white/50 text-center max-w-lg px-4 leading-relaxed font-normal">
              {copy.empty.description}
            </p>
          </div>
        )}
      </div>

      {/* ── PROMPT COMPOSER FOOTER ── */}
      <PromptComposer>
        {/* Mode Segmented Switcher Header */}
        <div className="flex items-center justify-between gap-3 px-1 pb-1">
          <PromptSegmentedControl>
            <PromptSegmentOption
              selected={mode === "motion_transfer"}
              onClick={() => setMode("motion_transfer")}
            >
              {copy.modes.motionTransfer}
            </PromptSegmentOption>
            <PromptSegmentOption
              selected={mode === "objects_swap"}
              onClick={() => setMode("objects_swap")}
            >
              {copy.modes.objectsSwap}
            </PromptSegmentOption>
          </PromptSegmentedControl>

          <span className="text-[11px] font-medium text-white/40 hidden sm:inline">
            {mode === "motion_transfer"
              ? copy.modes.motionTransferDesc
              : copy.modes.objectsSwapDesc}
          </span>
        </div>

        {/* Media Pickers & Textarea Row */}
        <div className="flex items-center gap-3 px-1 py-0.5">
          {/* Media Input Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Reference Video Button */}
            <VideoMediaButton
              onUpload={handleUploadVideo}
              onClear={handleClearVideo}
              uploadState={videoState}
              progress={videoProgress}
              fileName={videoName}
              previewUrl={videoUrl}
              copy={copy}
            />

            {/* Character / Performer Multi-Image Button */}
            <CharacterImagesMediaButton
              images={characterImages}
              maxImages={maxImagesAllowed}
              onAddImage={handleAddImage}
              onRemoveImage={handleRemoveImage}
              isUploading={isImageUploading}
              progress={imageProgress}
              copy={copy}
            />
          </div>

          {/* Prompt Textarea */}
          <div className="flex-1 flex flex-col min-w-0">
            <PromptTextarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={copy.placeholders.prompt}
            />
          </div>
        </div>

        {/* Bottom controls row */}
        <PromptFooter>
          <PromptControls>
            {/* Model Selector */}
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
                <div className="w-3.5 h-3.5 bg-[#22d3ee] rounded-sm flex items-center justify-center flex-shrink-0">
                  <span className="text-[9px] font-black text-black">M</span>
                </div>
                <span className={PROMPT_CONTROL_LABEL_CLASS}>
                  {modelShortName}
                </span>
                <PromptChevronIcon />
              </button>

              <MenuDropdown
                isOpen={openDropdown === "model"}
                title={copy.dropdowns.model}
                items={motionControlModels}
                selectedId={selectedModelId}
                onSelect={(item) => setSelectedModelId(item.id)}
                onClose={() => setOpenDropdown(null)}
                anchorRef={modelBtnRef}
                className="w-80 max-w-[calc(100vw-2rem)]"
              />
            </div>

            {/* Aspect Ratio Selector */}
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
                <span className={PROMPT_CONTROL_LABEL_CLASS}>{aspectRatio}</span>
                <PromptChevronIcon />
              </button>

              <MenuDropdown
                isOpen={openDropdown === "aspect"}
                title={copy.dropdowns.aspectRatio}
                items={availableAspectRatios.map((ar) => ({ id: ar, name: ar }))}
                selectedId={aspectRatio}
                onSelect={(item) => setAspectRatio(item.id)}
                onClose={() => setOpenDropdown(null)}
                anchorRef={aspectBtnRef}
                className="w-44"
              />
            </div>

            {/* Duration Popover */}
            <div className="relative">
              <button
                ref={durationBtnRef}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdown(openDropdown === "duration" ? null : "duration");
                }}
                className={promptControlClassName({
                  active: openDropdown === "duration",
                })}
              >
                <PromptDurationIcon />
                <span className={PROMPT_CONTROL_LABEL_CLASS}>{duration}s</span>
                <PromptChevronIcon />
              </button>

              {openDropdown === "duration" && (
                <PromptPopover
                  className="w-64 p-3 flex flex-col gap-3 z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <PromptPopoverHeader className="mb-0">
                    {copy.labels.duration} ({duration}s)
                  </PromptPopoverHeader>

                  {/* Range Slider */}
                  <input
                    type="range"
                    min={selectedModel.minDuration || 4}
                    max={maxDurationAllowed}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full accent-[#22d3ee] cursor-pointer"
                  />

                  {/* Preset Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[5, 10, 15, 20, 30].filter((d) => d <= maxDurationAllowed).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setDuration(d);
                          setOpenDropdown(null);
                        }}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                          duration === d
                            ? "bg-[#22d3ee] text-black font-bold shadow-sm"
                            : "bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {d}s
                      </button>
                    ))}
                  </div>
                </PromptPopover>
              )}
            </div>

            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => setGenerateAudio(!generateAudio)}
              title={copy.labels.generateAudio}
              className={promptControlClassName({
                active: generateAudio,
                className: "gap-1.5",
              })}
            >
              <AudioIcon enabled={generateAudio} className={generateAudio ? "text-[#22d3ee]" : "text-white/40"} />
              <span className={PROMPT_CONTROL_LABEL_CLASS}>
                {copy.labels.generateAudio}
              </span>
            </button>

            {/* Advanced Settings Popover (Quality / Bitrate / Seed) */}
            <div className="relative">
              <button
                ref={optionsBtnRef}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdown(openDropdown === "options" ? null : "options");
                }}
                className={promptControlClassName({
                  active: openDropdown === "options" || highBitrate || (selectedModelId === "seedance-2-motion-control" && quality === "basic"),
                })}
              >
                <SlidersIcon />
                <PromptChevronIcon />
              </button>

              {openDropdown === "options" && (
                <PromptPopover
                  className="w-72 p-3.5 flex flex-col gap-3 z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <PromptPopoverHeader className="mb-0">
                    {copy.labels.mode} & {copy.dropdowns.model} Options
                  </PromptPopoverHeader>

                  {/* Seedance 2.5: High Bitrate Toggle */}
                  {selectedModelId === "seedance-2.5-motion-control" && (
                    <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-white">{copy.labels.highBitrate}</span>
                        <span className="text-[10px] text-white/40">Enhanced video encoding fidelity</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHighBitrate(!highBitrate)}
                        className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                          highBitrate ? "bg-[#22d3ee]" : "bg-white/15"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-black transition-transform ${
                            highBitrate ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  )}

                  {/* Seedance 2.0: Quality Mode */}
                  {selectedModelId === "seedance-2-motion-control" && (
                    <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <span className="text-xs font-semibold text-white">{copy.labels.quality}</span>
                      <div className="flex gap-1">
                        {["high", "basic"].map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => setQuality(q)}
                            className={`flex-1 py-1 text-xs font-bold rounded-lg capitalize transition-all ${
                              quality === q
                                ? "bg-[#22d3ee] text-black shadow-sm"
                                : "text-white/50 hover:text-white bg-white/[0.04]"
                            }`}
                          >
                            {q === "high" ? copy.dropdowns.qualityHigh : copy.dropdowns.qualityBasic}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Seed Control */}
                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-white">{copy.labels.seed}</span>
                      <span className="text-[10px] text-white/40">{copy.labels.randomSeed}</span>
                    </div>
                    <input
                      type="number"
                      value={seed}
                      onChange={(e) => setSeed(Number(e.target.value))}
                      placeholder="-1"
                      className="w-20 px-2 py-1 text-xs bg-black/60 border border-white/10 rounded-lg text-white text-right focus:outline-none focus:border-[#22d3ee]/50"
                    />
                  </div>
                </PromptPopover>
              )}
            </div>

            {/* Assets Library Button */}
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
                <span className={PROMPT_CONTROL_LABEL_CLASS}>
                  {copy.labels.library}
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
                    setVideoName(name || copy.defaults.selectedVideo);
                    setVideoState(UPLOAD_STATE.READY);
                    setOpenDropdown(null);
                  }}
                  onSelectImage={(url, name) => {
                    if (characterImages.length < maxImagesAllowed) {
                      setCharacterImages((prev) => [
                        ...prev,
                        { url, name: name || copy.defaults.selectedImage },
                      ]);
                    }
                    setOpenDropdown(null);
                  }}
                  onDeleteAsset={handleDeleteAsset}
                  setFullscreenUrl={setFullscreenUrl}
                  onClose={() => setOpenDropdown(null)}
                  anchorRef={assetsBtnRef}
                  copy={copy}
                />
              )}
            </div>
          </PromptControls>

          {/* Action Generate Button */}
          <PromptAction onClick={handleGenerate} className="whitespace-nowrap" disabled={isGenerating}>
            {isGenerating ? (
              <>
                <span className="animate-spin inline-block text-black mr-1.5">◌</span>
                <span>{copy.buttons.generating}</span>
              </>
            ) : (
              <span>{copy.buttons.generate}</span>
            )}
          </PromptAction>
        </PromptFooter>
      </PromptComposer>

      {/* ── FULLSCREEN MEDIA MODAL ── */}
      {fullscreenUrl && (
        <div
          className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setFullscreenUrl(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setFullscreenUrl(null)}
              className="absolute -top-12 right-0 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <video
              src={fullscreenUrl}
              controls
              autoPlay
              playsInline
              className="w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl bg-black border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
}
