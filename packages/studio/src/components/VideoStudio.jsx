"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Boxes,
  Check,
  Copy,
  Download,
  ExternalLink,
  ImagePlus,
  Images,
  Maximize2,
  Play,
  RotateCcw,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { generateVideo, generateI2V, processV2V, uploadFile, pollForResult } from "../muapi.js";
import { getActiveProvider, getProviderVideoModelWhitelist, normalizeApiConfig } from "../apiProviders.js";
import { isLocalStudioModel, loadLocalRuntimeModelCatalog } from "../localModels.js";
import {
  t2vModels,
  i2vModels,
  v2vModels,
  getAspectRatiosForVideoModel,
  getDurationsForModel,
  getResolutionsForVideoModel,
  getAspectRatiosForI2VModel,
  getDurationsForI2VModel,
  getResolutionsForI2VModel,
  getModesForModel,
} from "../models.js";

// ── tiny helpers ──────────────────────────────────────────────────────────────

function getQualitiesForModel(modelList, modelId) {
  const model = modelList.find((m) => m.id === modelId);
  return model?.inputs?.quality?.enum || [];
}

function getInputOptions(model, inputName) {
  const input = model?.inputs?.[inputName];
  if (!input) return [];
  if (Array.isArray(input.enum)) return input.enum;
  return input.default !== undefined && input.default !== null ? [input.default] : [];
}

function getInputDefault(model, inputName, fallback = "") {
  const input = model?.inputs?.[inputName];
  if (input?.default !== undefined && input.default !== null) return input.default;
  const options = getInputOptions(model, inputName);
  return options[0] ?? fallback;
}

function modelMatchesWhitelist(model, whitelistId) {
  const needle = String(whitelistId || "").toLowerCase();
  if (!needle) return false;
  const candidates = [model.id, model.endpoint, model.family, ...(model.aliases || [])]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  if (needle === "sd-2" || needle === "sd-2-vip") {
    return candidates.some((candidate) => candidate === needle);
  }

  return candidates.some((candidate) => candidate === needle || candidate.includes(needle) || needle.includes(candidate));
}

function filterVideoModelsByWhitelist(models, whitelist) {
  if (!whitelist?.length) return models;
  const picked = [];
  const pickedIds = new Set();

  whitelist.forEach((modelId) => {
    models.forEach((model) => {
      if (!modelMatchesWhitelist(model, modelId) || pickedIds.has(model.id)) return;
      picked.push(model);
      pickedIds.add(model.id);
    });
  });

  return picked.length ? picked : models;
}

function isWan2gpRuntimeModel(model) {
  return isLocalStudioModel(model) && model.localRuntime?.provider === "wan2gp";
}

function getUploadResultUrl(result) {
  if (typeof result === "string") return result;
  return result?.url || result?.path || "";
}

const SEEDANCE_VIDEO_MODEL_ORDER = ["sd-2-vip", "sd-2"];

function pickSeedanceVideoModels(models) {
  const byId = new Map(models.map((model) => [model.id, model]));
  return SEEDANCE_VIDEO_MODEL_ORDER.map((modelId) => byId.get(modelId)).filter(Boolean);
}

