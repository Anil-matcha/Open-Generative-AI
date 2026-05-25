export const API_PROVIDER_STORAGE_KEY = "api_provider_config_v1";
export const ACTIVE_PROVIDER_COOKIE = "active_api_provider";
export const PROVIDER_API_KEY_COOKIE = "provider_api_key";
export const PROVIDER_BASE_URL_COOKIE = "provider_base_url";

export const LEGACY_YUNWU_KEY_STORAGE_KEY = "yunwu_api_key";
export const LEGACY_MUAPI_KEY_STORAGE_KEY = "muapi_key";
export const REQUIRE_KEY_STORAGE_KEY = "provider_require_key";
export const LEGACY_REQUIRE_KEY_STORAGE_KEY = "muapi_require_key";

export const PROVIDER_PROXY_PATH = "/api/provider/v1";
export const CUSTOM_PROVIDER_ID_PREFIX = "custom-";
export const DEFAULT_API_PROVIDER_ID = "hfsy";
export const API_PROVIDER_CONFIG_VERSION = 2;

export const PROVIDER_CAPABILITY_KEYS = ["image", "video", "chat", "workflow", "agent", "apps"];

export const PROVIDER_CAPABILITY_META = {
  image: { label: "图片", detail: "文生图 / 图生图" },
  video: { label: "视频", detail: "文生视频 / 图生视频" },
  chat: { label: "Chat", detail: "对话与文本推理" },
  workflow: { label: "工作流", detail: "工作流列表、运行与编辑" },
  agent: { label: "智能体", detail: "智能体、会话与创建" },
  apps: { label: "应用中心", detail: "模板登记与应用 API" },
};

const DEFAULT_IMAGE_MODEL_WHITELIST = {
  hfsy: ["doubao-seedream-5.0-lite", "gemini-3.1-flash-image-preview", "gemini-3-pro-image-preview", "gpt-image-2-all", "gpt-image-2"],
  "seedance-ark": ["doubao-seedream-5.0-lite"],
  yunwu: ["gemini-3.1-flash-image-preview", "gemini-3-pro-image-preview", "gpt-image-2-all", "gpt-image-2"],
  "openai-compatible": ["gemini-3.1-flash-image-preview", "gemini-3-pro-image-preview", "gpt-image-2-all", "gpt-image-2"],
  local: [],
};

const DEFAULT_VIDEO_MODEL_WHITELIST = {
  hfsy: ["sd-2-vip", "sd-2"],
  "seedance-ark": ["sd-2-vip", "sd-2"],
  yunwu: [],
  "openai-compatible": [],
  local: [],
};

const DEFAULT_PROVIDER_CAPABILITIES = {
  hfsy: { image: true, video: true, chat: true, workflow: false, agent: false, apps: false },
  "seedance-ark": { image: true, video: true, chat: false, workflow: false, agent: false, apps: false },
  yunwu: { image: true, video: false, chat: true, workflow: false, agent: false, apps: false },
  "openai-compatible": { image: true, video: false, chat: true, workflow: false, agent: false, apps: false },
  local: { image: false, video: false, chat: true, workflow: false, agent: false, apps: false },
};

