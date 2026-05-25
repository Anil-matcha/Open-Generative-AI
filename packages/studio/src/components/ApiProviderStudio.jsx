"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Download,
  ExternalLink,
  FileUp,
  KeyRound,
  Plus,
  RotateCcw,
  Server,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import {
  API_PROVIDER_PRESETS,
  DEFAULT_API_PROVIDER_ID,
  PROVIDER_CAPABILITY_KEYS,
  PROVIDER_CAPABILITY_META,
  buildProviderRequestHeaders,
  createApiProviderExport,
  createCustomProviderEntry,
  getActiveProvider,
  getAllProviderEntries,
  getProviderEntry,
  getProviderProxyBase,
  isProviderReady,
  maskApiKey,
  normalizeApiConfig,
  normalizeApiKey,
  normalizeModelWhitelist,
  normalizeProviderCapabilities,
} from "../apiProviders.js";

const TEST_TIMEOUT_MS = 15000;
const LOCAL_TEMPLATE_TIMEOUT_MS = 60000;

const PROVIDER_ICONS = {
  hfsy: Zap,
  yunwu: Zap,
  "openai-compatible": Server,
  local: Server,
};

const COMMON_IMAGE_MODELS = ["gpt-image-2", "gpt-image-2pro", "gemini-3-pro-image-preview", "gpt-image-1.5", "gpt-image-1"];
const COMMON_VIDEO_MODELS = [
  "sd-2",
  "sd-2-vip",
  "kling-v3.0-standard-text-to-video",
  "kling-v3.0-pro-text-to-video",
  "openai-sora-2-text-to-video",
  "openai-sora-2-image-to-video",
];

const STATUS_META = {
  idle: { label: "未测试", className: "border-white/10 bg-white/5 text-white/45" },
  checking: { label: "测试中", className: "border-[#d9ff00]/25 bg-[#d9ff00]/10 text-[#d9ff00]" },
  available: { label: "可连接", className: "border-emerald-300/20 bg-emerald-400/10 text-emerald-200" },
  no_key: { label: "缺少密钥", className: "border-white/10 bg-white/5 text-white/45" },
  timeout: { label: "超时", className: "border-orange-300/20 bg-orange-400/10 text-orange-200" },
  rate_limited: { label: "429", className: "border-yellow-300/20 bg-yellow-400/10 text-yellow-200" },
  unsupported: { label: "不支持", className: "border-red-300/20 bg-red-400/10 text-red-200" },
  error: { label: "异常", className: "border-red-300/20 bg-red-400/10 text-red-200" },
};

const LOCAL_TESTS = [
  {
    id: "models",
    label: "模型列表",
    path: "models",
    method: "GET",
    help: "/v1/models",
  },
  {
    id: "chat",
    label: "对话接口",
    path: "chat/completions",
    method: "POST",
    help: "/v1/chat/completions",
  },
  {
    id: "image",
    label: "生图接口",
    path: "images/generations",
    method: "POST",
    help: "/v1/images/generations",
  },
];

function fetchWithTimeout(url, options = {}, timeoutMs = TEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeout));
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

function buildConfigWithActive(config, providerId) {
  const normalized = normalizeApiConfig(config);
  return normalizeApiConfig({
    ...normalized,
    activeProviderId: providerId,
    providers: {
      ...normalized.providers,
      [providerId]: {
        ...normalized.providers?.[providerId],
        enabled: true,
      },
    },
  });
}

function getResponseMessage(data, fallback = "") {
  return String(data?.error?.message || data?.error || data?.detail || fallback || "").slice(0, 180);
}

function classifyTestFailure(response, data) {
  const message = getResponseMessage(data, response.statusText);
  const lowerMessage = message.toLowerCase();

  if (response.status === 401 || response.status === 403) return { status: "no_key", detail: "密钥无效或未填写" };
  if (response.status === 429 || lowerMessage.includes("too many requests") || message.includes("负载已饱和")) {
    return { status: "rate_limited", detail: message || "请求过快或上游繁忙" };
  }
  if (response.status === 404 || lowerMessage.includes("not found")) {
    return { status: "unsupported", detail: "这个地址没有返回 OpenAI 格式的接口" };
  }
  return { status: "error", detail: message || `HTTP ${response.status}` };
}