function isSeedance2Model(modelOrId) {
  const model =
    modelOrId && typeof modelOrId === "object"
      ? modelOrId
      : [...t2vModels, ...i2vModels].find((m) => m.id === modelOrId);
  const candidates = [
    typeof modelOrId === "string" ? modelOrId : null,
    model?.id,
    model?.endpoint,
    model?.family,
    ...(model?.aliases || []),
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  return candidates.some(
    (candidate) =>
      candidate === "sd-2" ||
      candidate === "sd-2-vip" ||
      candidate === "seedance-v2.0" ||
      candidate.includes("seedance-v2.0"),
  );
}

function getGenerationRequestId(entry) {
  return entry?.requestId || entry?.request_id || entry?.task_id || entry?.id || null;
}

function getVideoResultUrl(entry) {
  return entry?.url || entry?.video_url || entry?.result_url || entry?.failedUrl || null;
}

function normalizeLocalVideoHistory(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.map((entry) => {
    const recoveredUrl = getVideoResultUrl(entry);
    if (recoveredUrl && (!entry?.url || entry.status === "failed")) {
      return {
        ...entry,
        url: recoveredUrl,
        status: entry.status === "failed" ? "completed" : entry.status || "completed",
        previewError:
          entry.previewError ||
          (entry.status === "failed" ? entry.error || "视频预览失败，已保留原始 URL。" : ""),
      };
    }
    return entry;
  });
}

const VIDEO_RESULT_URL_FIELDS = [
  "url",
  "video_url",
  "videoUrl",
  "result_url",
  "resultUrl",
  "output_url",
  "outputUrl",
  "content_url",
  "contentUrl",
  "download_url",
  "downloadUrl",
  "failedUrl",
];

const VIDEO_REQUEST_ID_FIELDS = [
  "requestId",
  "request_id",
  "task_id",
  "taskId",
  "id",
];

const VIDEO_HISTORY_TIME_FIELDS = [
  "completedAt",
  "updatedAt",
  "timestamp",
  "submittedAt",
  "createdAt",
];

function isMaybeVideoResultUrl(value, explicitField = false) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!/^(https?:\/\/|blob:)/i.test(raw)) return false;
  const lower = raw.toLowerCase();
  if (lower.startsWith("data:image/")) return false;
  if (/\.(png|jpe?g|webp|gif|avif|svg)([?#]|$)/i.test(lower)) return false;
  if (explicitField) return true;
  return (
    /\.(mp4|webm|mov|m3u8)([?#]|$)/i.test(lower) ||
    lower.includes("video") ||
    lower.includes("mp4") ||
    lower.includes("volces") ||
    lower.includes("tos-")
  );
}

function getFirstStringField(source, fields) {
  if (!source || typeof source !== "object") return "";
  for (const field of fields) {
    const value = source[field];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function getFirstVideoUrlField(source) {
  if (!source || typeof source !== "object") return "";
  for (const field of VIDEO_RESULT_URL_FIELDS) {
    const value = source[field];
    if (isMaybeVideoResultUrl(value, true)) return value.trim();
  }
  return "";
}

function shouldRecoverTaskOnly(source, sourceKey) {
  if (!/video|seedance|task|history|generation|result|studio/i.test(sourceKey || "")) return false;
  if (!source || typeof source !== "object") return false;
  return Boolean(
    source.status ||
      source.state ||
      source.providerStatus ||
      source.prompt ||
      isSeedance2Model(source.model || source.modelId || source.model_id || source.endpoint),
  );
}

function buildRecoveredVideoEntry(source, sourceKey, fallbackUrl = "") {
  const url = getFirstVideoUrlField(source) || (isMaybeVideoResultUrl(fallbackUrl) ? fallbackUrl.trim() : "");
  const requestId = getFirstStringField(source, VIDEO_REQUEST_ID_FIELDS);
  if (!url && (!requestId || !shouldRecoverTaskOnly(source, sourceKey))) return null;

  const prompt = getFirstStringField(source, ["prompt", "input_prompt", "inputPrompt", "description"]);
  const model = getFirstStringField(source, ["model", "modelId", "model_id", "endpoint", "endpointId"]);
  const timestamp = getFirstStringField(source, VIDEO_HISTORY_TIME_FIELDS) || new Date().toISOString();
  const status = getFirstStringField(source, ["status", "state", "providerStatus"]) || (url ? "completed" : "processing");

  return {
    id: requestId || url,
    requestId: requestId || undefined,
    url: url || undefined,
    status: status === "failed" && url ? "completed" : status,
    prompt: prompt || "从本地历史恢复的视频任务",
    model: model || "video",
    timestamp,
    updatedAt: timestamp,
    source: `localStorage:${sourceKey}`,
    recovered: true,
  };
}

function collectVideoEntriesFromValue(value, sourceKey, seen, depth = 0) {
  if (depth > 5 || value == null) return [];

  if (typeof value === "string") {
    if (!isMaybeVideoResultUrl(value)) return [];
    const dedupeKey = value.trim();
    if (seen.has(dedupeKey)) return [];
    seen.add(dedupeKey);
    return [
      buildRecoveredVideoEntry(
        {
          url: value.trim(),
          timestamp: new Date().toISOString(),
        },
        sourceKey,
        value,
      ),
    ].filter(Boolean);
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, 120)
      .flatMap((item) => collectVideoEntriesFromValue(item, sourceKey, seen, depth + 1));
  }

  if (typeof value !== "object") return [];

  const entries = [];
  const entry = buildRecoveredVideoEntry(value, sourceKey);
  if (entry) {
    const dedupeKey = entry.requestId || entry.url;
    if (dedupeKey && !seen.has(dedupeKey)) {
      seen.add(dedupeKey);
      entries.push(entry);
    }
  }

  Object.entries(value)
    .slice(0, 160)
    .forEach(([key, child]) => {
      if (/api.?key|token|secret|cookie|authorization/i.test(key)) return;
      if (VIDEO_RESULT_URL_FIELDS.includes(key) || VIDEO_REQUEST_ID_FIELDS.includes(key)) return;
      entries.push(...collectVideoEntriesFromValue(child, sourceKey, seen, depth + 1));
    });

  return entries;
}

function scanRecoverableVideoHistoryFromStorage() {
  if (typeof localStorage === "undefined") {
    return { entries: [], scannedKeys: 0, sourceKeys: [] };
  }

  const seen = new Set();
  const entries = [];
  const sourceKeys = new Set();
  let scannedKeys = 0;

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key || /api.?key|token|secret|cookie|authorization|api_provider|provider_config|api_config/i.test(key)) continue;
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    scannedKeys += 1;

    const maybeVideoKey = /video|seedance|task|history|generation|result|studio/i.test(key);
    let parsed = raw;
    try {
      parsed = JSON.parse(raw);
    } catch {
      if (!maybeVideoKey) continue;
    }

    const found = collectVideoEntriesFromValue(parsed, key, seen);
    if (found.length) {
      found.forEach((item) => {
        entries.push(item);
        sourceKeys.add(key);
      });
    }
  }

  return {
    entries: limitLocalVideoHistory(entries),
    scannedKeys,
    sourceKeys: Array.from(sourceKeys).slice(0, 8),
  };
}

function getLocalVideoHistoryKey(entry, index) {
  return getGenerationRequestId(entry) || getVideoResultUrl(entry) || `${entry?.timestamp || "video"}-${index}`;
}

function getVideoHistoryKeyCandidates(entry, index) {
  return Array.from(
    new Set(
      [
        getGenerationRequestId(entry),
        entry?.id,
        entry?.request_id,
        entry?.task_id,
        getVideoResultUrl(entry),
        entry?.timestamp ? `${entry.timestamp}-${index}` : null,
        getLocalVideoHistoryKey(entry, index),
      ]
        .filter(Boolean)
        .map(String),
    ),
  );
}

function isHiddenFailedVideoEntry(entry) {
  const resultUrl = getVideoResultUrl(entry);
  const status = String(entry?.status || (resultUrl ? "completed" : getGenerationRequestId(entry) ? "processing" : "")).toLowerCase();
  return !resultUrl && status === "failed";
}

function readDeletedVideoHistoryKeys() {
  if (typeof localStorage === "undefined") return new Set();
  try {
    const parsed = JSON.parse(localStorage.getItem(VIDEO_DELETED_HISTORY_KEY) || "[]");
    return new Set(Array.isArray(parsed) ? parsed.filter(Boolean) : []);
  } catch {
    return new Set();
  }
}

function writeDeletedVideoHistoryKeys(keys) {
  if (typeof localStorage === "undefined") return;
  try {
    const values = Array.from(keys).filter(Boolean).slice(-VIDEO_DELETED_HISTORY_LIMIT);
    localStorage.setItem(VIDEO_DELETED_HISTORY_KEY, JSON.stringify(values));
  } catch {
    // Best-effort only. The visible deletion still happens in component state.
  }
}

function rememberDeletedVideoHistoryKeys(keys) {
  const additions = Array.isArray(keys) ? keys.filter(Boolean) : [keys].filter(Boolean);
  if (!additions.length) return;
  const deletedKeys = readDeletedVideoHistoryKeys();
  additions.forEach((key) => deletedKeys.add(key));
  writeDeletedVideoHistoryKeys(deletedKeys);
}

function limitLocalVideoHistory(entries) {
  const normalized = normalizeLocalVideoHistory(Array.isArray(entries) ? entries : []);
  const seen = new Set();
  const deduped = normalized.filter((entry, index) => {
    const key = getLocalVideoHistoryKey(entry, index);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (deduped.length <= VIDEO_HISTORY_LIMIT) return deduped;

  const keep = [];
  const keepKeys = new Set();
  const add = (entry, index) => {
    const key = getLocalVideoHistoryKey(entry, index);
    if (!key || keepKeys.has(key) || keep.length >= VIDEO_HISTORY_LIMIT) return;
    keep.push(entry);
    keepKeys.add(key);
  };

  const recentBudget = Math.max(0, VIDEO_HISTORY_LIMIT - VIDEO_COMPLETED_HISTORY_RESERVE);
  deduped.slice(0, recentBudget).forEach(add);
  deduped
    .filter((entry) => getVideoResultUrl(entry))
    .slice(0, VIDEO_COMPLETED_HISTORY_RESERVE)
    .forEach(add);
  deduped.forEach(add);

  return keep.slice(0, VIDEO_HISTORY_LIMIT);
}

function mergeLocalVideoHistory(current, recovered) {
  return limitLocalVideoHistory([...(Array.isArray(recovered) ? recovered : []), ...(Array.isArray(current) ? current : [])]);
}

function buildMissingVideoUrlMessage(result) {
  const requestId = getGenerationRequestId(result);
  const status = result?.provider_status || result?.providerStatus || result?.status || result?.code || null;
  const detail = result?.error || result?.message || result?.detail || null;
  const parts = [];
  if (requestId) parts.push(`任务 ID：${requestId}`);
  if (status) parts.push(`状态：${String(status).slice(0, 80)}`);
  if (detail && detail !== status) parts.push(`信息：${String(detail).slice(0, 100)}`);
  return parts.length ? `接口未返回视频地址（${parts.join("，")}）` : "接口未返回视频地址";
}

function ensureVideoResult(result) {
  if (!result?.url) throw new Error(buildMissingVideoUrlMessage(result));
}

function summarizeErrorResponse(error) {
  if (error?.responseSummary) return String(error.responseSummary).slice(0, 220);
  if (!error?.response) return null;
  try {
    const summary = JSON.stringify(error.response);
    return summary.length > 220 ? `${summary.slice(0, 220)}...` : summary;
  } catch {
    return String(error.response).slice(0, 220);
  }
}

function getGenerationErrorMessage(error) {
  const message = String(error?.message || "生成失败");
  if (/real person|真人|人脸/i.test(message)) {
    return "参考图疑似包含真人人脸，Ark 已拒绝提交。请换虚拟人像、已入库授权素材或非人像素材。";
  }
  return message.length > 120 ? `${message.slice(0, 120)}...` : message;
}

function safePlayVideo(video) {
  if (!video?.play) return;
  try {
    const playPromise = video.play();
    if (playPromise?.catch) playPromise.catch(() => {});
  } catch {
    // Unsupported or not-yet-loaded sources are reported through onError.
  }
}

function resetVideoPreview(video) {
  if (!video) return;
  video.pause?.();
  try {
    video.currentTime = 0;
  } catch {
    // Some remote streams do not allow seeking before metadata is loaded.
  }
}

function getVideoElementErrorMessage(video) {
  const code = video?.error?.code;
  if (code === 4) return "视频地址暂不可播放，可能是上游返回了非视频链接或格式未转码完成。";
  if (code === 3) return "视频解码失败，请稍后刷新或下载源文件确认。";
  if (code === 2) return "视频加载中断，请检查网络或稍后重试。";
  return "视频预览失败，请尝试下载或稍后刷新。";
}

const SEEDANCE2_MODES = [
  { id: "t2v", label: "文生视频", description: "Prompt" },
  { id: "i2v", label: "单图生视频", description: "起始帧" },
  { id: "flf", label: "首尾帧", description: "首帧 + 尾帧" },
  { id: "omni", label: "多参考图", description: "最多 9 张" },
];

const SEEDANCE_REFERENCE_LIMIT = 9;
const IMAGE_STUDIO_PERSIST_KEY = "hg_image_studio_persistent";
const SEEDANCE_ASSET_FAVORITES_KEY = "hg_seedance_asset_favorites";
const SEEDANCE_LOCAL_ASSET_LIBRARY_KEY = "hg_seedance_local_asset_library";
const PROMPT_TEXTAREA_MAX_HEIGHT = 112;
const VIDEO_HISTORY_LIMIT = 160;
const VIDEO_COMPLETED_HISTORY_RESERVE = 60;
const VIDEO_DELETED_HISTORY_KEY = "hg_video_studio_deleted_history";
const VIDEO_DELETED_HISTORY_LIMIT = 400;
const SEEDANCE_LOCAL_ASSET_LIMIT = 120;

function createLocalPreviewUrl(file) {
  if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") return null;
  try {
    return URL.createObjectURL(file);
  } catch {
    return null;
  }
}

function revokeLocalPreviewUrl(url) {
  if (!url || !String(url).startsWith("blob:")) return;
  if (typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
    URL.revokeObjectURL(url);
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

function canPreviewImageUrl(value) {
  const raw = String(value || "").trim();
  return /^(https?:\/\/|data:image\/|blob:)/i.test(raw);
}

function isUsableSeedanceImageUrl(value, allowDataImage = false) {
  return isUsableRemoteImageUrl(value) || isUsableArkAssetUrl(value) || (allowDataImage && isUsableDataImageUrl(value));
}

function sanitizeSeedanceReferenceImages(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item?.url)
    .map((item, index) => ({
      id: item.id || `${Date.now()}_${index}`,
      url: item.url,
      name: item.name || `image-${index + 1}`,
      source: item.source || undefined,
      model: item.model || undefined,
      timestamp: item.timestamp || undefined,
      providerId: item.providerId || undefined,
      trustedForSeedance: Boolean(item.trustedForSeedance),
      trustedUntil: item.trustedUntil || undefined,
      localUpload: Boolean(item.localUpload),
      role: item.role || undefined,
      order: Number.isFinite(Number(item.order)) ? Number(item.order) : undefined,
    }))
    .slice(0, SEEDANCE_REFERENCE_LIMIT);
}

function pushImageHistoryEntry(target, seen, entry, fallbackName) {
  const url = normalizeSeedanceTrustedUrl(entry?.url || entry?.image_url || entry);
  if (!url || seen.has(url) || !isUsableSeedanceImageUrl(url, true)) return;
  seen.add(url);
  target.push({
    id: entry?.id || `history-${target.length}`,
    url,
    name: entry?.name || fallbackName || `历史图 ${target.length + 1}`,
    prompt: entry?.prompt || "",
    model: entry?.model || "",
    timestamp: entry?.timestamp || "",
    providerId: entry?.providerId || "",
    trustedForSeedance: Boolean(entry?.trustedForSeedance),
    trustedUntil: entry?.trustedUntil || "",
    source: entry?.source || "",
    localUpload: Boolean(entry?.localUpload),
    role: entry?.role || "",
    order: Number.isFinite(Number(entry?.order)) ? Number(entry.order) : undefined,
  });
}

function isTrustedHumanoidHistoryEntry(entry) {
  const model = String(entry?.model || "").toLowerCase();
  const providerId = String(entry?.providerId || "").toLowerCase();
  return Boolean(entry?.trustedForSeedance) || providerId === "seedance-ark" || model.includes("seedream");
}

function collectTrustedImageHistoryFromState(data) {
  const items = [];
  const seen = new Set();
  if (!data || typeof data !== "object") return items;

  (Array.isArray(data.localHistory) ? data.localHistory : []).forEach((entry, index) => {
    pushImageHistoryEntry(items, seen, entry, `历史图 ${index + 1}`);
  });
  (Array.isArray(data.uploadedImageUrls) ? data.uploadedImageUrls : []).forEach((url, index) => {
    pushImageHistoryEntry(items, seen, { url, name: `已选图 ${index + 1}` }, `已选图 ${index + 1}`);
  });

  return items.slice(0, 30);
}

function isLocalUploadAsset(entry) {
  return Boolean(entry?.localUpload) || entry?.source === "local-upload";
}

function getSeedanceAssetBadge(entry) {
  if (isLocalUploadAsset(entry)) return "本地";
  if (isTrustedHumanoidHistoryEntry(entry)) return "可信";
  return "其他";
}

function normalizeSeedanceAssetEntry(entry, fallbackName = "本地上传") {
  const url = normalizeSeedanceTrustedUrl(entry?.url);
  if (!url || !isUsableSeedanceImageUrl(url, true)) return null;
  return {
    id: entry?.id || `asset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    url,
    name: entry?.name || fallbackName,
    prompt: entry?.prompt || "",
    model: entry?.model || "local-upload",
    source: entry?.source || "",
    providerId: entry?.providerId || "",
    timestamp: entry?.timestamp || entry?.uploadedAt || new Date().toISOString(),
    uploadedAt: entry?.uploadedAt || entry?.timestamp || new Date().toISOString(),
    trustedForSeedance: Boolean(entry?.trustedForSeedance),
    trustedUntil: entry?.trustedUntil || "",
    localUpload: Boolean(entry?.localUpload || entry?.source === "local-upload"),
    role: entry?.role || "",
    order: Number.isFinite(Number(entry?.order)) ? Number(entry.order) : undefined,
  };
}

function mergeSeedanceAssetLibrary(existing, additions) {
  const seen = new Set();
  return [...(Array.isArray(additions) ? additions : []), ...(Array.isArray(existing) ? existing : [])]
    .map((entry, index) => normalizeSeedanceAssetEntry(entry, `本地上传 ${index + 1}`))
    .filter(Boolean)
    .filter((entry) => {
      if (seen.has(entry.url)) return false;
      seen.add(entry.url);
      return true;
    })
    .slice(0, SEEDANCE_LOCAL_ASSET_LIMIT);
}

function readSeedanceLocalAssetLibrary() {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(SEEDANCE_LOCAL_ASSET_LIBRARY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return mergeSeedanceAssetLibrary(parsed, []);
  } catch {
    return [];
  }
}

function writeSeedanceLocalAssetLibrary(items) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(SEEDANCE_LOCAL_ASSET_LIBRARY_KEY, JSON.stringify(mergeSeedanceAssetLibrary(items, [])));
  } catch (err) {
    console.warn("Failed to save local Seedance asset library:", err);
  }
}

function createLocalUploadAsset(file, url, role = "reference", model = "local-upload", providerId = "") {
  const normalizedUrl = normalizeSeedanceTrustedUrl(url);
  if (!normalizedUrl || !isUsableSeedanceImageUrl(normalizedUrl, true)) return null;
  return normalizeSeedanceAssetEntry({
    id: `local-upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    url: normalizedUrl,
    name: file?.name || "本地上传",
    model,
    source: "local-upload",
    providerId,
    localUpload: true,
    role,
    timestamp: new Date().toISOString(),
    uploadedAt: new Date().toISOString(),
  });
}

function findSeedanceAssetByUrl(assetLibrary, rawUrl) {
  const url = normalizeSeedanceTrustedUrl(rawUrl);
  if (!url) return null;
  return (Array.isArray(assetLibrary) ? assetLibrary : []).find((entry) => normalizeSeedanceTrustedUrl(entry?.url) === url) || null;
}

function buildVideoReferenceSet({ seedanceMode, referenceImages, firstFrameUrl, lastFrameUrl, assetLibrary }) {
  const ordered = [];
  const seen = new Set();
  const add = (rawUrl, role, order, source = {}) => {
    const url = normalizeSeedanceTrustedUrl(rawUrl);
    if (!url || seen.has(`${role}:${url}`) || !isUsableSeedanceImageUrl(url, true)) return;
    seen.add(`${role}:${url}`);
    const meta = findSeedanceAssetByUrl(assetLibrary, url) || source || {};
    ordered.push({
      id: meta.id || `${role}-${order}-${Date.now()}`,
      url,
      name: meta.name || source.name || role,
      prompt: meta.prompt || source.prompt || "",
      model: meta.model || source.model || "",
      source: meta.source || source.source || "",
      providerId: meta.providerId || source.providerId || "",
      trustedForSeedance: Boolean(meta.trustedForSeedance || source.trustedForSeedance),
      trustedUntil: meta.trustedUntil || source.trustedUntil || "",
      localUpload: Boolean(meta.localUpload || source.localUpload),
      uploadedAt: meta.uploadedAt || source.uploadedAt || "",
      role,
      order,
    });
  };

  if (seedanceMode === "omni") {
    sanitizeSeedanceReferenceImages(referenceImages).forEach((item, index) => {
      add(item.url, `image${index + 1}`, index + 1, item);
    });
  } else {
    add(firstFrameUrl, "first", 1);
    add(lastFrameUrl, "last", 2);
  }

  return ordered;
}

function getVideoReferenceSet(entry) {
  if (Array.isArray(entry?.referenceSet) && entry.referenceSet.length) {
    return entry.referenceSet
      .map((item, index) => normalizeSeedanceAssetEntry({ ...item, order: item.order || index + 1 }, `参考图 ${index + 1}`))
      .filter(Boolean)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  return buildVideoReferenceSet({
    seedanceMode: entry?.seedanceMode || (Array.isArray(entry?.referenceImages) && entry.referenceImages.length > 1 ? "omni" : "i2v"),
    referenceImages: entry?.referenceImages || [],
    firstFrameUrl: entry?.firstFrameUrl,
    lastFrameUrl: entry?.lastFrameUrl,
    assetLibrary: [],
  });
}

function getVideoReferenceRoleLabel(entry, index) {
  const role = String(entry?.role || "").toLowerCase();
  if (role.startsWith("image")) return `@${role}`;
  if (role === "first") return "首帧";
  if (role === "last") return "尾帧";
  return `图${index + 1}`;
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

// ── SVG icons (kept inline to avoid extra deps) ───────────────────────────────

const CheckSvg = () => (
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
);

const VideoIconSvg = ({ className }) => (
  <svg
    width="18"
    height="18"
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

const VideoReadySvg = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="text-primary"
  >
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    <polyline points="7 10 10 13 15 8" stroke="#d9ff00" strokeWidth="2.5" />
  </svg>
);

// ── Dropdown components ───────────────────────────────────────────────────────

function DropdownItem({ label, selected, onClick }) {
  return (
    <div
      className="flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl cursor-pointer transition-all group"
      onClick={onClick}
    >
      <span className="text-xs font-bold text-white opacity-80 group-hover:opacity-100 capitalize">
        {label}
      </span>
      {selected && <CheckSvg />}
    </div>
  );
}

function ModelDropdown({ imageMode, selectedModel, onSelect, onClose, t2vModelOptions, i2vModelOptions, v2vModelOptions }) {
  const [search, setSearch] = useState("");

  const generationModels = imageMode ? i2vModelOptions : t2vModelOptions;

  const lf = search.toLowerCase();
  const filteredMain = generationModels.filter(
    (m) => m.name.toLowerCase().includes(lf) || m.id.toLowerCase().includes(lf),
  );
  const filteredV2V = v2vModelOptions.filter(
    (m) => m.name.toLowerCase().includes(lf) || m.id.toLowerCase().includes(lf),
  );

  const getIconColor = (m, isV2V) => {
    if (isLocalStudioModel(m)) return "bg-emerald-500/10 text-emerald-300";
    if (isV2V) return "bg-orange-500/10 text-orange-400";
    if (m.id.includes("kling")) return "bg-blue-500/10 text-blue-400";
    if (m.id.includes("veo")) return "bg-purple-500/10 text-purple-400";
    if (m.id.includes("sora")) return "bg-rose-500/10 text-rose-400";
    return "bg-primary/10 text-primary";
  };

  const renderItem = (m, isV2V = false) => {
    const localInfo = isLocalStudioModel(m) ? m.localRuntime : null;
    return (
      <div
        key={m.id}
        className={`flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-white/5 ${selectedModel === m.id ? "bg-white/5 border-white/5" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(m, isV2V);
          onClose();
        }}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-10 h-10 ${getIconColor(m, isV2V)} border border-white/5 rounded-xl flex items-center justify-center font-black text-sm shadow-inner uppercase`}
          >
            {m.name.charAt(0)}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-white tracking-tight">
              {m.name}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {isV2V && (
                <span className="text-[9px] text-orange-400/70">
                  {m.imageField ? "上传视频和参考图" : "上传视频即可使用"}
                </span>
              )}
              {localInfo && (
                <span className={`w-fit rounded border px-1.5 py-0.5 text-[10px] font-black ${
                  localInfo.ready === false
                    ? "border-yellow-300/25 bg-yellow-300/10 text-yellow-100"
                    : "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                }`}>
                  {localInfo.ready === false ? "需配置" : "本地"}
                </span>
              )}
            </div>
          </div>
        </div>
        {selectedModel === m.id && <CheckSvg />}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full max-h-[70vh]">
      <div className="px-2 pb-3 mb-2 border-b border-white/5 shrink-0">
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
            onChange={(e) => setSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="bg-transparent border-none text-xs text-white focus:ring-0 w-full p-0 outline-none"
          />
        </div>
      </div>
      <div className="text-xs font-bold text-secondary px-3 py-2 shrink-0">
        视频模型
      </div>
      <div className="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-1 pb-2">
        {filteredMain.map((m) => renderItem(m, false))}
        {filteredV2V.length > 0 && (
          <>
            <div className="text-xs font-bold text-orange-400/70 px-3 py-2 mt-1 border-t border-white/5">
              视频工具
            </div>
            {filteredV2V.map((m) => renderItem(m, true))}
          </>
        )}
      </div>
    </div>
  );
}

// ── Control button ────────────────────────────────────────────────────────────

function ControlBtn({ icon, label, onClick, style }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className="flex items-center gap-1.5 md:gap-2.5 px-3 md:px-4 py-2 md:py-2.5 bg-white/5 hover:bg-white/10 rounded-xl md:rounded-2xl transition-all border border-white/5 group whitespace-nowrap"
    >
      {icon}
      <span className="text-xs font-bold text-white group-hover:text-primary transition-colors">
        {label}
      </span>
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        className="opacity-20 group-hover:opacity-100 transition-opacity"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
  );
}

// ── Dropdown panel ─────────────────────────────────────────────────────────────
// Rendered inside a `relative` wrapper div; floats above the anchor button.

// ── Main component ────────────────────────────────────────────────────────────

export default function VideoStudio({
  apiKey,
  apiConfig,
  onGenerationComplete,
  historyItems,
  droppedFiles,
  onFilesHandled,
  localRuntime,
}) {
  const PERSIST_KEY = "hg_video_studio_persistent";
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
  const activeApiProvider = useMemo(() => getActiveProvider(normalizedApiConfig), [normalizedApiConfig]);
  const activeProviderRequiresPublicImageUrl =
    activeApiProvider?.id === "hfsy" || String(activeApiProvider?.baseUrl || "").toLowerCase().includes("hfsyapi.cn");
  const activeProviderAllowsDataImage =
    activeApiProvider?.id === "seedance-ark" ||
    (String(activeApiProvider?.baseUrl || "").toLowerCase().includes("ark.") &&
      String(activeApiProvider?.baseUrl || "").toLowerCase().includes("volces.com"));
  const [localModelCatalog, setLocalModelCatalog] = useState({ image: [], videoT2V: [], videoI2V: [], warnings: [] });

  useEffect(() => {
    let cancelled = false;
    loadLocalRuntimeModelCatalog(localRuntime)
      .then((catalog) => {
        if (!cancelled) setLocalModelCatalog(catalog);
      })
      .catch((error) => {
        console.warn("[VideoStudio] Failed to load local model catalog:", error);
        if (!cancelled) setLocalModelCatalog({ image: [], videoT2V: [], videoI2V: [], warnings: [error?.message || "本地模型目录读取失败"] });
      });
    return () => {
      cancelled = true;
    };
  }, [localRuntime]);

  const localVideoT2VModels = useMemo(() => localModelCatalog.videoT2V || [], [localModelCatalog.videoT2V]);
  const localVideoI2VModels = useMemo(() => localModelCatalog.videoI2V || [], [localModelCatalog.videoI2V]);
  const activeVideoModelWhitelist = useMemo(
    () => getProviderVideoModelWhitelist(normalizedApiConfig, activeApiProvider?.id),
    [normalizedApiConfig, activeApiProvider?.id],
  );
  const seedanceT2VModelOptions = useMemo(
    () => filterVideoModelsByWhitelist(pickSeedanceVideoModels(t2vModels), activeVideoModelWhitelist),
    [activeVideoModelWhitelist],
  );
  const seedanceI2VModelOptions = useMemo(
    () => filterVideoModelsByWhitelist(pickSeedanceVideoModels(i2vModels), activeVideoModelWhitelist),
    [activeVideoModelWhitelist],
  );
  const t2vModelOptions = useMemo(() => [...seedanceT2VModelOptions, ...localVideoT2VModels], [localVideoT2VModels, seedanceT2VModelOptions]);
  const i2vModelOptions = useMemo(() => [...seedanceI2VModelOptions, ...localVideoI2VModels], [localVideoI2VModels, seedanceI2VModelOptions]);
  const v2vModelOptions = useMemo(() => [], []);

  // ── mode state ──
  const [imageMode, setImageMode] = useState(false); // i2v
  const [v2vMode, setV2vMode] = useState(false);
  const [seedanceMode, setSeedanceMode] = useState("t2v");

  // ── model / params ──
  const defaultModel = t2vModelOptions[0] || t2vModels[0];
  const [selectedModel, setSelectedModel] = useState(defaultModel.id);
  const [selectedModelName, setSelectedModelName] = useState(defaultModel.name);
  const [selectedAr, setSelectedAr] = useState(
    defaultModel.inputs?.aspect_ratio?.default || "16:9",
  );
  const [selectedDuration, setSelectedDuration] = useState(
    defaultModel.inputs?.duration?.default || 5,
  );
  const [selectedResolution, setSelectedResolution] = useState(
    defaultModel.inputs?.resolution?.default || "",
  );
  const [selectedQuality, setSelectedQuality] = useState(
    defaultModel.inputs?.quality?.default || "",
  );
  const [selectedMode, setSelectedMode] = useState("");

  // ── upload progress ──
  const [imageProgress, setImageProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);

  // ── control visibility ──
  const [showAr, setShowAr] = useState(true);
  const [showDuration, setShowDuration] = useState(true);
  const [showResolution, setShowResolution] = useState(false);
  const [showQuality, setShowQuality] = useState(false);
  const [showMode, setShowMode] = useState(false);

  // ── uploads ──
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadedEndImageUrl, setUploadedEndImageUrl] = useState(null);
  const [endImageUploading, setEndImageUploading] = useState(false);
  const [endImageProgress, setEndImageProgress] = useState(0);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [uploadedVideoName, setUploadedVideoName] = useState(null);
  const [seedanceReferenceImages, setSeedanceReferenceImages] = useState([]);
  const [seedanceReferenceUploading, setSeedanceReferenceUploading] = useState(false);
  const [seedanceReferenceProgress, setSeedanceReferenceProgress] = useState(0);
  const [trustedImageHistory, setTrustedImageHistory] = useState([]);
  const [showAssetGallery, setShowAssetGallery] = useState(false);
  const [assetGalleryTab, setAssetGalleryTab] = useState("human");
  const [assetGalleryFilter, setAssetGalleryFilter] = useState("all");
  const [favoriteAssetUrls, setFavoriteAssetUrls] = useState([]);

  // ── generation / canvas ──
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [fullscreenUrl, setFullscreenUrl] = useState(null);
  const [copiedVideoKey, setCopiedVideoKey] = useState(null);
  const [canvasUrl, setCanvasUrl] = useState(null);
  const [canvasModel, setCanvasModel] = useState(null);
  const [showCanvas, setShowCanvas] = useState(false);
  const [lastGenerationId, setLastGenerationId] = useState(null);
  const [lastGenerationModel, setLastGenerationModel] = useState(null);
  const previewErrorTimerRef = useRef(null);

  const showPreviewError = useCallback((message) => {
    setGenerateError(message);
    window.clearTimeout(previewErrorTimerRef.current);
    previewErrorTimerRef.current = window.setTimeout(() => setGenerateError(null), 6000);
  }, []);

  const handleVideoPreviewError = useCallback(
    (event) => {
      const video = event?.currentTarget || event?.target || event;
      const message = getVideoElementErrorMessage(video);
      console.warn("[VideoStudio] video preview failed", {
        message,
        src: video?.currentSrc || video?.src,
        code: video?.error?.code,
      });
      showPreviewError(message);
    },
    [showPreviewError],
  );

  // ── history ──
  const [localHistory, setLocalHistory] = useState([]);
  const [activeHistoryIdx, setActiveHistoryIdx] = useState(0);
  const [historyRecoveryReport, setHistoryRecoveryReport] = useState(null);
  const [historyRepairReport, setHistoryRepairReport] = useState(null);
  const [repairingHistory, setRepairingHistory] = useState(false);
  const [restoredVersion, setRestoredVersion] = useState(0);
  const [showAllVideoHistory, setShowAllVideoHistory] = useState(false);

  // ── dropdown ──
  const [openDropdown, setOpenDropdown] = useState(null); // 'model'|'ar'|'duration'|'resolution'|'quality'|'mode'|null

  // ── prompt ──
  const [prompt, setPrompt] = useState("");
  const [promptDisabled, setPromptDisabled] = useState(false);

  // ── refs ──
  const containerRef = useRef(null);
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);
  const imageFileInputRef = useRef(null);
  const endImageFileInputRef = useRef(null);
  const videoFileInputRef = useRef(null);
  const seedanceReferenceInputRef = useRef(null);
  const resultVideoRef = useRef(null);
  const hasRestored = useRef(false);
  const hasScannedVideoHistory = useRef(false);
  const resumingRequestsRef = useRef(new Set());
  const seedanceReferenceImagesRef = useRef([]);

  // ── derived data ──
  const history = historyItems ?? localHistory;
  const canManageHistory = !historyItems;
  const historyStats = useMemo(() => {
    return history.reduce(
      (acc, entry) => {
        const requestId = getGenerationRequestId(entry);
        const resultUrl = getVideoResultUrl(entry);
        const status = entry?.status || (resultUrl ? "completed" : requestId ? "processing" : "");
        acc.total += 1;
        if (resultUrl || status === "completed") acc.completed += 1;
        else if (status === "failed") acc.failed += 1;
        else acc.processing += 1;
        if (isSeedance2Model(entry?.model)) acc.seedance += 1;
        return acc;
      },
      { total: 0, completed: 0, processing: 0, failed: 0, seedance: 0 },
    );
  }, [history]);
  const visibleHistory = useMemo(
    () => history.filter((entry) => !isHiddenFailedVideoEntry(entry)),
    [history],
  );
  const displayedHistory = showAllVideoHistory ? visibleHistory : visibleHistory.slice(0, 1);
  const repairableHistoryCount = useMemo(
    () =>
      history.filter((entry) => {
        const requestId = getGenerationRequestId(entry);
        const resultUrl = getVideoResultUrl(entry);
        return Boolean(requestId && !resultUrl && !isHiddenFailedVideoEntry(entry));
      }).length,
    [history],
  );

  const readTrustedImageHistory = useCallback(() => {
    try {
      const stored = localStorage.getItem(IMAGE_STUDIO_PERSIST_KEY);
      const parsed = stored ? JSON.parse(stored) : null;
      const imageHistory = collectTrustedImageHistoryFromState(parsed);
      return mergeSeedanceAssetLibrary(imageHistory, readSeedanceLocalAssetLibrary());
    } catch (err) {
      console.warn("Failed to load ImageStudio history:", err);
      return readSeedanceLocalAssetLibrary();
    }
  }, []);

  const refreshTrustedImageHistory = useCallback(() => {
    const items = readTrustedImageHistory();
    setTrustedImageHistory(items);
    return items;
  }, [readTrustedImageHistory]);

  const addLocalSeedanceAssets = useCallback(
    (assets) => {
      const additions = (Array.isArray(assets) ? assets : [assets]).filter(Boolean);
      if (!additions.length) return [];
      const merged = mergeSeedanceAssetLibrary(readSeedanceLocalAssetLibrary(), additions);
      writeSeedanceLocalAssetLibrary(merged);
      setTrustedImageHistory((prev) => mergeSeedanceAssetLibrary(prev, additions));
      window.dispatchEvent(new Event("hg-task-center-refresh"));
      return merged;
    },
    [],
  );

  const getCurrentModels = useCallback(() => {
    if (v2vMode) return v2vModelOptions;
    return imageMode ? i2vModelOptions : t2vModelOptions;
  }, [imageMode, i2vModelOptions, t2vModelOptions, v2vMode, v2vModelOptions]);

  const getCurrentAspectRatios = useCallback(
    (id) => {
      const model = getCurrentModels().find((m) => m.id === id);
      const localOptions = getInputOptions(model, "aspect_ratio");
      if (localOptions.length > 0) return localOptions;
      return imageMode
        ? getAspectRatiosForI2VModel(id)
        : getAspectRatiosForVideoModel(id);
    },
    [getCurrentModels, imageMode],
  );

  const getCurrentDurations = useCallback(
    (id) => {
      const model = getCurrentModels().find((m) => m.id === id);
      const localOptions = getInputOptions(model, "duration");
      if (localOptions.length > 0) return localOptions;
      return imageMode ? getDurationsForI2VModel(id) : getDurationsForModel(id);
    },
    [getCurrentModels, imageMode],
  );

  const getCurrentResolutions = useCallback(
    (id) => {
      const model = getCurrentModels().find((m) => m.id === id);
      const localOptions = getInputOptions(model, "resolution");
      if (localOptions.length > 0) return localOptions;
      return imageMode
        ? getResolutionsForI2VModel(id)
        : getResolutionsForVideoModel(id);
    },
    [getCurrentModels, imageMode],
  );

  const getCurrentModel = useCallback(
    () => getCurrentModels().find((m) => m.id === selectedModel),
    [getCurrentModels, selectedModel],
  );

  const isMotionControlSelection = useCallback(
    (modelId, isV2v) => {
      if (!isV2v) return false;
      const m = v2vModelOptions.find((x) => x.id === modelId);
      return !!m?.imageField;
    },
    [v2vModelOptions],
  );

  // ── update controls when model/mode changes ──────────────────────────────
  const applyControlsForModel = useCallback(
    (modelId, isImageMode, isV2vMode) => {
      if (isV2vMode) {
        setShowAr(false);
        setShowDuration(false);
        setShowResolution(false);
        setShowQuality(false);
        setShowMode(false);
        return;
      }

      const modelList = isImageMode ? i2vModelOptions : t2vModelOptions;
      const model = modelList.find((m) => m.id === modelId);

      const localArs = getInputOptions(model, "aspect_ratio");
      const ars = localArs.length
        ? localArs
        : isImageMode
          ? getAspectRatiosForI2VModel(modelId)
          : getAspectRatiosForVideoModel(modelId);
      if (ars.length > 0) {
        setSelectedAr(getInputDefault(model, "aspect_ratio", ars[0]));
        setShowAr(true);
      } else {
        setShowAr(false);
      }

      const localDurations = getInputOptions(model, "duration");
      const durations = localDurations.length
        ? localDurations
        : isImageMode
          ? getDurationsForI2VModel(modelId)
          : getDurationsForModel(modelId);
      if (durations.length > 0) {
        setSelectedDuration(getInputDefault(model, "duration", durations[0]));
        setShowDuration(true);
      } else {
        setShowDuration(false);
      }

      const localResolutions = getInputOptions(model, "resolution");
      const resolutions = localResolutions.length
        ? localResolutions
        : isImageMode
          ? getResolutionsForI2VModel(modelId)
          : getResolutionsForVideoModel(modelId);
      if (resolutions.length > 0) {
        setSelectedResolution(getInputDefault(model, "resolution", resolutions[0]));
        setShowResolution(true);
      } else {
        setShowResolution(false);
      }

      const qualities = getQualitiesForModel(modelList, modelId);
      if (qualities.length > 0) {
        setSelectedQuality(model?.inputs?.quality?.default || qualities[0]);
        setShowQuality(true);
      } else {
        setSelectedQuality("");
        setShowQuality(false);
      }

      const modes = getModesForModel(modelId);
      if (modes.length > 0) {
        setSelectedMode(model?.inputs?.mode?.default || modes[0]);
        setShowMode(true);
      } else {
        setSelectedMode("");
        setShowMode(false);
      }
    },
    [i2vModelOptions, t2vModelOptions],
  );

  const pickSeedanceModel = useCallback(
    (modelList, preferredId) =>
      modelList.find((model) => model.id === preferredId) ||
      modelList.find((model) => isSeedance2Model(model)) ||
      modelList[0],
    [],
  );

  const selectSeedanceMode = useCallback(
    (modeId) => {
      if (modeId === "extend") return;
      const preferredId = selectedModel === "sd-2" ? "sd-2" : "sd-2-vip";
      const wantsImageMode = modeId === "i2v" || modeId === "flf" || modeId === "omni";
      const targetList = wantsImageMode ? i2vModelOptions : t2vModelOptions;
      const target = pickSeedanceModel(targetList, preferredId);

      if (!target) return;

      setSeedanceMode(modeId);
      setV2vMode(false);
      setImageMode(wantsImageMode);
      setSelectedModel(target.id);
      setSelectedModelName(target.name);
      applyControlsForModel(target.id, wantsImageMode, false);
      setPromptDisabled(false);
      if (modeId !== "extend") {
        setUploadedVideoUrl(null);
        setUploadedVideoName(null);
      }
    },
    [
      applyControlsForModel,
      i2vModelOptions,
      pickSeedanceModel,
      selectedModel,
      t2vModelOptions,
    ],
  );

  const uploadImageForCurrentModel = useCallback(
    async (file, onProgress, uploadApiConfig) => {
      const currentModel = getCurrentModel();
      if (isWan2gpRuntimeModel(currentModel)) {
        const uploadToWan2gp = localRuntime?.wan2gp?.uploadFile;
        if (typeof uploadToWan2gp !== "function") {
          throw new Error("Wan2GP 上传桥接不可用，请检查桌面端本地模型配置。");
        }

        onProgress?.(8);
        const buffer = await file.arrayBuffer();
        onProgress?.(35);
        const result = await uploadToWan2gp({
          name: file.name,
          type: file.type,
          bytes: new Uint8Array(buffer),
        });
        const url = getUploadResultUrl(result);
        if (!url) throw new Error("Wan2GP 上传成功但未返回可用文件地址。");
        onProgress?.(100);
        return url;
      }

      return uploadFile(apiKey, file, onProgress, uploadApiConfig);
    },
    [apiKey, getCurrentModel, localRuntime],
  );

  // ── Persistence: Load ────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PERSIST_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const restoreImageMode = Boolean(data.imageMode) && data.seedanceMode !== "t2v" && data.seedanceMode !== "extend";
        const restoreSeedanceMode =
          data.seedanceMode && data.seedanceMode !== "extend"
            ? data.seedanceMode
            : restoreImageMode
              ? "i2v"
              : "t2v";
        const restoreModelList = restoreImageMode ? i2vModelOptions : t2vModelOptions;
        const restoredModel =
          restoreModelList.find((model) => model.id === data.selectedModel) ||
          pickSeedanceModel(restoreModelList, data.selectedModel === "sd-2" ? "sd-2" : "sd-2-vip") ||
          defaultModel;

        setImageMode(restoreImageMode);
        setV2vMode(false);
        setSeedanceMode(restoreSeedanceMode);
        setSelectedModel(restoredModel.id);
        setSelectedModelName(restoredModel.name);
        if (data.selectedAr) setSelectedAr(data.selectedAr);
        if (data.selectedDuration) setSelectedDuration(data.selectedDuration);
        if (data.selectedResolution) setSelectedResolution(data.selectedResolution);
        if (data.selectedQuality) setSelectedQuality(data.selectedQuality);
        if (data.selectedMode) setSelectedMode(data.selectedMode);
        if (data.uploadedImageUrl) setUploadedImageUrl(data.uploadedImageUrl);
        if (data.uploadedEndImageUrl) setUploadedEndImageUrl(data.uploadedEndImageUrl);
        setUploadedVideoUrl(null);
        setUploadedVideoName(null);
        if (Array.isArray(data.seedanceReferenceImages)) {
          setSeedanceReferenceImages(sanitizeSeedanceReferenceImages(data.seedanceReferenceImages));
        }
        if (data.prompt) setPrompt(data.prompt);
        if (data.localHistory) setLocalHistory(limitLocalVideoHistory(data.localHistory));

        // Update control visibility based on restored model/mode
        applyControlsForModel(
          restoredModel.id,
          restoreImageMode,
          false
        );
      }
    } catch (err) {
      console.warn("Failed to load VideoStudio persistence:", err);
    } finally {
      hasRestored.current = true;
      setRestoredVersion((value) => value + 1);
    }
  }, [applyControlsForModel, defaultModel, i2vModelOptions, pickSeedanceModel, t2vModelOptions]);

  // ── Adjust height on load ────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (textareaRef.current) {
        const el = textareaRef.current;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, PROMPT_TEXTAREA_MAX_HEIGHT) + "px";
      }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // ── Persistence: Save ────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const state = {
          imageMode,
          v2vMode,
          seedanceMode,
          selectedModel,
          selectedModelName,
          selectedAr,
          selectedDuration,
          selectedResolution,
          selectedQuality,
          selectedMode,
          uploadedImageUrl,
          uploadedEndImageUrl,
          uploadedVideoUrl,
          uploadedVideoName,
          seedanceReferenceImages: sanitizeSeedanceReferenceImages(seedanceReferenceImages),
          prompt,
          localHistory: limitLocalVideoHistory(localHistory),
        };
        localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
        window.dispatchEvent(new Event("hg-task-center-refresh"));
      } catch (err) {
        console.warn("Failed to save VideoStudio persistence:", err);
      }
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [
    imageMode,
    v2vMode,
    seedanceMode,
    selectedModel,
    selectedModelName,
    selectedAr,
    selectedDuration,
    selectedResolution,
    selectedQuality,
    selectedMode,
    uploadedImageUrl,
    uploadedEndImageUrl,
    uploadedVideoUrl,
    uploadedVideoName,
    seedanceReferenceImages,
    prompt,
    localHistory,
  ]);

  useEffect(() => {
    seedanceReferenceImagesRef.current = seedanceReferenceImages;
  }, [seedanceReferenceImages]);

  useEffect(() => {
    refreshTrustedImageHistory();
    window.addEventListener("storage", refreshTrustedImageHistory);
    return () => window.removeEventListener("storage", refreshTrustedImageHistory);
  }, [refreshTrustedImageHistory]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEEDANCE_ASSET_FAVORITES_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setFavoriteAssetUrls(parsed.map(normalizeSeedanceTrustedUrl).filter(Boolean).slice(0, 200));
      }
    } catch (err) {
      console.warn("Failed to load Seedance asset favorites:", err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SEEDANCE_ASSET_FAVORITES_KEY, JSON.stringify(favoriteAssetUrls.slice(0, 200)));
    } catch (err) {
      console.warn("Failed to save Seedance asset favorites:", err);
    }
  }, [favoriteAssetUrls]);

  useEffect(() => {
    return () => {
      seedanceReferenceImagesRef.current.forEach((item) => revokeLocalPreviewUrl(item.previewUrl));
      window.clearTimeout(previewErrorTimerRef.current);
    };
  }, []);

  const updateLocalHistoryTask = useCallback((requestId, patch) => {
    if (!requestId) return;
    setLocalHistory((prev) =>
      prev.map((entry) =>
        getGenerationRequestId(entry) === requestId
          ? { ...entry, ...patch, updatedAt: new Date().toISOString() }
          : entry,
      ),
    );
  }, []);

  useEffect(() => {
    if (!hasRestored.current || !localHistory.length) return;

    localHistory.forEach((entry) => {
      const requestId = getGenerationRequestId(entry);
      const resultUrl = getVideoResultUrl(entry);
      const isPending =
        requestId &&
        !resultUrl &&
        entry.status !== "completed" &&
        entry.status !== "failed";

      if (!isPending || resumingRequestsRef.current.has(requestId)) return;

      resumingRequestsRef.current.add(requestId);
      const submittedAt = Date.parse(entry.submittedAt || entry.timestamp || "");
      const elapsedAttempts = Number.isFinite(submittedAt)
        ? Math.floor(Math.max(0, Date.now() - submittedAt) / 2000)
        : 0;
      const attemptsLeft = Math.max(1, (entry.maxAttempts || 900) - elapsedAttempts);
      const pollApiConfig =
        entry.providerId === "seedance-ark" || isSeedance2Model(entry.model)
          ? seedanceArkApiConfig
          : normalizedApiConfig;

      pollForResult(
        requestId,
        apiKey,
        attemptsLeft,
        entry.interval || 2000,
        pollApiConfig,
        (status) => {
          updateLocalHistoryTask(requestId, {
            status: status.status || "processing",
            providerStatus: status.provider_status,
            pollAttempt: status.attempt,
            maxAttempts: status.maxAttempts,
            responseSummary: status.responseSummary,
            lastStatusAt: new Date().toISOString(),
            requestId,
          });
        },
      )
        .then((result) => {
          ensureVideoResult(result);
          updateLocalHistoryTask(requestId, {
            url: result.url,
            status: "completed",
            providerStatus: result.provider_status,
            requestId,
            request_id: result.request_id || requestId,
            task_id: result.task_id || requestId,
            completedAt: new Date().toISOString(),
          });
          if (isSeedance2Model(entry.model)) {
            setLastGenerationId(requestId);
            setLastGenerationModel(entry.model);
          }
          onGenerationComplete?.({
            url: result.url,
            model: entry.model,
            prompt: entry.prompt || "",
            type: "video",
          });
        })
        .catch((error) => {
          updateLocalHistoryTask(requestId, {
            status: "failed",
            error: error.message?.slice(0, 120) || "生成失败",
            responseSummary: summarizeErrorResponse(error),
          });
        })
        .finally(() => {
          resumingRequestsRef.current.delete(requestId);
        });
    });
  }, [apiKey, localHistory, normalizedApiConfig, onGenerationComplete, seedanceArkApiConfig, updateLocalHistoryTask]);

  // ── Derived UI values ────────────────────────────────────────────────────

  const processDroppedImage = useCallback(async (file) => {
    if (file.size > 10 * 1024 * 1024) {
      alert("图片超过 10MB 限制。");
      return;
    }
    setImageUploading(true);
    setImageProgress(0);
    try {
      const uploadApiConfig = isSeedance2Model(selectedModel) ? seedanceArkApiConfig : normalizedApiConfig;
      const currentUploadModel = getCurrentModel();
      const usesWan2gpUpload = isWan2gpRuntimeModel(currentUploadModel);
      const url = await uploadImageForCurrentModel(file, (pct) => {
        setImageProgress(pct);
      }, uploadApiConfig);
      setUploadedImageUrl(url);
      if (!usesWan2gpUpload) {
        addLocalSeedanceAssets(
          createLocalUploadAsset(
            file,
            url,
            "first",
            isSeedance2Model(selectedModel) ? selectedModel : "local-upload",
            isSeedance2Model(selectedModel) ? "seedance-ark" : activeApiProvider?.id,
          ),
        );
      }
      setUploadedVideoUrl(null);
      setUploadedVideoName(null);
      setV2vMode(false);
      if (isSeedance2Model(selectedModel) && (seedanceMode === "t2v" || seedanceMode === "extend")) {
        setSeedanceMode("i2v");
      }
      if (!imageMode) {
        const currentT2V = t2vModelOptions.find((m) => m.id === selectedModel);
        const exactSibling = currentT2V
          ? i2vModelOptions.find((m) => m.id === currentT2V.id)
          : null;
        const familySibling = currentT2V?.family
          ? i2vModelOptions.find((m) => m.family === currentT2V.family)
          : null;
        const target = exactSibling || familySibling || i2vModelOptions[0] || i2vModels[0];
        setImageMode(true);
        setSelectedModel(target.id);
        setSelectedModelName(target.name);
        applyControlsForModel(target.id, true, false);
      }
      setPromptDisabled(false);
    } catch (err) {
      alert(`图片上传失败：${err.message}`);
    } finally {
      setImageUploading(false);
      setImageProgress(0);
    }
  }, [
    activeApiProvider?.id,
    addLocalSeedanceAssets,
    applyControlsForModel,
    getCurrentModel,
    i2vModelOptions,
    imageMode,
    normalizedApiConfig,
    seedanceArkApiConfig,
    seedanceMode,
    selectedModel,
    t2vModelOptions,
    uploadImageForCurrentModel,
  ]);

  const processDroppedVideo = useCallback(async () => {
    alert("当前视频创作只开放 Seedance 2.0 文生/图生/多参考图，视频上传工具暂时关闭。");
  }, []);

  // ── Handle Dropped Files ────────────────────────────────────────────────
  useEffect(() => {
    if (droppedFiles && droppedFiles.length > 0) {
      const imageFiles = droppedFiles.filter(f => f.type.startsWith('image/'));
      const videoFiles = droppedFiles.filter(f => f.type.startsWith('video/'));
      
      if (videoFiles.length > 0) {
        processDroppedVideo(videoFiles[0]);
      } else if (imageFiles.length > 0) {
        processDroppedImage(imageFiles[0]);
      }
      onFilesHandled?.();
    }
  }, [droppedFiles, onFilesHandled, processDroppedImage, processDroppedVideo]);

  // Initialise controls for default model on mount
  useEffect(() => {
    if (hasRestored.current) return;
    applyControlsForModel(defaultModel.id, false, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const currentModels = getCurrentModels();
    if (selectedModel === "seedance-v2.0-extend") return;
    if (currentModels.some((model) => model.id === selectedModel)) return;
    const fallback = currentModels[0] || defaultModel;
    if (!fallback) return;

    setSelectedModel(fallback.id);
    setSelectedModelName(fallback.name);
    applyControlsForModel(fallback.id, imageMode, v2vMode);
  }, [applyControlsForModel, defaultModel, getCurrentModels, imageMode, selectedModel, v2vMode]);

  // ── close dropdown on outside click ─────────────────────────────────────
  useEffect(() => {
    if (!openDropdown) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [openDropdown]);

  // ── textarea auto-resize ──────────────────────────────────────────────────
  const handlePromptInput = (e) => {
    setPrompt(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, PROMPT_TEXTAREA_MAX_HEIGHT) + "px";
  };

  // ── image upload ─────────────────────────────────────────────────────────
  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("图片超过 10MB 限制。");
      return;
    }
    setImageUploading(true);
    setImageProgress(0);

    try {
      const uploadApiConfig = isSeedance2Model(selectedModel) ? seedanceArkApiConfig : normalizedApiConfig;
      const currentUploadModel = getCurrentModel();
      const usesWan2gpUpload = isWan2gpRuntimeModel(currentUploadModel);
      const url = await uploadImageForCurrentModel(file, (pct) => {
        setImageProgress(pct);
      }, uploadApiConfig);
      setUploadedImageUrl(url);
      if (!usesWan2gpUpload) {
        addLocalSeedanceAssets(
          createLocalUploadAsset(
            file,
            url,
            "first",
            isSeedance2Model(selectedModel) ? selectedModel : "local-upload",
            isSeedance2Model(selectedModel) ? "seedance-ark" : activeApiProvider?.id,
          ),
        );
      }

      // Motion-control v2v: image is a second input, not a mode switch
      if (isMotionControlSelection(selectedModel, v2vMode)) {
        setPromptDisabled(false);
      } else {
        // Clear v2v if active
        setUploadedVideoUrl(null);
        setUploadedVideoName(null);
        setV2vMode(false);

        if (!imageMode) {
          const currentT2V = t2vModelOptions.find((m) => m.id === selectedModel);
          const exactSibling = currentT2V
            ? i2vModelOptions.find((m) => m.id === currentT2V.id)
            : null;
          const familySibling = currentT2V?.family
            ? i2vModelOptions.find((m) => m.family === currentT2V.family)
            : null;
          const target = exactSibling || familySibling || i2vModelOptions[0] || i2vModels[0];
          setImageMode(true);
          setSelectedModel(target.id);
          setSelectedModelName(target.name);
          applyControlsForModel(target.id, true, false);
        }
        if (isSeedance2Model(selectedModel) && (seedanceMode === "t2v" || seedanceMode === "extend")) {
          setSeedanceMode("i2v");
        }
        setPromptDisabled(false);
      }
    } catch (err) {
      console.error("[VideoStudio] Image upload failed:", err);
      alert(`图片上传失败：${err.message}`);
    } finally {
      setImageUploading(false);
      setImageProgress(0);
      if (imageFileInputRef.current) imageFileInputRef.current.value = "";
    }
  };

  const clearImageUpload = () => {
    setUploadedImageUrl(null);
    setUploadedEndImageUrl(null);
    // Motion-control v2v: keep model and video; just drop the image
    if (isMotionControlSelection(selectedModel, v2vMode)) return;
    if (isSeedance2Model(selectedModel)) setSeedanceMode("t2v");
    setImageMode(false);
    const first = t2vModelOptions[0] || t2vModels[0];
    setSelectedModel(first.id);
    setSelectedModelName(first.name);
    applyControlsForModel(first.id, false, false);
    setPromptDisabled(false);
  };

  // ── end-frame upload (FLF i2v models) ──────────────────────────────────────
  const handleEndImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("图片超过 10MB 限制。");
      return;
    }
    setEndImageUploading(true);
    setEndImageProgress(0);
    try {
      const url = await uploadFile(apiKey, file, (pct) => {
        setEndImageProgress(pct);
      }, seedanceArkApiConfig);
      setUploadedEndImageUrl(url);
      addLocalSeedanceAssets(createLocalUploadAsset(file, url, "last", selectedModel, "seedance-ark"));
      if (isSeedance2Model(selectedModel)) {
        setSeedanceMode("flf");
      }
    } catch (err) {
      alert(`结束帧上传失败：${err.message}`);
    } finally {
      setEndImageUploading(false);
      setEndImageProgress(0);
      if (endImageFileInputRef.current) endImageFileInputRef.current.value = "";
    }
  };

  const clearEndImage = () => {
    setUploadedEndImageUrl(null);
    if (isSeedance2Model(selectedModel) && seedanceMode === "flf") {
      setSeedanceMode("i2v");
    }
  };

  const handleSeedanceReferenceFileChange = async (e) => {
    const files = Array.from(e.target.files || []).filter((file) => file.type.startsWith("image/"));
    if (!files.length) return;

    const room = SEEDANCE_REFERENCE_LIMIT - seedanceReferenceImages.length;
    if (room <= 0) {
      alert(`Seedance 2.0 最多支持 ${SEEDANCE_REFERENCE_LIMIT} 张参考图。`);
      if (seedanceReferenceInputRef.current) seedanceReferenceInputRef.current.value = "";
      return;
    }

    const uploadFiles = files.slice(0, room);
    const oversized = uploadFiles.find((file) => file.size > 10 * 1024 * 1024);
    if (oversized) {
      alert(`参考图 ${oversized.name} 超过 10MB 限制。`);
      if (seedanceReferenceInputRef.current) seedanceReferenceInputRef.current.value = "";
      return;
    }

    setSeedanceReferenceUploading(true);
    setSeedanceReferenceProgress(0);
    selectSeedanceMode("omni");

    const uploaded = [];
    try {
      for (let index = 0; index < uploadFiles.length; index += 1) {
        const file = uploadFiles[index];
        const url = await uploadFile(apiKey, file, (pct) => {
          const overall = Math.round(((index + pct / 100) / uploadFiles.length) * 100);
          setSeedanceReferenceProgress(overall);
        }, seedanceArkApiConfig);
        uploaded.push({
          id: `${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`,
          url,
          previewUrl: createLocalPreviewUrl(file),
          name: file.name,
          source: "local-upload",
          localUpload: true,
          role: `image${seedanceReferenceImages.length + index + 1}`,
          order: seedanceReferenceImages.length + index + 1,
          model: selectedModel,
          providerId: "seedance-ark",
          timestamp: new Date().toISOString(),
        });
      }
      addLocalSeedanceAssets(uploaded.map((item) => ({ ...item, previewUrl: undefined })));
      setSeedanceReferenceImages((prev) => {
        const next = [...prev, ...uploaded].slice(0, SEEDANCE_REFERENCE_LIMIT);
        uploaded.forEach((item) => {
          if (!next.includes(item)) revokeLocalPreviewUrl(item.previewUrl);
        });
        return next;
      });
      setPromptDisabled(false);
    } catch (err) {
      uploaded.forEach((item) => revokeLocalPreviewUrl(item.previewUrl));
      alert(`参考图上传失败：${err.message}`);
    } finally {
      setSeedanceReferenceUploading(false);
      setSeedanceReferenceProgress(0);
      if (seedanceReferenceInputRef.current) seedanceReferenceInputRef.current.value = "";
    }
  };

  const removeSeedanceReferenceImage = useCallback((id) => {
    setSeedanceReferenceImages((prev) => {
      const target = prev.find((item) => item.id === id);
      revokeLocalPreviewUrl(target?.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const clearSeedanceReferenceImages = useCallback(() => {
    setSeedanceReferenceImages((prev) => {
      prev.forEach((item) => revokeLocalPreviewUrl(item.previewUrl));
      return [];
    });
  }, []);

  const moveSeedanceReferenceImage = useCallback((index, direction) => {
    setSeedanceReferenceImages((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  }, []);

  // ── video upload ─────────────────────────────────────────────────────────
  const handleVideoFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    alert("当前视频创作只开放 Seedance 2.0 文生/图生/多参考图，视频上传工具暂时关闭。");
    if (videoFileInputRef.current) videoFileInputRef.current.value = "";
  };

  const clearVideoUpload = () => {
    setUploadedVideoUrl(null);
    setUploadedVideoName(null);
    setV2vMode(false);
    const first = t2vModelOptions[0] || t2vModels[0];
    setSelectedModel(first.id);
    setSelectedModelName(first.name);
    applyControlsForModel(first.id, false, false);
    setPromptDisabled(false);
  };

  // ── model selection from dropdown ─────────────────────────────────────────
  const handleModelSelect = useCallback(
    (m, isV2V) => {
      if (isV2V) {
        setV2vMode(true);
        setImageMode(false);
        const isMC = !!m.imageField;
        if (!isMC) {
          // Single-input v2v (watermark remover etc.) — drop any image
          setUploadedImageUrl(null);
        }
        setSelectedModel(m.id);
        setSelectedModelName(m.name);
        applyControlsForModel(m.id, false, true);
        if (isMC) {
          // Motion-control: prompt is editable, video+image are needed
          setPromptDisabled(false);
        } else {
          setPrompt("");
          setPromptDisabled(true);
        }
      } else {
        if (isLocalStudioModel(m)) {
          const wantsImageMode = Boolean(m.localRuntime?.needsImage);
          setV2vMode(false);
          setImageMode(wantsImageMode);
          setSeedanceMode(wantsImageMode ? "i2v" : "t2v");
          setUploadedVideoUrl(null);
          setUploadedVideoName(null);
          if (!wantsImageMode) {
            setUploadedImageUrl(null);
            setUploadedEndImageUrl(null);
          }
          setSelectedModel(m.id);
          setSelectedModelName(m.name);
          applyControlsForModel(m.id, wantsImageMode, false);
          setPromptDisabled(false);
          return;
        }

        if (v2vMode) {
          setV2vMode(false);
          setUploadedVideoUrl(null);
          setUploadedVideoName(null);
          setPromptDisabled(false);
        }
        setSelectedModel(m.id);
        setSelectedModelName(m.name);
        applyControlsForModel(m.id, imageMode, false);
        if (isSeedance2Model(m)) {
          if (m.requiresRequestId || m.id === "seedance-v2.0-extend") {
            setSeedanceMode("extend");
          } else if (imageMode && seedanceMode !== "flf" && seedanceMode !== "omni") {
            setSeedanceMode("i2v");
          } else if (!imageMode) {
            setSeedanceMode("t2v");
          }
        }
      }
    },
    [v2vMode, imageMode, seedanceMode, applyControlsForModel],
  );

  // ── local task/history helpers ────────────────────────────────────────────
  const upsertLocalHistory = useCallback((entry) => {
    setLocalHistory((prev) => {
      const key = getGenerationRequestId(entry);
      const existingIndex = prev.findIndex((item) => {
        const itemKey = getGenerationRequestId(item);
        return key && itemKey === key;
      });
      if (existingIndex === -1) {
        return limitLocalVideoHistory([entry, ...prev]);
      }

      const next = [...prev];
      next[existingIndex] = {
        ...next[existingIndex],
        ...entry,
        id: next[existingIndex].id || entry.id,
        requestId: getGenerationRequestId(entry) || getGenerationRequestId(next[existingIndex]),
        updatedAt: new Date().toISOString(),
      };
      return limitLocalVideoHistory(next);
    });
    setActiveHistoryIdx(0);
  }, []);

  const addToLocalHistory = upsertLocalHistory;

  const getVideoHistoryEntryKey = useCallback((entry, idx) => {
    return getGenerationRequestId(entry) || entry?.id || entry?.url || `${entry?.timestamp || "video"}-${idx}`;
  }, []);

  const handleCopyVideoText = useCallback(
    async (entry, idx, type, value) => {
      if (!value) return;
      const copied = await copyTextToClipboard(value);
      if (!copied) {
        showPreviewError("无法复制内容");
        return;
      }

      const key = `${getVideoHistoryEntryKey(entry, idx)}:${type}`;
      setCopiedVideoKey(key);
      window.setTimeout(() => {
        setCopiedVideoKey((current) => (current === key ? null : current));
      }, 1600);
    },
    [getVideoHistoryEntryKey, showPreviewError],
  );

  const handleOpenVideoUrl = useCallback((url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const handleDeleteHistoryEntry = useCallback(
    (entry, idx) => {
      if (!canManageHistory || !entry) return;
      const targetKey = getVideoHistoryEntryKey(entry, idx);
      const requestId = getGenerationRequestId(entry);

      rememberDeletedVideoHistoryKeys(getVideoHistoryKeyCandidates(entry, idx));
      setLocalHistory((prev) => prev.filter((item, itemIdx) => getVideoHistoryEntryKey(item, itemIdx) !== targetKey));
      if (requestId) {
        resumingRequestsRef.current.delete(requestId);
      }
      const resultUrl = getVideoResultUrl(entry);
      if (resultUrl && fullscreenUrl === resultUrl) {
        setFullscreenUrl(null);
      }
      if (resultUrl && canvasUrl === resultUrl) {
        setCanvasUrl(null);
        setShowCanvas(false);
      }
      if (requestId && lastGenerationId === requestId) {
        setLastGenerationId(null);
        setLastGenerationModel(null);
      }
      setActiveHistoryIdx(0);
    },
    [canManageHistory, canvasUrl, fullscreenUrl, getVideoHistoryEntryKey, lastGenerationId],
  );

  const handleClearHistory = useCallback(() => {
    if (!canManageHistory || localHistory.length === 0) return;
    const confirmed = window.confirm("清空全部视频历史和任务记录？");
    if (!confirmed) return;

    rememberDeletedVideoHistoryKeys(localHistory.flatMap((entry, index) => getVideoHistoryKeyCandidates(entry, index)));
    resumingRequestsRef.current.clear();
    setLocalHistory([]);
    setFullscreenUrl(null);
    setCanvasUrl(null);
    setShowCanvas(false);
    setLastGenerationId(null);
    setLastGenerationModel(null);
    setActiveHistoryIdx(0);
  }, [canManageHistory, getVideoHistoryEntryKey, localHistory]);

  const recoverVideoHistoryFromStorage = useCallback(
    (manual = false) => {
      if (!canManageHistory) return null;
      const scan = scanRecoverableVideoHistoryFromStorage();
      const deletedKeys = readDeletedVideoHistoryKeys();
      const recoverableEntries = scan.entries.filter((entry, index) => {
        const keyCandidates = getVideoHistoryKeyCandidates(entry, index);
        return keyCandidates.length && !keyCandidates.some((key) => deletedKeys.has(key));
      });
      let added = 0;

      setLocalHistory((prev) => {
        const currentKeys = new Set();
        normalizeLocalVideoHistory(prev).forEach((entry, index) => {
          getVideoHistoryKeyCandidates(entry, index).forEach((key) => currentKeys.add(key));
        });
        const fresh = recoverableEntries.filter((entry, index) => {
          const keyCandidates = getVideoHistoryKeyCandidates(entry, index);
          return keyCandidates.length && !keyCandidates.some((key) => currentKeys.has(key));
        });
        added = fresh.length;
        return mergeLocalVideoHistory(prev, fresh);
      });

      setHistoryRecoveryReport({
        scannedKeys: scan.scannedKeys,
        found: recoverableEntries.length,
        added,
        manual,
        timestamp: new Date().toISOString(),
      });
      return scan;
    },
    [canManageHistory],
  );

  useEffect(() => {
    if (!canManageHistory || !restoredVersion || hasScannedVideoHistory.current) return;
    hasScannedVideoHistory.current = true;
    const timer = window.setTimeout(() => {
      recoverVideoHistoryFromStorage(false);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [canManageHistory, recoverVideoHistoryFromStorage, restoredVersion]);

  const repairVideoHistoryTasks = useCallback(async () => {
    if (!canManageHistory || repairingHistory) return;
    const seen = new Set();
    const candidates = localHistory
      .filter((entry) => {
        const requestId = getGenerationRequestId(entry);
        if (!requestId || getVideoResultUrl(entry) || isHiddenFailedVideoEntry(entry) || seen.has(requestId)) return false;
        seen.add(requestId);
        return true;
      })
      .slice(0, 12);

    if (!candidates.length) {
      setHistoryRepairReport({
        checked: 0,
        fixed: 0,
        failed: 0,
        message: "没有可重新查询的任务 ID。",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    setRepairingHistory(true);
    setHistoryRepairReport({
      checked: 0,
      fixed: 0,
      failed: 0,
      total: candidates.length,
      message: "正在重新查询任务结果...",
      timestamp: new Date().toISOString(),
    });

    let checked = 0;
    let fixed = 0;
    let failed = 0;

    for (const entry of candidates) {
      const requestId = getGenerationRequestId(entry);
      const pollApiConfig =
        entry.providerId === "seedance-ark" || isSeedance2Model(entry.model)
          ? seedanceArkApiConfig
          : normalizedApiConfig;

      updateLocalHistoryTask(requestId, {
        status: "processing",
        error: "正在重新查询任务结果...",
        lastStatusAt: new Date().toISOString(),
      });

      try {
        const result = await pollForResult(
          requestId,
          apiKey,
          3,
          1000,
          pollApiConfig,
          (status) => {
            updateLocalHistoryTask(requestId, {
              status: status.status || "processing",
              providerStatus: status.provider_status,
              pollAttempt: status.attempt,
              maxAttempts: status.maxAttempts,
              responseSummary: status.responseSummary,
              lastStatusAt: new Date().toISOString(),
              requestId,
            });
          },
        );
        ensureVideoResult(result);
        fixed += 1;
        updateLocalHistoryTask(requestId, {
          url: result.url,
          failedUrl: undefined,
          status: "completed",
          error: "",
          previewError: "",
          providerStatus: result.provider_status,
          requestId,
          request_id: result.request_id || requestId,
          task_id: result.task_id || requestId,
          completedAt: new Date().toISOString(),
        });
        if (isSeedance2Model(entry.model)) {
          setLastGenerationId(requestId);
          setLastGenerationModel(entry.model);
        }
        onGenerationComplete?.({
          url: result.url,
          model: entry.model,
          prompt: entry.prompt || "",
          type: "video",
        });
      } catch (error) {
        failed += 1;
        updateLocalHistoryTask(requestId, {
          status: "failed",
          error: `重新查询失败：${String(error?.message || "未知错误").slice(0, 100)}`,
          responseSummary: summarizeErrorResponse(error),
          lastStatusAt: new Date().toISOString(),
        });
      } finally {
        checked += 1;
        setHistoryRepairReport({
          checked,
          fixed,
          failed,
          total: candidates.length,
          message: fixed > 0 ? `已恢复 ${fixed} 条视频结果。` : "已重新查询任务结果。",
          timestamp: new Date().toISOString(),
        });
      }
    }

    setRepairingHistory(false);
  }, [
    apiKey,
    canManageHistory,
    localHistory,
    normalizedApiConfig,
    onGenerationComplete,
    repairingHistory,
    seedanceArkApiConfig,
    updateLocalHistoryTask,
  ]);

  // ── show result in canvas ─────────────────────────────────────────────────
  const showVideoInCanvas = useCallback((url, model) => {
    setCanvasUrl(url);
    setCanvasModel(model);
    setShowCanvas(true);
  }, []);

  // ── generate ──────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    const currentModel = getCurrentModel();
    const usesLocalRuntimeVideoModel = isLocalStudioModel(currentModel);
    const isExtendMode = currentModel?.requiresRequestId || selectedModel === "seedance-v2.0-extend";
    const trimmedPrompt = prompt.trim();
    const isSeedance2 = isSeedance2Model(currentModel || selectedModel);
    const effectiveSeedanceMode = isSeedance2 && isExtendMode ? "extend" : seedanceMode;
    const allowSeedanceDataImage = activeProviderAllowsDataImage || isSeedance2;
    const seedanceReferenceUrls = seedanceReferenceImages
      .map((item) => item.url)
      .filter((url) => isUsableSeedanceImageUrl(url, allowSeedanceDataImage));
    const hasInvalidSeedanceReferenceUrl = seedanceReferenceImages.some(
      (item) => item?.url && !isUsableSeedanceImageUrl(item.url, allowSeedanceDataImage),
    );
    const seedanceReferenceHistory = sanitizeSeedanceReferenceImages(seedanceReferenceImages);
    const videoReferenceSet = buildVideoReferenceSet({
      seedanceMode: effectiveSeedanceMode,
      referenceImages: seedanceReferenceHistory,
      firstFrameUrl: uploadedImageUrl,
      lastFrameUrl: uploadedEndImageUrl,
      assetLibrary: trustedImageHistory,
    });

    if (usesLocalRuntimeVideoModel && currentModel.localRuntime.ready === false) {
      setGenerateError(currentModel.localRuntime.unavailableReason || "本地视频模型尚未就绪。");
      setTimeout(() => setGenerateError(null), 8000);
      return;
    }

    if (!v2vMode && isSeedance2) {
      if (effectiveSeedanceMode === "extend") {
        if (!lastGenerationId) {
          alert("没有可续接的 Seedance 2.0 结果，请先生成一段视频。");
          return;
        }
      } else if (effectiveSeedanceMode === "omni") {
        if (hasInvalidSeedanceReferenceUrl) {
          alert("检测到参考图地址无效，请删除后重新上传，或改用公网图片 URL。");
          return;
        }
        if (seedanceReferenceUrls.length === 0) {
          alert("请先上传 Seedance 2.0 多参考图。");
          return;
        }
        if (!trimmedPrompt) {
          alert("请输入提示词，说明多张参考图如何参与生成。");
          return;
        }
      } else if (effectiveSeedanceMode === "flf") {
        if (!uploadedImageUrl || !uploadedEndImageUrl) {
          alert("首尾帧模式需要同时上传起始帧和结束帧。");
          return;
        }
        if (
          !isUsableSeedanceImageUrl(uploadedImageUrl, allowSeedanceDataImage) ||
          !isUsableSeedanceImageUrl(uploadedEndImageUrl, allowSeedanceDataImage)
        ) {
          alert("检测到首尾帧图片地址无效，请重新上传图片或改用公网图片 URL。");
          return;
        }
      } else if (effectiveSeedanceMode === "i2v") {
        if (!uploadedImageUrl) {
          alert("请先上传起始帧图片。");
          return;
        }
        if (!isUsableSeedanceImageUrl(uploadedImageUrl, allowSeedanceDataImage)) {
          alert("检测到起始帧图片地址无效，请重新上传图片或改用公网图片 URL。");
          return;
        }
      } else if (!trimmedPrompt) {
        alert("请输入提示词再开始生成视频。");
        return;
      }
    } else if (v2vMode) {
      if (!uploadedVideoUrl) {
        alert("请先上传视频。");
        return;
      }
      if (currentModel?.imageField && !uploadedImageUrl) {
        alert("请先上传用于运镜控制的参考图。");
        return;
      }
      if (activeProviderRequiresPublicImageUrl && currentModel?.imageField && !isUsableRemoteImageUrl(uploadedImageUrl)) {
        alert("检测到参考图地址无效，请重新上传图片或改用公网图片 URL。");
        return;
      }
      if (currentModel?.promptRequired && !trimmedPrompt) {
        alert("请描述你想要的运镜方式。");
        return;
      }
    } else if (isExtendMode) {
      if (!lastGenerationId) {
        alert(
          "没有可续接的 Seedance 2.0 结果，请先生成一段视频。",
        );
        return;
      }
    } else if (imageMode) {
      if (!uploadedImageUrl) {
        alert("请先上传起始帧图片。");
        return;
      }
      if (!usesLocalRuntimeVideoModel && activeProviderRequiresPublicImageUrl && !isUsableRemoteImageUrl(uploadedImageUrl)) {
        alert("检测到起始帧图片地址无效，请重新上传图片或改用公网图片 URL。");
        return;
      }
    } else {
      if (!trimmedPrompt) {
        alert("请输入提示词再开始生成视频。");
        return;
      }
    }

    setGenerating(true);
    setGenerateError(null);

    let hadError = false;
    let capturedRequestId = null;
    const baseHistoryMeta = {
      prompt: v2vMode && !currentModel?.hasPrompt ? "" : trimmedPrompt,
      model: selectedModel,
      aspect_ratio: selectedAr,
      duration: selectedDuration,
      resolution: selectedResolution,
      seedanceMode: isSeedance2 ? effectiveSeedanceMode : undefined,
      referenceImages: isSeedance2 ? seedanceReferenceHistory : undefined,
      firstFrameUrl: isSeedance2 ? uploadedImageUrl : undefined,
      lastFrameUrl: isSeedance2 ? uploadedEndImageUrl : undefined,
      referenceSet: videoReferenceSet.length ? videoReferenceSet : undefined,
      providerId: usesLocalRuntimeVideoModel
        ? currentModel.providerId || currentModel.localRuntime.provider
        : isSeedance2 ? "seedance-ark" : activeApiProvider?.id,
      providerModelId: usesLocalRuntimeVideoModel ? currentModel.localRuntime.modelId : undefined,
      localRuntimeProvider: usesLocalRuntimeVideoModel ? currentModel.localRuntime.provider : undefined,
    };

    const onRequestId = (requestId, submitData = {}) => {
      capturedRequestId = requestId;
      const pendingEntry = {
        id: requestId,
        requestId,
        request_id: requestId,
        task_id: requestId,
        url: null,
        ...baseHistoryMeta,
        status: "processing",
        providerStatus: submitData.provider_status || submitData.status || "submitted",
        timestamp: new Date().toISOString(),
        submittedAt: Date.now(),
        maxAttempts: 900,
        interval: 2000,
      };
      upsertLocalHistory(pendingEntry);
      if (isSeedance2Model(selectedModel)) {
        setLastGenerationId(requestId);
        setLastGenerationModel(selectedModel);
      }
    };

    const onStatus = (status) => {
      const requestId = capturedRequestId || getGenerationRequestId(status);
      updateLocalHistoryTask(requestId, {
        status: status?.status || "processing",
        providerStatus: status?.provider_status,
        pollAttempt: status?.attempt,
        maxAttempts: status?.maxAttempts,
        responseSummary: status?.responseSummary,
        lastStatusAt: new Date().toISOString(),
      });
    };

    try {
      let res;

      if (usesLocalRuntimeVideoModel) {
        const generateLocal = localRuntime?.wan2gp?.generate;
        if (typeof generateLocal !== "function") {
          throw new Error("Wan2GP 本地运行时不可用，请检查桌面桥接。");
        }

        const params = {
          model: currentModel.localRuntime.modelId,
          prompt: trimmedPrompt,
          aspect_ratio: selectedAr,
        };
        if (imageMode && uploadedImageUrl) {
          params.image = uploadedImageUrl;
          params.image_url = uploadedImageUrl;
        }
        if (currentModel.defaultSteps) params.steps = currentModel.defaultSteps;
        if (currentModel.defaultGuidance) params.guidance_scale = currentModel.defaultGuidance;

        res = await generateLocal(params);
        if (!res?.url) throw new Error("Wan2GP 没有返回视频 URL。");
        if (res.mediaType && res.mediaType !== "video") {
          throw new Error("该 Wan2GP 模型返回的是图片，请在图片创作中使用。");
        }

        const genId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const entry = {
          id: genId,
          requestId: genId,
          request_id: genId,
          task_id: genId,
          url: res.url,
          ...baseHistoryMeta,
          firstFrameUrl: imageMode ? uploadedImageUrl : undefined,
          status: "completed",
          providerStatus: "local-completed",
          seed: res.seed,
          timestamp: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };
        setLastGenerationId(null);
        setLastGenerationModel(null);
        addToLocalHistory(entry);
        showVideoInCanvas(res.url, selectedModel);
        if (onGenerationComplete)
          onGenerationComplete({
            url: res.url,
            model: selectedModel,
            prompt: trimmedPrompt,
            type: "video",
            providerId: entry.providerId,
            providerModelId: entry.providerModelId,
            localRuntimeProvider: entry.localRuntimeProvider,
            seed: entry.seed,
          });
      } else if (!v2vMode && isSeedance2) {
        const params = {
          model: selectedModel,
          seedance_mode: effectiveSeedanceMode,
          onRequestId,
          onStatus,
        };
        if (trimmedPrompt) params.prompt = trimmedPrompt;

        if (effectiveSeedanceMode === "extend") {
          params.request_id = lastGenerationId;
        } else {
          params.aspect_ratio = selectedAr;
        }

        let imagesList = [];
        if (effectiveSeedanceMode === "omni") {
          imagesList = seedanceReferenceUrls;
        } else if ((effectiveSeedanceMode === "i2v" || effectiveSeedanceMode === "flf") && uploadedImageUrl) {
          imagesList = [uploadedImageUrl];
        }

        if (imagesList.length > 0) {
          params.images_list = imagesList;
          params.reference_images = imagesList;
          params.image_url = imagesList[0];
          params.first_frame_url = imagesList[0];
        }

        if (effectiveSeedanceMode === "flf" && uploadedEndImageUrl) {
          params.last_image = uploadedEndImageUrl;
          params.last_frame_url = uploadedEndImageUrl;
        }

        const durations = imageMode
          ? getDurationsForI2VModel(selectedModel)
          : getDurationsForModel(selectedModel);
        if (durations.length > 0) params.duration = selectedDuration;
        const resolutions = imageMode
          ? getResolutionsForI2VModel(selectedModel)
          : getResolutionsForVideoModel(selectedModel);
        if (resolutions.length > 0) params.resolution = selectedResolution;
        if (selectedQuality) params.quality = selectedQuality;
        if (selectedMode) params.mode = selectedMode;

        res = await generateVideo(apiKey, params, seedanceArkApiConfig);
        ensureVideoResult(res);

        const requestId = res.request_id || res.task_id || capturedRequestId || res.id || Date.now().toString();
        const genId = capturedRequestId || res.id || requestId;
        setLastGenerationId(requestId);
        setLastGenerationModel(selectedModel);
        const entry = {
          id: genId,
          requestId,
          request_id: requestId,
          task_id: requestId,
          url: res.url,
          prompt: trimmedPrompt,
          model: selectedModel,
          aspect_ratio: selectedAr,
          duration: selectedDuration,
          resolution: selectedResolution,
          seedanceMode: effectiveSeedanceMode,
          referenceImages: seedanceReferenceHistory,
          firstFrameUrl: uploadedImageUrl,
          lastFrameUrl: uploadedEndImageUrl,
          referenceSet: videoReferenceSet,
          providerId: "seedance-ark",
          status: "completed",
          providerStatus: res.provider_status,
          timestamp: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };
        addToLocalHistory(entry);
        showVideoInCanvas(res.url, selectedModel);
        if (onGenerationComplete)
          onGenerationComplete({
            url: res.url,
            model: selectedModel,
            prompt: trimmedPrompt,
            type: "video",
          });
      } else if (v2vMode) {
        // V2V: dedicated processV2V handles single-input tools (e.g. watermark
        // remover) and motion-control models (which take video + image + prompt)
        const v2vParams = {
          model: selectedModel,
          video_url: uploadedVideoUrl,
          onRequestId,
          onStatus,
        };
        if (currentModel?.imageField && uploadedImageUrl) {
          v2vParams.image_url = uploadedImageUrl;
        }
        if (currentModel?.hasPrompt && trimmedPrompt) {
          v2vParams.prompt = trimmedPrompt;
        }
        res = await processV2V(apiKey, v2vParams, normalizedApiConfig);
        ensureVideoResult(res);

        const requestId = res.request_id || res.task_id || capturedRequestId || res.id || Date.now().toString();
        const genId = capturedRequestId || res.id || requestId;
        setLastGenerationId(null);
        setLastGenerationModel(null);
        const entry = {
          id: genId,
          requestId,
          request_id: requestId,
          task_id: requestId,
          url: res.url,
          prompt: currentModel?.hasPrompt ? trimmedPrompt : "",
          model: selectedModel,
          firstFrameUrl: currentModel?.imageField ? uploadedImageUrl : undefined,
          referenceSet: videoReferenceSet.length ? videoReferenceSet : undefined,
          status: "completed",
          providerStatus: res.provider_status,
          timestamp: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };
        addToLocalHistory(entry);
        showVideoInCanvas(res.url, selectedModel);
        if (onGenerationComplete)
          onGenerationComplete({
            url: res.url,
            model: selectedModel,
            prompt: currentModel?.hasPrompt ? trimmedPrompt : "",
            type: "video",
          });
      } else if (imageMode) {
        const i2vParams = { model: selectedModel, image_url: uploadedImageUrl, onRequestId, onStatus };
        if (trimmedPrompt) i2vParams.prompt = trimmedPrompt;
        i2vParams.aspect_ratio = selectedAr;
        const i2vModel = i2vModelOptions.find((m) => m.id === selectedModel) || i2vModels.find((m) => m.id === selectedModel);
        if (uploadedEndImageUrl && i2vModel?.lastImageField) {
          i2vParams.last_image = uploadedEndImageUrl;
        }
        const durations = getDurationsForI2VModel(selectedModel);
        if (durations.length > 0) i2vParams.duration = selectedDuration;
        const resolutions = getResolutionsForI2VModel(selectedModel);
        if (resolutions.length > 0) i2vParams.resolution = selectedResolution;
        if (selectedQuality) i2vParams.quality = selectedQuality;
        if (selectedMode) i2vParams.mode = selectedMode;

        res = await generateI2V(apiKey, i2vParams, normalizedApiConfig);
        ensureVideoResult(res);

        const requestId = res.request_id || res.task_id || capturedRequestId || res.id || Date.now().toString();
        const genId = capturedRequestId || res.id || requestId;
        if (isSeedance2Model(selectedModel)) {
          setLastGenerationId(requestId);
          setLastGenerationModel(selectedModel);
        } else {
          setLastGenerationId(null);
          setLastGenerationModel(null);
        }
        const entry = {
          id: genId,
          requestId,
          request_id: requestId,
          task_id: requestId,
          url: res.url,
          prompt: trimmedPrompt,
          model: selectedModel,
          aspect_ratio: selectedAr,
          duration: selectedDuration,
          firstFrameUrl: uploadedImageUrl,
          lastFrameUrl: uploadedEndImageUrl,
          referenceSet: videoReferenceSet.length ? videoReferenceSet : undefined,
          status: "completed",
          providerStatus: res.provider_status,
          timestamp: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };
        addToLocalHistory(entry);
        showVideoInCanvas(res.url, selectedModel);
        if (onGenerationComplete)
          onGenerationComplete({
            url: res.url,
            model: selectedModel,
            prompt: trimmedPrompt,
            type: "video",
          });
      } else {
        // T2V (including extend mode)
        const params = { model: selectedModel, onRequestId, onStatus };
        if (trimmedPrompt) params.prompt = trimmedPrompt;

        if (isExtendMode) {
          params.request_id = lastGenerationId;
        } else {
          params.aspect_ratio = selectedAr;
        }

        const durations = getDurationsForModel(selectedModel);
        if (durations.length > 0) params.duration = selectedDuration;
        const resolutions = getResolutionsForVideoModel(selectedModel);
        if (resolutions.length > 0) params.resolution = selectedResolution;
        if (selectedQuality) params.quality = selectedQuality;
        if (selectedMode) params.mode = selectedMode;

        res = await generateVideo(apiKey, params, normalizedApiConfig);
        ensureVideoResult(res);

        const requestId = res.request_id || res.task_id || capturedRequestId || res.id || Date.now().toString();
        const genId = capturedRequestId || res.id || requestId;
        if (isSeedance2Model(selectedModel)) {
          setLastGenerationId(requestId);
          setLastGenerationModel(selectedModel);
        } else {
          setLastGenerationId(null);
          setLastGenerationModel(null);
        }
        const entry = {
          id: genId,
          requestId,
          request_id: requestId,
          task_id: requestId,
          url: res.url,
          prompt: trimmedPrompt,
          model: selectedModel,
          aspect_ratio: selectedAr,
          duration: selectedDuration,
          status: "completed",
          providerStatus: res.provider_status,
          timestamp: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };
        addToLocalHistory(entry);
        showVideoInCanvas(res.url, selectedModel);
        if (onGenerationComplete)
          onGenerationComplete({
            url: res.url,
            model: selectedModel,
            prompt: trimmedPrompt,
            type: "video",
          });
      }
    } catch (e) {
      hadError = true;
      console.error("[VideoStudio]", e);
      const userMessage = getGenerationErrorMessage(e);
      if (capturedRequestId) {
        updateLocalHistoryTask(capturedRequestId, {
          status: "failed",
          error: userMessage,
          providerStatus: e.response?.provider_status,
          responseSummary: summarizeErrorResponse(e),
        });
      }
      setGenerateError(userMessage);
      setTimeout(() => setGenerateError(null), 8000);
    } finally {
      setGenerating(false);
    }
  }, [
    apiKey,
    activeApiProvider?.id,
    activeProviderRequiresPublicImageUrl,
    activeProviderAllowsDataImage,
    prompt,
    v2vMode,
    imageMode,
    seedanceMode,
    seedanceReferenceImages,
    trustedImageHistory,
    selectedModel,
    selectedAr,
    selectedDuration,
    selectedResolution,
    selectedQuality,
    selectedMode,
    uploadedImageUrl,
    uploadedEndImageUrl,
    uploadedVideoUrl,
    lastGenerationId,
    localRuntime,
    normalizedApiConfig,
    seedanceArkApiConfig,
    getCurrentModel,
    i2vModelOptions,
    addToLocalHistory,
    upsertLocalHistory,
    updateLocalHistoryTask,
    showVideoInCanvas,
    onGenerationComplete,
  ]);

  // ── reset to prompt bar ───────────────────────────────────────────────────
  const resetToPromptBar = useCallback(() => {
    setShowCanvas(false);
  }, []);

  const handleNewPrompt = useCallback(() => {
    resetToPromptBar();
    setPrompt("");
    setUploadedImageUrl(null);
    setUploadedEndImageUrl(null);
    clearSeedanceReferenceImages();
    setSeedanceMode("t2v");
    setImageMode(false);
    setUploadedVideoUrl(null);
    setUploadedVideoName(null);
    setV2vMode(false);
    const first = t2vModelOptions[0] || t2vModels[0];
    setSelectedModel(first.id);
    setSelectedModelName(first.name);
    applyControlsForModel(first.id, false, false);
    setPromptDisabled(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [resetToPromptBar, clearSeedanceReferenceImages, applyControlsForModel]);

  const handleExtend = useCallback((requestId = lastGenerationId) => {
    const targetRequestId = requestId || lastGenerationId;
    if (!targetRequestId) return;
    showPreviewError("续写模型已暂时隐藏；当前视频创作只保留 Seedance 2.0 与 Seedance 2.0 Flash。");
  }, [lastGenerationId, showPreviewError]);

  const reuseVideoReferenceSet = useCallback(
    (entry) => {
      const referenceSet = getVideoReferenceSet(entry);
      if (!referenceSet.length) {
        showPreviewError("这条视频没有保存参考图套组。");
        return;
      }

      const sorted = [...referenceSet].sort((a, b) => (a.order || 0) - (b.order || 0));
      const hasImageRoles = sorted.some((item) => String(item.role || "").toLowerCase().startsWith("image"));
      const firstAsset = sorted.find((item) => item.role === "first") || sorted[0];
      const lastAsset = sorted.find((item) => item.role === "last");
      const wantsOmni = entry?.seedanceMode === "omni" || hasImageRoles || sorted.length > 2;
      const preferredId = isSeedance2Model(entry?.model) ? entry.model : selectedModel;
      const target = pickSeedanceModel(i2vModelOptions, preferredId);

      if (!target) {
        showPreviewError("当前没有可用的 Seedance 图生视频模型。");
        return;
      }

      resetToPromptBar();
      setPrompt(entry?.prompt || "");
      setUploadedVideoUrl(null);
      setUploadedVideoName(null);
      setV2vMode(false);
      setImageMode(true);
      setSelectedModel(target.id);
      setSelectedModelName(target.name);
      applyControlsForModel(target.id, true, false);
      setPromptDisabled(false);

      if (wantsOmni) {
        const nextReferences = sorted.slice(0, SEEDANCE_REFERENCE_LIMIT).map((item, index) => ({
          ...item,
          id: `reuse-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
          role: `image${index + 1}`,
          order: index + 1,
        }));
        setSeedanceMode("omni");
        setUploadedImageUrl(null);
        setUploadedEndImageUrl(null);
        setSeedanceReferenceImages((prev) => {
          prev.forEach((item) => revokeLocalPreviewUrl(item.previewUrl));
          return sanitizeSeedanceReferenceImages(nextReferences);
        });
      } else {
        setSeedanceMode(lastAsset ? "flf" : "i2v");
        setUploadedImageUrl(firstAsset?.url || null);
        setUploadedEndImageUrl(lastAsset?.url || null);
        setSeedanceReferenceImages((prev) => {
          prev.forEach((item) => revokeLocalPreviewUrl(item.previewUrl));
          return [];
        });
      }

      setTimeout(() => textareaRef.current?.focus(), 50);
    },
    [applyControlsForModel, i2vModelOptions, pickSeedanceModel, resetToPromptBar, selectedModel, showPreviewError],
  );

  // ── derived UI values ────────────────────────────────────────────────────
  const currentModelObj = getCurrentModel();
  const isExtendMode = currentModelObj?.requiresRequestId || selectedModel === "seedance-v2.0-extend";
  const isCurrentSeedance2 = isSeedance2Model(currentModelObj || selectedModel);
  const activeSeedanceMode = isCurrentSeedance2 && isExtendMode ? "extend" : seedanceMode;
  const activeI2VModel =
    i2vModelOptions.find((m) => m.id === selectedModel) ||
    i2vModels.find((m) => m.id === selectedModel);
  const seedancePromptPlaceholder =
    activeSeedanceMode === "omni"
      ? "描述多张参考图如何共同约束画面，可写 @image1、@image2..."
      : activeSeedanceMode === "flf"
        ? "描述从起始帧到结束帧的动作、镜头和过渡"
        : activeSeedanceMode === "i2v"
          ? "描述起始帧如何运动、镜头如何推进"
          : activeSeedanceMode === "extend"
            ? "可选：描述你希望如何续接视频..."
            : "描述你想要生成的视频";
  const showEndFrameUpload =
    imageMode &&
    (isCurrentSeedance2
      ? activeSeedanceMode === "flf"
      : !!activeI2VModel?.lastImageField);
  const canUseTrustedSeedanceInput =
    isCurrentSeedance2 && !v2vMode && ["i2v", "flf", "omni"].includes(activeSeedanceMode);
  const seedanceAssetSelectionLimit =
    activeSeedanceMode === "omni" ? SEEDANCE_REFERENCE_LIMIT : 1;
  const trustedHumanoidAssets = useMemo(
    () => trustedImageHistory.filter((entry) => !isLocalUploadAsset(entry) && isTrustedHumanoidHistoryEntry(entry)),
    [trustedImageHistory],
  );
  const otherTrustedAssets = useMemo(
    () => trustedImageHistory.filter((entry) => isLocalUploadAsset(entry) || !isTrustedHumanoidHistoryEntry(entry)),
    [trustedImageHistory],
  );
  const favoriteAssetUrlSet = useMemo(
    () => new Set(favoriteAssetUrls.map(normalizeSeedanceTrustedUrl).filter(Boolean)),
    [favoriteAssetUrls],
  );
  const usedSeedanceAssetUrlSet = useMemo(() => {
    const urls = new Set();
    const addUrl = (value) => {
      const url = normalizeSeedanceTrustedUrl(value?.url || value);
      if (url) urls.add(url);
    };

    history.forEach((entry) => {
      if (Array.isArray(entry?.referenceSet)) entry.referenceSet.forEach(addUrl);
      if (Array.isArray(entry?.referenceImages)) entry.referenceImages.forEach(addUrl);
      addUrl(entry?.firstFrameUrl);
      addUrl(entry?.lastFrameUrl);
    });

    return urls;
  }, [history]);
  const recentSeedanceAssetUrlSet = useMemo(() => {
    const urls = new Set();
    const addUrl = (value) => {
      const url = normalizeSeedanceTrustedUrl(value?.url || value);
      if (url) urls.add(url);
    };

    seedanceReferenceImages.forEach(addUrl);
    history.slice(0, 8).forEach((entry) => {
      if (Array.isArray(entry?.referenceSet)) entry.referenceSet.forEach(addUrl);
      if (Array.isArray(entry?.referenceImages)) entry.referenceImages.forEach(addUrl);
      addUrl(entry?.firstFrameUrl);
    });

    return urls;
  }, [history, seedanceReferenceImages]);
  const assetGalleryBaseItems = assetGalleryTab === "human" ? trustedHumanoidAssets : otherTrustedAssets;
  const assetGalleryItems = useMemo(() => {
    if (assetGalleryFilter === "favorite") {
      return assetGalleryBaseItems.filter((entry) => favoriteAssetUrlSet.has(normalizeSeedanceTrustedUrl(entry.url)));
    }
    if (assetGalleryFilter === "recent") {
      return assetGalleryBaseItems.filter((entry) => recentSeedanceAssetUrlSet.has(normalizeSeedanceTrustedUrl(entry.url)));
    }
    if (assetGalleryFilter === "used") {
      return assetGalleryBaseItems.filter((entry) => usedSeedanceAssetUrlSet.has(normalizeSeedanceTrustedUrl(entry.url)));
    }
    return assetGalleryBaseItems;
  }, [
    assetGalleryBaseItems,
    assetGalleryFilter,
    favoriteAssetUrlSet,
    recentSeedanceAssetUrlSet,
    usedSeedanceAssetUrlSet,
  ]);
  const selectedSeedanceAssets = useMemo(() => {
    if (!canUseTrustedSeedanceInput) return [];
    if (activeSeedanceMode === "omni") return seedanceReferenceImages;
    if (!uploadedImageUrl) return [];
    const matched = trustedImageHistory.find((entry) => entry.url === uploadedImageUrl);
    return [
      {
        id: matched?.id || "selected-start-frame",
        url: uploadedImageUrl,
        name: matched?.name || "首帧参考图",
        prompt: matched?.prompt || "",
        model: matched?.model || currentModelObj?.name || selectedModelName,
        source: matched?.source || "trusted-url",
        trustedForSeedance: matched?.trustedForSeedance,
        providerId: matched?.providerId,
        localUpload: matched?.localUpload,
      },
    ];
  }, [
    activeSeedanceMode,
    canUseTrustedSeedanceInput,
    currentModelObj?.name,
    seedanceReferenceImages,
    selectedModelName,
    trustedImageHistory,
    uploadedImageUrl,
  ]);
  const selectedSeedanceUrls = useMemo(
    () => new Set(selectedSeedanceAssets.map((entry) => entry.url).filter(Boolean)),
    [selectedSeedanceAssets],
  );
  const assetGalleryTabs = useMemo(
    () => [
      { id: "human", label: "可用的仿真人", count: trustedHumanoidAssets.length, icon: UserRound },
      { id: "other", label: "其他", count: otherTrustedAssets.length, icon: Boxes },
    ],
    [otherTrustedAssets.length, trustedHumanoidAssets.length],
  );
  const assetGalleryFilterTabs = useMemo(
    () => [
      { id: "all", label: "全部", count: assetGalleryBaseItems.length },
      {
        id: "favorite",
        label: "收藏",
        count: assetGalleryBaseItems.filter((entry) => favoriteAssetUrlSet.has(normalizeSeedanceTrustedUrl(entry.url))).length,
      },
      {
        id: "recent",
        label: "最近使用",
        count: assetGalleryBaseItems.filter((entry) => recentSeedanceAssetUrlSet.has(normalizeSeedanceTrustedUrl(entry.url))).length,
      },
      {
        id: "used",
        label: "已用于视频",
        count: assetGalleryBaseItems.filter((entry) => usedSeedanceAssetUrlSet.has(normalizeSeedanceTrustedUrl(entry.url))).length,
      },
    ],
    [assetGalleryBaseItems, favoriteAssetUrlSet, recentSeedanceAssetUrlSet, usedSeedanceAssetUrlSet],
  );

  const applyTrustedSeedanceImageUrl = useCallback(
    (rawUrl, source = {}) => {
      const url = normalizeSeedanceTrustedUrl(rawUrl);
      if (!url) {
        alert("请先粘贴 Seedream 原始图片 URL 或 asset:// 素材 URI。");
        return false;
      }
      if (!isUsableSeedanceImageUrl(url, true)) {
        alert("可信产物地址需要是 https:// 图片 URL、asset:// 素材 URI，或可识别的图片 data URL。");
        return false;
      }

      const entry = {
        id: `trusted-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        url,
        name: source.name || source.prompt || "Seedream 可信产物",
        source: source.source || "trusted-url",
        model: source.model,
        timestamp: source.timestamp,
        providerId: source.providerId,
        trustedForSeedance: Boolean(source.trustedForSeedance || isTrustedHumanoidHistoryEntry(source)),
        trustedUntil: source.trustedUntil,
        localUpload: Boolean(source.localUpload),
      };

      if (activeSeedanceMode === "i2v" || activeSeedanceMode === "flf") {
        selectSeedanceMode(activeSeedanceMode);
        setUploadedImageUrl(url);
        setPromptDisabled(false);
        return true;
      }

      const exists = seedanceReferenceImages.some((item) => item.url === url);
      if (!exists && seedanceReferenceImages.length >= SEEDANCE_REFERENCE_LIMIT) {
        alert(`Seedance 2.0 最多支持 ${SEEDANCE_REFERENCE_LIMIT} 张参考图。`);
        return false;
      }

      selectSeedanceMode("omni");
      setSeedanceReferenceImages((prev) => {
        if (prev.some((item) => item.url === url)) return prev;
        return [...prev, entry].slice(0, SEEDANCE_REFERENCE_LIMIT);
      });
      setPromptDisabled(false);
      return true;
    },
    [activeSeedanceMode, seedanceReferenceImages, selectSeedanceMode],
  );

  const handleOpenAssetGallery = useCallback(() => {
    const items = refreshTrustedImageHistory();
    const hasHuman = items.some((entry) => !isLocalUploadAsset(entry) && isTrustedHumanoidHistoryEntry(entry));
    const hasOther = items.some((entry) => isLocalUploadAsset(entry) || !isTrustedHumanoidHistoryEntry(entry));
    if (!hasHuman && hasOther) setAssetGalleryTab("other");
    setShowAssetGallery(true);
  }, [refreshTrustedImageHistory]);

  const toggleAssetFavorite = useCallback((rawUrl) => {
    const url = normalizeSeedanceTrustedUrl(rawUrl);
    if (!url) return;
    setFavoriteAssetUrls((prev) => {
      if (prev.includes(url)) return prev.filter((item) => item !== url);
      return [url, ...prev].slice(0, 200);
    });
  }, []);

  const addTrustedHistoryEntries = useCallback(
    (entries, maxCount = SEEDANCE_REFERENCE_LIMIT) => {
      const list = (Array.isArray(entries) ? entries : [])
        .map((entry) => ({
          ...entry,
          url: normalizeSeedanceTrustedUrl(entry?.url),
        }))
        .filter((entry) => entry.url && isUsableSeedanceImageUrl(entry.url, true))
        .slice(0, Math.max(1, maxCount));

      if (!list.length) {
        alert("暂无可用的 Seedream 历史图。");
        return 0;
      }

      if (activeSeedanceMode === "i2v" || activeSeedanceMode === "flf") {
        const added = applyTrustedSeedanceImageUrl(list[0].url, list[0]);
        return added ? 1 : 0;
      }

      const existingUrls = new Set(seedanceReferenceImages.map((item) => item.url));
      const room = Math.max(0, SEEDANCE_REFERENCE_LIMIT - seedanceReferenceImages.length);
      const additions = list
        .filter((entry) => !existingUrls.has(entry.url))
        .slice(0, room)
        .map((entry, index) => ({
          id: `trusted-history-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
          url: entry.url,
          name: entry.name || entry.prompt || `历史图 ${index + 1}`,
          source: "trusted-history",
          model: entry.model,
          timestamp: entry.timestamp,
          providerId: entry.providerId,
          trustedForSeedance: Boolean(entry.trustedForSeedance || isTrustedHumanoidHistoryEntry(entry)),
          trustedUntil: entry.trustedUntil,
          localUpload: Boolean(entry.localUpload),
        }));

      if (!additions.length) {
        alert(room <= 0 ? `Seedance 2.0 最多支持 ${SEEDANCE_REFERENCE_LIMIT} 张参考图。` : "这些历史图已经加入参考图列表。");
        return 0;
      }

      selectSeedanceMode("omni");
      setSeedanceReferenceImages((prev) => {
        const seen = new Set(prev.map((item) => item.url));
        const merged = [
          ...prev,
          ...additions.filter((entry) => !seen.has(entry.url)),
        ];
        return merged.slice(0, SEEDANCE_REFERENCE_LIMIT);
      });
      setPromptDisabled(false);
      return additions.length;
    },
    [activeSeedanceMode, applyTrustedSeedanceImageUrl, seedanceReferenceImages, selectSeedanceMode],
  );

  const handleGalleryAssetClick = useCallback(
    (entry) => {
      const url = normalizeSeedanceTrustedUrl(entry?.url);
      if (!url) return;

      if (activeSeedanceMode === "omni" && seedanceReferenceImages.some((item) => item.url === url)) {
        setSeedanceReferenceImages((prev) => prev.filter((item) => item.url !== url));
        return;
      }

      const added = applyTrustedSeedanceImageUrl(url, entry);
      if (added && activeSeedanceMode !== "omni") {
        setShowAssetGallery(false);
      }
    },
    [activeSeedanceMode, applyTrustedSeedanceImageUrl, seedanceReferenceImages],
  );

  const promptPlaceholder = v2vMode
    ? currentModelObj?.imageField
      ? currentModelObj?.promptRequired
        ? "描述你希望的运动"
        : "描述运动方式（可选）"
      : "视频已就绪 - 点击开始生成可去除水印"
    : isCurrentSeedance2
      ? seedancePromptPlaceholder
      : imageMode
        ? "描述运动或效果（可选）"
        : isExtendMode
          ? "可选：描述你希望如何续接视频..."
          : "描述你想要生成的视频";

  const historyRecoveryText = historyRecoveryReport
    ? `已扫描 ${historyRecoveryReport.scannedKeys} 项本地记录，发现 ${historyRecoveryReport.found} 个视频线索，本次恢复 ${historyRecoveryReport.added} 条`
    : "";
  const historyRepairText = historyRepairReport
    ? `${historyRepairReport.message || "任务查询完成"}（${historyRepairReport.checked || 0}/${historyRepairReport.total || 0}，恢复 ${historyRepairReport.fixed || 0}，失败 ${historyRepairReport.failed || 0}）`
    : "";

  const toggleDropdown = (type) => (e) => {
    e.stopPropagation();
    setOpenDropdown((prev) => (prev === type ? null : type));
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col items-center justify-center bg-app-bg relative overflow-hidden"
    >
      {/* ── CENTRAL GALLERY AREA ── */}
      <div className="flex-1 w-full max-w-7xl mx-auto overflow-y-auto custom-scrollbar px-2 pb-48 sm:px-3 sm:pb-44 lg:pb-32">
        {history.length > 0 ? (
          <div className="w-full pt-4 animate-fade-in-up">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h2 className="text-sm font-black text-white/80">最近结果</h2>
                <span className="rounded border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[11px] font-bold text-white/45">
                  {historyStats.total} 条
                </span>
                <span className="rounded border border-emerald-300/15 bg-emerald-400/10 px-2 py-1 text-[11px] font-black text-emerald-200/80">
                  已完成 {historyStats.completed}
                </span>
                {historyStats.processing > 0 && (
                  <span className="rounded border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] font-black text-primary">
                    进行中 {historyStats.processing}
                  </span>
                )}
                {historyStats.failed > 0 && (
                  <span className="rounded border border-red-400/20 bg-red-500/10 px-2 py-1 text-[11px] font-black text-red-200/80">
                    失败 {historyStats.failed}
                  </span>
                )}
                {historyStats.seedance > 0 && (
                <span className="rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[11px] font-bold text-white/45">
                    Seedance {historyStats.seedance}
                  </span>
                )}
              </div>
              {canManageHistory && (
                <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                  {visibleHistory.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setShowAllVideoHistory((value) => !value)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.03] px-3 text-[11px] font-black text-white/55 transition-colors hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                    >
                      {showAllVideoHistory ? "收起" : `查看全部 ${visibleHistory.length}`}
                    </button>
                  )}
                  {repairableHistoryCount > 0 && (
                    <button
                      type="button"
                      onClick={repairVideoHistoryTasks}
                      disabled={repairingHistory}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-amber-300/20 bg-amber-400/10 px-3 text-[11px] font-black text-amber-100/85 hover:border-amber-200/45 hover:bg-amber-400/15 disabled:cursor-wait disabled:opacity-55 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/35"
                    >
                      <RotateCcw size={13} className={repairingHistory ? "animate-spin" : ""} />
                      {repairingHistory ? "查询中" : `重查任务 ${repairableHistoryCount}`}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => recoverVideoHistoryFromStorage(true)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-primary/20 bg-primary/10 px-3 text-[11px] font-black text-primary hover:border-primary/45 hover:bg-primary/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                  >
                    <RotateCcw size={13} />
                    扫描本地历史
                  </button>
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-red-400/20 bg-red-500/10 px-3 text-[11px] font-black text-red-200/80 hover:border-red-300/45 hover:bg-red-500/20 hover:text-red-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/35"
                  >
                    <Trash2 size={13} />
                    清空
                  </button>
                </div>
              )}
            </div>
            {historyRecoveryReport && historyRecoveryReport.added > 0 && (
              <div className="mb-4 rounded-md border border-primary/15 bg-primary/[0.06] px-3 py-2 text-[11px] font-bold text-primary/90">
                {historyRecoveryText}
              </div>
            )}
            {historyRepairReport && (
              <div className="mb-4 rounded-md border border-amber-300/15 bg-amber-400/[0.06] px-3 py-2 text-[11px] font-bold text-amber-100/90">
                {historyRepairText}
              </div>
            )}

            {visibleHistory.length === 0 ? (
              <div className="rounded-md border border-white/[0.06] bg-white/[0.02] px-4 py-5 text-xs font-bold text-white/40">
                暂无可展示视频，失败记录已隐藏；上方统计仍保留完整任务数据。
              </div>
            ) : (
              <div className={`grid w-full grid-cols-1 gap-3 sm:gap-5 ${
                showAllVideoHistory ? "sm:grid-cols-2 xl:grid-cols-3" : "max-w-xl"
              }`}>
              {displayedHistory.map((entry, idx) => {
                const requestId = getGenerationRequestId(entry);
                const entryKey = getVideoHistoryEntryKey(entry, idx);
                const urlCopyKey = `${entryKey}:url`;
                const idCopyKey = `${entryKey}:id`;
                const isSeedance2 = isSeedance2Model(entry.model);
                const resultUrl = getVideoResultUrl(entry);
                const previewFailed = Boolean(resultUrl && entry.previewError);
                const status = entry.status || (resultUrl ? "completed" : requestId ? "processing" : "");
                const isProcessing = !resultUrl && status !== "failed";
                const isFailed = !resultUrl && status === "failed";
                const statusText = previewFailed ? "预览失败" : isFailed ? "失败" : isProcessing ? "进行中" : "已完成";
                const statusClass = isFailed
                  ? "border-red-400/20 bg-red-500/10 text-red-200/80"
                  : previewFailed
                    ? "border-amber-300/20 bg-amber-400/10 text-amber-100/80"
                  : isProcessing
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : "border-emerald-300/15 bg-emerald-400/10 text-emerald-200/80";
                const providerStatusText = entry.providerStatus != null ? String(entry.providerStatus) : "";
                const statusLabel =
                  providerStatusText && providerStatusText !== "200"
                    ? providerStatusText
                    : status || "processing";
                const pollLabel = entry.pollAttempt
                  ? `${statusLabel} · ${entry.pollAttempt}/${entry.maxAttempts || "?"}`
                  : statusLabel;
                const responseSummary = entry.responseSummary || entry.lastResponseSummary || "";
                const referenceSet = getVideoReferenceSet(entry);
                return (
                  <div
                    key={entryKey}
                    className="relative group rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col"
                  >
                    {resultUrl ? (
                      <video
                        src={resultUrl}
                        className="w-full aspect-video object-cover bg-black/40 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setFullscreenUrl(resultUrl)}
                        controls={false}
                        loop
                        muted
                        playsInline
                        onMouseOver={(e) => safePlayVideo(e.currentTarget)}
                        onMouseOut={(e) => {
                          resetVideoPreview(e.currentTarget);
                        }}
                        onError={(e) => {
                          const message = getVideoElementErrorMessage(e.currentTarget);
                          handleVideoPreviewError(e);
                          updateLocalHistoryTask(requestId, {
                            status: status === "processing" ? status : "completed",
                            previewError: message,
                            failedUrl: resultUrl,
                            url: resultUrl,
                          });
                        }}
                      />
                    ) : (
                      <div className="w-full aspect-video bg-black/40 flex flex-col items-center justify-center gap-3 px-6 text-center">
                        {isFailed ? (
                          <>
                            <div className="w-10 h-10 rounded-full border border-red-400/30 bg-red-500/10 flex items-center justify-center text-red-300 font-black">
                              !
                            </div>
                            <div className="text-xs text-red-200/80 line-clamp-2">
                              {entry.error || "任务失败"}
                            </div>
                            {responseSummary && (
                              <div
                                className="text-[10px] text-red-100/35 line-clamp-2"
                                title={responseSummary}
                              >
                                响应：{responseSummary}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="animate-spin inline-block text-primary text-2xl">◌</span>
                            <div className="text-xs text-white/50">
                              {pollLabel}
                            </div>
                            {requestId && (
                              <div className="text-[10px] text-white/25 font-mono max-w-full truncate">
                                {requestId}
                              </div>
                            )}
                            {responseSummary && (
                              <div
                                className="text-[10px] text-white/25 line-clamp-2 max-w-full"
                                title={responseSummary}
                              >
                                最后响应：{responseSummary}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Overlay actions */}
                    <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {requestId && (
                        <button
                          type="button"
                          title={copiedVideoKey === idCopyKey ? "已复制任务 ID" : "复制任务 ID"}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyVideoText(entry, idx, "id", requestId);
                          }}
                          className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                          {copiedVideoKey === idCopyKey ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      )}
                      {resultUrl && (
                        <>
                          <button
                            type="button"
                            title="全屏"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFullscreenUrl(resultUrl);
                            }}
                            className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                          >
                            <Maximize2 size={14} strokeWidth={2.5} />
                          </button>
                          <button
                            type="button"
                            title="下载"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadFile(resultUrl, `video-${requestId || entry.id || idx}.mp4`);
                            }}
                            className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                          >
                            <Download size={14} strokeWidth={2.5} />
                          </button>
                        </>
                      )}
                      {resultUrl && isSeedance2 && requestId && (
                        <button
                          type="button"
                          title="使用 Seedance 2.0 Extend 续接此视频"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExtend(requestId);
                          }}
                          className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                          <RotateCcw size={14} strokeWidth={2.3} />
                        </button>
                      )}
                      {canManageHistory && (
                        <button
                          type="button"
                          title="删除"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteHistoryEntry(entry, idx);
                          }}
                          className="p-2 bg-black/60 backdrop-blur-md rounded-full text-red-100/80 hover:bg-red-500/20 hover:text-red-100 transition-all border border-red-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/35"
                        >
                          <Trash2 size={14} strokeWidth={2.4} />
                        </button>
                      )}
                    </div>

                    {/* Prompt & Details */}
                    <div className="p-3 bg-black/80 backdrop-blur-sm border-t border-white/5 flex-1 flex flex-col justify-between gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 text-white/70 text-xs line-clamp-3 leading-relaxed" title={entry.prompt}>
                          {entry.prompt || "未填写提示词"}
                        </p>
                        <span className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-black ${statusClass}`}>
                          {statusText}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1 flex-wrap gap-1">
                        <span className="min-w-0 truncate text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20">
                          {entry.model?.replace("-", " ") || "video"}
                        </span>
                        <div className="flex shrink-0 gap-2">
                          {entry.resolution && (
                            <span className="text-[10px] text-white/40">{entry.resolution}</span>
                          )}
                          {entry.duration && (
                            <span className="text-[10px] text-white/40">{entry.duration}s</span>
                          )}
                        </div>
                      </div>
                      {referenceSet.length > 0 && (
                        <div className="flex items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.025] p-1.5">
                          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-primary/20 bg-primary/10 text-primary">
                              <Images size={13} />
                            </span>
                            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
                              {referenceSet.slice(0, 5).map((asset, assetIndex) => {
                                const label = getVideoReferenceRoleLabel(asset, assetIndex);
                                return (
                                  <div
                                    key={`${asset.url}-${assetIndex}`}
                                    className="relative h-8 w-8 shrink-0 overflow-hidden rounded border border-white/[0.08] bg-black/50"
                                    title={`${label} · ${asset.name || asset.model || "参考图"}`}
                                  >
                                    {canPreviewImageUrl(asset.url) ? (
                                      <img src={asset.url} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                      <span className="flex h-full w-full items-center justify-center text-[8px] font-black text-primary">
                                        URI
                                      </span>
                                    )}
                                    <span className="absolute inset-x-0 bottom-0 truncate bg-black/75 px-0.5 text-center text-[7px] font-black text-primary">
                                      {label}
                                    </span>
                                    {isLocalUploadAsset(asset) && (
                                      <span className="absolute right-0 top-0 rounded-bl bg-primary px-0.5 text-[7px] font-black text-black">
                                        本
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                              {referenceSet.length > 5 && (
                                <span className="shrink-0 rounded border border-white/[0.06] bg-white/[0.03] px-1.5 py-1 text-[9px] font-black text-white/40">
                                  +{referenceSet.length - 5}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              reuseVideoReferenceSet(entry);
                            }}
                            className="h-8 shrink-0 rounded-md border border-primary/25 bg-primary/10 px-2 text-[10px] font-black text-primary transition-colors hover:bg-primary hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                          >
                            复用套图
                          </button>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        {resultUrl ? (
                          <button
                            type="button"
                            title={resultUrl}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyVideoText(entry, idx, "url", resultUrl);
                            }}
                            className={`inline-flex min-w-0 items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-[10px] font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 ${
                              copiedVideoKey === urlCopyKey
                                ? "border-primary/45 bg-primary/15 text-primary"
                                : "border-white/[0.06] bg-white/[0.03] text-white/55 hover:border-primary/35 hover:text-primary"
                            }`}
                          >
                            {copiedVideoKey === urlCopyKey ? <Check size={13} /> : <Copy size={13} />}
                            <span className="truncate">{copiedVideoKey === urlCopyKey ? "已复制 URL" : "复制 URL"}</span>
                          </button>
                        ) : (
                          <span className="inline-flex min-w-0 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 text-[10px] font-bold text-white/25">
                            等待视频 URL
                          </span>
                        )}

                        {requestId ? (
                          <button
                            type="button"
                            title={requestId}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyVideoText(entry, idx, "id", requestId);
                            }}
                            className={`inline-flex min-w-0 items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-[10px] font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 ${
                              copiedVideoKey === idCopyKey
                                ? "border-primary/45 bg-primary/15 text-primary"
                                : "border-white/[0.06] bg-white/[0.03] text-white/55 hover:border-primary/35 hover:text-primary"
                            }`}
                          >
                            {copiedVideoKey === idCopyKey ? <Check size={13} /> : <Copy size={13} />}
                            <span className="truncate">{copiedVideoKey === idCopyKey ? "已复制 ID" : "复制 ID"}</span>
                          </button>
                        ) : (
                          <span className="inline-flex min-w-0 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 text-[10px] font-bold text-white/25">
                            无任务 ID
                          </span>
                        )}
                      </div>
                      {resultUrl && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenVideoUrl(resultUrl);
                            }}
                            className="inline-flex h-7 flex-1 min-w-0 items-center justify-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 text-[10px] font-black text-white/55 hover:border-primary/35 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                          >
                            <ExternalLink size={13} />
                            <span className="truncate">打开原始视频</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFullscreenUrl(resultUrl);
                            }}
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.03] text-white/55 hover:border-primary/35 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                          >
                            <Play size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full pt-4 animate-fade-in-up">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h2 className="text-sm font-black text-white/80">最近结果</h2>
                <span className="rounded border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[11px] font-bold text-white/45">
                  0 条
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className="text-[11px] font-semibold text-white/30">
                  生成成功后会自动进入这里，也会同步到顶部任务中心
                </span>
                {canManageHistory && (
                  <button
                    type="button"
                    onClick={() => recoverVideoHistoryFromStorage(true)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-primary/20 bg-primary/10 px-3 text-[11px] font-black text-primary hover:border-primary/45 hover:bg-primary/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                  >
                    <RotateCcw size={13} />
                    扫描本地历史
                  </button>
                )}
              </div>
            </div>
            {historyRecoveryReport && historyRecoveryReport.added > 0 && (
              <div className="mb-4 rounded-md border border-primary/15 bg-primary/[0.06] px-3 py-2 text-[11px] font-bold text-primary/90">
                {historyRecoveryText}
              </div>
            )}
            <div className="min-h-[42vh]" aria-hidden="true" />
          </div>
        )}
      </div>

      {showAssetGallery && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-2 py-3 backdrop-blur-sm sm:px-4 sm:py-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowAssetGallery(false);
          }}
        >
          <div className="flex h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-md border border-white/[0.08] bg-[#080808]/95 shadow-2xl sm:h-[78vh]">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
                    <Images size={18} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-black text-white/85">在线图库</h2>
                    <p className="truncate text-[11px] font-semibold text-white/35">
                      {assetGalleryItems.length} 张素材 · 已选 {selectedSeedanceAssets.length}/{seedanceAssetSelectionLimit}
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAssetGallery(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.03] text-white/45 transition-colors hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                title="关闭图库"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.05] px-4 py-3">
              {assetGalleryTabs.map((tab) => {
                const Icon = tab.icon;
                const active = assetGalleryTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAssetGalleryTab(tab.id)}
                    className={`flex h-9 items-center gap-2 rounded-md border px-3 text-[11px] font-black transition-colors ${
                      active
                        ? "border-primary/60 bg-primary/10 text-primary"
                        : "border-white/[0.06] bg-white/[0.03] text-white/50 hover:border-primary/35 hover:text-white/75"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                    <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/45">
                      {tab.count}
                    </span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => refreshTrustedImageHistory()}
                className="ml-auto flex h-9 items-center rounded-md border border-white/[0.06] bg-white/[0.03] px-3 text-[11px] font-bold text-white/50 transition-colors hover:border-primary/35 hover:text-primary"
              >
                刷新
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.05] px-3 py-2 sm:px-4">
              {assetGalleryFilterTabs.map((tab) => {
                const active = assetGalleryFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAssetGalleryFilter(tab.id)}
                    className={`h-8 rounded-md border px-3 text-[10px] font-black transition-colors ${
                      active
                        ? "border-primary/60 bg-primary/10 text-primary"
                        : "border-white/[0.06] bg-white/[0.03] text-white/45 hover:border-primary/35 hover:text-white/75"
                    }`}
                  >
                    {tab.label} {tab.count}
                  </button>
                );
              })}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar px-3 py-3 sm:px-4 sm:py-4">
              {assetGalleryItems.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
                  {assetGalleryItems.map((entry, index) => {
                    const selected = selectedSeedanceUrls.has(entry.url);
                    const favorite = favoriteAssetUrlSet.has(normalizeSeedanceTrustedUrl(entry.url));
                    const badge = getSeedanceAssetBadge(entry);
                    return (
                      <div
                        key={`${entry.url}-${index}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleGalleryAssetClick(entry)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleGalleryAssetClick(entry);
                          }
                        }}
                        className={`group min-w-0 overflow-hidden rounded-md border bg-white/[0.025] text-left transition-all hover:-translate-y-0.5 hover:border-primary/45 ${
                          selected ? "border-primary/70 ring-1 ring-primary/30" : "border-white/[0.07]"
                        }`}
                      >
                        <div className="relative aspect-[4/3] overflow-hidden bg-black/60">
                          {canPreviewImageUrl(entry.url) ? (
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
                              badge === "本地"
                                ? "border border-primary/45 bg-black/75 text-primary"
                                : badge === "可信"
                                ? "bg-primary text-black"
                                : "bg-black/70 text-white/70"
                            }`}
                          >
                            {badge}
                          </span>
                          {selected && (
                            <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-black shadow-lg shadow-primary/20">
                              <Check size={14} strokeWidth={3} />
                            </span>
                          )}
                          {!selected && (
                            <button
                              type="button"
                              title={favorite ? "取消收藏" : "收藏素材"}
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleAssetFavorite(entry.url);
                              }}
                              className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border text-[13px] transition-colors ${
                                favorite
                                  ? "border-primary/70 bg-primary text-black"
                                  : "border-white/10 bg-black/70 text-white/45 hover:border-primary/45 hover:text-primary"
                              }`}
                            >
                              {favorite ? "★" : "☆"}
                            </button>
                          )}
                        </div>
                        <div className="space-y-1 p-2.5">
                          <div className="truncate text-xs font-black text-white/80">
                            {entry.name || entry.prompt || `图库素材 ${index + 1}`}
                          </div>
                          <div className="truncate text-[10px] font-semibold text-primary/70">
                            {isLocalUploadAsset(entry) ? "本地上传" : entry.model || "unknown model"}
                          </div>
                          {entry.prompt && (
                            <div className="line-clamp-2 min-h-[28px] text-[10px] font-medium leading-3.5 text-white/35">
                              {entry.prompt}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-md border border-dashed border-white/[0.08] bg-white/[0.02] text-center">
                  <Images size={28} className="mb-3 text-white/25" />
                  <div className="text-sm font-black text-white/60">
                    {assetGalleryTab === "human" ? "暂无可信仿真人素材" : "暂无其他素材"}
                  </div>
                  <div className="mt-1 text-[11px] font-semibold text-white/30">
                    图像创作生成后会自动出现在这里
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-white/[0.06] px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <div className="flex min-w-0 items-center gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
                {selectedSeedanceAssets.length > 0 ? (
                  selectedSeedanceAssets.map((entry, index) => (
                    <div
                      key={`${entry.url}-${index}`}
                      className="flex h-12 max-w-[230px] shrink-0 items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.03] px-2"
                    >
                      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded bg-black/50">
                        {canPreviewImageUrl(entry.url) ? (
                          <img src={entry.url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-[8px] font-black text-primary">
                            URI
                          </span>
                        )}
                        <span className="absolute inset-x-0 bottom-0 bg-black/75 text-center text-[7px] font-black text-primary">
                          {index + 1}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[10px] font-black text-white/70">
                          {activeSeedanceMode === "omni" ? `@image${index + 1}` : "首帧"}
                        </div>
                        <div className="truncate text-[9px] font-semibold text-white/35">
                          {entry.model || entry.name || "selected"}
                        </div>
                      </div>
                      {activeSeedanceMode === "omni" && (
                        <div className="ml-1 flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            title="左移"
                            disabled={index === 0}
                            onClick={() => moveSeedanceReferenceImage(index, -1)}
                            className="flex h-7 w-7 items-center justify-center rounded border border-white/[0.06] bg-black/30 text-xs font-black text-white/55 transition-colors hover:border-primary/35 hover:text-primary disabled:cursor-not-allowed disabled:opacity-25"
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            title="右移"
                            disabled={index === selectedSeedanceAssets.length - 1}
                            onClick={() => moveSeedanceReferenceImage(index, 1)}
                            className="flex h-7 w-7 items-center justify-center rounded border border-white/[0.06] bg-black/30 text-xs font-black text-white/55 transition-colors hover:border-primary/35 hover:text-primary disabled:cursor-not-allowed disabled:opacity-25"
                          >
                            ›
                          </button>
                          <button
                            type="button"
                            title="删除"
                            onClick={() => removeSeedanceReferenceImage(entry.id)}
                            className="flex h-7 w-7 items-center justify-center rounded border border-red-400/15 bg-red-500/5 text-xs font-black text-red-100/55 transition-colors hover:border-red-300/35 hover:text-red-100"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-[11px] font-semibold text-white/35">未选择图库素材</span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {assetGalleryItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => addTrustedHistoryEntries(assetGalleryItems, seedanceAssetSelectionLimit)}
                    className="h-9 rounded-md border border-primary/30 bg-primary/10 px-3 text-[11px] font-black text-primary transition-colors hover:bg-primary hover:text-black"
                  >
                    {activeSeedanceMode === "omni" ? "加入本类" : "使用最近"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowAssetGallery(false)}
                  className="h-9 rounded-md border border-white/[0.06] bg-white/[0.03] px-3 text-[11px] font-bold text-white/55 transition-colors hover:border-primary/35 hover:text-primary"
                >
                  完成
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BOTTOM PROMPT BAR ── */}
      <div
        className="absolute inset-x-3 bottom-16 z-40 mx-auto w-auto sm:inset-x-0 sm:bottom-5 sm:w-[92%] lg:max-w-3xl"
        style={{ animationDelay: "0.2s" }}
      >
        <div className="flex w-full flex-col gap-2 rounded-md border border-white/10 bg-[#0a0a0a]/85 p-2.5 shadow-2xl backdrop-blur-3xl sm:p-3">
          <div className="flex items-start gap-2 sm:items-center">
            {/* Image upload button */}
            <div className="relative">
              <input
                ref={imageFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFileChange}
              />
              <button
                type="button"
                title={
                  uploadedImageUrl
                    ? "清除参考图"
                    : "上传参考图用于图生视频"
                }
                onClick={() =>
                  uploadedImageUrl
                    ? clearImageUpload()
                    : imageFileInputRef.current?.click()
                }
                className={`w-10 h-10 shrink-0 rounded-full border transition-all flex items-center justify-center relative overflow-hidden ${uploadedImageUrl ? "border-primary/60 bg-primary/5" : "bg-white/5 border-white/[0.03] hover:bg-white/10 hover:border-primary/40"} group`}
              >
                {imageUploading ? (
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
                        strokeDashoffset={88 - (88 * imageProgress) / 100}
                        className="text-primary transition-all duration-300"
                      />
                    </svg>
                    <span className="absolute text-[9px] font-black text-primary leading-none">
                      {imageProgress}%
                    </span>
                  </div>
                ) : null}

                {uploadedImageUrl ? (
                  canPreviewImageUrl(uploadedImageUrl) ? (
                  <img
                    src={uploadedImageUrl}
                    alt=""
                    className={`w-full h-full object-cover rounded-full ${imageUploading ? "opacity-40 blur-[2px]" : "opacity-100"}`}
                  />
                  ) : (
                    <span className="text-[9px] font-black text-primary">URI</span>
                  )
                ) : (
                  !imageUploading && (
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
                  )
                )}
              </button>
            </div>

            {/* End-frame upload button (FLF i2v models only) */}
            {showEndFrameUpload && (
              <div className="relative">
                <input
                  ref={endImageFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleEndImageFileChange}
                />
                <button
                  type="button"
                  title={uploadedEndImageUrl ? "清除结束帧" : "上传结束帧（可选）"}
                  onClick={() =>
                    uploadedEndImageUrl
                      ? clearEndImage()
                      : endImageFileInputRef.current?.click()
                  }
                  className={`w-10 h-10 shrink-0 rounded-full border transition-all flex items-center justify-center relative overflow-hidden ${uploadedEndImageUrl ? "border-primary/60 bg-primary/5" : "bg-white/5 border-white/[0.03] hover:bg-white/10 hover:border-primary/40"} group`}
                >
                  {endImageUploading ? (
                    <div className="flex flex-col items-center justify-center w-full h-full absolute inset-0 bg-black/80 z-20 backdrop-blur-[2px]">
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
                          strokeDashoffset={88 - (88 * endImageProgress) / 100}
                          className="text-primary transition-all duration-300"
                        />
                      </svg>
                      <span className="absolute text-[9px] font-black text-primary leading-none">
                        {endImageProgress}%
                      </span>
                    </div>
                  ) : null}

                  {uploadedEndImageUrl ? (
                    canPreviewImageUrl(uploadedEndImageUrl) ? (
                    <img
                      src={uploadedEndImageUrl}
                      alt=""
                      className={`w-full h-full object-cover rounded-full ${endImageUploading ? "opacity-40 blur-[2px]" : "opacity-100"}`}
                    />
                    ) : (
                      <span className="text-[9px] font-black text-primary">URI</span>
                    )
                  ) : (
                    !endImageUploading && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40 group-hover:text-primary transition-colors">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    )
                  )}
                  <span className="absolute top-0.5 left-0.5 px-1 h-3.5 bg-black/60 rounded-md text-[7px] font-black text-primary leading-none flex items-center justify-center pointer-events-none">
                    END
                  </span>
                </button>
              </div>
            )}

            {/* Video upload button */}
            {v2vModelOptions.length > 0 && (
            <div className="relative">
              <input
                ref={videoFileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideoFileChange}
              />
              <button
                type="button"
                title={
                  uploadedVideoUrl
                    ? `${uploadedVideoName} — click to clear`
                    : "上传视频用于去除水印"
                }
                onClick={() =>
                  uploadedVideoUrl
                    ? clearVideoUpload()
                    : videoFileInputRef.current?.click()
                }
                className={`w-10 h-10 shrink-0 rounded-full border transition-all flex items-center justify-center relative overflow-hidden ${uploadedVideoUrl ? "border-primary/60 bg-white/5" : "bg-white/[0.03] border-white/[0.03] hover:bg-white/10 hover:border-primary/40"} group`}
              >
                {videoUploading ? (
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
                        strokeDashoffset={88 - (88 * videoProgress) / 100}
                        className="text-primary transition-all duration-300"
                      />
                    </svg>
                    <span className="absolute text-[9px] font-black text-primary leading-none">
                      {videoProgress}%
                    </span>
                  </div>
                ) : uploadedVideoUrl ? (
                  <video
                    src={uploadedVideoUrl}
                    className={`w-full h-full object-cover rounded-full ${videoUploading ? "opacity-40 blur-[2px]" : "opacity-100"}`}
                    muted
                    playsInline
                    onError={handleVideoPreviewError}
                  />
                ) : (
                  <VideoIconSvg className="text-white/40 group-hover:text-primary transition-colors" />
                )}
              </button>
            </div>
            )}

            {/* Prompt textarea */}
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={handlePromptInput}
                placeholder={promptPlaceholder}
                disabled={promptDisabled}
                rows={1}
                className="w-full resize-none overflow-y-auto border-none bg-transparent pt-1 text-sm leading-relaxed text-white placeholder:text-white/10 focus:outline-none disabled:opacity-40 min-h-[38px] max-h-[72px] sm:max-h-[84px] custom-scrollbar"
              />
            </div>
          </div>

          {/* Extend banner */}
          {isExtendMode && (
            <div className="flex items-center gap-2 px-3 py-1.5 mx-3 bg-primary/5 border border-primary/10 rounded-lg text-[10px] text-primary/80 font-medium tracking-tight">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <span>正在续接上一段 Seedance 2.0 结果</span>
            </div>
          )}

          {isCurrentSeedance2 && !v2vMode && (
            <div className="flex min-w-0 flex-col gap-2 border-t border-white/[0.03] pt-2">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex min-w-0 shrink overflow-x-auto custom-scrollbar gap-1 pb-0.5">
                  {SEEDANCE2_MODES.map((mode) => {
                    const active = activeSeedanceMode === mode.id;
                    const disabled = mode.id === "extend" && !lastGenerationId;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        disabled={disabled}
                        title={disabled ? "先生成一段 Seedance 2.0 视频后再续写" : `${mode.label} · ${mode.description}`}
                        onClick={() => selectSeedanceMode(mode.id)}
                        className={`h-8 min-w-[58px] shrink-0 rounded-md border px-2 text-center transition-all sm:min-w-[66px] ${
                          active
                            ? "border-primary/60 bg-primary/10 text-primary"
                            : "border-white/[0.05] bg-white/[0.03] text-white/50 hover:border-primary/30 hover:text-white/80"
                        } ${disabled ? "opacity-35 cursor-not-allowed" : ""}`}
                      >
                        <span className="block truncate text-[10px] font-black leading-8">{mode.label}</span>
                      </button>
                    );
                  })}
                </div>

                {canUseTrustedSeedanceInput && (
                  <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-1.5 overflow-x-auto custom-scrollbar pb-0.5">
                    <input
                      ref={seedanceReferenceInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleSeedanceReferenceFileChange}
                    />
                    {activeSeedanceMode === "omni" && (
                      <button
                        type="button"
                        title="本地上传 Seedance 多参考图"
                        aria-label="本地上传 Seedance 多参考图"
                        disabled={seedanceReferenceImages.length >= SEEDANCE_REFERENCE_LIMIT || seedanceReferenceUploading}
                        onClick={() => seedanceReferenceInputRef.current?.click()}
                        className={`flex h-9 min-w-[58px] shrink-0 items-center justify-center gap-1.5 rounded-md border px-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 ${
                          seedanceReferenceImages.length >= SEEDANCE_REFERENCE_LIMIT
                            ? "cursor-not-allowed border-white/[0.04] bg-white/[0.02] text-white/25"
                            : "border-white/[0.06] bg-white/[0.03] text-white/55 hover:border-primary/40 hover:text-primary"
                        }`}
                      >
                        {seedanceReferenceUploading ? (
                          <span className="text-[10px] font-black">{seedanceReferenceProgress}%</span>
                        ) : (
                          <>
                            <ImagePlus size={13} />
                            <span className="text-[10px] font-black">
                              {Math.max(0, SEEDANCE_REFERENCE_LIMIT - seedanceReferenceImages.length)}
                            </span>
                          </>
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      title="打开在线图库选择 Seedance 参考图"
                      aria-label="打开在线图库选择 Seedance 参考图"
                      onClick={handleOpenAssetGallery}
                      className={`flex h-9 min-w-[68px] shrink-0 items-center justify-center gap-1.5 rounded-md border px-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 ${
                        selectedSeedanceAssets.length > 0
                          ? "border-primary/45 bg-primary/10 text-primary hover:bg-primary hover:text-black"
                          : "border-white/[0.06] bg-white/[0.03] text-white/55 hover:border-primary/40 hover:text-primary"
                      }`}
                    >
                      {seedanceReferenceUploading ? (
                        <span className="text-[10px] font-black">{seedanceReferenceProgress}%</span>
                      ) : (
                        <>
                          <Images size={13} />
                          <span className="text-[10px] font-black">
                            {selectedSeedanceAssets.length}/{seedanceAssetSelectionLimit}
                          </span>
                        </>
                      )}
                    </button>

                    {activeSeedanceMode === "omni" ? (
                      <>
                        {selectedSeedanceAssets.slice(0, 4).map((item, index) => (
                          <div
                            key={item.id}
                            className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-white/[0.08] bg-black/40 group"
                          >
                            {canPreviewImageUrl(item.previewUrl || item.url) ? (
                              <img
                                src={item.previewUrl || item.url}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(event) => {
                                  if (item.previewUrl && event.currentTarget.src !== item.url) {
                                    event.currentTarget.src = item.url;
                                  }
                                }}
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-[8px] font-black text-primary">
                                URI
                              </span>
                            )}
                            <span className="absolute inset-x-0 bottom-0 truncate bg-black/70 px-0.5 text-center text-[7px] font-black text-primary">
                              @{index + 1}
                            </span>
                            <button
                              type="button"
                              title="删除"
                              onClick={() => removeSeedanceReferenceImage(item.id)}
                              className="absolute right-0.5 top-0.5 hidden h-4 w-4 items-center justify-center rounded bg-black/75 text-[10px] text-white/80 hover:text-primary group-hover:flex"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {selectedSeedanceAssets.length > 4 && (
                          <span className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.03] px-2 text-[10px] font-black text-white/40">
                            +{selectedSeedanceAssets.length - 4}
                          </span>
                        )}
                      </>
                    ) : selectedSeedanceAssets.length > 0 ? (
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-primary/35 bg-black/40">
                        {canPreviewImageUrl(selectedSeedanceAssets[0].previewUrl || selectedSeedanceAssets[0].url) ? (
                          <img
                            src={selectedSeedanceAssets[0].previewUrl || selectedSeedanceAssets[0].url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-[8px] font-black text-primary">
                            URI
                          </span>
                        )}
                        <span className="absolute inset-x-0 bottom-0 bg-black/70 text-center text-[7px] font-black text-primary">
                          首帧
                        </span>
                      </div>
                    ) : null}

                    {selectedSeedanceAssets.length > 0 && (
                      <button
                        type="button"
                        title="清空参考图"
                        onClick={activeSeedanceMode === "omni" ? clearSeedanceReferenceImages : clearImageUpload}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.03] text-white/45 transition-all hover:border-primary/30 hover:text-primary"
                      >
                        ×
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom row: controls + generate */}
          <div className="relative flex flex-col items-stretch justify-between gap-2 border-t border-white/[0.03] pt-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="relative flex min-w-0 flex-wrap items-center gap-2 pb-1 md:pb-0">
              {/* Model btn */}
              <div className="relative">
                <button
                  type="button"
                  onClick={toggleDropdown("model")}
                  className="group flex max-w-full items-center gap-2 rounded-md border border-white/[0.03] bg-white/[0.03] px-3 py-2 transition-all hover:bg-white/[0.06]"
                >
                  <div className="w-4 h-4 bg-[#d9ff00] rounded flex items-center justify-center shadow-lg shadow-[#d9ff00]/10">
                    <span className="text-[9px] font-bold text-black uppercase">
                      V
                    </span>
                  </div>
                  <span className="max-w-[180px] truncate text-xs font-semibold text-white/70 transition-colors group-hover:text-[#d9ff00] sm:max-w-[240px]">
                    {selectedModelName}
                  </span>
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="opacity-20 group-hover:opacity-100 transition-opacity"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {openDropdown === "model" && (
                  <div
                    ref={dropdownRef}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-[1.5rem] p-3 shadow-2xl border border-white/[0.05] w-[calc(100vw-3rem)] max-w-xs"
                  >
                    <ModelDropdown
                      imageMode={imageMode}
                      selectedModel={selectedModel}
                      onSelect={handleModelSelect}
                      onClose={() => setOpenDropdown(null)}
                      t2vModelOptions={t2vModelOptions}
                      i2vModelOptions={i2vModelOptions}
                      v2vModelOptions={v2vModelOptions}
                    />
                  </div>
                )}
              </div>

              {/* Aspect ratio btn */}
              {showAr && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={toggleDropdown("ar")}
                    className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="opacity-40 text-white"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      />
                    </svg>
                    <span className="text-[11px] font-semibold text-white/70 group-hover:text-[#d9ff00] transition-colors">
                      {selectedAr}
                    </span>
                  </button>
                  {openDropdown === "ar" && (
                    <div
                      ref={dropdownRef}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-lg p-3 shadow-2xl border border-white/[0.05] max-h-80 overflow-y-auto custom-scrollbar min-w-[160px]"
                    >
                      <div className="text-xs font-bold text-white/20 border-b border-white/[0.03] mb-2">
                        画幅
                      </div>
                      <div className="flex flex-col gap-1">
                        {getCurrentAspectRatios(selectedModel).map((r) => (
                          <div
                            key={r}
                            className="flex items-center justify-between p-3 hover:bg-white/5 rounded cursor-pointer transition-all group/opt"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAr(r);
                              setOpenDropdown(null);
                            }}
                          >
                            <span className="text-[11px] font-semibold text-white/70 group-hover/opt:text-white transition-opacity">
                              {r}
                            </span>
                            {selectedAr === r && <CheckSvg />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Duration btn */}
              {showDuration && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={toggleDropdown("duration")}
                    className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="opacity-40 text-white"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="text-xs font-semibold text-white/70 group-hover:text-[#d9ff00] transition-colors">
                      {selectedDuration}s
                    </span>
                  </button>
                  {openDropdown === "duration" && (
                    <div
                      ref={dropdownRef}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-md p-3 shadow-2xl border border-white/10 min-w-[140px]"
                    >
                      <div className="text-xs font-bold text-white/20 border-b border-white/[0.03] mb-2">
                        Duration
                      </div>
                      <div className="flex flex-col gap-1">
                        {getCurrentDurations(selectedModel).map((d) => (
                          <div
                            key={d}
                            className="flex items-center justify-between p-2 hover:bg-white/5 rounded-md cursor-pointer transition-all group/opt"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDuration(d);
                              setOpenDropdown(null);
                            }}
                          >
                            <span className="text-xs font-semibold text-white/70 group-hover/opt:text-white">
                              {d}s
                            </span>
                            {selectedDuration === d && <CheckSvg />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Resolution btn */}
              {showResolution && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={toggleDropdown("resolution")}
                    className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="opacity-40 text-white"
                    >
                      <path d="M6 2L3 6v15a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z" />
                    </svg>
                    <span className="text-[11px] font-semibold text-white/70 group-hover:text-[#d9ff00] transition-colors">
                      {selectedResolution || "720p"}
                    </span>
                  </button>
                  {openDropdown === "resolution" && (
                    <div
                      ref={dropdownRef}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-md p-3 shadow-2xl border border-white/[0.05] min-w-[140px]"
                    >
                      <div className="text-xs font-bold text-white/20 border-b border-white/[0.03] mb-2">
                        分辨率
                      </div>
                      <div className="flex flex-col gap-1">
                        {getCurrentResolutions(selectedModel).map((r) => (
                          <div
                            key={r}
                            className="flex items-center justify-between p-3 hover:bg-white/5 rounded cursor-pointer transition-all group/opt"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedResolution(r);
                              setOpenDropdown(null);
                            }}
                          >
                            <span className="text-[11px] font-semibold text-white/70 group-hover/opt:text-white">
                              {r}
                            </span>
                            {selectedResolution === r && <CheckSvg />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Generate button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-[#d9ff00] px-4 py-2 text-sm font-medium text-black shadow-lg shadow-[#d9ff00]/10 transition-all hover:scale-[1.02] hover:bg-[#e5ff33] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {generating ? (
                <>
                  <span className="animate-spin inline-block text-black">
                    ◌
                  </span>{" "}
                  生成中...
                </>
              ) : generateError ? (
                <span className="max-w-full truncate">错误：{generateError}</span>
              ) : (
                <>
                  <span>开始生成</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── FULLSCREEN VIDEO MODAL ── */}
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
          <video 
            src={fullscreenUrl} 
            controls 
            loop 
            className="max-w-[95vw] max-h-[95vh] rounded-2xl shadow-2xl object-contain animate-scale-up" 
            onClick={(e) => e.stopPropagation()}
            onCanPlay={(e) => safePlayVideo(e.currentTarget)}
            onError={handleVideoPreviewError}
          />
        </div>
      )}
    </div>
  );
}