export const API_PROVIDER_PRESETS = {
  hfsy: {
    id: "hfsy",
    name: "HFSY API",
    shortName: "HFSY",
    badge: "推荐默认",
    baseUrl: "https://www.hfsyapi.cn/v1",
    apiKeyLabel: "HFSY API Key",
    requiresKey: false,
    tone: "emerald",
    fit: "默认图形与视频中转。支持服务端按模型密钥路由，适合先做低成本图片测试。",
    imageModelWhitelist: DEFAULT_IMAGE_MODEL_WHITELIST.hfsy,
    videoModelWhitelist: DEFAULT_VIDEO_MODEL_WHITELIST.hfsy,
    capabilities: DEFAULT_PROVIDER_CAPABILITIES.hfsy,
  },
  "seedance-ark": {
    id: "seedance-ark",
    name: "Seedance Ark 官方",
    shortName: "Ark",
    badge: "官方直连",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    apiKeyLabel: "Ark API Key",
    requiresKey: false,
    tone: "rose",
    fit: "Seedream 5.0 lite 生图与 Seedance 2.0 官方 Ark 任务接口，适合可信素材到视频的闭环测试。",
    imageModelWhitelist: DEFAULT_IMAGE_MODEL_WHITELIST["seedance-ark"],
    videoModelWhitelist: DEFAULT_VIDEO_MODEL_WHITELIST["seedance-ark"],
    capabilities: DEFAULT_PROVIDER_CAPABILITIES["seedance-ark"],
  },
  yunwu: {
    id: "yunwu",
    name: "YunwuAPI",
    shortName: "Yunwu",
    badge: "备用",
    baseUrl: "https://yunwu.ai/v1",
    apiKeyLabel: "YunwuAPI Key",
    requiresKey: true,
    tone: "lime",
    fit: "图片生成、模型列表、低成本可用性检查",
    imageModelWhitelist: DEFAULT_IMAGE_MODEL_WHITELIST.yunwu,
    videoModelWhitelist: DEFAULT_VIDEO_MODEL_WHITELIST.yunwu,
    capabilities: DEFAULT_PROVIDER_CAPABILITIES.yunwu,
  },
  "openai-compatible": {
    id: "openai-compatible",
    name: "OpenAI 兼容中转",
    shortName: "兼容中转",
    badge: "可替换",
    baseUrl: "https://api.openai.com/v1",
    apiKeyLabel: "API Key",
    requiresKey: true,
    tone: "sky",
    fit: "使用 OpenAI 格式的第三方中转站",
    imageModelWhitelist: DEFAULT_IMAGE_MODEL_WHITELIST["openai-compatible"],
    videoModelWhitelist: DEFAULT_VIDEO_MODEL_WHITELIST["openai-compatible"],
    capabilities: DEFAULT_PROVIDER_CAPABILITIES["openai-compatible"],
  },
  local: {
    id: "local",
    name: "本地服务",
    shortName: "本地",
    badge: "预留",
    baseUrl: "http://localhost:8000/v1",
    apiKeyLabel: "访问口令",
    requiresKey: false,
    tone: "violet",
    fit: "未来接入本地模型或内网推理服务",
    imageModelWhitelist: DEFAULT_IMAGE_MODEL_WHITELIST.local,
    videoModelWhitelist: DEFAULT_VIDEO_MODEL_WHITELIST.local,
    capabilities: DEFAULT_PROVIDER_CAPABILITIES.local,
  },
};

function normalizeString(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed && trimmed !== "null" && trimmed !== "undefined" ? trimmed : "";
}

export function normalizeApiKey(value) {
  return normalizeString(value) || null;
}

export function normalizeBaseUrl(value, fallback) {
  return (normalizeString(value) || fallback || "").replace(/\/+$/, "");
}

export function normalizeProviderId(value, fallback = "") {
  const normalized = normalizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return normalized || fallback;
}