function getImageResultCount(data) {
  if (Array.isArray(data?.data)) return data.data.length;
  if (Array.isArray(data?.output)) return data.output.length;
  return data?.url || data?.b64_json ? 1 : 0;
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function makeIdleLocalStates() {
  return Object.fromEntries(
    LOCAL_TESTS.map((test) => [
      test.id,
      { status: "idle", detail: "等待手动检测", count: null },
    ]),
  );
}

function getEnabledCapabilityKeys(provider) {
  const capabilities = normalizeProviderCapabilities(provider?.capabilities);
  return PROVIDER_CAPABILITY_KEYS.filter((key) => capabilities[key]);
}

export default function ApiProviderStudio({ apiConfig, onSave }) {
  const importInputRef = useRef(null);
  const [draftConfig, setDraftConfig] = useState(() => normalizeApiConfig(apiConfig));
  const [selectedProviderId, setSelectedProviderId] = useState(() => normalizeApiConfig(apiConfig).activeProviderId);
  const [modelDraft, setModelDraft] = useState("");
  const [videoModelDraft, setVideoModelDraft] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [testState, setTestState] = useState({
    status: "idle",
    detail: "保存后，图像、视频创作和健康检查会使用这个通道。",
    count: null,
  });
  const [localTestStates, setLocalTestStates] = useState(() => makeIdleLocalStates());

  useEffect(() => {
    const normalized = normalizeApiConfig(apiConfig);
    setDraftConfig(normalized);
    setSelectedProviderId(normalized.activeProviderId);
  }, [apiConfig]);

  const providers = useMemo(() => getAllProviderEntries(draftConfig), [draftConfig]);
  const activeProvider = useMemo(() => getActiveProvider(draftConfig), [draftConfig]);
  const selectedProvider = useMemo(
    () => getProviderEntry(draftConfig, selectedProviderId),
    [draftConfig, selectedProviderId],
  );
  const selectedMeta = STATUS_META[testState.status] || STATUS_META.idle;
  const imageWhitelist = selectedProvider.imageModelWhitelist || [];
  const videoWhitelist = selectedProvider.videoModelWhitelist || [];
  const selectedCapabilities = normalizeProviderCapabilities(selectedProvider.capabilities);
  const isCustomProvider = Boolean(selectedProvider.custom);
  const isLocalLike = selectedProvider.id === "local" || /localhost|127\.0\.0\.1|0\.0\.0\.0|\.local/i.test(selectedProvider.baseUrl);

  const resetInlineTests = (detail = "连接信息已改动，可以重新测试。") => {
    setTestState({ status: "idle", detail, count: null });
    setLocalTestStates(makeIdleLocalStates());
  };

  const updateSelectedProvider = (patch) => {
    setDraftConfig((current) => normalizeApiConfig({
      ...current,
      providers: {
        ...current.providers,
        [selectedProviderId]: {
          ...current.providers[selectedProviderId],
          ...patch,
        },
      },
    }));
    resetInlineTests();
  };

  const saveSelectedProvider = () => {
    const nextConfig = buildConfigWithActive(draftConfig, selectedProviderId);
    setDraftConfig(nextConfig);
    onSave?.(nextConfig);
    setImportMessage("");
    setTestState({
      status: "idle",
      detail: "已保存为当前创作通道。",
      count: null,
    });
  };

  const clearSelectedProvider = () => {
    const preset = API_PROVIDER_PRESETS[selectedProviderId];
    if (!preset) return;
    const nextConfig = normalizeApiConfig({
      ...draftConfig,
      providers: {
        ...draftConfig.providers,
        [selectedProviderId]: {
          id: selectedProviderId,
          baseUrl: preset.baseUrl,
          apiKey: "",
          enabled: selectedProviderId === draftConfig.activeProviderId,
          imageModelWhitelist: preset.imageModelWhitelist || [],
          videoModelWhitelist: preset.videoModelWhitelist || [],
          capabilities: preset.capabilities,
        },
      },
    });
    setDraftConfig(nextConfig);
    onSave?.(nextConfig);
    resetInlineTests("这个通道的密钥和地址已恢复为默认值。");
  };

  const createProvider = () => {
    const provider = createCustomProviderEntry({ imageModelWhitelist: ["gpt-image-1"], videoModelWhitelist: [] });
    const nextConfig = normalizeApiConfig({
      ...draftConfig,
      providerOrder: [...(draftConfig.providerOrder || providers.map((item) => item.id)), provider.id],
      providers: {
        ...draftConfig.providers,
        [provider.id]: provider,
      },
    });
    setDraftConfig(nextConfig);
    setSelectedProviderId(provider.id);
    setModelDraft("");
    setVideoModelDraft("");
    resetInlineTests("已新建通道，请填写地址和密钥后保存。");
  };

  const deleteSelectedProvider = () => {
    if (!selectedProvider.custom) return;
    const confirmed = window.confirm(`删除「${selectedProvider.name}」？这会移除它保存的地址、密钥和模型清单。`);
    if (!confirmed) return;

    const { [selectedProvider.id]: _removed, ...remainingProviders } = draftConfig.providers;
    const fallbackId = draftConfig.activeProviderId === selectedProvider.id ? DEFAULT_API_PROVIDER_ID : draftConfig.activeProviderId;
    const nextConfig = normalizeApiConfig({
      ...draftConfig,
      activeProviderId: fallbackId,
      providerOrder: (draftConfig.providerOrder || []).filter((id) => id !== selectedProvider.id),
      providers: remainingProviders,
    });
    setDraftConfig(nextConfig);
    setSelectedProviderId(nextConfig.activeProviderId);
    onSave?.(nextConfig);
    resetInlineTests("自定义通道已删除。");
  };

  const moveProvider = (providerId, direction) => {
    const currentOrder = (draftConfig.providerOrder?.length ? draftConfig.providerOrder : providers.map((item) => item.id))
      .filter((id) => draftConfig.providers[id]);
    const index = currentOrder.indexOf(providerId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= currentOrder.length) return;

    const nextOrder = [...currentOrder];
    const [moved] = nextOrder.splice(index, 1);
    nextOrder.splice(nextIndex, 0, moved);

    const nextConfig = normalizeApiConfig({
      ...draftConfig,
      providerOrder: nextOrder,
    });
    setDraftConfig(nextConfig);
    onSave?.(nextConfig);
    resetInlineTests("通道排序已更新。");
  };

  const testSelectedProvider = async () => {
    const configForTest = buildConfigWithActive(draftConfig, selectedProviderId);
    const provider = getActiveProvider(configForTest);

    if (provider.requiresKey && !normalizeApiKey(provider.apiKey)) {
      setTestState({ status: "no_key", detail: "先粘贴密钥，再测试连接。", count: null });
      return;
    }

    if (!provider.baseUrl) {
      setTestState({ status: "unsupported", detail: "先填写 API 地址。", count: null });
      return;
    }

    setTestState({ status: "checking", detail: "正在读取模型列表，不会触发生图费用。", count: null });

    try {
      const response = await fetchWithTimeout(`${getProviderProxyBase()}/models`, {
        headers: buildProviderRequestHeaders(configForTest),
      });
      const data = await readJson(response);

      if (!response.ok) {
        setTestState({ ...classifyTestFailure(response, data), count: null });
        return;
      }

      const count = Array.isArray(data?.data) ? data.data.length : 0;
      setTestState({
        status: "available",
        detail: count ? `已读到 ${count} 个模型。` : "连接成功，但模型列表为空。",
        count,
      });
    } catch (error) {
      setTestState({
        status: error?.name === "AbortError" ? "timeout" : "error",
        detail: error?.name === "AbortError" ? "超过 15 秒未返回。" : error.message,
        count: null,
      });
    }
  };

  const runLocalTemplateTest = async (testId) => {
    const test = LOCAL_TESTS.find((item) => item.id === testId);
    if (!test) return;

    const configForTest = buildConfigWithActive(draftConfig, selectedProviderId);
    const provider = getActiveProvider(configForTest);
    if (provider.requiresKey && !normalizeApiKey(provider.apiKey)) {
      setLocalTestStates((current) => ({
        ...current,
        [testId]: { status: "no_key", detail: "缺少当前通道密钥", count: null },
      }));
      return;
    }

    const imageModel = imageWhitelist[0] || "gpt-image-1";
    const init = {
      method: test.method,
      headers: buildProviderRequestHeaders(configForTest, { json: test.method !== "GET" }),
    };

    if (test.id === "chat") {
      init.body = JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 8,
      });
    }

    if (test.id === "image") {
      init.body = JSON.stringify({
        model: imageModel,
        prompt: "白色背景上的极简电影场记板图标",
        n: 1,
        size: "1024x1024",
        quality: "low",
      });
    }

    setLocalTestStates((current) => ({
      ...current,
      [testId]: { status: "checking", detail: "正在检测", count: null },
    }));

    try {
      const response = await fetchWithTimeout(
        `${getProviderProxyBase()}/${test.path}`,
        init,
        test.id === "models" ? TEST_TIMEOUT_MS : LOCAL_TEMPLATE_TIMEOUT_MS,
      );
      const data = await readJson(response);

      if (!response.ok) {
        setLocalTestStates((current) => ({
          ...current,
          [testId]: { ...classifyTestFailure(response, data), count: null },
        }));
        return;
      }

      const count = test.id === "models"
        ? Array.isArray(data?.data) ? data.data.length : 0
        : test.id === "image"
          ? getImageResultCount(data)
          : 1;

      setLocalTestStates((current) => ({
        ...current,
        [testId]: {
          status: "available",
          detail: test.id === "models" ? `返回 ${count} 个模型` : "请求成功",
          count,
        },
      }));
    } catch (error) {
      setLocalTestStates((current) => ({
        ...current,
        [testId]: {
          status: error?.name === "AbortError" ? "timeout" : "error",
          detail: error?.name === "AbortError" ? "请求超时" : error.message,
          count: null,
        },
      }));
    }
  };

  const addWhitelistModels = (value) => {
    const nextModels = normalizeModelWhitelist([...imageWhitelist, ...normalizeModelWhitelist(value)]);
    updateSelectedProvider({ imageModelWhitelist: nextModels });
    setModelDraft("");
  };

  const removeWhitelistModel = (modelId) => {
    updateSelectedProvider({ imageModelWhitelist: imageWhitelist.filter((item) => item !== modelId) });
  };

  const addVideoWhitelistModels = (value) => {
    const nextModels = normalizeModelWhitelist([...videoWhitelist, ...normalizeModelWhitelist(value)]);
    updateSelectedProvider({ videoModelWhitelist: nextModels });
    setVideoModelDraft("");
  };

  const removeVideoWhitelistModel = (modelId) => {
    updateSelectedProvider({ videoModelWhitelist: videoWhitelist.filter((item) => item !== modelId) });
  };

  const toggleCapability = (capabilityKey) => {
    updateSelectedProvider({
      capabilities: {
        ...selectedCapabilities,
        [capabilityKey]: !selectedCapabilities[capabilityKey],
      },
    });
  };

  const exportConfig = (includeSecrets = false) => {
    const payload = createApiProviderExport(draftConfig, { includeSecrets });
    downloadJson(
      includeSecrets
        ? "open-generative-ai-api-providers-full.json"
        : "open-generative-ai-api-providers-safe.json",
      payload,
    );
    setImportMessage(includeSecrets ? "已导出完整配置，请妥善保管密钥。" : "已导出隐藏密钥版配置。");
  };

  const importConfigFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        const importedConfig = normalizeApiConfig(parsed.config || parsed);
        setDraftConfig(importedConfig);
        setSelectedProviderId(importedConfig.activeProviderId);
        onSave?.(importedConfig);
        setImportMessage("导入完成，已保存为当前配置。");
        resetInlineTests("导入完成，可以测试当前通道。");
      } catch (error) {
        setImportMessage(`导入失败：${error.message}`);
      }
    };
    reader.readAsText(file, "utf-8");
  };

  return (
    <div className="h-full overflow-auto bg-[#030303] text-white">
      <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-6 px-5 py-6 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-4 border-b border-white/[0.06] pb-6">
          <div className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#d9ff00]/70">
            API 通道
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">API 管理</h1>
              <p className="mt-2 max-w-2xl text-[13px] leading-6 text-white/45">
                统一管理 Yunwu、OpenAI 兼容中转和本地服务。保存后，图像创作、健康检查、工作流、智能体和应用中心会读取同一套当前通道。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={importConfigFile}
              />
              <button
                type="button"
                onClick={() => exportConfig(false)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-[12px] font-bold text-white/75 transition-colors hover:border-white/20 hover:bg-white/10"
                title="排查用导出，不包含 API Key"
              >
                <Download size={15} />
                隐藏密钥导出
              </button>
              <button
                type="button"
                onClick={() => exportConfig(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-[12px] font-bold text-white/75 transition-colors hover:border-white/20 hover:bg-white/10"
                title="完整备份会包含密钥"
              >
                <KeyRound size={15} />
                完整导出
              </button>
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-[12px] font-bold text-white/75 transition-colors hover:border-white/20 hover:bg-white/10"
              >
                <FileUp size={15} />
                导入配置
              </button>
              <button
                type="button"
                onClick={createProvider}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#d9ff00] px-3 text-[12px] font-bold text-black transition-colors hover:bg-[#e5ff33]"
              >
                <Plus size={15} />
                新建通道
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[12px] text-white/35">
            <span className={`h-2 w-2 rounded-full ${isProviderReady(activeProvider) ? "bg-emerald-400" : "bg-white/25"}`} />
            当前使用：<span className="font-bold text-white/85">{activeProvider.name}</span>
            <span className="font-mono text-white/45">{maskApiKey(activeProvider.apiKey)}</span>
            {importMessage && <span className="text-[#d9ff00]/75">{importMessage}</span>}
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.15fr]">
          <section className="space-y-3">
            {providers.map((provider, providerIndex) => {
              const isSelected = selectedProviderId === provider.id;
              const isActive = draftConfig.activeProviderId === provider.id;
              const ready = isProviderReady(provider);
              const Icon = PROVIDER_ICONS[provider.id] || Server;
              const enabledCapabilities = getEnabledCapabilityKeys(provider);

              return (
                <div
                  key={provider.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onClick={() => {
                    setSelectedProviderId(provider.id);
                    setModelDraft("");
                    resetInlineTests(isActive ? "这是当前正在使用的通道。" : "编辑后保存，才会切换到这个通道。");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedProviderId(provider.id);
                      setModelDraft("");
                      resetInlineTests(isActive ? "这是当前正在使用的通道。" : "编辑后保存，才会切换到这个通道。");
                    }
                  }}
                  className={`w-full rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9ff00]/60 ${
                    isSelected
                      ? "border-[#d9ff00]/45 bg-[#d9ff00]/[0.06]"
                      : "border-white/[0.07] bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border ${
                      isSelected ? "border-[#d9ff00]/30 bg-[#d9ff00]/10 text-[#d9ff00]" : "border-white/10 bg-black/20 text-white/55"
                    }`}>
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-white">{provider.name}</span>
                            {isActive && (
                              <span className="rounded-full border border-[#d9ff00]/25 bg-[#d9ff00]/10 px-2 py-0.5 text-[11px] font-bold text-[#d9ff00]">
                                当前使用
                              </span>
                            )}
                            {provider.custom && (
                              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/45">
                                自定义
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 gap-1" aria-label="通道排序">
                          <button
                            type="button"
                            title="上移"
                            onClick={(event) => {
                              event.stopPropagation();
                              moveProvider(provider.id, -1);
                            }}
                            disabled={providerIndex === 0}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-black/20 text-white/45 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            type="button"
                            title="下移"
                            onClick={(event) => {
                              event.stopPropagation();
                              moveProvider(provider.id, 1);
                            }}
                            disabled={providerIndex === providers.length - 1}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-black/20 text-white/45 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ArrowDown size={13} />
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 text-[12px] leading-5 text-white/43">{provider.fit}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                        <span className="rounded-full border border-white/10 bg-black/15 px-2 py-1 text-white/45">
                          {provider.badge}
                        </span>
                        <span className={`rounded-full border px-2 py-1 ${
                          ready ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-black/15 text-white/40"
                        }`}>
                          {ready ? "已填写" : provider.requiresKey ? "待填密钥" : "待确认地址"}
                        </span>
                        <span className="rounded-full border border-white/10 bg-black/15 px-2 py-1 text-white/40">
                          图片模型 {provider.imageModelWhitelist?.length || 0}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {enabledCapabilities.map((capabilityKey) => (
                          <span
                            key={capabilityKey}
                            className="rounded-full border border-[#d9ff00]/15 bg-[#d9ff00]/[0.07] px-2 py-0.5 text-[10px] font-bold text-[#d9ff00]/80"
                          >
                            {PROVIDER_CAPABILITY_META[capabilityKey]?.label}
                          </span>
                        ))}
                        {!enabledCapabilities.length && (
                          <span className="rounded-full border border-white/10 bg-black/15 px-2 py-0.5 text-[10px] text-white/35">
                            未标记能力
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="rounded-lg border border-white/[0.07] bg-white/[0.035] p-5 sm:p-6">
            <div className="flex flex-col gap-3 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-white/35">
                  连接信息
                </div>
                <h2 className="mt-2 text-xl font-bold tracking-tight text-white">
                  连接 {selectedProvider.name}
                </h2>
              </div>
              <span className={`w-fit rounded-full border px-3 py-1.5 text-[12px] font-bold ${selectedMeta.className}`}>
                {selectedMeta.label}
              </span>
            </div>

            <div className="mt-5 space-y-5">
              {isCustomProvider && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-[12px] font-bold text-white/45">通道名称</span>
                    <input
                      value={selectedProvider.name}
                      onChange={(event) => updateSelectedProvider({ name: event.target.value })}
                      placeholder="例如：我的 Yunwu 备用站"
                      className="h-11 w-full rounded-md border border-white/[0.08] bg-black/25 px-3 text-[13px] text-white outline-none transition-colors placeholder:text-white/20 focus:border-[#d9ff00]/45"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[12px] font-bold text-white/45">短名称</span>
                    <input
                      value={selectedProvider.shortName}
                      onChange={(event) => updateSelectedProvider({ shortName: event.target.value })}
                      placeholder="备用站"
                      className="h-11 w-full rounded-md border border-white/[0.08] bg-black/25 px-3 text-[13px] text-white outline-none transition-colors placeholder:text-white/20 focus:border-[#d9ff00]/45"
                    />
                  </label>
                </div>
              )}

              <label className="block">
                <span className="mb-2 block text-[12px] font-bold text-white/45">API 地址</span>
                <input
                  value={selectedProvider.baseUrl}
                  onChange={(event) => updateSelectedProvider({ baseUrl: event.target.value })}
                  placeholder="https://example.com/v1"
                  className="h-11 w-full rounded-md border border-white/[0.08] bg-black/25 px-3 text-[13px] text-white outline-none transition-colors placeholder:text-white/20 focus:border-[#d9ff00]/45"
                  spellCheck={false}
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-[12px] font-bold text-white/45">
                  <KeyRound size={14} />
                  {selectedProvider.apiKeyLabel}
                  {!selectedProvider.requiresKey && <span className="font-normal text-white/25">可空</span>}
                </span>
                <input
                  value={selectedProvider.apiKey}
                  onChange={(event) => updateSelectedProvider({ apiKey: event.target.value })}
                  placeholder={selectedProvider.requiresKey ? "粘贴密钥" : "本地服务如无口令可留空"}
                  type="password"
                  className="h-11 w-full rounded-md border border-white/[0.08] bg-black/25 px-3 text-[13px] text-white outline-none transition-colors placeholder:text-white/20 focus:border-[#d9ff00]/45"
                  spellCheck={false}
                />
              </label>

              {isCustomProvider && (
                <div className="flex items-start justify-between gap-4 rounded-md border border-white/[0.06] bg-black/20 p-4">
                  <div>
                    <div className="text-[12px] font-bold text-white/55">这个通道需要密钥</div>
                    <p className="mt-1 text-[12px] leading-5 text-white/35">本地服务或内网测试服务可以关闭。</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={selectedProvider.requiresKey}
                    onClick={() => updateSelectedProvider({ requiresKey: !selectedProvider.requiresKey })}
                    className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full border transition-colors ${
                      selectedProvider.requiresKey ? "border-[#d9ff00] bg-[#d9ff00]" : "border-white/10 bg-white/10"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-black transition-transform ${
                        selectedProvider.requiresKey ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              )}

              <div className="rounded-md border border-white/[0.06] bg-black/20 p-4">
                <div>
                  <div className="text-[12px] font-bold text-white/55">通道能力标记</div>
                  <p className="mt-1 text-[12px] leading-5 text-white/35">
                    用来告诉前端哪些页面适合使用当前通道。关闭后会提示用户先换通道，不会改动上游接口。
                  </p>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {PROVIDER_CAPABILITY_KEYS.map((capabilityKey) => {
                    const meta = PROVIDER_CAPABILITY_META[capabilityKey];
                    const enabled = Boolean(selectedCapabilities[capabilityKey]);
                    return (
                      <button
                        key={capabilityKey}
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        onClick={() => toggleCapability(capabilityKey)}
                        className={`flex min-h-[58px] items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition-colors ${
                          enabled
                            ? "border-[#d9ff00]/30 bg-[#d9ff00]/10"
                            : "border-white/[0.07] bg-white/[0.025] hover:border-white/15"
                        }`}
                      >
                        <span className="min-w-0">
                          <span className={`block text-[12px] font-bold ${enabled ? "text-[#d9ff00]" : "text-white/65"}`}>
                            支持{meta.label}
                          </span>
                          <span className="mt-0.5 block text-[11px] leading-4 text-white/35">{meta.detail}</span>
                        </span>
                        <span
                          className={`relative inline-flex h-6 w-10 flex-shrink-0 items-center rounded-full border transition-colors ${
                            enabled ? "border-[#d9ff00] bg-[#d9ff00]" : "border-white/10 bg-white/10"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 rounded-full bg-black transition-transform ${
                              enabled ? "translate-x-5" : "translate-x-1"
                            }`}
                          />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-md border border-white/[0.06] bg-black/20 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[12px] font-bold text-white/55">图片模型安全清单</div>
                    <p className="mt-1 text-[12px] leading-5 text-white/35">
                      图像创作和健康检查优先只显示这些模型，避免误选不可用模型。留空则显示系统默认图片模型。
                    </p>
                  </div>
                  {imageWhitelist.length > 0 && (
                    <button
                      type="button"
                      onClick={() => updateSelectedProvider({ imageModelWhitelist: [] })}
                      className="h-8 rounded-md border border-white/10 bg-white/5 px-3 text-[12px] font-bold text-white/55 transition-colors hover:border-white/20 hover:bg-white/10"
                    >
                      清空
                    </button>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {imageWhitelist.map((modelId) => (
                    <span
                      key={modelId}
                      className="inline-flex h-8 items-center gap-2 rounded-md border border-[#d9ff00]/20 bg-[#d9ff00]/10 px-2.5 text-[12px] font-bold text-[#d9ff00]"
                    >
                      {modelId}
                      <button
                        type="button"
                        onClick={() => removeWhitelistModel(modelId)}
                        title="移除模型"
                        className="rounded-sm text-[#d9ff00]/70 transition-colors hover:bg-black/30 hover:text-[#d9ff00]"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                  {!imageWhitelist.length && (
                    <span className="text-[12px] text-white/35">未限制，图像页会显示默认图片模型。</span>
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input
                    value={modelDraft}
                    onChange={(event) => setModelDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addWhitelistModels(modelDraft);
                      }
                    }}
                    placeholder="输入模型名，回车添加"
                    className="h-10 flex-1 rounded-md border border-white/[0.08] bg-black/25 px-3 text-[13px] text-white outline-none transition-colors placeholder:text-white/20 focus:border-[#d9ff00]/45"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    onClick={() => addWhitelistModels(modelDraft)}
                    disabled={!modelDraft.trim()}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 text-[12px] font-bold text-white/75 transition-colors hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus size={14} />
                    添加
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {COMMON_IMAGE_MODELS.map((modelId) => (
                    <button
                      key={modelId}
                      type="button"
                      onClick={() => addWhitelistModels(modelId)}
                      disabled={imageWhitelist.includes(modelId)}
                      className="h-8 rounded-md border border-white/10 bg-white/[0.03] px-2.5 text-[11px] font-bold text-white/45 transition-colors hover:border-white/20 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      {modelId}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-white/[0.06] bg-black/20 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[12px] font-bold text-white/55">视频模型安全清单</div>
                    <p className="mt-1 text-[12px] leading-5 text-white/35">
                      视频创作页只显示这些模型。视频单价较高，建议先保留少量已配置密钥的模型。
                    </p>
                  </div>
                  {videoWhitelist.length > 0 && (
                    <button
                      type="button"
                      onClick={() => updateSelectedProvider({ videoModelWhitelist: [] })}
                      className="h-8 rounded-md border border-white/10 bg-white/5 px-3 text-[12px] font-bold text-white/55 transition-colors hover:border-white/20 hover:bg-white/10"
                    >
                      清空
                    </button>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {videoWhitelist.map((modelId) => (
                    <span
                      key={modelId}
                      className="inline-flex h-8 items-center gap-2 rounded-md border border-sky-300/20 bg-sky-400/10 px-2.5 text-[12px] font-bold text-sky-200"
                    >
                      {modelId}
                      <button
                        type="button"
                        onClick={() => removeVideoWhitelistModel(modelId)}
                        title="移除模型"
                        className="rounded-sm text-sky-200/70 transition-colors hover:bg-black/30 hover:text-sky-100"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                  {!videoWhitelist.length && (
                    <span className="text-[12px] text-white/35">未限制，视频页会显示默认视频模型。</span>
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input
                    value={videoModelDraft}
                    onChange={(event) => setVideoModelDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addVideoWhitelistModels(videoModelDraft);
                      }
                    }}
                    placeholder="输入视频模型名，回车添加"
                    className="h-10 flex-1 rounded-md border border-white/[0.08] bg-black/25 px-3 text-[13px] text-white outline-none transition-colors placeholder:text-white/20 focus:border-sky-300/45"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    onClick={() => addVideoWhitelistModels(videoModelDraft)}
                    disabled={!videoModelDraft.trim()}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 text-[12px] font-bold text-white/75 transition-colors hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus size={14} />
                    添加
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {COMMON_VIDEO_MODELS.map((modelId) => (
                    <button
                      key={modelId}
                      type="button"
                      onClick={() => addVideoWhitelistModels(modelId)}
                      disabled={videoWhitelist.includes(modelId)}
                      className="h-8 rounded-md border border-white/10 bg-white/[0.03] px-2.5 text-[11px] font-bold text-white/45 transition-colors hover:border-white/20 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      {modelId}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-white/[0.06] bg-black/20 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-[12px] font-bold text-white/45">连接状态</div>
                    <div className="mt-1 text-[13px] leading-5 text-white/70">{testState.detail}</div>
                    {testState.count !== null && (
                      <div className="mt-1 text-[12px] text-white/35">模型数量：{testState.count}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={testSelectedProvider}
                    disabled={testState.status === "checking"}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 text-[13px] font-bold text-white/80 transition-colors hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RotateCcw size={15} />
                    测试连接
                  </button>
                </div>
              </div>

              {isLocalLike && (
                <div className="rounded-md border border-white/[0.06] bg-black/20 p-4">
                  <div className="flex flex-col gap-1">
                    <div className="text-[12px] font-bold text-white/55">本地服务检测模板</div>
                    <p className="text-[12px] leading-5 text-white/35">
                      只在你点击时请求。生图模板会发一张 1K low 测试图，建议先用于本地或低成本通道。
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {LOCAL_TESTS.map((test) => {
                      const state = localTestStates[test.id] || STATUS_META.idle;
                      const meta = STATUS_META[state.status] || STATUS_META.idle;
                      return (
                        <div key={test.id} className="rounded-md border border-white/[0.06] bg-white/[0.025] p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-[12px] font-bold text-white/75">{test.label}</div>
                              <div className="mt-1 font-mono text-[11px] text-white/30">{test.help}</div>
                            </div>
                            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${meta.className}`}>
                              {meta.label}
                            </span>
                          </div>
                          <div className="mt-3 min-h-8 text-[12px] leading-4 text-white/40">{state.detail}</div>
                          <button
                            type="button"
                            onClick={() => runLocalTemplateTest(test.id)}
                            disabled={state.status === "checking"}
                            className="mt-3 h-8 w-full rounded-md border border-white/10 bg-white/5 text-[12px] font-bold text-white/70 transition-colors hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            检测
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={saveSelectedProvider}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-[#d9ff00] px-4 text-[13px] font-bold text-black transition-colors hover:bg-[#e5ff33]"
                >
                  <Check size={16} />
                  保存并使用
                </button>
                {isCustomProvider ? (
                  <button
                    type="button"
                    onClick={deleteSelectedProvider}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-red-300/15 bg-red-400/10 px-4 text-[13px] font-bold text-red-200 transition-colors hover:bg-red-400/15"
                  >
                    <Trash2 size={15} />
                    删除
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={clearSelectedProvider}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-red-300/15 bg-red-400/10 px-4 text-[13px] font-bold text-red-200 transition-colors hover:bg-red-400/15"
                  >
                    <Trash2 size={15} />
                    清空
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-4 text-[12px] text-white/35">
                <span>当前密钥：</span>
                <span className="font-mono text-white/55">{maskApiKey(selectedProvider.apiKey)}</span>
                {selectedProvider.id === "yunwu" && (
                  <a
                    href="https://yunwu.ai/"
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto inline-flex items-center gap-1 text-[#d9ff00]/80 hover:text-[#d9ff00]"
                  >
                    打开官网
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
