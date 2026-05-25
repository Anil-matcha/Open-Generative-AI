"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  applyProviderImageWhitelistDraft,
  buildProviderRequestHeaders,
  getActiveProvider,
  getProviderModelWhitelist,
  getProviderProxyBase,
  isProviderReady,
  normalizeApiConfig,
  normalizeModelWhitelist,
  providerNeedsKey,
} from "../apiProviders.js";

const LIST_TIMEOUT_MS = 15000;
const PROBE_TIMEOUT_MS = 60000;

const DEFAULT_TARGET_MODELS = [
  { id: "gpt-image-2", name: "Gpt Image 2", group: "文生图", recommended: true },
  { id: "gpt-image-2pro", name: "Gpt Image 2 Pro", group: "文生图" },
  { id: "gemini-3-pro-image-preview", name: "Gemini 3 Pro Image Preview", group: "文生图" },
];

const STATUS_META = {
  idle: { label: "待检查", className: "bg-white/5 text-white/50 border-white/10" },
  listed: { label: "待实测", className: "bg-sky-400/10 text-sky-200 border-sky-300/20" },
  checking: { label: "检查中", className: "bg-[#d9ff00]/10 text-[#d9ff00] border-[#d9ff00]/25" },
  available: { label: "可用", className: "bg-emerald-400/10 text-emerald-200 border-emerald-300/20" },
  rate_limited: { label: "429", className: "bg-yellow-400/10 text-yellow-200 border-yellow-300/20" },
  timeout: { label: "超时", className: "bg-orange-400/10 text-orange-200 border-orange-300/20" },
  unsupported: { label: "不支持", className: "bg-red-400/10 text-red-200 border-red-300/20" },
  error: { label: "异常", className: "bg-red-400/10 text-red-200 border-red-300/20" },
  no_key: { label: "缺少 Key", className: "bg-white/5 text-white/50 border-white/10" },
};