export function normalizeModelWhitelist(value) {
  const list = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[\n,，;；\s]+/g)
      : [];
  const seen = new Set();

  return list
    .map(normalizeString)
    .filter(Boolean)
    .filter((modelId) => {
      const key = modelId.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function normalizeProviderCapabilities(value, fallback = {}) {
  const source = value && typeof value === "object" ? value : {};
  return Object.fromEntries(
    PROVIDER_CAPABILITY_KEYS.map((key) => [
      key,
      typeof source[key] === "boolean" ? source[key] : Boolean(fallback[key]),
    ]),
  );
}

function getDefaultProviderCapabilities(providerId) {
  return DEFAULT_PROVIDER_CAPABILITIES[providerId] || DEFAULT_PROVIDER_CAPABILITIES["openai-compatible"];
}

function normalizeProviderEntry(rawEntry = {}, rawId = null, legacyYunwuKey = null, activeProviderId = DEFAULT_API_PROVIDER_ID) {
  const id = normalizeProviderId(rawEntry.id || rawId, activeProviderId);
  const preset = API_PROVIDER_PRESETS[id] || null;
  const isPreset = Boolean(preset);
  const displayName = normalizeString(rawEntry.name) || preset?.name || "自定义通道";
  const shortName = normalizeString(rawEntry.shortName) || preset?.shortName || displayName.slice(0, 8) || "自定义";
  const fallbackBaseUrl = preset?.baseUrl || "https://api.example.com/v1";
  const requiresKey = typeof rawEntry.requiresKey === "boolean" ? rawEntry.requiresKey : preset?.requiresKey ?? true;
  const legacyKey = id === "yunwu" ? normalizeApiKey(legacyYunwuKey) : null;
  const imageModelWhitelist = normalizeModelWhitelist(
    rawEntry.imageModelWhitelist ||
      rawEntry.modelWhitelist ||
      preset?.imageModelWhitelist ||
      DEFAULT_IMAGE_MODEL_WHITELIST[id] ||
      [],
  );
  const videoModelWhitelist = normalizeModelWhitelist(
    rawEntry.videoModelWhitelist ||
      preset?.videoModelWhitelist ||
      DEFAULT_VIDEO_MODEL_WHITELIST[id] ||
      [],
  );
  const capabilities = normalizeProviderCapabilities(
    rawEntry.capabilities,
    preset?.capabilities || getDefaultProviderCapabilities(id),
  );

  return {
    id,
    name: isPreset ? preset.name : displayName,
    shortName: isPreset ? preset.shortName : shortName,
    badge: isPreset ? preset.badge : normalizeString(rawEntry.badge) || "自定义",
    baseUrl: normalizeBaseUrl(rawEntry.baseUrl, fallbackBaseUrl),
    apiKeyLabel: isPreset ? preset.apiKeyLabel : normalizeString(rawEntry.apiKeyLabel) || "API Key",
    apiKey: normalizeApiKey(rawEntry.apiKey) || legacyKey || "",
    requiresKey,
    enabled: Boolean(rawEntry.enabled || id === activeProviderId),
    tone: isPreset ? preset.tone : normalizeString(rawEntry.tone) || "slate",
    fit: isPreset ? preset.fit : normalizeString(rawEntry.fit) || "OpenAI 兼容 API 通道",
    custom: Boolean(rawEntry.custom || !isPreset),
    imageModelWhitelist,
    videoModelWhitelist,
    capabilities,
  };
}

export function createDefaultApiConfig(legacyYunwuKey = null) {
  return {
    version: API_PROVIDER_CONFIG_VERSION,
    activeProviderId: DEFAULT_API_PROVIDER_ID,
    providerOrder: Object.keys(API_PROVIDER_PRESETS),
    providers: Object.fromEntries(
      Object.values(API_PROVIDER_PRESETS).map((preset) => [
        preset.id,
        normalizeProviderEntry(
          {
            id: preset.id,
            baseUrl: preset.baseUrl,
            apiKey: preset.id === "yunwu" ? normalizeApiKey(legacyYunwuKey) || "" : "",
            enabled: preset.id === DEFAULT_API_PROVIDER_ID,
          },
          preset.id,
          legacyYunwuKey,
          DEFAULT_API_PROVIDER_ID,
        ),
      ]),
    ),
  };
}

export function normalizeApiConfig(value, legacyYunwuKey = null) {
  const defaults = createDefaultApiConfig(legacyYunwuKey);
  const source = value && typeof value === "object" ? value : {};
  const sourceProviders = source.providers && typeof source.providers === "object" ? source.providers : {};
  const requestedActiveProviderId = normalizeProviderId(source.activeProviderId, defaults.activeProviderId);
  const shouldMigrateDefault =
    (!Number.isFinite(Number(source.version)) || Number(source.version) < API_PROVIDER_CONFIG_VERSION) &&
    requestedActiveProviderId === "yunwu";
  const sourceActiveProviderId = shouldMigrateDefault ? DEFAULT_API_PROVIDER_ID : requestedActiveProviderId;

  const providers = { ...defaults.providers };

  for (const [rawId, rawEntry] of Object.entries(sourceProviders)) {
    if (!rawEntry || typeof rawEntry !== "object") continue;
    const id = normalizeProviderId(rawEntry.id || rawId, rawId);
    providers[id] = normalizeProviderEntry(rawEntry, id, legacyYunwuKey, sourceActiveProviderId);
  }

  for (const preset of Object.values(API_PROVIDER_PRESETS)) {
    providers[preset.id] = normalizeProviderEntry(
      {
        ...providers[preset.id],
        ...(sourceProviders[preset.id] || {}),
        id: preset.id,
      },
      preset.id,
      legacyYunwuKey,
      sourceActiveProviderId,
    );
  }

  const activeProviderId = providers[sourceActiveProviderId]
    ? sourceActiveProviderId
    : defaults.activeProviderId;

  Object.keys(providers).forEach((providerId) => {
    providers[providerId] = {
      ...providers[providerId],
      enabled: providerId === activeProviderId || Boolean(providers[providerId].enabled),
    };
  });
  providers[activeProviderId].enabled = true;

  const rawRequestedOrder = Array.isArray(source.providerOrder)
    ? source.providerOrder.map((id) => normalizeProviderId(id)).filter(Boolean)
    : [];
  const requestedOrder = shouldMigrateDefault
    ? [DEFAULT_API_PROVIDER_ID, ...rawRequestedOrder.filter((id) => id !== DEFAULT_API_PROVIDER_ID)]
    : rawRequestedOrder;
  const providerOrder = [
    ...requestedOrder.filter((id) => providers[id]),
    ...Object.keys(API_PROVIDER_PRESETS).filter((id) => !requestedOrder.includes(id)),
    ...Object.keys(providers)
      .filter((id) => !API_PROVIDER_PRESETS[id] && !requestedOrder.includes(id))
      .sort(),
  ].filter((id, index, list) => providers[id] && list.indexOf(id) === index);

  return {
    version: API_PROVIDER_CONFIG_VERSION,
    activeProviderId,
    providerOrder,
    providers,
  };
}

export function getProviderEntry(config, providerId) {
  const normalized = normalizeApiConfig(config);
  const requestedId = normalizeProviderId(providerId, normalized.activeProviderId);
  const id = normalized.providers[requestedId] ? requestedId : normalized.activeProviderId;
  const entry = normalized.providers[id] || normalized.providers[DEFAULT_API_PROVIDER_ID] || normalized.providers.yunwu || {};
  const preset = API_PROVIDER_PRESETS[id] || null;

  return {
    ...(preset || {}),
    ...entry,
    id,
    name: entry.name || preset?.name || "自定义通道",
    shortName: entry.shortName || preset?.shortName || "自定义",
    apiKeyLabel: entry.apiKeyLabel || preset?.apiKeyLabel || "API Key",
    requiresKey: typeof entry.requiresKey === "boolean" ? entry.requiresKey : preset?.requiresKey ?? true,
    baseUrl: normalizeBaseUrl(entry.baseUrl, preset?.baseUrl || ""),
    apiKey: normalizeApiKey(entry.apiKey) || "",
    imageModelWhitelist: normalizeModelWhitelist(entry.imageModelWhitelist || preset?.imageModelWhitelist || []),
    videoModelWhitelist: normalizeModelWhitelist(entry.videoModelWhitelist || preset?.videoModelWhitelist || []),
    capabilities: normalizeProviderCapabilities(entry.capabilities, preset?.capabilities || getDefaultProviderCapabilities(id)),
  };
}

export function getActiveProvider(config) {
  const normalized = normalizeApiConfig(config);
  return getProviderEntry(normalized, normalized.activeProviderId);
}

export function getAllProviderEntries(config) {
  const normalized = normalizeApiConfig(config);
  return normalized.providerOrder.map((id) => getProviderEntry(normalized, id)).filter(Boolean);
}

export function createCustomProviderEntry(seed = {}) {
  const timestamp = Date.now().toString(36);
  const id = normalizeProviderId(seed.id, `${CUSTOM_PROVIDER_ID_PREFIX}${timestamp}`);
  return normalizeProviderEntry(
    {
      id,
      name: seed.name || "新的中转站",
      shortName: seed.shortName || "新通道",
      badge: "自定义",
      baseUrl: seed.baseUrl || "https://api.example.com/v1",
      apiKeyLabel: seed.apiKeyLabel || "API Key",
      apiKey: seed.apiKey || "",
      requiresKey: seed.requiresKey ?? true,
      enabled: false,
      custom: true,
      tone: "slate",
      fit: seed.fit || "OpenAI 兼容 API 通道",
      imageModelWhitelist: normalizeModelWhitelist(seed.imageModelWhitelist || []),
      videoModelWhitelist: normalizeModelWhitelist(seed.videoModelWhitelist || []),
      capabilities: normalizeProviderCapabilities(
        seed.capabilities,
        seed.capabilities || DEFAULT_PROVIDER_CAPABILITIES["openai-compatible"],
      ),
    },
    id,
  );
}

export function getProviderModelWhitelist(config, providerId = null) {
  const provider = providerId ? getProviderEntry(config, providerId) : getActiveProvider(config);
  return normalizeModelWhitelist(provider.imageModelWhitelist || provider.modelWhitelist || []);
}

export function getProviderVideoModelWhitelist(config, providerId = null) {
  const provider = providerId ? getProviderEntry(config, providerId) : getActiveProvider(config);
  return normalizeModelWhitelist(provider.videoModelWhitelist || []);
}

export function getProviderCapabilities(config, providerId = null) {
  const provider = providerId ? getProviderEntry(config, providerId) : getActiveProvider(config);
  const preset = API_PROVIDER_PRESETS[provider.id] || null;
  return normalizeProviderCapabilities(provider.capabilities, preset?.capabilities || getDefaultProviderCapabilities(provider.id));
}

export function providerSupports(config, capability, providerId = null) {
  if (!PROVIDER_CAPABILITY_KEYS.includes(capability)) return false;
  return Boolean(getProviderCapabilities(config, providerId)[capability]);
}

export function applyProviderImageWhitelistDraft(config, providerId, models) {
  const normalized = normalizeApiConfig(config);
  const requestedId = normalizeProviderId(providerId, normalized.activeProviderId);
  const targetId = normalized.providers[requestedId] ? requestedId : normalized.activeProviderId;

  return normalizeApiConfig({
    ...normalized,
    providers: {
      ...normalized.providers,
      [targetId]: {
        ...normalized.providers[targetId],
        imageModelWhitelist: normalizeModelWhitelist(models),
      },
    },
  });
}

export function providerNeedsKey(provider) {
  return Boolean(provider?.requiresKey && !normalizeApiKey(provider?.apiKey));
}

export function isProviderReady(provider) {
  if (!provider?.baseUrl) return false;
  return !providerNeedsKey(provider);
}

export function maskApiKey(apiKey) {
  const normalized = normalizeApiKey(apiKey);
  if (!normalized) return "尚未保存";
  if (normalized.length <= 8) return `${normalized.slice(0, 2)}••••`;
  return `${normalized.slice(0, 7)}••••••••${normalized.slice(-4)}`;
}

export function getProviderProxyBase() {
  return PROVIDER_PROXY_PATH;
}

export function createApiProviderExport(config, { includeSecrets = false } = {}) {
  const normalized = normalizeApiConfig(config);
  const providers = Object.fromEntries(
    Object.entries(normalized.providers).map(([providerId, provider]) => {
      const normalizedKey = normalizeApiKey(provider.apiKey);
      if (includeSecrets) return [providerId, provider];

      return [
        providerId,
        {
          ...provider,
          apiKey: "",
          apiKeyMasked: normalizedKey ? maskApiKey(normalizedKey) : "",
          hasApiKey: Boolean(normalizedKey),
        },
      ];
    }),
  );

  return {
    type: "open-generative-ai.api-providers",
    version: 2,
    exportedAt: new Date().toISOString(),
    redactedSecrets: !includeSecrets,
    note: includeSecrets
      ? "此文件包含 API 地址、密钥和模型白名单，请妥善保管。"
      : "此文件已隐藏 API Key，适合发给别人排查地址、排序、能力标记和模型白名单。",
    config: {
      ...normalized,
      providers,
    },
  };
}

export function buildProviderRequestHeaders(config, { json = false, providerId = null } = {}) {
  const provider = providerId ? getProviderEntry(config, providerId) : getActiveProvider(config);
  const headers = {};

  if (json) headers["Content-Type"] = "application/json";
  if (provider.apiKey) headers.Authorization = `Bearer ${provider.apiKey}`;
  if (provider.baseUrl) headers["x-provider-base-url"] = provider.baseUrl;
  headers["x-provider-id"] = provider.id;

  return headers;
}
