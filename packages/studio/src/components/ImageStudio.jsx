"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Boxes, Check, Copy, Download, ExternalLink, Images, Maximize2, Trash2, UserRound, X } from "lucide-react";
import { generateImage, generateI2I, uploadFile } from "../yunwu.js";
import { getActiveProvider, getProviderModelWhitelist, isProviderReady, normalizeApiConfig } from "../apiProviders.js";
import { isLocalStudioModel, loadLocalRuntimeModelCatalog } from "../localModels.js";
import {
  t2iModels,
  getAspectRatiosForModel,
  getResolutionsForModel,
  getQualityFieldForModel,
  getAspectRatiosForI2IModel,
  getResolutionsForI2IModel,
  getQualityFieldForI2IModel,
  getMaxImagesForI2IModel,
} from "../models.js";

// ─── helpers ────────────────────────────────────────────────────────────────

const seedreamLiteInputs = {
  prompt: { type: "string", title: "Prompt", name: "prompt" },
  aspect_ratio: {
    enum: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9"],
    title: "Aspect Ratio",
    name: "aspect_ratio",
    type: "string",
    default: "1:1",
  },
  resolution: {
    enum: ["2K", "3K"],
    title: "Resolution",
    name: "resolution",
    type: "string",
    default: "2K",
  },
};

const geminiImageInputs = {
  prompt: { type: "string", title: "Prompt", name: "prompt" },
  aspect_ratio: {
    enum: ["1:1", "16:9", "9:16", "4:3", "3:4"],
    title: "Aspect Ratio",
    name: "aspect_ratio",
    type: "string",
    default: "1:1",
  },
};

const gptImageInputs = {
  prompt: { type: "string", title: "Prompt", name: "prompt" },
  aspect_ratio: {
    enum: ["1:1", "16:9", "9:16", "4:3", "3:4"],
    title: "Aspect Ratio",
    name: "aspect_ratio",
    type: "string",
    default: "1:1",
  },
  quality: {
    enum: ["auto", "low", "medium", "high"],
    title: "Quality",
    name: "quality",
    type: "string",
    default: "auto",
  },
};

const imageT2iModels = [
  {
    id: "doubao-seedream-5.0-lite",
    name: "Doubao Seedream 5.0 Lite",
    providerId: "seedance-ark",
    trustedForSeedance: true,
    maxImages: 1,
    aliases: ["seedream-5-lite", "seedream-5.0-lite"],
    inputs: seedreamLiteInputs,
  },
  {
    id: "gemini-3.1-flash-image-preview",
    name: "Nano Banana",
    providerId: "yunwu",
    transport: "chat-completions",
    maxImages: 4,
    aliases: ["nano-banana"],
    inputs: geminiImageInputs,
  },
  {
    id: "gemini-3-pro-image-preview",
    name: "Nano Banana Pro",
    providerId: "yunwu",
    transport: "chat-completions",
    maxImages: 4,
    aliases: ["nano-banana-pro"],
    inputs: geminiImageInputs,
  },
  {
    id: "gpt-image-2",
    name: "GPT Image 2 All",
    providerId: "yunwu",
    transport: "images",
    maxImages: 4,
    aliases: ["gpt-image-2-all", "gpt-image-2pro"],
    inputs: gptImageInputs,
  },
];

const IMAGE_CREATION_MODES = [
  { id: "t2i", label: "文生图", description: "Prompt" },
  { id: "i2i", label: "图生图", description: "参考图" },
];

const defaultT2IModel = imageT2iModels[0] || t2iModels[0];

function getYunwuImageModelById(modelId) {
  return imageT2iModels.find((model) => model.id === modelId);
}

function getBaseImageModelId(modelId) {
  return String(modelId || "").replace(/-edit$/, "");
}

function isSeedreamLiteModel(modelId) {
  return /seedream[-_. ]?5(?:\.|-)?0[-_. ]?lite/i.test(String(modelId || ""));
}

function isSeedanceTrustedImageModel(modelId) {
  return isSeedreamLiteModel(modelId);
}

function normalizeStoredImageModelId(modelId) {
  const base = getBaseImageModelId(modelId);
  const aliases = {
    "gpt-image-2-all": "gpt-image-2",
    "nano-banana": "gemini-3.1-flash-image-preview",
    "nano-banana-pro": "gemini-3-pro-image-preview",
  };
  const normalized = aliases[base] || base;
  return getYunwuImageModelById(normalized)?.id || defaultT2IModel.id;
}

function normalizeImageModelMatchValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function imageModelMatchesWhitelist(model, whitelistId) {
  const needle = normalizeImageModelMatchValue(whitelistId);
  if (!needle) return false;

  const candidates = [
    model.id,
    model.endpoint,
    model.family,
    model.name,
    model.providerModelId,
    ...(model.aliases || []),
  ]
    .map(normalizeImageModelMatchValue)
    .filter(Boolean);

  return candidates.some((candidate) => candidate === needle || candidate.includes(needle) || needle.includes(candidate));
}

function filterImageModelsByWhitelist(models, whitelist) {
  if (!whitelist?.length) return models;

  const picked = [];
  const pickedIds = new Set();
  whitelist.forEach((modelId) => {
    models.forEach((model) => {
      if (!imageModelMatchesWhitelist(model, modelId) || pickedIds.has(model.id)) return;
      picked.push(model);
      pickedIds.add(model.id);
    });
  });

  return picked.length ? picked : models;
}

function getImageAspectRatios(modelId, mode) {
  const localModel = getYunwuImageModelById(modelId);
  if (localModel?.inputs?.aspect_ratio?.enum) return localModel.inputs.aspect_ratio.enum;
  return mode ? getAspectRatiosForI2IModel(modelId) : getAspectRatiosForModel(modelId);
}

function getImageResolutions(modelId, mode) {
  const localModel = getYunwuImageModelById(modelId);
  if (localModel?.inputs?.resolution?.enum) return localModel.inputs.resolution.enum;
  if (localModel?.inputs?.quality?.enum) return localModel.inputs.quality.enum;
  return mode ? getResolutionsForI2IModel(modelId) : getResolutionsForModel(modelId);
}

function getImageQualityField(modelId, mode) {
  const localModel = getYunwuImageModelById(modelId);
  if (localModel?.inputs?.resolution) return "resolution";
  if (localModel?.inputs?.quality) return "quality";
  return mode ? getQualityFieldForI2IModel(modelId) : getQualityFieldForModel(modelId);
}

function getImageMaxImages(modelId) {
  const localModel = getYunwuImageModelById(modelId);
  return localModel?.maxImages || getMaxImagesForI2IModel(modelId);
}

function normalizeImageGalleryUrl(value) {
  return String(value || "").trim();
}

function isPreviewableImageUrl(value) {
  return /^(https?:\/\/|data:image\/|blob:)/i.test(normalizeImageGalleryUrl(value));
}

function isTrustedImageGalleryEntry(entry) {
  const model = String(entry?.model || "").toLowerCase();
  const providerId = String(entry?.providerId || "").toLowerCase();
  return Boolean(entry?.trustedForSeedance) || providerId === "seedance-ark" || model.includes("seedream");
}

async function downloadImage(url, filename) {
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
}

async function copyTextToClipboard(text) {
  if (!text) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn("Clipboard API failed:", err);
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch (err) {
    console.warn("Fallback clipboard copy failed:", err);
    return false;
  }
}

// ─── UploadButton (inline picker) ───────────────────────────────────────────