function formatModelName(modelId) {
  return String(modelId)
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildTargetModels(config, provider) {
  const whitelist = getProviderModelWhitelist(config, provider?.id);
  if (!whitelist.length) return DEFAULT_TARGET_MODELS;

  return whitelist.map((modelId) => {
    const known = DEFAULT_TARGET_MODELS.find((model) => model.id === modelId);
    return known || { id: modelId, name: formatModelName(modelId), group: "文生图" };
  });
}

function buildRows(targetModels = DEFAULT_TARGET_MODELS) {
  return targetModels.map((model) => ({
    ...model,
    status: "idle",
    detail: "尚未检查",
    duration: null,
    resultUrl: null,
    checkedAt: null,
  }));
}

function extractModelIds(data) {
  const items = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  return normalizeModelWhitelist(
    items.map((item) => {
      if (typeof item === "string") return item;
      return item?.id || item?.name || item?.model || "";
    }),
  );
}

function inferImageWhitelist(modelIds) {
  const imageHints = [
    /^gpt-image/i,
    /(^|[-_])image($|[-_])/i,
    /dall[-_]?e/i,
    /imagen/i,
    /flux/i,
    /stable[-_ ]?diffusion/i,
    /(^|[-_])sd\d*/i,
    /midjourney/i,
    /recraft/i,
    /ideogram/i,
    /seedream/i,
    /jimeng/i,
    /nano[-_ ]?banana/i,
  ];
  const nonImageHints = [/embedding/i, /audio/i, /whisper/i, /tts/i, /speech/i, /rerank/i, /moderation/i];

  return normalizeModelWhitelist(
    modelIds.filter((modelId) => {
      const id = String(modelId);
      if (nonImageHints.some((pattern) => pattern.test(id))) return false;
      return imageHints.some((pattern) => pattern.test(id));
    }),
  );
}

async function fetchWithTimeout(url, options = {}, timeoutMs = LIST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

function getResponseMessage(data, fallback = "") {
  return String(data?.error?.message || data?.error || data?.detail || fallback || "").slice(0, 180);
}

function classifyFailure(response, data) {
  const message = getResponseMessage(data, response.statusText);
  const lowerMessage = message.toLowerCase();

  if (response.status === 401 || response.status === 403) {
    return { status: "no_key", detail: "缺少 API Key" };
  }

  if (response.status === 429 || lowerMessage.includes("too many requests") || message.includes("负载已饱和")) {
    return { status: "rate_limited", detail: message || "上游分组负载饱和" };
  }

  if (
    response.status === 404 ||
    lowerMessage.includes("model_not_found") ||
    lowerMessage.includes("does not exist") ||
    lowerMessage.includes("not found")
  ) {
    return { status: "unsupported", detail: message || "模型或端点不支持" };
  }

  return { status: "error", detail: message || `HTTP ${response.status}` };
}

function hasImageResult(data) {
  const item = data?.data?.[0] || data?.output?.[0] || data;
  return Boolean(item?.url || item?.image_url || item?.b64_json || data?.url || data?.b64_json);
}

function classifyProbeResponse(response, data) {
  if (!response.ok) return classifyFailure(response, data);
  if (hasImageResult(data)) {
    const item = data?.data?.[0] || data?.output?.[0] || data;
    return {
      status: "available",
      detail: "低成本生图请求成功",
      resultUrl: item?.url || item?.image_url || data?.url || null,
    };
  }
  return { status: "error", detail: "接口返回成功，但未发现图片 URL 或 b64_json" };
}

export default function ApiHealthStudio({ apiKey, apiConfig, onSave, onMissingApiKey }) {
  const activeConfig = useMemo(() => apiConfig || normalizeApiConfig(null, apiKey), [apiConfig, apiKey]);
  const activeProvider = useMemo(() => getActiveProvider(activeConfig), [activeConfig]);
  const targetModels = useMemo(() => buildTargetModels(activeConfig, activeProvider), [activeConfig, activeProvider]);
  const [rows, setRows] = useState(() => buildRows(targetModels));
  const [modelListState, setModelListState] = useState({
    status: "idle",
    detail: "尚未同步模型列表",
    count: 0,
    checkedAt: null,
  });
  const [whitelistDraft, setWhitelistDraft] = useState({
    status: "idle",
    models: [],
    detail: "读取 /v1/models 后会自动生成图片模型白名单草稿。",
  });
  const [runningAll, setRunningAll] = useState(false);

  const updateRow = useCallback((id, patch) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }, []);

  useEffect(() => {
    setRows(buildRows(targetModels));
  }, [targetModels]);

  useEffect(() => {
    setWhitelistDraft({
      status: "idle",
      models: [],
      detail: "读取 /v1/models 后会自动生成图片模型白名单草稿。",
    });
  }, [activeProvider.id]);

  const refreshModelList = useCallback(async () => {
    setModelListState((current) => ({ ...current, status: "checking", detail: "正在同步模型列表" }));

    if (!isProviderReady(activeProvider)) {
      const missingKey = providerNeedsKey(activeProvider);
      setModelListState({
        status: missingKey ? "no_key" : "unsupported",
        detail: missingKey ? `缺少 ${activeProvider.apiKeyLabel}` : "当前通道缺少 API 地址",
        count: 0,
        checkedAt: new Date().toLocaleTimeString(),
      });
      setWhitelistDraft({
        status: "idle",
        models: [],
        detail: "通道配置完成后才能生成白名单草稿。",
      });
      setRows((current) => current.map((row) => ({ ...row, status: "idle", detail: "等待通道配置完成" })));
      if (missingKey) onMissingApiKey?.();
      return;
    }

    try {
      const response = await fetchWithTimeout(
        `${getProviderProxyBase()}/models`,
        { headers: buildProviderRequestHeaders(activeConfig) },
        LIST_TIMEOUT_MS,
      );
      const data = await readJson(response);

      if (!response.ok) {
        const failure = classifyFailure(response, data);
        setModelListState({
          status: failure.status,
          detail: failure.detail,
          count: 0,
          checkedAt: new Date().toLocaleTimeString(),
        });
        setWhitelistDraft({
          status: failure.status,
          models: [],
          detail: "模型列表未同步，暂时无法生成白名单草稿。",
        });
        if (failure.status === "no_key") onMissingApiKey?.();
        setRows((current) => current.map((row) => ({ ...row, status: "idle", detail: "模型列表未同步" })));
        return;
      }

      const modelIds = extractModelIds(data);
      const ids = new Set(modelIds);
      const draftModels = inferImageWhitelist(modelIds);
      setModelListState({
        status: "available",
        detail: "模型列表同步成功",
        count: ids.size,
        checkedAt: new Date().toLocaleTimeString(),
      });
      setWhitelistDraft({
        status: draftModels.length ? "ready" : "empty",
        models: draftModels,
        detail: draftModels.length
          ? `从 ${ids.size} 个模型中识别出 ${draftModels.length} 个图片模型。`
          : "已读取模型列表，但没有识别出明显的图片模型名。",
      });
      setRows((current) =>
        current.map((row) => {
          const listed = ids.has(row.id);
          return {
            ...row,
            status: listed ? (row.status === "available" ? "available" : "listed") : "unsupported",
            detail: listed ? "模型列表中存在，等待低成本实测" : "模型列表未返回该模型",
            duration: row.status === "available" ? row.duration : null,
            checkedAt: row.status === "available" ? row.checkedAt : new Date().toLocaleTimeString(),
          };
        }),
      );
    } catch (error) {
      const isAbort = error?.name === "AbortError";
      setModelListState({
        status: isAbort ? "timeout" : "error",
        detail: isAbort ? "模型列表请求超时" : error.message,
        count: 0,
        checkedAt: new Date().toLocaleTimeString(),
      });
      setWhitelistDraft({
        status: isAbort ? "timeout" : "error",
        models: [],
        detail: isAbort ? "模型列表超时，无法生成白名单草稿。" : "读取模型列表失败，无法生成白名单草稿。",
      });
    }
  }, [activeConfig, activeProvider, onMissingApiKey]);

  const applyWhitelistDraft = useCallback(() => {
    if (!whitelistDraft.models.length) return;
    const nextConfig = applyProviderImageWhitelistDraft(activeConfig, activeProvider.id, whitelistDraft.models);
    onSave?.(nextConfig);
    setWhitelistDraft((current) => ({
      ...current,
      status: "applied",
      detail: `已写入 ${activeProvider.shortName || activeProvider.name} 的图片模型白名单。`,
    }));
  }, [activeConfig, activeProvider, onSave, whitelistDraft.models]);

  const probeModel = useCallback(
    async (model) => {
      updateRow(model.id, {
        status: "checking",
        detail: "正在发送 1K 低成本生图请求",
        duration: null,
        resultUrl: null,
        checkedAt: new Date().toLocaleTimeString(),
      });

      const startedAt = performance.now();

      try {
        const response = await fetchWithTimeout(
          `${getProviderProxyBase()}/images/generations`,
          {
            method: "POST",
            headers: buildProviderRequestHeaders(activeConfig, { json: true }),
            body: JSON.stringify({
              model: model.id,
              prompt: "一枚暖黄色星形贴纸，白色背景，极简插画风格",
              n: 1,
              size: "1024x1024",
              quality: "low",
            }),
          },
          PROBE_TIMEOUT_MS,
        );
        const data = await readJson(response);
        const result = classifyProbeResponse(response, data);

        if (result.status === "no_key") onMissingApiKey?.();
        updateRow(model.id, {
          ...result,
          duration: Math.round(performance.now() - startedAt),
          checkedAt: new Date().toLocaleTimeString(),
        });
        return result;
      } catch (error) {
        const isAbort = error?.name === "AbortError";
        const result = {
          status: isAbort ? "timeout" : "error",
          detail: isAbort ? "低成本实测超过 60 秒未返回" : error.message,
          duration: Math.round(performance.now() - startedAt),
          checkedAt: new Date().toLocaleTimeString(),
        };
        updateRow(model.id, result);
        return result;
      }
    },
    [activeConfig, onMissingApiKey, updateRow],
  );

  const runAllProbes = useCallback(async () => {
    setRunningAll(true);
    try {
      for (const model of targetModels) {
        const current = rows.find((row) => row.id === model.id);
        if (current?.status === "unsupported") continue;
        await probeModel(model);
      }
    } finally {
      setRunningAll(false);
    }
  }, [probeModel, rows, targetModels]);

  useEffect(() => {
    refreshModelList();
  }, [refreshModelList]);

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc[row.status] = (acc[row.status] || 0) + 1;
        return acc;
      },
      {},
    );
  }, [rows]);

  const modelListMeta = STATUS_META[modelListState.status] || STATUS_META.idle;
  const whitelistDraftReady = whitelistDraft.models.length > 0;

  return (
    <div className="h-full overflow-auto bg-[#030303] text-white">
      <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-6 px-6 py-7">
        <div className="flex flex-col gap-4 border-b border-white/[0.06] pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 text-[12px] font-bold uppercase tracking-[0.18em] text-[#d9ff00]/70">
              {activeProvider.name}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">API 健康检查</h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-white/45">
              模型列表检查不消耗生图额度；低成本实测会通过当前通道发送一次 1K 文生图请求。
              {targetModels.length ? " 当前列表来自 API 管理中的图片模型清单。" : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={refreshModelList}
              disabled={modelListState.status === "checking"}
              className="h-10 rounded-md border border-white/10 bg-white/5 px-4 text-[13px] font-bold text-white/80 transition-colors hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              刷新模型列表
            </button>
            <button
              type="button"
              onClick={runAllProbes}
              disabled={runningAll || rows.some((row) => row.status === "checking")}
              className="h-10 rounded-md bg-[#d9ff00] px-4 text-[13px] font-bold text-black transition-colors hover:bg-[#e5ff33] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {runningAll ? "实测中" : "开始低成本实测"}
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-md border border-white/[0.06] bg-white/[0.03] p-4">
            <div className="text-[12px] text-white/40">模型列表</div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-xl font-bold">{modelListState.count}</span>
              <span className={`rounded-full border px-2.5 py-1 text-[12px] font-bold ${modelListMeta.className}`}>
                {modelListMeta.label}
              </span>
            </div>
            <div className="mt-3 min-h-8 text-[12px] leading-4 text-white/45">{modelListState.detail}</div>
          </div>

          {["available", "rate_limited", "timeout"].map((status) => {
            const meta = STATUS_META[status];
            return (
              <div key={status} className="rounded-md border border-white/[0.06] bg-white/[0.03] p-4">
                <div className="text-[12px] text-white/40">{meta.label}</div>
                <div className="mt-2 text-2xl font-bold">{summary[status] || 0}</div>
                <div className="mt-3 h-1.5 rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-[#d9ff00]"
                    style={{ width: `${((summary[status] || 0) / rows.length) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-md border border-white/[0.06] bg-white/[0.03] p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="text-[12px] font-bold text-white/55">白名单草稿</div>
              <p className="mt-1 text-[12px] leading-5 text-white/40">
                自动从 /v1/models 推断图片模型，用来减少图像页误选不可用模型。
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {whitelistDraftReady ? (
                  whitelistDraft.models.map((modelId) => (
                    <span
                      key={modelId}
                      className="rounded-md border border-[#d9ff00]/20 bg-[#d9ff00]/10 px-2.5 py-1 font-mono text-[12px] font-bold text-[#d9ff00]"
                    >
                      {modelId}
                    </span>
                  ))
                ) : (
                  <span className="text-[12px] text-white/30">暂无可应用模型。</span>
                )}
              </div>
              <div className="mt-3 text-[12px] leading-5 text-white/38">{whitelistDraft.detail}</div>
            </div>
            <button
              type="button"
              onClick={applyWhitelistDraft}
              disabled={!whitelistDraftReady || !onSave}
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#d9ff00] px-4 text-[13px] font-bold text-black transition-colors hover:bg-[#e5ff33] disabled:cursor-not-allowed disabled:opacity-40"
            >
              应用到 API 管理
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-md border border-white/[0.06]">
          <div className="min-w-[920px]">
          <div className="grid grid-cols-[1.15fr_0.7fr_0.6fr_0.65fr_1.5fr_0.55fr] border-b border-white/[0.06] bg-white/[0.03] px-4 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-white/35">
            <div>模型</div>
            <div>类型</div>
            <div>状态</div>
            <div>耗时</div>
            <div>详情</div>
            <div className="text-right">操作</div>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {rows.map((row) => {
              const meta = STATUS_META[row.status] || STATUS_META.idle;
              const busy = row.status === "checking" || runningAll;
              return (
                <div
                  key={row.id}
                  className="grid grid-cols-[1.15fr_0.7fr_0.6fr_0.65fr_1.5fr_0.55fr] items-center px-4 py-4 text-[13px]"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-bold text-white">
                      <span>{row.name}</span>
                      {row.recommended && (
                        <span className="rounded-full border border-[#d9ff00]/20 bg-[#d9ff00]/10 px-2 py-0.5 text-[11px] text-[#d9ff00]">
                          稳定
                        </span>
                      )}
                    </div>
                    <div className="mt-1 truncate font-mono text-[12px] text-white/35">{row.id}</div>
                  </div>
                  <div className="text-white/55">{row.group}</div>
                  <div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[12px] font-bold ${meta.className}`}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="font-mono text-[12px] text-white/50">
                    {row.duration === null ? "-" : `${(row.duration / 1000).toFixed(1)}s`}
                  </div>
                  <div className="min-w-0 pr-4 text-[12px] leading-5 text-white/50">
                    <div className="truncate">{row.detail}</div>
                    {row.checkedAt && <div className="mt-0.5 text-white/25">{row.checkedAt}</div>}
                    {row.resultUrl && (
                      <a
                        href={row.resultUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex text-[#d9ff00]/80 hover:text-[#d9ff00]"
                      >
                        查看结果
                      </a>
                    )}
                  </div>
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => probeModel(row)}
                      disabled={busy || row.status === "unsupported"}
                      className="h-8 rounded-md border border-white/10 bg-white/5 px-3 text-[12px] font-bold text-white/75 transition-colors hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      实测
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
