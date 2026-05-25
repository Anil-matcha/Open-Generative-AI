"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Images,
  Maximize2,
  Package,
  Play,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  Wand2,
  X,
} from "lucide-react";
import { generateVideo, uploadFile } from "../muapi.js";
import { normalizeApiConfig } from "../apiProviders.js";

const SCROLLBAR_STYLE = `
  .custom-scrollbar-thin::-webkit-scrollbar { width: 4px; height: 4px; }
  .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar-thin::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.12);
    border-radius: 10px;
  }
  .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background: rgba(217, 255, 0, 0.36);
  }
`;

const PERSIST_KEY = "hg_marketing_studio_persistent";
const IMAGE_STUDIO_PERSIST_KEY = "hg_image_studio_persistent";
const VIDEO_STUDIO_PERSIST_KEY = "hg_video_studio_persistent";
const MARKETING_PERSIST_VERSION = 2;
const SEEDANCE_LOCAL_ASSET_LIBRARY_KEY = "hg_seedance_local_asset_library";
const VIDEO_HISTORY_LIMIT = 160;
const ASSET_LIBRARY_LIMIT = 180;
const SEEDANCE_REFERENCE_LIMIT = 9;
const PROMPT_TEXTAREA_MAX_HEIGHT = 132;

const MARKETING_TEMPLATES = [
  {
    id: "ugc-product",
    name: "UGC 种草",
    detail: "人物 + 产品",
    prompt:
      "短视频营销片，真实 UGC 口吻，先建立生活场景，再自然展示产品，镜头轻微手持感，节奏清晰，不要字幕，不要可读文字。",
  },
  {
    id: "product-proof",
    name: "卖点证明",
    detail: "产品主导",
    prompt:
      "产品卖点展示短片，用可见动作证明核心价值，镜头从问题场景切到使用过程，再给出结果画面，质感真实，避免夸张特效。",
  },
  {
    id: "cinematic-brand",
    name: "品牌质感",
    detail: "氛围 + 质感",
    prompt:
      "品牌质感短片，电影感构图，产品与人物自然同框，光线克制，强调材质、空间和情绪，不要硬广字幕。",
  },
  {
    id: "social-hook",
    name: "开头抓眼",
    detail: "社媒开场",
    prompt:
      "社媒短视频开头片，第一秒有明确动作或表情钩子，中段展示产品细节，结尾保持可循环的动作节奏，画面真实自然。",
  },
];

const OPTIONS = {
  ratio: ["9:16", "3:4", "4:3", "16:9", "1:1"],
  res: ["720p", "1080p"],
  duration: [4, 5, 6, 7, 8, 9, 10],
  model: [
    { id: "sd-2-vip", name: "Seedance 2.0 I2V" },
    { id: "sd-2", name: "Seedance 2.0 Flash" },
  ],
};

function readJsonStorage(key, fallback = null) {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJsonStorage(key, value) {
  if (typeof localStorage === "undefined") return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`[MarketingStudio] Failed to write ${key}:`, err);
    return false;
  }
}

function safelyDecodeUrlValue(value) {
  try {
    return decodeURIComponent(String(value || ""));
  } catch {
    return String(value || "");
  }
}

function normalizeSeedanceTrustedUrl(value) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/^asset:\s*\/\//i, "asset://");
}

function isUsableRemoteImageUrl(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!/^https?:\/\//i.test(raw)) return false;
  const decoded = safelyDecodeUrlValue(raw).toLowerCase();
  return !(
    decoded.includes("<!doctype") ||
    decoded.includes("<html") ||
    decoded.includes("<head") ||
    decoded.includes("<body") ||
    decoded.includes("&lt;!doctype") ||
    decoded.includes("&lt;html")
  );
}

function isUsableDataImageUrl(value) {
  return /^data:image\/[a-z0-9.+-]+;base64,/i.test(String(value || "").trim());
}

function isUsableArkAssetUrl(value) {
  return /^asset:\/\/[a-z0-9._-]+/i.test(String(value || "").trim());
}

function isUsableSeedanceImageUrl(value) {
  return isUsableRemoteImageUrl(value) || isUsableArkAssetUrl(value) || isUsableDataImageUrl(value);
}

function canPreviewImageUrl(value) {
  return /^(https?:\/\/|data:image\/|blob:)/i.test(String(value || "").trim());
}

function isTrustedHumanoidAsset(entry) {
  const model = String(entry?.model || "").toLowerCase();
  const category = String(entry?.category || "").toLowerCase();
  const role = String(entry?.role || "").toLowerCase();
  return (
    Boolean(entry?.trustedForSeedance) ||
    category === "human" ||
    role === "human" ||
    role === "avatar" ||
    model.includes("seedream")
  );
}

