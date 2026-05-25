"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

export const TASK_CENTER_REFRESH_EVENT = "hg-task-center-refresh";
export const IMAGE_STUDIO_PERSIST_KEY = "hg_image_studio_persistent";
export const VIDEO_STUDIO_PERSIST_KEY = "hg_video_studio_persistent";

function getBrowserStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage || null;
  } catch {
    return null;
  }
}

function readStorageValue(storage, key) {
  try {
    if (storage && typeof storage.getItem === "function") return storage.getItem(key);
    return getBrowserStorage()?.getItem(key) || null;
  } catch {
    return null;
  }
}

function readJsonStorage(storage, key) {
  try {
    const raw = readStorageValue(storage, key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getTaskTime(entry) {
  return entry?.completedAt || entry?.updatedAt || entry?.timestamp || entry?.submittedAt || "";
}

function getVideoRequestId(entry) {
  return entry?.requestId || entry?.request_id || entry?.task_id || entry?.id || "";
}

function getTaskVideoUrl(entry) {
  return entry?.url || entry?.video_url || entry?.result_url || entry?.failedUrl || "";
}

function parseTaskTime(value) {
  if (typeof value === "number") return value;
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : 0;
}

export function collectTaskCenterItems({ storage = null } = {}) {
  const imageState = readJsonStorage(storage, IMAGE_STUDIO_PERSIST_KEY);
  const videoState = readJsonStorage(storage, VIDEO_STUDIO_PERSIST_KEY);

  const imageItems = (Array.isArray(imageState?.localHistory) ? imageState.localHistory : [])
    .filter((entry) => entry?.url)
    .map((entry, index) => ({
      id: entry.id || entry.url || `image-${index}`,
      type: "image",
      title: entry.prompt || "未填写提示词",
      url: entry.url,
      prompt: entry.prompt || "",
      model: entry.model || "image",
      status: "completed",
      timestamp: getTaskTime(entry),
    }));

  const videoItems = (Array.isArray(videoState?.localHistory) ? videoState.localHistory : []).map((entry, index) => {
    const requestId = getVideoRequestId(entry);
    const url = getTaskVideoUrl(entry);
    const status =
      entry.status === "failed" && url
        ? "completed"
        : entry.status || (url ? "completed" : requestId ? "processing" : "unknown");

    return {
      id: requestId || url || `video-${index}`,
      type: "video",
      title: entry.prompt || requestId || "未填写提示词",
      url,
      prompt: entry.prompt || "",
      model: entry.model || "video",
      status,
      requestId,
      timestamp: getTaskTime(entry),
      error: entry.error || "",
      previewError: entry.previewError || "",
    };
  });

  return [...videoItems, ...imageItems].sort((a, b) => parseTaskTime(b.timestamp) - parseTaskTime(a.timestamp));
}

function formatTaskTime(value) {
  const parsed = parseTaskTime(value);
  if (!parsed) return "刚刚";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(parsed));
}

function getStatusText(item) {
  if (item.previewError) return "预览失败";
  if (item.status === "failed") return "失败";
  if (item.status === "completed" || item.url) return "已完成";
  return "进行中";
}

function TaskCard({ item }) {
  const isVideo = item.type === "video";
  const statusText = getStatusText(item);

  return (
    <div className="group overflow-hidden rounded-md border border-white/[0.08] bg-white/[0.025] transition-colors hover:border-[#d9ff00]/35">
      <div className="relative aspect-video bg-black/55">
        {item.url && isVideo ? (
          <video src={item.url} className="h-full w-full object-cover" muted playsInline loop />
        ) : item.url ? (
          <img src={item.url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center">
            <span className="inline-block animate-spin text-2xl text-[#d9ff00]">◌</span>
            <span className="text-[11px] font-bold text-white/35">等待结果 URL</span>
          </div>
        )}
        <div className="absolute left-2 top-2 flex items-center gap-1.5">
          <span className={`rounded px-2 py-1 text-[10px] font-black ${isVideo ? "bg-[#d9ff00] text-black" : "bg-white/85 text-black"}`}>
            {isVideo ? "视频" : "图片"}
          </span>
          <span className="rounded bg-black/70 px-2 py-1 text-[10px] font-black text-white/70">
            {statusText}
          </span>
        </div>
      </div>

      <div className="space-y-2 p-3">
        <div className="line-clamp-2 min-h-[36px] text-[12px] font-bold leading-relaxed text-white/75" title={item.title}>
          {item.title}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate rounded border border-[#d9ff00]/20 bg-[#d9ff00]/10 px-2 py-0.5 text-[10px] font-black text-[#d9ff00]">
            {item.model || item.type}
          </span>
          <span className="shrink-0 text-[10px] font-semibold text-white/30">
            {formatTaskTime(item.timestamp)}
          </span>
        </div>
        {item.requestId && (
          <div className="truncate font-mono text-[10px] text-white/25" title={item.requestId}>
            {item.requestId}
          </div>
        )}
        {item.error && (
          <div className="line-clamp-2 text-[10px] font-semibold text-red-200/60" title={item.error}>
            {item.error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            disabled={!item.url}
            onClick={() => item.url && window.open(item.url, "_blank", "noopener,noreferrer")}
            className="h-8 rounded-md border border-white/[0.06] bg-white/[0.03] text-[10px] font-black text-white/55 transition-colors hover:border-[#d9ff00]/35 hover:text-[#d9ff00] disabled:cursor-not-allowed disabled:opacity-35"
          >
            打开
          </button>
          <button
            type="button"
            disabled={!item.url}
            onClick={() => item.url && navigator.clipboard?.writeText(item.url)}
            className="h-8 rounded-md border border-white/[0.06] bg-white/[0.03] text-[10px] font-black text-white/55 transition-colors hover:border-[#d9ff00]/35 hover:text-[#d9ff00] disabled:cursor-not-allowed disabled:opacity-35"
          >
            复制 URL
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TaskCenter({ open, onClose, storage = null }) {
  const [items, setItems] = useState([]);
  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");

  const refresh = useCallback(() => {
    setItems(collectTaskCenterItems({ storage }));
  }, [storage]);

  useEffect(() => {
    refresh();
    if (typeof window === "undefined") return undefined;

    window.addEventListener("storage", refresh);
    window.addEventListener(TASK_CENTER_REFRESH_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(TASK_CENTER_REFRESH_EVENT, refresh);
    };
  }, [refresh]);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  const stats = useMemo(
    () => ({
      all: items.length,
      image: items.filter((item) => item.type === "image").length,
      video: items.filter((item) => item.type === "video").length,
    }),
    [items],
  );

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (type !== "all" && item.type !== type) return false;
      if (!q) return true;
      return [item.title, item.prompt, item.model, item.id, item.url, item.requestId].some((value) =>
        String(value || "").toLowerCase().includes(q),
      );
    });
  }, [items, search, type]);

  const typeTabs = useMemo(
    () => [
      { id: "all", label: "全部", count: stats.all },
      { id: "image", label: "图片", count: stats.image },
      { id: "video", label: "视频", count: stats.video },
    ],
    [stats],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div className="flex h-[78vh] w-full max-w-5xl flex-col overflow-hidden rounded-md border border-white/[0.08] bg-[#080808]/95 shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-black text-white/90">任务中心</h2>
            <p className="mt-1 text-[12px] font-semibold text-white/35">
              图片、视频和生成中的任务都会从本地历史汇总到这里
            </p>
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.03] text-white/45 transition-colors hover:border-[#d9ff00]/35 hover:text-[#d9ff00]"
            title="关闭任务中心"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-white/[0.05] px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {typeTabs.map((tab) => {
              const active = type === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setType(tab.id)}
                  className={`flex h-9 items-center gap-2 rounded-md border px-3 text-[11px] font-black transition-colors ${
                    active
                      ? "border-[#d9ff00]/60 bg-[#d9ff00]/10 text-[#d9ff00]"
                      : "border-white/[0.06] bg-white/[0.03] text-white/50 hover:border-[#d9ff00]/35 hover:text-white/75"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/45">
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜索提示词、模型、任务 ID、URL"
              className="h-9 w-full min-w-0 rounded-md border border-white/[0.06] bg-white/[0.03] px-3 text-[12px] font-semibold text-white outline-none placeholder:text-white/25 focus:border-[#d9ff00]/45 lg:w-80"
            />
            <button
              type="button"
              onClick={refresh}
              className="h-9 shrink-0 rounded-md border border-white/[0.06] bg-white/[0.03] px-3 text-[11px] font-bold text-white/50 transition-colors hover:border-[#d9ff00]/35 hover:text-[#d9ff00]"
            >
              刷新
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar p-5">
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => (
                <TaskCard key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>
          ) : (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-md border border-dashed border-white/[0.08] bg-white/[0.02] text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.03] text-xl text-[#d9ff00]">
                ◌
              </div>
              <div className="text-sm font-black text-white/65">暂无匹配任务</div>
              <div className="mt-1 text-[11px] font-semibold text-white/30">
                生成图片或视频后，会自动出现在这里
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
