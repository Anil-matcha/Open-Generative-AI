const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadApiProviders() {
  const sourcePath = path.join(__dirname, "..", "packages", "studio", "src", "apiProviders.js");
  const source = fs.readFileSync(sourcePath, "utf8");
  const babel = require("@babel/core");
  const { code } = babel.transformSync(source, {
    babelrc: false,
    configFile: false,
    presets: [
      [
        require.resolve("@babel/preset-env"),
        {
          modules: "commonjs",
          targets: { node: "current" },
        },
      ],
    ],
  });
  const module = { exports: {} };
  vm.runInNewContext(
    code,
    {
      module,
      exports: module.exports,
      require,
      console,
      Date,
    },
    { filename: sourcePath },
  );
  return module.exports;
}

const apiProviders = loadApiProviders();

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("normalizeApiConfig imports legacy whitelist and keeps requested order", () => {
  const config = apiProviders.normalizeApiConfig({
    activeProviderId: "custom-backup",
    providerOrder: ["custom-backup", "local", "yunwu"],
    providers: {
      "custom-backup": {
        id: "custom-backup",
        name: "备用中转",
        baseUrl: "https://backup.example.com/v1/",
        apiKey: "sk-backup",
        modelWhitelist: "gpt-image-1, gpt-image-1, gpt-image-2",
        capabilities: { image: true, agent: true },
      },
    },
  });

  assert.equal(config.activeProviderId, "custom-backup");
  assert.deepEqual(plain(config.providerOrder.slice(0, 3)), ["custom-backup", "local", "yunwu"]);
  assert.deepEqual(plain(apiProviders.getProviderModelWhitelist(config, "custom-backup")), [
    "gpt-image-1",
    "gpt-image-2",
  ]);
  assert.deepEqual(plain(apiProviders.getProviderCapabilities(config, "custom-backup")), {
    image: true,
    video: false,
    chat: true,
    workflow: false,
    agent: true,
    apps: false,
  });
});

test("applyProviderImageWhitelistDraft migrates one provider without changing others", () => {
  const config = apiProviders.normalizeApiConfig({
    version: apiProviders.API_PROVIDER_CONFIG_VERSION,
    activeProviderId: "yunwu",
    providers: {
      yunwu: {
        id: "yunwu",
        apiKey: "sk-yunwu",
        imageModelWhitelist: ["gpt-image-1"],
      },
      local: {
        id: "local",
        imageModelWhitelist: ["local-image-model"],
      },
    },
  });

  const nextConfig = apiProviders.applyProviderImageWhitelistDraft(config, "yunwu", [
    "gpt-image-2",
    "gpt-image-2",
    " flux-pro ",
  ]);

  assert.deepEqual(plain(apiProviders.getProviderModelWhitelist(nextConfig, "yunwu")), [
    "gpt-image-2",
    "flux-pro",
  ]);
  assert.deepEqual(plain(apiProviders.getProviderModelWhitelist(nextConfig, "local")), ["local-image-model"]);
  assert.equal(nextConfig.activeProviderId, "yunwu");
});

test("default config migrates legacy Yunwu default to HFSY with image and video whitelists", () => {
  const config = apiProviders.normalizeApiConfig({
    version: 1,
    activeProviderId: "yunwu",
    providers: {
      yunwu: { id: "yunwu", apiKey: "sk-old-yunwu" },
    },
  });

  assert.equal(config.activeProviderId, "hfsy");
  assert.equal(config.providerOrder[0], "hfsy");
  assert.deepEqual(plain(apiProviders.getProviderModelWhitelist(config, "hfsy")), [
    "doubao-seedream-5.0-lite",
    "gemini-3.1-flash-image-preview",
    "gemini-3-pro-image-preview",
    "gpt-image-2-all",
    "gpt-image-2",
  ]);
  assert.deepEqual(plain(apiProviders.getProviderVideoModelWhitelist(config, "hfsy")), [
    "sd-2-vip",
    "sd-2",
  ]);
});

test("normalizeApiConfig keeps independent video whitelist per provider", () => {
  const config = apiProviders.normalizeApiConfig({
    activeProviderId: "custom-video",
    providers: {
      "custom-video": {
        id: "custom-video",
        baseUrl: "https://video.example.com/v1",
        videoModelWhitelist: "sora-2, sora-2, kling-v3",
      },
    },
  });

  assert.deepEqual(plain(apiProviders.getProviderVideoModelWhitelist(config, "custom-video")), [
    "sora-2",
    "kling-v3",
  ]);
  assert.deepEqual(plain(apiProviders.getProviderModelWhitelist(config, "custom-video")), []);
});

test("createApiProviderExport can redact secrets for support handoff", () => {
  const config = apiProviders.normalizeApiConfig({
    providers: {
      yunwu: {
        id: "yunwu",
        apiKey: "sk-secret-yunwu",
      },
      "custom-sec": {
        id: "custom-sec",
        name: "私有通道",
        baseUrl: "https://private.example.com/v1",
        apiKey: "sk-secret-custom",
      },
    },
  });

  const safeExport = apiProviders.createApiProviderExport(config, { includeSecrets: false });
  const safeJson = JSON.stringify(safeExport);
  assert.equal(safeExport.redactedSecrets, true);
  assert.equal(safeExport.config.providers.yunwu.apiKey, "");
  assert.equal(safeExport.config.providers.yunwu.hasApiKey, true);
  assert.equal(safeJson.includes("sk-secret-yunwu"), false);
  assert.equal(safeJson.includes("sk-secret-custom"), false);

  const fullExport = apiProviders.createApiProviderExport(config, { includeSecrets: true });
  assert.equal(fullExport.redactedSecrets, false);
  assert.equal(fullExport.config.providers.yunwu.apiKey, "sk-secret-yunwu");
  assert.equal(fullExport.config.providers["custom-sec"].apiKey, "sk-secret-custom");
});

test("providerSupports reads capability flags after normalization", () => {
  const config = apiProviders.normalizeApiConfig({
    providers: {
      yunwu: {
        id: "yunwu",
        capabilities: { image: true, video: false, chat: true, workflow: true, agent: false, apps: false },
      },
    },
  });

  assert.equal(apiProviders.providerSupports(config, "image", "yunwu"), true);
  assert.equal(apiProviders.providerSupports(config, "workflow", "yunwu"), true);
  assert.equal(apiProviders.providerSupports(config, "agent", "yunwu"), false);
  assert.equal(apiProviders.providerSupports(config, "unknown", "yunwu"), false);
});