function normalizeSeedanceAssetEntry(entry, fallbackName = "素材") {
  const url = normalizeSeedanceTrustedUrl(entry?.url || entry?.image_url || entry?.uri || entry);
  if (!url || !isUsableSeedanceImageUrl(url)) return null;
  const model = entry?.model || entry?.modelId || entry?.model_id || "";
  const trusted = Boolean(entry?.trustedForSeedance) || String(model).toLowerCase().includes("seedream");
  const role = entry?.role || (trusted ? "human" : "reference");
  const category = entry?.category || (trusted ? "human" : "other");
  return {
    id: entry?.id || `${category}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    url,
    name: entry?.name || entry?.title || fallbackName,
    prompt: entry?.prompt || "",
    model: model || (entry?.localUpload ? "local-upload" : ""),
    source: entry?.source || "",
    sourceType: entry?.sourceType || "",
    providerId: entry?.providerId || "",
    timestamp: entry?.timestamp || entry?.uploadedAt || new Date().toISOString(),
    uploadedAt: entry?.uploadedAt || entry?.timestamp || new Date().toISOString(),
    trustedForSeedance: trusted,
    trustedUntil: entry?.trustedUntil || "",
    localUpload: Boolean(entry?.localUpload || entry?.source === "local-upload"),
    role,
    category,
    order: Number.isFinite(Number(entry?.order)) ? Number(entry.order) : undefined,
  };
}

function mergeAssetLibrary(existing, additions) {
  const seen = new Set();
  return [...(Array.isArray(additions) ? additions : []), ...(Array.isArray(existing) ? existing : [])]
    .map((entry, index) => normalizeSeedanceAssetEntry(entry, `素材 ${index + 1}`))
    .filter(Boolean)
    .filter((entry) => {
      const key = normalizeSeedanceTrustedUrl(entry.url);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, ASSET_LIBRARY_LIMIT);
}

function readSeedanceLocalAssetLibrary() {
  return mergeAssetLibrary(readJsonStorage(SEEDANCE_LOCAL_ASSET_LIBRARY_KEY, []), []);
}

function writeSeedanceLocalAssetLibrary(items) {
  writeJsonStorage(SEEDANCE_LOCAL_ASSET_LIBRARY_KEY, mergeAssetLibrary(items, []));
}

function pushImageHistoryEntry(target, seen, entry, fallbackName) {
  const normalized = normalizeSeedanceAssetEntry(entry, fallbackName);
  if (!normalized || seen.has(normalized.url)) return;
  seen.add(normalized.url);
  target.push(normalized);
}

function collectImageStudioAssets() {
  const data = readJsonStorage(IMAGE_STUDIO_PERSIST_KEY, null);
  const items = [];
  const seen = new Set();
  if (!data || typeof data !== "object") return items;

  (Array.isArray(data.localHistory) ? data.localHistory : []).forEach((entry, index) => {
    pushImageHistoryEntry(items, seen, entry, `历史图 ${index + 1}`);
  });
  (Array.isArray(data.uploadedImageUrls) ? data.uploadedImageUrls : []).forEach((url, index) => {
    pushImageHistoryEntry(items, seen, { url, name: `已选图 ${index + 1}` }, `已选图 ${index + 1}`);
  });

  return items.slice(0, 80);
}

function createLocalUploadAsset(file, url, role) {
  const category = role === "human" ? "human" : "other";
  return normalizeSeedanceAssetEntry({
    id: `marketing-upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    url,
    name: file?.name || "本地上传",
    model: "local-upload",
    source: "local-upload",
    sourceType: "marketing",
    localUpload: true,
    role,
    category,
    timestamp: new Date().toISOString(),
    uploadedAt: new Date().toISOString(),
  });
}

function normalizeSelectedAsset(value, fallbackName = "素材") {
  if (!value) return null;
  return normalizeSeedanceAssetEntry(typeof value === "string" ? { url: value } : value, fallbackName);
}

function getAssetBadge(entry) {
  if (isTrustedHumanoidAsset(entry)) return "可信";
  if (entry?.localUpload) return "本地";
  return "其他";
}

function getAssetSubtitle(entry) {
  if (!entry) return "";
  if (entry.model) return entry.model;
  if (entry.source) return entry.source;
  return getAssetBadge(entry);
}

function getVideoRequestId(entry) {
  return entry?.requestId || entry?.request_id || entry?.task_id || entry?.id || null;
}

function getVideoResultUrl(entry) {
  return entry?.url || entry?.video_url || entry?.result_url || entry?.failedUrl || null;
}