function UploadButton({ apiKey, maxImages, onSelect, onClear, initialUrls = [] }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState([]); // [{url, thumbnail}]
  const [uploadHistory, setUploadHistory] = useState([]); // [{id, name, url, thumbnail}]
  const [lastUploadProgress, setLastUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);
  const emittedSelectionKeyRef = useRef("");

  // Close on outside click
  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setPanelOpen(false);
      }
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [panelOpen]);

  // Sync initialUrls from parent (e.g. restored from localStorage)
  useEffect(() => {
    const nextUrls = (initialUrls || []).filter(Boolean).slice(0, maxImages);
    setSelectedEntries((prev) => {
      const currentUrls = prev.map((e) => e.url);
      const isSame =
        nextUrls.length === currentUrls.length &&
        nextUrls.every((url, index) => url === currentUrls[index]);
      return isSame ? prev : nextUrls.map((url) => ({ url }));
    });

    if (nextUrls.length > 0) {
      setUploadHistory(prev => {
        const existingUrls = prev.map(h => h.url);
        const missing = nextUrls
          .filter(u => !existingUrls.includes(u))
          .map(u => ({ id: `restored-${u}`, name: "恢复的图片", url: u, progress: 100 }));
        return [...missing, ...prev];
      });
    }
  }, [initialUrls, maxImages]);

  // When maxImages changes, trim excess selections
  useEffect(() => {
    if (selectedEntries.length > maxImages) {
      const trimmed = selectedEntries.slice(0, maxImages);
      setSelectedEntries(trimmed);
      if (trimmed.length === 0) onClear?.();
    }
    if (fileInputRef.current) {
      fileInputRef.current.multiple = maxImages > 1;
    }
  }, [maxImages]); // eslint-disable-line react-hooks/exhaustive-deps

  const fireOnSelect = useCallback(
    (entries) => {
      if (!entries.length) return;
      const urls = entries.map((e) => e.url);
      onSelect({ url: urls[0], urls, thumbnail: entries[0].url });
    },
    [onSelect],
  );

  useEffect(() => {
    const validEntries = selectedEntries.filter((entry) => entry?.url);
    const key = validEntries.map((entry) => entry.url).join("\n");
    if (key === emittedSelectionKeyRef.current) return;
    emittedSelectionKeyRef.current = key;

    if (validEntries.length > 0) {
      fireOnSelect(validEntries);
    } else {
      onClear?.();
    }
  }, [fireOnSelect, onClear, selectedEntries]);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    e.target.value = "";

    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    const tooLarge = files.filter((f) => f.size > MAX_IMAGE_SIZE);
    if (tooLarge.length > 0) {
      alert(
        `以下图片过大（最大 10MB）：${tooLarge.map((f) => f.name).join(", ")}`,
      );
      return;
    }

    setUploading(true);
    try {
      const currentCount = selectedEntries.filter((entry) => entry?.url).length;
      const remainingSlots = maxImages === 1 ? 1 : Math.max(0, maxImages - currentCount);
      if (remainingSlots <= 0) {
        alert(`最多只能添加 ${maxImages} 张参考图。`);
        return;
      }

      const toUpload =
        maxImages === 1
          ? files.slice(0, 1)
          : files.slice(0, remainingSlots);

      await Promise.all(
        toUpload.map(async (file) => {
          const id = Date.now().toString() + Math.random();

          // Add a placeholder to history immediately without local preview
          const placeholder = { id, name: file.name, url: null, progress: 0 };
          setUploadHistory((prev) => [placeholder, ...prev]);

          try {
            const uploadedUrl = await uploadFile(apiKey, file, (pct) => {
              setLastUploadProgress(pct);
              setUploadHistory((prev) =>
                prev.map((h) => (h.id === id ? { ...h, progress: pct } : h)),
              );
            });

            // Update history with real URL and Mark as 100%
            setUploadHistory((prev) =>
              prev.map((h) => {
                if (h.id === id) {
                  return { ...h, url: uploadedUrl, progress: 100 };
                }
                return h;
              }),
            );

            // Auto-select if there's room
            const newEntry = { url: uploadedUrl };
            setSelectedEntries((prev) => {
              const deduped = prev.filter((entry) => entry.url !== uploadedUrl);
              return maxImages === 1
                ? [newEntry]
                : [...deduped, newEntry].slice(0, maxImages);
            });

            if (maxImages === 1) {
              setPanelOpen(false);
            }
          } catch (err) {
            console.error("[UploadButton] 图片上传失败：", file.name, err);
            setUploadHistory((prev) => prev.filter((h) => h.id !== id));
            throw err;
          }
        }),
      );
    } catch (err) {
      alert(`图片上传失败：${err.message}`);
    } finally {
      setUploading(false);
      setLastUploadProgress(0);
    }
  };

  const handleCellClick = (entry) => {
    const selIdx = selectedEntries.findIndex((e) => e.url === entry.url);
    const isSelected = selIdx !== -1;
    const atMax =
      maxImages > 1 && !isSelected && selectedEntries.length >= maxImages;
    if (atMax) return;

    if (maxImages === 1) {
      const newSelected = [{ url: entry.url, localUrl: entry.localUrl }];
      setSelectedEntries(newSelected);
      fireOnSelect(newSelected);
      setPanelOpen(false);
    } else {
      let next;
      if (isSelected) {
        next = selectedEntries.filter((_, i) => i !== selIdx);
        if (next.length === 0) onClear?.();
      } else {
        next = [
          ...selectedEntries,
          { url: entry.url, localUrl: entry.localUrl },
        ];
      }
      setSelectedEntries(next);
    }
  };

  const handleRemoveFromHistory = (e, entry) => {
    e.stopPropagation();
    if (entry.localUrl) URL.revokeObjectURL(entry.localUrl);
    setUploadHistory((prev) => prev.filter((h) => h.id !== entry.id));

    const next = selectedEntries.filter((s) => s.url !== entry.url);
    if (next.length !== selectedEntries.length) {
      setSelectedEntries(next);
      if (next.length === 0) onClear?.();
    }
  };

  const handleDone = (e) => {
    e.stopPropagation();
    fireOnSelect(selectedEntries);
    setPanelOpen(false);
  };

  const reset = () => {
    setSelectedEntries([]);
    setPanelOpen(false);
  };

  // expose reset via ref pattern — parent calls reset() directly
  // (handled by parent through uploadedImageUrls state reset)

  const isMulti = maxImages > 1;
  const count = selectedEntries.length;
  const hasSelection = count > 0;

  // Trigger icon content
  let triggerContent;
  if (hasSelection || uploading) {
    const mainEntry = selectedEntries[0] || uploadHistory[0];
    const canAddMore = isMulti && count < maxImages;
    let badge;
    if (uploading && !hasSelection) {
      badge = (
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
              strokeDashoffset={88 - (88 * lastUploadProgress) / 100}
              className="text-primary transition-all duration-300"
            />
          </svg>
          <span className="absolute text-[9px] font-black text-primary leading-none">
            {lastUploadProgress}%
          </span>
        </div>
      );
    } else if (count > 1) {
      badge = (
        <div className="absolute bottom-0.5 right-0.5 min-w-[16px] h-4 bg-primary rounded-full flex items-center justify-center px-0.5">
          <span className="text-[9px] font-black text-black leading-none">
            {count}
          </span>
        </div>
      );
    } else if (canAddMore) {
      badge = (
        <div className="absolute bottom-0.5 right-0.5 min-w-[16px] h-4 bg-white/80 rounded-full flex items-center justify-center px-0.5 border border-primary/60">
          <span className="text-[9px] font-black text-black leading-none">
            +
          </span>
        </div>
      );
    } else {
      badge = (
        <div className="absolute bottom-0.5 right-0.5 min-w-[16px] h-4 bg-primary rounded-full flex items-center justify-center px-0.5">
          <svg
            width="8"
            height="8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="black"
            strokeWidth="4"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      );
    }
    triggerContent = (
      <>
        {uploading && hasSelection && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-30">
            <div className="w-4 h-4 rounded-full border border-primary/30 border-t-primary animate-spin mb-0.5" />
            <span className="text-[8px] font-black text-primary">
              {lastUploadProgress}%
            </span>
          </div>
        )}
        {count > 1 ? (
          <div className="relative w-full h-full p-1.5 flex items-center justify-center">
            {/* Bottom Image */}
            {selectedEntries[1]?.url && (
              <div className="absolute top-1 left-1 w-6 h-6 rounded-md border border-black/40 overflow-hidden shadow-lg rotate-[-8deg] translate-x-[-1px] translate-y-[-1px]">
                <img
                  src={selectedEntries[1].url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {/* Top Image */}
            {selectedEntries[0]?.url && (
              <div className="absolute bottom-1 right-1 w-7 h-7 rounded-sm border-[1.5px] border-black/60 overflow-hidden shadow-2xl z-10 rotate-[4deg] translate-x-[1px] translate-y-[1px]">
                <img
                  src={selectedEntries[0].url}
                  alt=""
                  className={`w-full h-full object-cover transition-all duration-300 ${
                    uploading && hasSelection ? "blur-[2px] opacity-60" : "opacity-100"
                  }`}
                />
              </div>
            )}
          </div>
        ) : mainEntry?.url ? (
          <img
            src={mainEntry.url}
            alt=""
            className={`w-full h-full object-cover transition-all duration-300 ${
              uploading && hasSelection ? "blur-[2px] scale-110 opacity-60" : "blur-0 scale-100 opacity-100"
            }`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 animate-pulse">
            <div className="w-4 h-4 rounded-full border border-primary/20 border-t-primary animate-spin mb-0.5" />
            <span className="text-[8px] font-black text-primary">
              {lastUploadProgress}%
            </span>
          </div>
        )}
        {!uploading && badge}
      </>
    );
  } else {
    triggerContent = (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-white/40 group-hover:text-primary transition-colors"
      >
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="2"
          ry="2"
        />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    );
  }

  const triggerTitle = hasSelection
    ? count > 1
      ? `${count}/${maxImages} 张已选 - 点击管理`
      : isMulti
        ? `已选 1 张 - 点击继续添加（最多 ${maxImages} 张）`
        : "参考图"
    : isMulti
      ? `最多可添加 ${maxImages} 张`
      : "参考图";

  return (
    <div className="relative">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={isMulti}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        title={triggerTitle}
        onClick={(e) => {
          e.stopPropagation();
          setPanelOpen((o) => !o);
        }}
        className={`w-10 h-10 shrink-0 rounded-full border transition-all flex items-center justify-center relative overflow-hidden mt-1.5 bg-white/5 hover:bg-white/10 group ${
          hasSelection
            ? "border-primary/60 hover:border-primary/40"
            : "border-white/10 hover:border-primary/40"
        }`}
      >
        {triggerContent}
      </button>

      {/* Panel */}
      {panelOpen && (
        <div
          ref={panelRef}
          onClick={(e) => e.stopPropagation()}
          className="absolute z-50 bottom-[calc(100%+8px)] left-0 bg-[#111] rounded-xl p-3 shadow-4xl border border-white/10 w-96"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-1 pb-3 mb-2 border-b border-white/5">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-secondary">
                参考图集
              </span>
              {isMulti && (
                <span className="text-[9px] text-muted">
                  最多可选 {maxImages} 张
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isMulti && hasSelection && (
                <button
                  type="button"
                  onClick={handleDone}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary text-black rounded-xl text-xs font-black transition-all hover:scale-105"
                >
                  ✓ 完成（{count}）
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isMulti && count >= maxImages) {
                    alert(`最多只能添加 ${maxImages} 张参考图。`);
                    return;
                  }
                  setPanelOpen(false);
                  fileInputRef.current?.click();
                }}
                disabled={isMulti && count >= maxImages}
                className={`flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-xs font-bold transition-all border border-primary/20 ${
                  isMulti && count >= maxImages ? "cursor-not-allowed opacity-45" : ""
                }`}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {isMulti ? "上传文件" : "重新上传"}
              </button>
            </div>
          </div>

          {/* Grid or empty state */}
          {uploadHistory.length === 0 ? (
            <div className="py-6 flex flex-col items-center gap-2 opacity-40">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-secondary"
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="text-xs text-secondary">暂无上传内容</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto custom-scrollbar pr-0.5">
              {uploadHistory.map((entry) => {
                const selIdx = selectedEntries.findIndex(
                  (e) => e.url === entry.url,
                );
                const isSelected = selIdx !== -1;
                const atMax =
                  isMulti && !isSelected && selectedEntries.length >= maxImages;

                return (
                  <div
                    key={entry.id}
                    title={entry.name}
                    onClick={() => entry.url && handleCellClick(entry)}
                    className={`relative rounded-xl overflow-hidden border-2 cursor-pointer group/cell aspect-square transition-all ${
                      isSelected
                        ? "border-primary shadow-glow"
                        : "border-white/10 hover:border-white/30"
                    } ${atMax ? "opacity-40 cursor-not-allowed" : ""} ${!entry.url ? "cursor-wait" : ""}`}
                  >
                    {entry.url ? (
                      <img
                        src={entry.url}
                        alt={entry.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex flex-col items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin mb-1" />
                        <span className="text-[10px] font-black text-primary">
                          {entry.progress}%
                        </span>
                      </div>
                    )}

                    {/* Hover overlay with delete */}
                    {entry.url && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/cell:opacity-100 transition-opacity flex items-end justify-end p-1">
                        <button
                          type="button"
                          title="从历史中移除"
                          onClick={(e) => handleRemoveFromHistory(e, entry)}
                          className="w-5 h-5 bg-red-500/80 hover:bg-red-500 rounded-md flex items-center justify-center transition-colors"
                        >
                          <svg
                            width="8"
                            height="8"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="3"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {/* Selection badge */}
                    {isSelected && (
                      <div className="absolute top-1 left-1 min-w-[20px] h-5 bg-primary rounded-full flex items-center justify-center px-1">
                        {isMulti ? (
                          <span className="text-[10px] font-black text-black">
                            {selIdx + 1}
                          </span>
                        ) : (
                          <svg
                            width="9"
                            height="9"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="black"
                            strokeWidth="4"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom bar for multi-select */}
          {isMulti && hasSelection && (
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-secondary">
                已选 {count}/{maxImages}
              </span>
              <button
                type="button"
                onClick={handleDone}
                className="px-4 py-1.5 bg-primary text-black rounded-xl text-xs font-black transition-all hover:scale-105"
              >
                使用所选
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ModelDropdown ────────────────────────────────────────────────────────────

function ModelDropdown({ models, selectedModel, onSelect, onClose }) {
  const [search, setSearch] = useState("");

  const filtered = models.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-2 h-full max-h-[60vh]">
      <div className="border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2.5 border border-white/5 focus-within:border-primary/50 transition-colors">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-muted"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="搜索模型..."
            value={search}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none text-xs text-white focus:ring-0 w-full p-0 focus:outline-none"
          />
        </div>
      </div>
      <div className="text-xs font-medium text-secondary py-2 shrink-0">
        可用模型
      </div>
      <div className="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-1 pb-2">
        {filtered.map((m) => {
          const localInfo = isLocalStudioModel(m) ? m.localRuntime : null;
          return (
            <div
              key={m.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(m);
                onClose();
              }}
              className={`flex items-center justify-between p-3.5 hover:bg-white/5 rounded-lg cursor-pointer transition-all border border-transparent hover:border-white/5 ${
                selectedModel === m.id ? "bg-white/5 border-white/5" : ""
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-10 h-10 ${
                    localInfo
                      ? "bg-emerald-500/10 text-emerald-300"
                      : m.family === "kontext"
                        ? "bg-blue-500/10 text-blue-400"
                        : m.family === "effects"
                          ? "bg-purple-500/10 text-purple-400"
                          : "bg-primary/10 text-primary"
                  } border border-white/5 rounded-full flex items-center justify-center font-bold text-xs shadow-inner uppercase`}
                >
                  {m.name.charAt(0)}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-white tracking-tight">
                    {m.name}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="w-fit rounded border border-white/[0.06] bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-bold text-white/45">
                      {localInfo ? "本地文生图" : `图生图 ${m.maxImages || 1} 张`}
                    </span>
                    {localInfo && (
                      <span className={`w-fit rounded border px-1.5 py-0.5 text-[10px] font-black ${
                        localInfo.ready === false
                          ? "border-yellow-300/25 bg-yellow-300/10 text-yellow-100"
                          : "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                      }`}>
                        {localInfo.ready === false ? "需配置" : "本地"}
                      </span>
                    )}
                    {m.trustedForSeedance && (
                      <span className="w-fit rounded border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[10px] font-black text-primary">
                        Seedance 可信
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {selectedModel === m.id && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#d9ff00"
                  strokeWidth="4"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SimpleDropdown ───────────────────────────────────────────────────────────

function SimpleDropdown({ title, options, selected, onSelect, onClose }) {
  return (
    <>
      <div className="text-xs font-medium text-muted pb-2 border-b border-white/5 mb-2">
        {title}
      </div>
      <div className="flex flex-col gap-1">
        {options.map((opt) => (
          <div
            key={opt}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(opt);
              onClose();
            }}
            className="flex items-center justify-between p-2 hover:bg-white/5 rounded-md cursor-pointer transition-all group"
          >
            <span className="text-xs font-bold text-white opacity-80 group-hover:opacity-100">
              {opt}
            </span>
            {selected === opt && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#d9ff00"
                strokeWidth="4"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ImageStudio({
  apiKey,
  apiConfig,
  onGenerationComplete,
  historyItems,
  droppedFiles,
  onFilesHandled,
  onMissingApiKey,
  localRuntime,
}) {
  const PERSIST_KEY = "hg_image_studio_persistent";
  const normalizedApiConfig = useMemo(() => normalizeApiConfig(apiConfig), [apiConfig]);
  const seedanceArkApiConfig = useMemo(
    () =>
      normalizeApiConfig({
        ...normalizedApiConfig,
        activeProviderId: "seedance-ark",
        providerOrder: normalizedApiConfig.providerOrder?.includes("seedance-ark")
          ? normalizedApiConfig.providerOrder
          : ["seedance-ark", ...(normalizedApiConfig.providerOrder || [])],
        providers: {
          ...normalizedApiConfig.providers,
          "seedance-ark": {
            ...(normalizedApiConfig.providers?.["seedance-ark"] || {}),
            id: "seedance-ark",
            enabled: true,
          },
        },
      }),
    [normalizedApiConfig],
  );
  const yunwuApiConfig = useMemo(
    () =>
      normalizeApiConfig({
        ...normalizedApiConfig,
        activeProviderId: "yunwu",
        providerOrder: normalizedApiConfig.providerOrder?.includes("yunwu")
          ? normalizedApiConfig.providerOrder
          : ["yunwu", ...(normalizedApiConfig.providerOrder || [])],
        providers: {
          ...normalizedApiConfig.providers,
          yunwu: {
            ...(normalizedApiConfig.providers?.yunwu || {}),
            id: "yunwu",
            enabled: true,
            baseUrl: normalizedApiConfig.providers?.yunwu?.baseUrl || "https://yunwu.ai/v1",
          },
        },
      }),
    [normalizedApiConfig],
  );
  const activeProvider = apiConfig ? getActiveProvider(normalizedApiConfig) : null;
  const hasApiConnection = apiConfig ? isProviderReady(activeProvider) : Boolean(apiKey);
  const activeImageModelWhitelist = useMemo(
    () => (apiConfig ? getProviderModelWhitelist(normalizedApiConfig, activeProvider?.id) : []),
    [apiConfig, normalizedApiConfig, activeProvider?.id],
  );
  const [localModelCatalog, setLocalModelCatalog] = useState({ image: [], videoT2V: [], videoI2V: [], warnings: [] });

  useEffect(() => {
    let cancelled = false;
    loadLocalRuntimeModelCatalog(localRuntime)
      .then((catalog) => {
        if (!cancelled) setLocalModelCatalog(catalog);
      })
      .catch((error) => {
        console.warn("[ImageStudio] Failed to load local model catalog:", error);
        if (!cancelled) setLocalModelCatalog({ image: [], videoT2V: [], videoI2V: [], warnings: [error?.message || "本地模型目录读取失败"] });
      });
    return () => {
      cancelled = true;
    };
  }, [localRuntime]);

  const remoteImageModels = useMemo(
    () => filterImageModelsByWhitelist(imageT2iModels, activeImageModelWhitelist),
    [activeImageModelWhitelist],
  );
  const currentT2IModels = useMemo(
    () => [...remoteImageModels, ...(localModelCatalog.image || [])],
    [localModelCatalog.image, remoteImageModels],
  );
  const modelDropdownModels = currentT2IModels;

  // ── Model / mode state ──────────────────────────────────────────────────
  const [imageMode, setImageMode] = useState(false); // false=t2i, true=i2i
  const [selectedModelId, setSelectedModelId] = useState(defaultT2IModel.id);
  const [selectedModelName, setSelectedModelName] = useState(defaultT2IModel.name);
  const [selectedAr, setSelectedAr] = useState(
    defaultT2IModel.inputs?.aspect_ratio?.default || "1:1",
  );
  const [selectedQuality, setSelectedQuality] = useState(() => {
    const resolutions = getImageResolutions(defaultT2IModel.id, false);
    return resolutions[0] || null;
  });
  const [maxImages, setMaxImages] = useState(() => getImageMaxImages(defaultT2IModel.id));

  // ── Prompt / upload state ───────────────────────────────────────────────
  const [prompt, setPrompt] = useState("");
  const [uploadedImageUrls, setUploadedImageUrls] = useState([]);

  // ── UI state ────────────────────────────────────────────────────────────
  const [dropdownOpen, setDropdownOpen] = useState(null); // 'model' | 'ar' | 'quality' | null
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [fullscreenUrl, setFullscreenUrl] = useState(null);
  const [copiedUrlKey, setCopiedUrlKey] = useState(null);
  const [showReferenceGallery, setShowReferenceGallery] = useState(false);
  const [imageReferenceGalleryTab, setImageReferenceGalleryTab] = useState("trusted");

  // ── Canvas / history state ──────────────────────────────────────────────
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [activeHistoryIdx, setActiveHistoryIdx] = useState(0);
  const [batchSize, setBatchSize] = useState(1);
  const [localHistory, setLocalHistory] = useState([]); // [{id,url,prompt,model,aspect_ratio,timestamp}]

  // Use prop history if provided, otherwise local
  const history = historyItems ?? localHistory;
  const canManageHistory = !historyItems;
  const trustedHistoryCount = useMemo(
    () => history.filter((entry) => entry?.trustedForSeedance).length,
    [history],
  );

  // ── Refs ────────────────────────────────────────────────────────────────
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);

  const getAvailableImageModel = useCallback(
    (modelId) => currentT2IModels.find((model) => model.id === modelId),
    [currentT2IModels],
  );

  const getAvailableImageAspectRatios = useCallback(
    (modelId, mode) => {
      const model = getAvailableImageModel(modelId);
      if (model?.inputs?.aspect_ratio?.enum) return model.inputs.aspect_ratio.enum;
      return getImageAspectRatios(modelId, mode);
    },
    [getAvailableImageModel],
  );

  const getAvailableImageResolutions = useCallback(
    (modelId, mode) => {
      const model = getAvailableImageModel(modelId);
      if (model?.inputs?.resolution?.enum) return model.inputs.resolution.enum;
      if (model?.inputs?.quality?.enum) return model.inputs.quality.enum;
      return getImageResolutions(modelId, mode);
    },
    [getAvailableImageModel],
  );

  const getAvailableImageQualityField = useCallback(
    (modelId, mode) => {
      const model = getAvailableImageModel(modelId);
      if (model?.inputs?.resolution) return "resolution";
      if (model?.inputs?.quality) return "quality";
      return getImageQualityField(modelId, mode);
    },
    [getAvailableImageModel],
  );

  const getAvailableImageMaxImages = useCallback(
    (modelId) => {
      const model = getAvailableImageModel(modelId);
      return model?.maxImages || getImageMaxImages(modelId);
    },
    [getAvailableImageModel],
  );

  // ── Close dropdown on outside click ─────────────────────────────────────
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(null);
      }
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [dropdownOpen]);

  // ── Persistence: Load ────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PERSIST_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const restoredModelId = normalizeStoredImageModelId(data.selectedModelId || defaultT2IModel.id);
        const restoredModel = getYunwuImageModelById(restoredModelId) || defaultT2IModel;
        const referenceLimit = getAvailableImageMaxImages(restoredModelId);
        if (data.imageMode !== undefined) setImageMode(data.imageMode);
        setSelectedModelId(restoredModelId);
        setSelectedModelName(restoredModel.name);
        if (data.selectedAr) setSelectedAr(data.selectedAr);
        if (data.selectedQuality) setSelectedQuality(data.selectedQuality);
        setMaxImages(referenceLimit);
        if (data.prompt) setPrompt(data.prompt);
        if (data.uploadedImageUrls) {
          setUploadedImageUrls(data.uploadedImageUrls.filter(Boolean).slice(0, referenceLimit));
        }
        if (data.batchSize) setBatchSize(data.batchSize);
        if (data.localHistory) setLocalHistory(data.localHistory);
      }
    } catch (err) {
      console.warn("Failed to load ImageStudio persistence:", err);
    }
  }, []);

  // ── Adjust height on load ────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      handleTextareaInput();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // ── Persistence: Save ────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const state = {
          imageMode,
          selectedModelId,
          selectedModelName,
          selectedAr,
          selectedQuality,
          maxImages,
          prompt,
          uploadedImageUrls,
          batchSize,
          localHistory,
        };
        localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
        window.dispatchEvent(new Event("hg-task-center-refresh"));
      } catch (err) {
        console.warn("Failed to save ImageStudio persistence:", err);
      }
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [
    imageMode,
    selectedModelId,
    selectedModelName,
    selectedAr,
    selectedQuality,
    maxImages,
    prompt,
    uploadedImageUrls,
    batchSize,
    localHistory,
  ]);

  // ── Derived: current model lists & helpers ───────────────────────────────
  const currentModels = currentT2IModels;
  const currentAspectRatios = getAvailableImageAspectRatios(selectedModelId, imageMode);
  const currentResolutions = getAvailableImageResolutions(selectedModelId, imageMode);
  const currentQualityField = getAvailableImageQualityField(selectedModelId, imageMode);
  const showQualityBtn = currentResolutions.length > 0;
  const currentReferenceLimit = getAvailableImageMaxImages(selectedModelId);
  const imageReferenceGalleryItems = useMemo(() => {
    const byUrl = new Map();
    const addEntry = (entry, fallbackName, source = "history") => {
      const url = normalizeImageGalleryUrl(entry?.url || entry?.image_url || entry);
      if (!url) return;
      const next = {
        id: entry?.id || url,
        url,
        name: entry?.name || fallbackName || "图库图片",
        prompt: entry?.prompt || "",
        model: entry?.model || "",
        providerId: entry?.providerId || "",
        timestamp: entry?.timestamp || entry?.uploadedAt || entry?.createdAt || "",
        uploadedAt: entry?.uploadedAt || entry?.timestamp || entry?.createdAt || "",
        trustedForSeedance: Boolean(entry?.trustedForSeedance),
        source,
        referenceImages: Array.isArray(entry?.referenceImages) ? entry.referenceImages : [],
      };
      const existing = byUrl.get(url);
      if (existing) {
        byUrl.set(url, {
          ...existing,
          name: existing.name || next.name,
          prompt: existing.prompt || next.prompt,
          model: existing.model || next.model,
          providerId: existing.providerId || next.providerId,
          timestamp: existing.timestamp || next.timestamp,
          uploadedAt: existing.uploadedAt || next.uploadedAt,
          trustedForSeedance: existing.trustedForSeedance || next.trustedForSeedance,
          source: existing.source === next.source ? existing.source : `${existing.source},${next.source}`,
          referenceImages: existing.referenceImages?.length ? existing.referenceImages : next.referenceImages,
        });
        return;
      }
      byUrl.set(url, next);
    };

    history.forEach((entry, index) => {
      addEntry(entry, `历史图片 ${index + 1}`, "history");
    });
    uploadedImageUrls.forEach((url, index) => {
      addEntry({ url, name: `已选参考图 ${index + 1}`, model: selectedModelName }, `已选参考图 ${index + 1}`, "selected");
    });

    return Array.from(byUrl.values()).slice(0, 80);
  }, [history, selectedModelName, uploadedImageUrls]);
  const recentImageReferenceUrlSet = useMemo(() => {
    const urls = new Set();
    const addUrl = (value) => {
      const url = normalizeImageGalleryUrl(value?.url || value?.image_url || value);
      if (url) urls.add(url);
    };

    uploadedImageUrls.forEach(addUrl);
    history.slice(0, 12).forEach((entry) => {
      addUrl(entry);
      if (Array.isArray(entry?.referenceImages)) {
        entry.referenceImages.forEach(addUrl);
      }
    });
    return urls;
  }, [history, uploadedImageUrls]);
  const trustedImageReferenceItems = useMemo(
    () => imageReferenceGalleryItems.filter(isTrustedImageGalleryEntry),
    [imageReferenceGalleryItems],
  );
  const otherImageReferenceItems = useMemo(
    () => imageReferenceGalleryItems.filter((entry) => !isTrustedImageGalleryEntry(entry)),
    [imageReferenceGalleryItems],
  );
  const recentImageReferenceItems = useMemo(
    () => imageReferenceGalleryItems.filter((entry) => recentImageReferenceUrlSet.has(entry.url)),
    [imageReferenceGalleryItems, recentImageReferenceUrlSet],
  );
  const imageReferenceGalleryTabs = useMemo(
    () => [
      { id: "trusted", label: "可信仿真人", count: trustedImageReferenceItems.length, icon: UserRound },
      { id: "other", label: "其他", count: otherImageReferenceItems.length, icon: Boxes },
      { id: "recent", label: "最近使用", count: recentImageReferenceItems.length, icon: Images },
    ],
    [otherImageReferenceItems.length, recentImageReferenceItems.length, trustedImageReferenceItems.length],
  );
  const displayedImageReferenceGalleryItems = useMemo(() => {
    if (imageReferenceGalleryTab === "other") return otherImageReferenceItems;
    if (imageReferenceGalleryTab === "recent") return recentImageReferenceItems;
    return trustedImageReferenceItems;
  }, [
    imageReferenceGalleryTab,
    otherImageReferenceItems,
    recentImageReferenceItems,
    trustedImageReferenceItems,
  ]);
  const selectedReferenceUrlSet = useMemo(
    () => new Set(uploadedImageUrls.filter(Boolean)),
    [uploadedImageUrls],
  );

  const handleOpenReferenceGallery = useCallback(() => {
    if (trustedImageReferenceItems.length > 0) {
      setImageReferenceGalleryTab("trusted");
    } else if (otherImageReferenceItems.length > 0) {
      setImageReferenceGalleryTab("other");
    } else if (recentImageReferenceItems.length > 0) {
      setImageReferenceGalleryTab("recent");
    }
    setShowReferenceGallery(true);
  }, [otherImageReferenceItems.length, recentImageReferenceItems.length, trustedImageReferenceItems.length]);

  const handleReferenceGallerySelect = useCallback(
    (entry) => {
      const url = String(entry?.url || "").trim();
      if (!url) return;
      setImageMode(true);
      setMaxImages(currentReferenceLimit);
      setUploadedImageUrls((prev) => {
        if (prev.includes(url)) return prev.filter((item) => item !== url);
        if (prev.length >= currentReferenceLimit) {
          alert(`当前模型最多支持 ${currentReferenceLimit} 张参考图。`);
          return prev;
        }
        return [...prev, url].slice(0, currentReferenceLimit);
      });
    },
    [currentReferenceLimit],
  );

  // ── Textarea auto-resize ─────────────────────────────────────────────────
  const handleTextareaInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxHeight = window.innerWidth < 768 ? 150 : 250;
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
  };

  // ── Upload picker callbacks ──────────────────────────────────────────────
  const handleUploadSelect = useCallback(
    ({ url, urls }) => {
      const newUrls = (urls || [url]).filter(Boolean).slice(0, getAvailableImageMaxImages(selectedModelId));
      setUploadedImageUrls(newUrls);
      setImageMode(true);
      setMaxImages(getAvailableImageMaxImages(selectedModelId));
    },
    [getAvailableImageMaxImages, selectedModelId],
  );

  const handleUploadClear = useCallback(() => {
    setUploadedImageUrls([]);
  }, []);

  const processDroppedImages = useCallback(
    async (files) => {
      const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
      const referenceLimit = getAvailableImageMaxImages(selectedModelId);
      const tooLarge = files.filter((f) => f.size > MAX_IMAGE_SIZE);
      if (tooLarge.length > 0) {
        alert(
          `以下图片过大（最大 10MB）：${tooLarge.map((f) => f.name).join(", ")}`
        );
        return;
      }

      setGenerating(true); // Show as generating/busy
      try {
        const toUpload =
          referenceLimit === 1 ? files.slice(0, 1) : files.slice(0, referenceLimit);
        const urls = await Promise.all(
          toUpload.map(async (file) => {
            try {
              return await uploadFile(apiKey, file);
            } catch (err) {
              console.error(
                "[ImageStudio] Drop upload failed for",
                file.name,
                err
              );
              throw err;
            }
          })
        );

        handleUploadSelect({ urls });
      } catch (err) {
        alert(`图片上传失败：${err.message}`);
      } finally {
        setGenerating(false);
      }
    },
    [apiKey, getAvailableImageMaxImages, handleUploadSelect, selectedModelId],
  );

  // ── Handle Dropped Files ────────────────────────────────────────────────
  useEffect(() => {
    if (droppedFiles && droppedFiles.length > 0) {
      const imageFiles = droppedFiles.filter(f => f.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        processDroppedImages(imageFiles);
      }
      onFilesHandled?.();
    }
  }, [droppedFiles, onFilesHandled, processDroppedImages]);

  const handleModeSelect = useCallback(
    (modeId) => {
      const nextImageMode = modeId === "i2i";
      setImageMode(nextImageMode);
      setMaxImages(getAvailableImageMaxImages(selectedModelId));
      if (!nextImageMode) setUploadedImageUrls([]);
      setDropdownOpen(null);
    },
    [getAvailableImageMaxImages, selectedModelId],
  );

  // ── Model selection ──────────────────────────────────────────────────────
  const handleModelSelect = (m) => {
    const nextImageMode = isLocalStudioModel(m) ? false : imageMode;
    const ars = getAvailableImageAspectRatios(m.id, nextImageMode);
    const resolutions = getAvailableImageResolutions(m.id, nextImageMode);
    const referenceLimit = getAvailableImageMaxImages(m.id);

    setSelectedModelId(m.id);
    setSelectedModelName(m.name);
    setImageMode(nextImageMode);
    setSelectedAr(ars[0] || "1:1");
    setSelectedQuality(resolutions[0] || null);
    setMaxImages(referenceLimit);
    setUploadedImageUrls((prev) => (isLocalStudioModel(m) ? [] : prev.slice(0, referenceLimit)));
  };

  useEffect(() => {
    const supportedModels = currentModels;
    if (!supportedModels.length) return;
    if (supportedModels.some((model) => model.id === selectedModelId)) return;

    const fallbackModel = supportedModels[0];
    const ars = getAvailableImageAspectRatios(fallbackModel.id, imageMode);
    const resolutions = getAvailableImageResolutions(fallbackModel.id, imageMode);

    setSelectedModelId(fallbackModel.id);
    setSelectedModelName(fallbackModel.name);
    setSelectedAr(ars[0] || "1:1");
    setSelectedQuality(resolutions[0] || null);
    setMaxImages(getAvailableImageMaxImages(fallbackModel.id));
  }, [currentModels, getAvailableImageAspectRatios, getAvailableImageMaxImages, getAvailableImageResolutions, imageMode, selectedModelId]);

  // ── History helpers ──────────────────────────────────────────────────────
  const addToHistory = useCallback(
    (entry) => {
      if (!historyItems) {
        setLocalHistory((prev) => [entry, ...prev.slice(0, 49)]);
      }
      setActiveHistoryIdx(0);
      setCurrentImageUrl(entry.url);
    },
    [historyItems],
  );

  const getHistoryEntryKey = useCallback((entry, idx) => {
    return entry?.id || entry?.url || `${entry?.timestamp || "history"}-${idx}`;
  }, []);

  const handleCopyImageUrl = useCallback(
    async (entry, idx) => {
      if (!entry?.url) return;
      const copied = await copyTextToClipboard(entry.url);
      if (!copied) {
        setGenerateError("无法复制 URL");
        setTimeout(() => setGenerateError(null), 2500);
        return;
      }

      const key = getHistoryEntryKey(entry, idx);
      setCopiedUrlKey(key);
      setTimeout(() => {
        setCopiedUrlKey((current) => (current === key ? null : current));
      }, 1600);
    },
    [getHistoryEntryKey],
  );

  const handleOpenImageUrl = useCallback((entry) => {
    if (!entry?.url) return;
    window.open(entry.url, "_blank", "noopener,noreferrer");
  }, []);

  const handleDeleteHistoryEntry = useCallback(
    (entry, idx) => {
      if (!canManageHistory || !entry) return;
      const key = getHistoryEntryKey(entry, idx);
      const nextHistory = localHistory.filter((item, itemIdx) => getHistoryEntryKey(item, itemIdx) !== key);
      setLocalHistory(nextHistory);

      if (currentImageUrl === entry.url) {
        setCurrentImageUrl(nextHistory[0]?.url || null);
      }
      if (fullscreenUrl === entry.url) {
        setFullscreenUrl(null);
      }
      setActiveHistoryIdx(0);
    },
    [canManageHistory, currentImageUrl, fullscreenUrl, getHistoryEntryKey, localHistory],
  );

  const handleClearHistory = useCallback(() => {
    if (!canManageHistory || localHistory.length === 0) return;
    const confirmed = window.confirm("清空全部图片历史？");
    if (!confirmed) return;

    setLocalHistory([]);
    setCurrentImageUrl(null);
    setFullscreenUrl(null);
    setActiveHistoryIdx(0);
  }, [canManageHistory, localHistory.length]);

  // ── View state ─────────────────────────────────────

  const resetToPrompt = () => {
    setCurrentImageUrl(null);
    setPrompt("");
    setUploadedImageUrls([]);
    setImageMode(false);
    const firstT2I = currentT2IModels[0] || defaultT2IModel;
    const ars = getAvailableImageAspectRatios(firstT2I.id, false);
    const resolutions = getAvailableImageResolutions(firstT2I.id, false);
    setSelectedModelId(firstT2I.id);
    setSelectedModelName(firstT2I.name);
    setSelectedAr(ars[0] || "1:1");
    setSelectedQuality(resolutions[0] || null);
    setMaxImages(getAvailableImageMaxImages(firstT2I.id));
  };

  // ── Generation ───────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (generating) return;

    const selectedCatalogModel = currentT2IModels.find((model) => model.id === selectedModelId);
    const usesLocalRuntimeModel = isLocalStudioModel(selectedCatalogModel);
    const usesSeedreamLite = isSeedreamLiteModel(selectedModelId);
    const selectedLocalModel = getYunwuImageModelById(selectedModelId);
    const usesManagedImageProvider = usesSeedreamLite || selectedLocalModel?.providerId === "yunwu" || usesLocalRuntimeModel;

    if (!hasApiConnection && !usesManagedImageProvider) {
      setGenerateError(activeProvider?.requiresKey ? "请先在 API 管理中保存当前通道密钥。" : "请先在 API 管理中确认当前通道地址。");
      onMissingApiKey?.();
      return;
    }

    if (usesLocalRuntimeModel && selectedCatalogModel.localRuntime.ready === false) {
      setGenerateError(selectedCatalogModel.localRuntime.unavailableReason || "本地模型尚未就绪。");
      setTimeout(() => setGenerateError(null), 8000);
      return;
    }

    if (imageMode) {
      if (usesLocalRuntimeModel) {
        setGenerateError("本地图片模型当前仅支持文生图，请切回文生图后生成。");
        setTimeout(() => setGenerateError(null), 8000);
        return;
      }
      if (uploadedImageUrls.length === 0) {
        alert("请先上传参考图。");
        return;
      }
    } else {
      if (!prompt.trim()) {
        alert("请输入提示词再开始生成。");
        return;
      }
    }

    setGenerating(true);
    setGenerateError(null);

    try {
      const results = await Promise.all(
        Array.from({ length: batchSize }).map(async () => {
          if (usesLocalRuntimeModel) {
            const runtimeProvider = selectedCatalogModel.localRuntime.provider;
            const generateLocal =
              runtimeProvider === "wan2gp"
                ? localRuntime?.wan2gp?.generate
                : localRuntime?.sdCpp?.generate;

            if (typeof generateLocal !== "function") {
              throw new Error("本地生成运行时不可用，请检查桌面桥接。");
            }

            const genParams = {
              model: selectedCatalogModel.localRuntime.modelId,
              prompt: prompt.trim(),
              aspect_ratio: selectedAr,
            };
            if (selectedCatalogModel.defaultSteps) genParams.steps = selectedCatalogModel.defaultSteps;
            if (selectedCatalogModel.defaultGuidance) genParams.guidance_scale = selectedCatalogModel.defaultGuidance;
            return await generateLocal(genParams);
          }

          if (imageMode) {
            const selectedReferenceUrls = uploadedImageUrls.slice(0, currentReferenceLimit);
            const genParams = {
              model: selectedModelId,
              images_list: selectedReferenceUrls,
              image_url: selectedReferenceUrls[0],
              aspect_ratio: selectedAr,
            };
            if (prompt.trim()) genParams.prompt = prompt.trim();
            if (currentQualityField && selectedQuality) {
              genParams[currentQualityField] = selectedQuality;
            }
            return await generateI2I(usesSeedreamLite ? seedanceArkApiConfig : yunwuApiConfig, genParams);
          } else {
            const genParams = {
              model: selectedModelId,
              prompt: prompt.trim(),
              aspect_ratio: selectedAr,
            };
            if (currentQualityField && selectedQuality) {
              genParams[currentQualityField] = selectedQuality;
            }
            return await generateImage(usesSeedreamLite ? seedanceArkApiConfig : yunwuApiConfig, genParams);
          }
        })
      );

      results.forEach((res) => {
        if (res && res.url) {
          const trustedForSeedance = !usesLocalRuntimeModel && isSeedanceTrustedImageModel(selectedModelId);
          const providerId = usesLocalRuntimeModel
            ? selectedCatalogModel.providerId || selectedCatalogModel.localRuntime.provider
            : trustedForSeedance ? "seedance-ark" : "yunwu";
          const generatedAt = new Date();
          const selectedReferenceUrls = imageMode ? uploadedImageUrls.slice(0, currentReferenceLimit) : [];
          const entry = {
            id: res.id || Math.random().toString(36).substring(7),
            url: res.url,
            prompt: prompt.trim(),
            model: selectedModelId,
            mode: usesLocalRuntimeModel ? "local-t2i" : imageMode ? "i2i" : "t2i",
            referenceImages: selectedReferenceUrls,
            referenceLimit: imageMode ? currentReferenceLimit : undefined,
            providerId,
            providerModelId: usesLocalRuntimeModel ? selectedCatalogModel.localRuntime.modelId : undefined,
            localRuntimeProvider: usesLocalRuntimeModel ? selectedCatalogModel.localRuntime.provider : undefined,
            seed: res.seed,
            trustedForSeedance,
            trustedUntil: trustedForSeedance
              ? new Date(generatedAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
              : undefined,
            aspect_ratio: selectedAr,
            timestamp: generatedAt.toISOString(),
          };
          addToHistory(entry);
          onGenerationComplete?.({
            url: res.url,
            model: selectedModelId,
            prompt: prompt.trim(),
            type: "image",
            mode: entry.mode,
            referenceImages: entry.referenceImages,
            referenceLimit: entry.referenceLimit,
            providerId,
            providerModelId: entry.providerModelId,
            localRuntimeProvider: entry.localRuntimeProvider,
            seed: entry.seed,
            trustedForSeedance: entry.trustedForSeedance,
            trustedUntil: entry.trustedUntil,
          });
        }
      });
    } catch (e) {
      console.info("[ImageStudio] 生成失败:", e.message);
      setGenerateError(e.message.slice(0, 120));
      setTimeout(() => setGenerateError(null), 8000);
    } finally {
      setGenerating(false);
    }
  };

  const placeholderText =
    uploadedImageUrls.length > 1
      ? `${uploadedImageUrls.length} 张已选 - 描述想要的变化（可选）`
      : imageMode
        ? "描述你想怎样改图（可选）"
        : "描述你想生成的画面";

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-app-bg relative p-4 md:p-6 overflow-hidden">
      
      {/* ── CENTRAL GALLERY AREA ── */}
      <div className="flex-1 w-full max-w-7xl mx-auto overflow-y-auto custom-scrollbar pb-40 lg:pb-32 px-2">
        {history.length > 0 ? (
          <div className="w-full pt-4 animate-fade-in-up">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
              <div className="flex min-w-0 items-center gap-3">
                <h2 className="text-sm font-black text-white/80">图片管理</h2>
                <span className="rounded border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[11px] font-bold text-white/45">
                  {history.length} 张
                </span>
                {trustedHistoryCount > 0 && (
                  <span className="rounded border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] font-black text-primary">
                    Seedance 可信 {trustedHistoryCount}
                  </span>
                )}
              </div>
              {canManageHistory && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-red-400/20 bg-red-500/10 px-3 text-[11px] font-black text-red-200/80 hover:border-red-300/45 hover:bg-red-500/20 hover:text-red-100 transition-colors"
                >
                  <Trash2 size={13} />
                  清空
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
              {history.map((entry, idx) => {
                const entryKey = getHistoryEntryKey(entry, idx);
                const isCopied = copiedUrlKey === entryKey;
                return (
                  <div
                    key={entryKey}
                    className="group relative flex flex-col overflow-hidden rounded-lg border border-white/10 bg-[#0a0a0a] shadow-xl transition-all duration-300 hover:border-primary/50"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-black/40">
                      <img
                        src={entry.url}
                        alt={entry.prompt?.substring(0, 30) || "生成结果图"}
                        className="h-full w-full cursor-pointer object-cover transition-transform duration-300 hover:opacity-90 group-hover:scale-[1.02]"
                        onClick={() => setFullscreenUrl(entry.url)}
                      />

                      <div className="absolute right-2 top-2 z-10 flex flex-col gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                        <button
                          type="button"
                          title="全屏"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFullscreenUrl(entry.url);
                          }}
                          className="rounded-full border border-white/10 bg-black/60 p-2 text-white backdrop-blur-md transition-all hover:bg-primary hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                          <Maximize2 size={14} strokeWidth={2.5} />
                        </button>
                        <button
                          type="button"
                          title="下载"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadImage(entry.url, `image-${entry.id || idx}.jpg`);
                          }}
                          className="rounded-full border border-white/10 bg-black/60 p-2 text-white backdrop-blur-md transition-all hover:bg-primary hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                          <Download size={14} strokeWidth={2.5} />
                        </button>
                        {canManageHistory && (
                          <button
                            type="button"
                            title="删除"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteHistoryEntry(entry, idx);
                            }}
                            className="rounded-full border border-red-400/20 bg-red-500/10 p-2 text-red-100/80 backdrop-blur-md transition-all hover:bg-red-500/20 hover:text-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/40"
                          >
                            <Trash2 size={14} strokeWidth={2.5} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-2 border-t border-white/5 bg-black/80 p-3">
                      <p className="line-clamp-3 text-xs leading-relaxed text-white/70" title={entry.prompt}>
                        {entry.prompt || "未填写提示词"}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate rounded border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                          {entry.model?.replace("-", " ") || "image"}
                        </span>
                        <span className="shrink-0 text-[10px] text-white/40">{entry.aspect_ratio || "—"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          type="button"
                          title={entry.url}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyImageUrl(entry, idx);
                          }}
                          className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-[10px] font-black transition-colors ${
                            isCopied
                              ? "border-primary/45 bg-primary/15 text-primary"
                              : "border-white/[0.06] bg-white/[0.03] text-white/55 hover:border-primary/35 hover:text-primary"
                          }`}
                        >
                          {isCopied ? <Check size={13} /> : <Copy size={13} />}
                          <span className="truncate">{isCopied ? "已复制 URL" : "复制 URL"}</span>
                        </button>
                        <button
                          type="button"
                          title="打开原始 URL"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenImageUrl(entry);
                          }}
                          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.03] text-white/55 transition-colors hover:border-primary/35 hover:text-primary"
                        >
                          <ExternalLink size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="min-h-[50vh]" aria-hidden="true" />
        )}
      </div>

      {/* ── BOTTOM PROMPT BAR ── */}
      <div 
        className="absolute bottom-4 w-full max-w-[95%] lg:max-w-4xl z-40 animate-fade-in-up" 
        style={{ animationDelay: "0.2s" }}
      >
        <div className="w-full bg-[#0a0a0a]/80 backdrop-blur-3xl rounded-md border border-white/10 p-4 flex flex-col gap-2 shadow-2xl">
          {/* Top row: prompt */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex flex-col gap-2">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onInput={handleTextareaInput}
                placeholder={placeholderText}
                rows={1}
                className="w-full bg-transparent border-none text-white text-sm placeholder:text-white/20 focus:outline-none resize-none pt-1 leading-relaxed min-h-[40px] max-h-[150px] md:max-h-[250px] overflow-y-auto custom-scrollbar"
              />
            </div>
          </div>

          {/* Mode row: mirrors VideoStudio's compact mode switch */}
          <div className="flex min-w-0 flex-col gap-2 pt-2 border-t border-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 gap-1.5 overflow-x-auto custom-scrollbar pb-0.5">
              {IMAGE_CREATION_MODES.map((mode) => {
                const isActive = (mode.id === "i2i") === imageMode;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => handleModeSelect(mode.id)}
                    className={`min-w-[108px] rounded-md border px-3 py-2 text-left transition-all ${
                      isActive
                        ? "border-primary/80 bg-primary/12 text-primary"
                        : "border-white/[0.05] bg-white/[0.03] text-white/60 hover:border-white/15 hover:text-white/85"
                    }`}
                  >
                    <span className="block text-xs font-black leading-none">{mode.label}</span>
                    <span className="mt-1 block text-[10px] font-bold leading-none opacity-55">{mode.description}</span>
                  </button>
                );
              })}
            </div>

            {imageMode && (
              <div className="flex min-w-0 items-center gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={handleOpenReferenceGallery}
                  title="从图片图库选择参考图"
                  aria-label="从图片图库选择参考图"
                  className={`flex h-10 min-w-[58px] shrink-0 items-center justify-center gap-1.5 rounded-md border px-2 transition-all ${
                    uploadedImageUrls.length > 0
                      ? "border-primary/45 bg-primary/10 text-primary hover:bg-primary hover:text-black"
                      : "border-white/[0.06] bg-white/[0.03] text-white/55 hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  <Images size={14} />
                  <span className="text-[10px] font-black">{imageReferenceGalleryItems.length}</span>
                </button>
                <UploadButton
                  apiKey={apiKey}
                  maxImages={currentReferenceLimit}
                  onSelect={handleUploadSelect}
                  onClear={handleUploadClear}
                  initialUrls={uploadedImageUrls}
                />
                <span className="shrink-0 rounded-md border border-white/[0.05] bg-white/[0.03] px-2 py-2 text-[11px] font-black text-white/50">
                  {uploadedImageUrls.length}/{currentReferenceLimit}
                </span>
                {uploadedImageUrls.length > 0 && (
                  <button
                    type="button"
                    onClick={handleUploadClear}
                    title="清空参考图"
                    className="h-9 w-9 shrink-0 rounded-md border border-white/[0.05] bg-white/[0.03] text-white/45 hover:border-red-300/35 hover:text-red-100 transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Bottom row: controls + generate */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-white/[0.03] relative">
            {/* Left controls */}
            <div className="flex items-center gap-2 relative flex-wrap pb-1 md:pb-0">
              {/* Model button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownOpen((o) => (o === "model" ? null : "model"));
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                >
                  <div className="w-4 h-4 bg-[#d9ff00] rounded flex items-center justify-center">
                    <span className="text-[9px] font-bold text-black uppercase">G</span>
                  </div>
                  <span className="text-xs font-semibold text-white/70 group-hover:text-[#d9ff00] transition-colors">
                    {selectedModelName}
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

                {dropdownOpen === "model" && (
                  <div
                    ref={dropdownRef}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-lg p-3 shadow-2xl border border-white/[0.05] w-[calc(100vw-3rem)] max-w-xs"
                  >
                    <ModelDropdown
                      models={modelDropdownModels}
                      selectedModel={selectedModelId}
                      onSelect={handleModelSelect}
                      onClose={() => setDropdownOpen(null)}
                    />
                  </div>
                )}
              </div>

              {/* Aspect ratio button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownOpen((o) => (o === "ar" ? null : "ar"));
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40 text-white">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  </svg>
                  <span className="text-[11px] font-semibold text-white/70 group-hover:text-[#d9ff00] transition-colors">
                    {selectedAr}
                  </span>
                </button>

                {dropdownOpen === "ar" && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-md p-3 max-h-[40vh] overflow-y-auto custom-scrollbar shadow-2xl border border-white/10 min-w-[160px]"
                  >
                    <SimpleDropdown
                      title="画幅"
                      options={currentAspectRatios}
                      selected={selectedAr}
                      onSelect={(val) => setSelectedAr(val)}
                      onClose={() => setDropdownOpen(null)}
                    />
                  </div>
                )}
              </div>

              {/* Quality/resolution button */}
              {showQualityBtn && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpen((o) => (o === "quality" ? null : "quality"));
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40 text-white">
                      <path d="M6 2L3 6v15a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z" />
                    </svg>
                    <span className="text-[11px] font-semibold text-white/70 group-hover:text-[#d9ff00] transition-colors">
                      {selectedQuality || currentResolutions[0]}
                    </span>
                  </button>

                  {dropdownOpen === "quality" && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-md p-3 max-h-[40vh] overflow-y-auto custom-scrollbar shadow-2xl border border-white/[0.05] min-w-[160px]"
                    >
                      <SimpleDropdown
                      title="分辨率"
                        options={currentResolutions}
                        selected={selectedQuality}
                        onSelect={(val) => setSelectedQuality(val)}
                        onClose={() => setDropdownOpen(null)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Batch size selector */}
              <div className="flex items-center gap-1 bg-white/[0.03] rounded-md p-1 border border-white/[0.03]">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setBatchSize(num)}
                    className={`w-7 h-7 flex items-center justify-center rounded-md text-[10px] font-black transition-all ${
                      batchSize === num
                        ? "bg-[#d9ff00] text-black shadow-lg shadow-[#d9ff00]/20"
                        : "text-white/40 hover:text-white/80 hover:bg-white/5"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="bg-[#d9ff00] text-black px-4 py-2 rounded-md font-medium text-sm hover:bg-[#e5ff33] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg shadow-[#d9ff00]/10 disabled:opacity-50 disabled:cursor-not-allowed z-10"
            >
              {generating ? (
                <>
                  <span className="animate-spin inline-block text-black">◌</span>
                  生成中...
                </>
              ) : generateError ? (
                `错误：${generateError}`
              ) : (
                <>
                  <span>开始生成</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showReferenceGallery && imageMode && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-2 py-3 backdrop-blur-sm sm:px-4 sm:py-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowReferenceGallery(false);
          }}
        >
          <div className="flex h-[82vh] w-full max-w-3xl flex-col overflow-hidden rounded-md border border-white/[0.08] bg-[#080808]/95 shadow-2xl sm:h-[72vh]">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
                  <Images size={18} />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-black text-white/85">图片图库</h2>
                  <p className="truncate text-[11px] font-semibold text-white/35">
                    共 {imageReferenceGalleryItems.length} 张 · 当前 {displayedImageReferenceGalleryItems.length} 张 · 已选 {uploadedImageUrls.length}/{currentReferenceLimit}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReferenceGallery(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.03] text-white/45 transition-colors hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                title="关闭图库"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-3 py-3 sm:px-4">
              {imageReferenceGalleryTabs.map((tab) => {
                const Icon = tab.icon;
                const active = imageReferenceGalleryTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setImageReferenceGalleryTab(tab.id)}
                    className={`flex min-w-0 items-center gap-2 rounded-md border px-3 py-2 text-xs font-black transition-all ${
                      active
                        ? "border-primary/70 bg-primary text-black shadow-lg shadow-primary/10"
                        : "border-white/[0.06] bg-white/[0.03] text-white/55 hover:border-primary/35 hover:text-primary"
                    }`}
                  >
                    <Icon size={14} />
                    <span className="truncate">{tab.label}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] ${
                        active ? "bg-black/15 text-black" : "bg-white/[0.05] text-white/45"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar px-3 py-3 sm:px-4 sm:py-4">
              {displayedImageReferenceGalleryItems.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
                  {displayedImageReferenceGalleryItems.map((entry, index) => {
                    const selected = selectedReferenceUrlSet.has(entry.url);
                    const canPreview = isPreviewableImageUrl(entry.url);
                    const trusted = isTrustedImageGalleryEntry(entry);
                    const recent = recentImageReferenceUrlSet.has(entry.url);
                    const badge = imageReferenceGalleryTab === "recent" ? "最近" : trusted ? "可信" : "其他";
                    return (
                      <button
                        key={`${entry.url}-${index}`}
                        type="button"
                        onClick={() => handleReferenceGallerySelect(entry)}
                        className={`group min-w-0 overflow-hidden rounded-md border bg-white/[0.025] text-left transition-all hover:-translate-y-0.5 hover:border-primary/45 ${
                          selected ? "border-primary/70 ring-1 ring-primary/30" : "border-white/[0.07]"
                        }`}
                      >
                        <div className="relative aspect-[4/3] overflow-hidden bg-black/60">
                          {canPreview ? (
                            <img
                              src={entry.url}
                              alt=""
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-black text-primary">
                              URI
                            </div>
                          )}
                          <span
                            className={`absolute left-2 top-2 rounded px-2 py-1 text-[10px] font-black ${
                              trusted
                                ? "bg-primary text-black shadow-lg shadow-primary/20"
                                : recent
                                  ? "border border-primary/35 bg-black/75 text-primary"
                                  : "bg-black/70 text-white/60"
                            }`}
                          >
                            {badge}
                          </span>
                          {selected && (
                            <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-black shadow-lg shadow-primary/20">
                              <Check size={14} strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 p-2.5">
                          <div className="truncate text-xs font-black text-white/80">
                            {entry.name || `图库图片 ${index + 1}`}
                          </div>
                          <div className="truncate text-[10px] font-semibold text-primary/70">
                            {trusted ? "Seedream 可信产物" : entry.model || (recent ? "最近使用" : "图片历史")}
                          </div>
                          {entry.prompt && (
                            <div className="line-clamp-2 min-h-[28px] text-[10px] font-medium leading-3.5 text-white/35">
                              {entry.prompt}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-md border border-dashed border-white/[0.08] bg-white/[0.02] text-center">
                  <Images size={28} className="mb-3 text-white/25" />
                  <div className="text-sm font-black text-white/60">
                    {imageReferenceGalleryTab === "trusted"
                      ? "暂无可信仿真人素材"
                      : imageReferenceGalleryTab === "recent"
                        ? "暂无最近使用素材"
                        : "暂无其他素材"}
                  </div>
                  <div className="mt-1 text-[11px] font-semibold text-white/30">
                    生成过的图片、当前参考图和最近使用的素材会出现在这里
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3">
              <span className="text-[11px] font-semibold text-white/40">
                点击图片可加入或移出参考图队列
              </span>
              <button
                type="button"
                onClick={() => setShowReferenceGallery(false)}
                className="h-9 rounded-md border border-primary/30 bg-primary/10 px-4 text-[11px] font-black text-primary transition-colors hover:bg-primary hover:text-black"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FULLSCREEN IMAGE MODAL ── */}
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
            <X size={24} strokeWidth={2.5} />
          </button>
          <img 
            src={fullscreenUrl} 
            alt="全屏预览"
            className="max-w-[95vw] max-h-[95vh] rounded-2xl shadow-2xl object-contain animate-scale-up" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