function limitVideoHistory(entries) {
  const seen = new Set();
  return (Array.isArray(entries) ? entries : [])
    .filter(Boolean)
    .filter((entry, index) => {
      const key = getVideoRequestId(entry) || getVideoResultUrl(entry) || `${entry?.timestamp || "video"}-${index}`;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, VIDEO_HISTORY_LIMIT);
}

function upsertVideoStudioHistory(entry) {
  if (typeof localStorage === "undefined" || !entry) return;
  const state = readJsonStorage(VIDEO_STUDIO_PERSIST_KEY, {}) || {};
  const current = Array.isArray(state.localHistory) ? state.localHistory : [];
  const key = getVideoRequestId(entry) || getVideoResultUrl(entry) || entry.id;
  const existingIndex = current.findIndex((item) => {
    if (!key) return false;
    return getVideoRequestId(item) === key || getVideoResultUrl(item) === key || item?.id === key;
  });
  const stamped = {
    ...entry,
    updatedAt: new Date().toISOString(),
  };
  const next = [...current];
  if (existingIndex >= 0) {
    next[existingIndex] = {
      ...next[existingIndex],
      ...stamped,
      id: next[existingIndex].id || stamped.id,
      requestId: getVideoRequestId(stamped) || getVideoRequestId(next[existingIndex]),
    };
  } else {
    next.unshift(stamped);
  }
  writeJsonStorage(VIDEO_STUDIO_PERSIST_KEY, {
    ...state,
    localHistory: limitVideoHistory(next),
  });
  window.dispatchEvent(new Event("hg-task-center-refresh"));
}

function patchVideoStudioHistoryTask(requestId, patch) {
  if (!requestId || typeof localStorage === "undefined") return;
  const state = readJsonStorage(VIDEO_STUDIO_PERSIST_KEY, {}) || {};
  const current = Array.isArray(state.localHistory) ? state.localHistory : [];
  const next = current.map((entry) =>
    getVideoRequestId(entry) === requestId
      ? { ...entry, ...patch, updatedAt: new Date().toISOString() }
      : entry,
  );
  writeJsonStorage(VIDEO_STUDIO_PERSIST_KEY, {
    ...state,
    localHistory: limitVideoHistory(next),
  });
  window.dispatchEvent(new Event("hg-task-center-refresh"));
}

function buildReferenceSet(assets) {
  return assets.map((asset, index) => ({
    id: asset.id || `marketing-ref-${index + 1}`,
    url: asset.url,
    name: asset.name || `参考图 ${index + 1}`,
    prompt: asset.prompt || "",
    model: asset.model || "",
    source: asset.source || "",
    providerId: asset.providerId || "",
    trustedForSeedance: Boolean(asset.trustedForSeedance),
    trustedUntil: asset.trustedUntil || "",
    localUpload: Boolean(asset.localUpload),
    role: `image${index + 1}`,
    order: index + 1,
    marketingRole: asset.marketingRole || asset.role || "",
  }));
}

function buildMarketingPrompt({ template, userPrompt, referenceSet }) {
  const refLines = referenceSet
    .map((entry) => {
      const roleLabel =
        entry.marketingRole === "human"
          ? "仿真人"
          : entry.marketingRole === "product"
            ? "产品/道具"
            : "风格/场景";
      return `@${entry.role}：${roleLabel}，${entry.name}`;
    })
    .join("\n");

  return [
    template?.prompt,
    userPrompt.trim(),
    refLines ? `参考图顺序：\n${refLines}` : "",
    "保持参考素材的身份、产品外观、材质和顺序关系；不要字幕，不要可读文字，不要现代广告贴片；镜头自然，有真实短片质感。",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function getGenerationErrorMessage(error) {
  const message = String(error?.message || "生成失败");
  if (/real person|真人|人脸/i.test(message)) {
    return "参考图疑似包含真人人脸，Ark 已拒绝提交。请换 Seedream 可信仿真人或非人像素材。";
  }
  return message.length > 180 ? `${message.slice(0, 180)}...` : message;
}

async function copyTextToClipboard(text) {
  if (!text) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to textarea fallback.
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
  } catch {
    return false;
  }
}

async function downloadFile(url, filename) {
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
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

function Thumb({ asset, label, onRemove, className = "" }) {
  return (
    <div className={`group/thumb relative shrink-0 overflow-hidden rounded border border-white/10 bg-white/[0.03] ${className}`}>
      {canPreviewImageUrl(asset?.url) ? (
        <img src={asset.url} alt={asset.name || label} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-white/30">
          <ImageIcon size={18} />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-1.5 py-1">
        <div className="truncate text-[10px] font-black text-primary">{label}</div>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded bg-black/75 text-white/70 opacity-0 transition-all hover:text-primary group-hover/thumb:opacity-100"
          title="移除"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

function AssetLane({
  icon,
  title,
  detail,
  assets,
  limit,
  poolCount,
  uploadable = false,
  multiple = false,
  progress = 0,
  onUpload,
  onOpenPicker,
  onRemove,
  onClear,
}) {
  const inputRef = useRef(null);
  const selected = Array.isArray(assets) ? assets.filter(Boolean) : assets ? [assets] : [];
  const count = selected.length;

  return (
    <div className="min-h-[132px] rounded-lg border border-white/10 bg-white/[0.025] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-white/[0.04] text-primary">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-black text-white/85">{title}</div>
            <div className="truncate text-[11px] font-bold text-white/35">{detail}</div>
          </div>
        </div>
        <span className="rounded bg-primary/10 px-2 py-1 text-[11px] font-black text-primary">
          {count}/{limit}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenPicker}
          className="flex flex-1 items-center justify-center gap-2 rounded bg-primary text-black px-3 py-2 text-xs font-black transition-all hover:bg-[#e5ff33]"
        >
          <Images size={15} />
          图库
          <span className="rounded bg-black/10 px-1.5 py-0.5 text-[10px]">{poolCount}</span>
        </button>
        {uploadable && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple={multiple}
              className="hidden"
              onChange={onUpload}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black text-white/70 transition-all hover:border-primary/50 hover:text-primary"
            >
              {progress > 0 ? `${progress}%` : <Upload size={15} />}
            </button>
          </>
        )}
        {count > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center justify-center rounded border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black text-white/45 transition-all hover:border-red-400/40 hover:text-red-300"
            title="清空"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      <div className="mt-3 flex min-h-[52px] gap-2 overflow-x-auto custom-scrollbar-thin">
        {selected.length ? (
          selected.map((asset, index) => (
            <Thumb
              key={`${asset.url}-${index}`}
              asset={asset}
              label={`@image${index + 1}`}
              onRemove={() => onRemove?.(asset, index)}
              className="h-14 w-14"
            />
          ))
        ) : (
          <div className="flex h-14 flex-1 items-center justify-center rounded border border-dashed border-white/10 text-[11px] font-bold text-white/28">
            未选择
          </div>
        )}
      </div>
    </div>
  );
}

function SelectDropdown({ isOpen, title, options, selected, onSelect, onClose, getLabel = (value) => value }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) onClose();
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className="absolute bottom-[calc(100%+10px)] left-0 z-50 min-w-[160px] rounded-lg border border-white/10 bg-[#090909] p-1 shadow-2xl"
    >
      <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/35">{title}</div>
      {options.map((option) => {
        const value = typeof option === "object" ? option.id : option;
        const label = getLabel(option);
        return (
          <button
            key={value}
            type="button"
            onClick={() => {
              onSelect(value);
              onClose();
            }}
            className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-xs font-black transition-all ${
              selected === value ? "bg-primary text-black" : "text-white/65 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <span>{label}</span>
            {selected === value && <Check size={14} />}
          </button>
        );
      })}
    </div>
  );
}

function AssetPickerModal({
  target,
  title,
  assets,
  selectedUrls,
  multiple,
  onPick,
  onClose,
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter((asset) =>
      [asset.name, asset.prompt, asset.model, asset.source, asset.url]
        .some((value) => String(value || "").toLowerCase().includes(q)),
    );
  }, [assets, search]);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[82vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-white/10 bg-[#080808] shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0">
            <div className="text-sm font-black text-white/90">{title}</div>
            <div className="text-[11px] font-bold text-white/35">
              {target === "human" ? "可信仿真人" : "其他素材"} {assets.length}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜索"
              className="h-9 w-44 rounded border border-white/10 bg-white/[0.04] px-3 text-xs font-bold text-white outline-none placeholder:text-white/25 focus:border-primary/50"
            />
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded border border-white/10 bg-white/[0.04] text-white/55 transition-all hover:text-primary"
              title="关闭"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-3 overflow-y-auto p-4 custom-scrollbar-thin">
          {filtered.length ? (
            filtered.map((asset) => {
              const selected = selectedUrls.has(normalizeSeedanceTrustedUrl(asset.url));
              return (
                <button
                  type="button"
                  key={asset.url}
                  onClick={() => onPick(asset)}
                  className={`group relative overflow-hidden rounded-lg border bg-white/[0.03] text-left transition-all ${
                    selected ? "border-primary shadow-[0_0_0_1px_rgba(217,255,0,.35)]" : "border-white/10 hover:border-white/25"
                  }`}
                >
                  <div className="aspect-[4/5] bg-black/40">
                    {canPreviewImageUrl(asset.url) ? (
                      <img src={asset.url} alt={asset.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-white/25">
                        <ImageIcon size={22} />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-black text-white/85">{asset.name}</span>
                      {selected && <Check size={14} className="shrink-0 text-primary" />}
                    </div>
                    <div className="truncate text-[10px] font-bold text-white/35">{getAssetSubtitle(asset)}</div>
                    <div className="inline-flex rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-black text-primary">
                      {getAssetBadge(asset)}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="col-span-full flex h-48 items-center justify-center rounded-lg border border-dashed border-white/10 text-sm font-bold text-white/35">
              暂无素材
            </div>
          )}
        </div>

        {multiple && (
          <div className="border-t border-white/10 px-4 py-3 text-right">
            <button
              type="button"
              onClick={onClose}
              className="rounded bg-primary px-5 py-2 text-sm font-black text-black transition-all hover:bg-[#e5ff33]"
            >
              完成
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryCard({ entry, onOpen, onCopy, onDownload }) {
  const requestId = getVideoRequestId(entry);
  const url = getVideoResultUrl(entry);
  const references = Array.isArray(entry.referenceSet) ? entry.referenceSet : [];

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-[#090909] transition-all hover:border-primary/35">
      <button type="button" onClick={() => url && onOpen(url)} className="group relative block w-full bg-black text-left">
        {url ? (
          <video
            src={url}
            className="aspect-video w-full object-cover opacity-90 transition-all group-hover:opacity-100"
            muted
            loop
            playsInline
            onMouseOver={(event) => event.currentTarget.play?.().catch?.(() => {})}
            onMouseOut={(event) => {
              event.currentTarget.pause?.();
              event.currentTarget.currentTime = 0;
            }}
          />
        ) : (
          <div className="flex aspect-video items-center justify-center text-white/30">
            <Play size={28} />
          </div>
        )}
        <div className="absolute right-2 top-2 rounded bg-emerald-400/15 px-2 py-1 text-[10px] font-black text-emerald-300">
          {entry.status || "completed"}
        </div>
      </button>
      <div className="space-y-3 p-3">
        <p className="line-clamp-2 min-h-[34px] text-xs font-bold leading-relaxed text-white/60">{entry.prompt}</p>
        {references.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto custom-scrollbar-thin">
            {references.slice(0, 6).map((ref, index) => (
              <Thumb key={`${ref.url}-${index}`} asset={ref} label={`@image${index + 1}`} className="h-10 w-10" />
            ))}
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <span className="truncate rounded bg-primary/10 px-2 py-1 text-[10px] font-black text-primary">
            {entry.marketingTemplateName || "营销视频"}
          </span>
          <span className="shrink-0 text-[10px] font-bold text-white/25">
            {entry.completedAt ? new Date(entry.completedAt).toLocaleDateString() : "刚刚"}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onCopy(url)}
            className="flex items-center justify-center gap-1.5 rounded border border-white/10 bg-white/[0.03] px-2 py-2 text-[11px] font-black text-white/55 transition-all hover:text-primary"
          >
            <Copy size={13} />
            URL
          </button>
          <button
            type="button"
            onClick={() => onCopy(requestId)}
            className="flex items-center justify-center gap-1.5 rounded border border-white/10 bg-white/[0.03] px-2 py-2 text-[11px] font-black text-white/55 transition-all hover:text-primary"
          >
            <Copy size={13} />
            ID
          </button>
          <button
            type="button"
            onClick={() => url && onDownload(url, `marketing-${requestId || Date.now()}.mp4`)}
            className="flex items-center justify-center gap-1.5 rounded border border-white/10 bg-white/[0.03] px-2 py-2 text-[11px] font-black text-white/55 transition-all hover:text-primary"
          >
            <Download size={13} />
            下载
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MarketingStudio({
  apiKey,
  apiConfig,
  droppedFiles,
  onFilesHandled,
  onGenerationComplete,
}) {
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
  const [prompt, setPrompt] = useState("");
  const [humanAsset, setHumanAsset] = useState(null);
  const [productAsset, setProductAsset] = useState(null);
  const [sceneAssets, setSceneAssets] = useState([]);
  const [params, setParams] = useState({
    ratio: "9:16",
    templateId: "",
    res: "1080p",
    duration: 5,
    model: "sd-2-vip",
  });
  const [history, setHistory] = useState([]);
  const [assetLibrary, setAssetLibrary] = useState([]);
  const [assetPickerTarget, setAssetPickerTarget] = useState(null);
  const [showAssetComposer, setShowAssetComposer] = useState(false);
  const [showAllMarketingHistory, setShowAllMarketingHistory] = useState(false);
  const [dropdown, setDropdown] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({ product: 0, scene: 0 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [statusText, setStatusText] = useState("");
  const [fullscreenUrl, setFullscreenUrl] = useState(null);
  const [copiedText, setCopiedText] = useState("");

  const textareaRef = useRef(null);

  const currentTemplate = useMemo(
    () => MARKETING_TEMPLATES.find((template) => template.id === params.templateId) || null,
    [params.templateId],
  );

  const selectedReferences = useMemo(() => {
    const refs = [];
    if (humanAsset) refs.push({ ...humanAsset, marketingRole: "human" });
    if (productAsset) refs.push({ ...productAsset, marketingRole: "product" });
    sceneAssets.forEach((asset) => refs.push({ ...asset, marketingRole: "scene" }));
    return refs.slice(0, SEEDANCE_REFERENCE_LIMIT);
  }, [humanAsset, productAsset, sceneAssets]);

  const selectedUrls = useMemo(
    () => new Set(selectedReferences.map((asset) => normalizeSeedanceTrustedUrl(asset.url))),
    [selectedReferences],
  );

  const humanAssets = useMemo(
    () => assetLibrary.filter((asset) => isTrustedHumanoidAsset(asset)),
    [assetLibrary],
  );

  const otherAssets = useMemo(
    () => assetLibrary.filter((asset) => !isTrustedHumanoidAsset(asset)),
    [assetLibrary],
  );

  const pickerAssets = useMemo(() => {
    if (assetPickerTarget === "human") return humanAssets;
    return otherAssets;
  }, [assetPickerTarget, humanAssets, otherAssets]);

  const refreshAssetLibrary = useCallback(() => {
    const merged = mergeAssetLibrary(readSeedanceLocalAssetLibrary(), collectImageStudioAssets());
    setAssetLibrary(merged);
    return merged;
  }, []);

  const addAssetsToLibrary = useCallback((items) => {
    const additions = (Array.isArray(items) ? items : [items]).filter(Boolean);
    if (!additions.length) return;
    const merged = mergeAssetLibrary(readSeedanceLocalAssetLibrary(), additions);
    writeSeedanceLocalAssetLibrary(merged);
    setAssetLibrary(mergeAssetLibrary(merged, collectImageStudioAssets()));
    window.dispatchEvent(new Event("hg-task-center-refresh"));
  }, []);

  useEffect(() => {
    const data = readJsonStorage(PERSIST_KEY, null);
    if (data && typeof data === "object") {
      if (typeof data.prompt === "string") setPrompt(data.prompt);
      if (data.params) {
        const shouldRestoreTemplate =
          data.marketingPersistVersion === MARKETING_PERSIST_VERSION &&
          MARKETING_TEMPLATES.some((template) => template.id === data.params.templateId);
        const restoredTemplateId = shouldRestoreTemplate
          ? data.params.templateId
          : "";
        setParams((prev) => ({
          ...prev,
          ...data.params,
          templateId: restoredTemplateId,
          model: data.params.model || prev.model,
        }));
      }
      if (data.humanAsset || data.avatarImage) setHumanAsset(normalizeSelectedAsset(data.humanAsset || data.avatarImage, "仿真人"));
      if (data.productAsset || data.productImage) setProductAsset(normalizeSelectedAsset(data.productAsset || data.productImage, "产品图"));
      if (Array.isArray(data.sceneAssets)) {
        setSceneAssets(data.sceneAssets.map((item) => normalizeSelectedAsset(item, "场景图")).filter(Boolean).slice(0, 7));
      } else if (Array.isArray(data.additionalImages)) {
        setSceneAssets(data.additionalImages.map((item) => normalizeSelectedAsset(item, "参考图")).filter(Boolean).slice(0, 7));
      }
      if (Array.isArray(data.history)) setHistory(data.history.filter((entry) => getVideoResultUrl(entry)));
    }
    refreshAssetLibrary();
  }, [refreshAssetLibrary]);

  useEffect(() => {
    const handler = () => refreshAssetLibrary();
    window.addEventListener("storage", handler);
    window.addEventListener("hg-task-center-refresh", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("hg-task-center-refresh", handler);
    };
  }, [refreshAssetLibrary]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      writeJsonStorage(PERSIST_KEY, {
        marketingPersistVersion: MARKETING_PERSIST_VERSION,
        prompt,
        params,
        humanAsset,
        productAsset,
        sceneAssets,
        history,
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [prompt, params, humanAsset, productAsset, sceneAssets, history]);

  const handleTextareaInput = (event) => {
    const el = event.target;
    setPrompt(el.value);
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, PROMPT_TEXTAREA_MAX_HEIGHT)}px`;
  };

  const chooseAsset = useCallback(
    (asset) => {
      const normalized = normalizeSelectedAsset(asset, "素材");
      if (!normalized) return;
      if (assetPickerTarget === "human") {
        setHumanAsset({ ...normalized, marketingRole: "human", role: "human", category: "human" });
        setAssetPickerTarget(null);
        return;
      }
      if (assetPickerTarget === "product") {
        setProductAsset({ ...normalized, marketingRole: "product", role: "product", category: "other" });
        setAssetPickerTarget(null);
        return;
      }
      if (assetPickerTarget === "scene") {
        setSceneAssets((prev) => {
          const key = normalizeSeedanceTrustedUrl(normalized.url);
          const exists = prev.some((item) => normalizeSeedanceTrustedUrl(item.url) === key);
          const next = exists
            ? prev.filter((item) => normalizeSeedanceTrustedUrl(item.url) !== key)
            : [...prev, { ...normalized, marketingRole: "scene", role: "scene", category: "other" }];
          return next.slice(0, SEEDANCE_REFERENCE_LIMIT - 2);
        });
      }
    },
    [assetPickerTarget],
  );

  const handleUpload = useCallback(
    async (event, target) => {
      const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith("image/"));
      if (!files.length) return;

      const room = target === "scene" ? SEEDANCE_REFERENCE_LIMIT - 2 - sceneAssets.length : 1;
      const uploadFiles = files.slice(0, Math.max(0, room));
      if (!uploadFiles.length) {
        alert(`最多支持 ${SEEDANCE_REFERENCE_LIMIT} 张 Seedance 参考图。`);
        return;
      }

      const oversized = uploadFiles.find((file) => file.size > 10 * 1024 * 1024);
      if (oversized) {
        alert(`图片 ${oversized.name} 超过 10MB 限制。`);
        return;
      }

      setUploadProgress((prev) => ({ ...prev, [target]: 1 }));
      const uploaded = [];
      try {
        for (let index = 0; index < uploadFiles.length; index += 1) {
          const file = uploadFiles[index];
          const url = await uploadFile(
            apiKey,
            file,
            (pct) => {
              const overall = Math.round(((index + pct / 100) / uploadFiles.length) * 100);
              setUploadProgress((prev) => ({ ...prev, [target]: overall }));
            },
            seedanceArkApiConfig,
          );
          const asset = createLocalUploadAsset(file, url, target === "product" ? "product" : "scene");
          if (asset) uploaded.push(asset);
        }

        addAssetsToLibrary(uploaded);
        if (target === "product") {
          setProductAsset(uploaded[0] || null);
        } else {
          setSceneAssets((prev) => mergeAssetLibrary(prev, uploaded).slice(0, SEEDANCE_REFERENCE_LIMIT - 2));
        }
      } catch (err) {
        alert(`上传失败：${err.message}`);
      } finally {
        setUploadProgress((prev) => ({ ...prev, [target]: 0 }));
        if (event.target) event.target.value = "";
      }
    },
    [addAssetsToLibrary, apiKey, sceneAssets.length, seedanceArkApiConfig],
  );

  useEffect(() => {
    if (!droppedFiles?.length) return;
    const imageFiles = droppedFiles.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length > 0) {
      const syntheticEvent = { target: { files: productAsset ? imageFiles : [imageFiles[0]], value: "" } };
      handleUpload(syntheticEvent, productAsset ? "scene" : "product");
    }
    onFilesHandled?.();
  }, [droppedFiles, handleUpload, onFilesHandled, productAsset]);

  const handleCopy = useCallback(async (value) => {
    const ok = await copyTextToClipboard(value);
    if (!ok) return;
    setCopiedText(value);
    window.setTimeout(() => setCopiedText(""), 1500);
  }, []);

  const handleGenerate = useCallback(async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      alert("请先输入营销视频提示词。");
      return;
    }
    if (selectedReferences.length === 0) {
      alert("请先选择仿真人、产品或场景素材。");
      return;
    }

    const invalidRef = selectedReferences.find((asset) => !isUsableSeedanceImageUrl(asset.url));
    if (invalidRef) {
      alert(`素材地址无效：${invalidRef.name || invalidRef.url}`);
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);
    setStatusText("正在提交 Seedance 任务...");

    let capturedRequestId = null;
    const referenceSet = buildReferenceSet(selectedReferences);
    const finalPrompt = buildMarketingPrompt({
      template: currentTemplate,
      userPrompt: trimmedPrompt,
      referenceSet,
    });
    const baseMeta = {
      prompt: trimmedPrompt,
      fullPrompt: finalPrompt,
      model: params.model,
      aspect_ratio: params.ratio,
      duration: params.duration,
      resolution: params.res,
      seedanceMode: "omni",
      referenceImages: referenceSet.map((entry) => ({
        id: entry.id,
        url: entry.url,
        name: entry.name,
        model: entry.model,
        trustedForSeedance: entry.trustedForSeedance,
        role: entry.role,
        order: entry.order,
      })),
      referenceSet,
      providerId: "seedance-ark",
      source: "marketing",
      sourceModule: "marketing",
      marketingTemplateId: currentTemplate?.id || "",
      marketingTemplateName: currentTemplate?.name || "",
    };

    const onRequestId = (requestId, submitData = {}) => {
      capturedRequestId = requestId;
      setStatusText(`已提交任务 ${requestId}`);
      upsertVideoStudioHistory({
        id: requestId,
        requestId,
        request_id: requestId,
        task_id: requestId,
        url: null,
        ...baseMeta,
        status: "processing",
        providerStatus: submitData.provider_status || submitData.status || "submitted",
        timestamp: new Date().toISOString(),
        submittedAt: Date.now(),
        maxAttempts: 900,
        interval: 2000,
      });
    };

    const onStatus = (status) => {
      const requestId = capturedRequestId || getVideoRequestId(status);
      if (!requestId) return;
      setStatusText(status?.status ? `任务状态：${status.status}` : "任务处理中...");
      patchVideoStudioHistoryTask(requestId, {
        status: status?.status || "processing",
        providerStatus: status?.provider_status,
        pollAttempt: status?.attempt,
        maxAttempts: status?.maxAttempts,
        responseSummary: status?.responseSummary,
        lastStatusAt: new Date().toISOString(),
      });
    };

    try {
      const urls = referenceSet.map((entry) => entry.url);
      const result = await generateVideo(
        apiKey,
        {
          model: params.model,
          prompt: finalPrompt,
          aspect_ratio: params.ratio,
          duration: params.duration,
          resolution: params.res,
          seedance_mode: "omni",
          images_list: urls,
          reference_images: urls,
          image_url: urls[0],
          first_frame_url: urls[0],
          onRequestId,
          onStatus,
        },
        seedanceArkApiConfig,
      );

      if (!result?.url) {
        throw new Error("接口未返回视频地址。");
      }

      const requestId = result.request_id || result.task_id || capturedRequestId || result.id || Date.now().toString();
      const entry = {
        id: capturedRequestId || result.id || requestId,
        requestId,
        request_id: requestId,
        task_id: requestId,
        url: result.url,
        ...baseMeta,
        status: "completed",
        providerStatus: result.provider_status,
        timestamp: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      upsertVideoStudioHistory(entry);
      setHistory((prev) => limitVideoHistory([entry, ...prev.filter((item) => getVideoResultUrl(item))]));
      setFullscreenUrl(result.url);
      setStatusText("生成完成，已同步到视频管理和任务中心。");
      onGenerationComplete?.({
        url: result.url,
        model: params.model,
        prompt: trimmedPrompt,
        type: "video",
      });
    } catch (err) {
      console.error("[MarketingStudio]", err);
      const message = getGenerationErrorMessage(err);
      if (capturedRequestId) {
        patchVideoStudioHistoryTask(capturedRequestId, {
          status: "failed",
          error: message,
          responseSummary: err?.response ? JSON.stringify(err.response).slice(0, 220) : null,
        });
      }
      setGenerateError(message);
      setStatusText("");
    } finally {
      setIsGenerating(false);
    }
  }, [
    apiKey,
    currentTemplate,
    onGenerationComplete,
    params.duration,
    params.model,
    params.ratio,
    params.res,
    prompt,
    seedanceArkApiConfig,
    selectedReferences,
  ]);

  const activePickerTitle =
    assetPickerTarget === "human"
      ? "选择仿真人"
      : assetPickerTarget === "product"
        ? "选择产品/道具"
        : "选择风格/场景";

  const completedHistory = history.filter((entry) => getVideoResultUrl(entry));
  const displayedHistory = showAllMarketingHistory ? completedHistory : completedHistory.slice(0, 1);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-app-bg text-white">
      <style>{SCROLLBAR_STYLE}</style>

      <div className="flex-1 overflow-y-auto px-4 pb-56 pt-5 custom-scrollbar-thin md:px-6 md:pb-44 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="text-sm font-black text-white/80">最近结果</h2>
              <span className="rounded border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[11px] font-bold text-white/45">
                {completedHistory.length} 条
              </span>
              <span className="rounded border border-primary/15 bg-primary/10 px-2 py-1 text-[11px] font-black text-primary">
                素材 {selectedReferences.length}/{SEEDANCE_REFERENCE_LIMIT}
              </span>
            </div>
            {completedHistory.length > 1 && (
              <button
                type="button"
                onClick={() => setShowAllMarketingHistory((value) => !value)}
                className="inline-flex h-8 items-center rounded-md border border-white/[0.06] bg-white/[0.03] px-3 text-[11px] font-black text-white/55 transition-colors hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
              >
                {showAllMarketingHistory ? "收起" : `查看全部 ${completedHistory.length}`}
              </button>
            )}
          </div>

          {completedHistory.length > 0 ? (
            <div className={`grid grid-cols-1 gap-4 ${showAllMarketingHistory ? "md:grid-cols-2 xl:grid-cols-3" : "max-w-xl"}`}>
              {displayedHistory.map((entry) => (
                <HistoryCard
                  key={entry.requestId || entry.url || entry.id}
                  entry={entry}
                  onOpen={setFullscreenUrl}
                  onCopy={handleCopy}
                  onDownload={downloadFile}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.015] px-4 py-5 text-sm font-bold text-white/30">
              暂无营销视频
            </div>
          )}
        </div>
      </div>

      <div className="absolute inset-x-3 bottom-16 z-40 mx-auto w-auto md:inset-x-0 md:bottom-5 md:w-[92%] lg:max-w-3xl">
        <div className="mx-auto flex w-full flex-col gap-2 rounded-md border border-white/10 bg-[#090909]/90 p-2.5 shadow-2xl backdrop-blur-2xl md:p-3">
          <div className="flex items-start gap-2 md:items-center">
            <button
              type="button"
              onClick={() => setShowAssetComposer(true)}
              className={`flex h-10 min-w-10 shrink-0 items-center justify-center gap-1 rounded-full border px-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 ${
                selectedReferences.length
                  ? "border-primary/45 bg-primary/10 text-primary hover:bg-primary hover:text-black"
                  : "border-white/[0.06] bg-white/[0.04] text-white/45 hover:border-primary/35 hover:text-primary"
              }`}
              title="打开素材组合"
            >
              <Images size={16} />
              <span className="text-[10px] font-black">{selectedReferences.length}/{SEEDANCE_REFERENCE_LIMIT}</span>
            </button>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onInput={handleTextareaInput}
              placeholder="写营销视频动作、卖点和氛围..."
              rows={1}
              className="min-h-[38px] max-h-[72px] w-full resize-none overflow-y-auto border-none bg-transparent pt-1 text-sm font-bold leading-relaxed text-white outline-none placeholder:text-white/15 custom-scrollbar-thin md:max-h-[84px]"
            />
          </div>

          <div className="flex min-w-0 items-center gap-2 border-t border-white/[0.04] pt-2">
            <div className="flex min-w-0 shrink overflow-x-auto custom-scrollbar-thin gap-1 pb-0.5">
              {MARKETING_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  title={`${template.name} · ${template.detail}`}
                  onClick={() =>
                    setParams((prev) => ({
                      ...prev,
                      templateId: prev.templateId === template.id ? "" : template.id,
                    }))
                  }
                  className={`h-8 min-w-[70px] shrink-0 rounded-md border px-2 text-center transition-all ${
                    params.templateId === template.id
                      ? "border-primary/60 bg-primary/10 text-primary"
                      : "border-white/[0.05] bg-white/[0.03] text-white/50 hover:border-primary/30 hover:text-white/80"
                  }`}
                >
                  <span className="block truncate text-[10px] font-black leading-8">{template.name}</span>
                </button>
              ))}
            </div>
            <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-1.5 overflow-x-auto custom-scrollbar-thin pb-0.5">
              {selectedReferences.slice(0, 4).map((asset, index) => (
                <Thumb key={`${asset.url}-${index}`} asset={asset} label={`@${index + 1}`} className="h-9 w-9" />
              ))}
              {selectedReferences.length > 4 && (
                <span className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.03] px-2 text-[10px] font-black text-white/40">
                  +{selectedReferences.length - 4}
                </span>
              )}
              {selectedReferences.length > 0 && (
                <button
                  type="button"
                  title="清空素材组合"
                  onClick={() => {
                    setHumanAsset(null);
                    setProductAsset(null);
                    setSceneAssets([]);
                  }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.03] text-white/45 transition-all hover:border-primary/30 hover:text-primary"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {(generateError || statusText || copiedText) && (
            <div className="rounded border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold">
              {generateError ? (
                <span className="text-red-300">{generateError}</span>
              ) : copiedText ? (
                <span className="text-primary">已复制</span>
              ) : (
                <span className="text-white/45">{statusText}</span>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-white/[0.04] pt-2 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setDropdown(dropdown === "model" ? null : "model");
                  }}
                  className="flex items-center gap-2 rounded border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-black text-white/70 transition-all hover:border-primary/45 hover:text-primary"
                >
                  <Wand2 size={16} className="text-primary" />
                  {OPTIONS.model.find((model) => model.id === params.model)?.name || params.model}
                </button>
                <SelectDropdown
                  isOpen={dropdown === "model"}
                  title="视频模型"
                  options={OPTIONS.model}
                  selected={params.model}
                  getLabel={(option) => option.name}
                  onSelect={(value) => setParams((prev) => ({ ...prev, model: value }))}
                  onClose={() => setDropdown(null)}
                />
              </div>

              {["ratio", "res", "duration"].map((key) => (
                <div key={key} className="relative">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setDropdown(dropdown === key ? null : key);
                    }}
                    className={`rounded border px-3 py-2.5 text-sm font-black transition-all ${
                      dropdown === key ? "border-primary text-primary" : "border-white/10 bg-white/[0.04] text-white/65 hover:border-white/25"
                    }`}
                  >
                    {key === "duration" ? `${params[key]}s` : params[key]}
                  </button>
                  <SelectDropdown
                    isOpen={dropdown === key}
                    title={key === "res" ? "分辨率" : key === "ratio" ? "画幅" : "时长"}
                    options={OPTIONS[key]}
                    selected={params[key]}
                    onSelect={(value) => setParams((prev) => ({ ...prev, [key]: value }))}
                    onClose={() => setDropdown(null)}
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex min-w-[160px] items-center justify-center gap-2 rounded bg-primary px-7 py-3 text-base font-black text-black shadow-[0_0_24px_rgba(217,255,0,.18)] transition-all hover:bg-[#e5ff33] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                  生成中
                </>
              ) : (
                <>
                  <Play size={17} fill="currentColor" />
                  开始生成
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showAssetComposer && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 px-2 py-3 backdrop-blur-sm md:px-4 md:py-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowAssetComposer(false);
          }}
        >
          <div className="flex max-h-[86vh] w-full max-w-5xl flex-col overflow-hidden rounded-md border border-white/[0.08] bg-[#080808]/95 shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-black text-white/85">素材组合</h2>
                <p className="mt-1 truncate text-[11px] font-semibold text-white/35">
                  仿真人、产品/道具、风格/场景会按顺序提交给 Seedance
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] font-black text-primary">
                  {selectedReferences.length}/{SEEDANCE_REFERENCE_LIMIT}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAssetComposer(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.03] text-white/45 transition-colors hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                  title="关闭"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3 custom-scrollbar-thin md:p-4">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <AssetLane
                  icon={<UserRound size={18} />}
                  title="仿真人"
                  detail="Seedream 可信产物"
                  assets={humanAsset}
                  limit={1}
                  poolCount={humanAssets.length}
                  onOpenPicker={() => setAssetPickerTarget("human")}
                  onRemove={() => setHumanAsset(null)}
                  onClear={() => setHumanAsset(null)}
                />
                <AssetLane
                  icon={<Package size={18} />}
                  title="产品/道具"
                  detail="本地上传或图库"
                  assets={productAsset}
                  limit={1}
                  poolCount={otherAssets.length}
                  uploadable
                  progress={uploadProgress.product}
                  onUpload={(event) => handleUpload(event, "product")}
                  onOpenPicker={() => setAssetPickerTarget("product")}
                  onRemove={() => setProductAsset(null)}
                  onClear={() => setProductAsset(null)}
                />
                <AssetLane
                  icon={<Sparkles size={18} />}
                  title="风格/场景"
                  detail="最多补充 7 张"
                  assets={sceneAssets}
                  limit={Math.max(0, SEEDANCE_REFERENCE_LIMIT - 2)}
                  poolCount={otherAssets.length}
                  uploadable
                  multiple
                  progress={uploadProgress.scene}
                  onUpload={(event) => handleUpload(event, "scene")}
                  onOpenPicker={() => setAssetPickerTarget("scene")}
                  onRemove={(asset) =>
                    setSceneAssets((prev) => prev.filter((item) => normalizeSeedanceTrustedUrl(item.url) !== normalizeSeedanceTrustedUrl(asset.url)))
                  }
                  onClear={() => setSceneAssets([])}
                />
              </div>

              <div className="mt-3 rounded-md border border-white/[0.06] bg-white/[0.025] p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-black text-white/70">提交顺序</span>
                  <button
                    type="button"
                    onClick={() => {
                      setHumanAsset(null);
                      setProductAsset(null);
                      setSceneAssets([]);
                    }}
                    className="rounded border border-white/10 px-2 py-1 text-[10px] font-black text-white/45 transition-colors hover:border-red-300/35 hover:text-red-200"
                  >
                    清空
                  </button>
                </div>
                <div className="flex min-h-12 items-center gap-2 overflow-x-auto custom-scrollbar-thin">
                  {selectedReferences.length ? (
                    selectedReferences.map((asset, index) => (
                      <div
                        key={`${asset.url}-${index}`}
                        className="flex h-12 max-w-[190px] shrink-0 items-center gap-2 rounded-md border border-white/[0.06] bg-black/30 px-2"
                      >
                        <Thumb asset={asset} label={`@${index + 1}`} className="h-8 w-8" />
                        <div className="min-w-0">
                          <div className="truncate text-[10px] font-black text-white/70">
                            @image{index + 1}
                          </div>
                          <div className="truncate text-[9px] font-semibold text-white/35">
                            {asset.marketingRole === "human" ? "仿真人" : asset.marketingRole === "product" ? "产品/道具" : "风格/场景"}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <span className="text-[11px] font-semibold text-white/35">未选择素材</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-white/[0.06] px-4 py-3">
              <button
                type="button"
                onClick={() => setShowAssetComposer(false)}
                className="h-9 rounded-md border border-primary/30 bg-primary/10 px-4 text-[11px] font-black text-primary transition-colors hover:bg-primary hover:text-black"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}

      {assetPickerTarget && (
        <AssetPickerModal
          target={assetPickerTarget}
          title={activePickerTitle}
          assets={pickerAssets}
          selectedUrls={selectedUrls}
          multiple={assetPickerTarget === "scene"}
          onPick={chooseAsset}
          onClose={() => setAssetPickerTarget(null)}
        />
      )}

      {fullscreenUrl && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm"
          onClick={() => setFullscreenUrl(null)}
        >
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                window.open(fullscreenUrl, "_blank", "noopener,noreferrer");
              }}
              className="flex h-10 w-10 items-center justify-center rounded border border-white/10 bg-white/[0.05] text-white/60 transition-all hover:text-primary"
              title="打开原始视频"
            >
              <ExternalLink size={17} />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setFullscreenUrl(null);
              }}
              className="flex h-10 w-10 items-center justify-center rounded border border-white/10 bg-white/[0.05] text-white/60 transition-all hover:text-primary"
              title="关闭"
            >
              <X size={18} />
            </button>
          </div>
          <video
            src={fullscreenUrl}
            controls
            autoPlay
            className="max-h-[92vh] max-w-[94vw] rounded-lg border border-white/10 bg-black shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setFullscreenUrl(fullscreenUrl);
            }}
            className="absolute bottom-4 right-4 hidden items-center gap-2 rounded border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-black text-white/50 md:flex"
            title="全屏"
          >
            <Maximize2 size={15} />
            预览
          </button>
        </div>
      )}
    </div>
  );
}
