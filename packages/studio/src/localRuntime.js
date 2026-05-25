export const LOCAL_RUNTIME_CAPABILITIES = Object.freeze({
  SD_CPP: "sdCpp",
  WAN2GP: "wan2gp",
});

export function createUnavailableLocalRuntime(overrides = {}) {
  return normalizeLocalRuntime({
    kind: "none",
    ...overrides,
    capabilities: {
      ...(overrides.capabilities || {}),
      sdCpp: false,
      wan2gp: false,
    },
  });
}

export function createElectronLocalRuntime(localAI = null, proxyConfig = {}) {
  const wan2gp = localAI?.wan2gp || null;
  return normalizeLocalRuntime({
    kind: "electron",
    isElectron: Boolean(localAI?.isElectron),
    apiBase: proxyConfig.origin || "",
    bridge: localAI,
    sdCpp: localAI
      ? {
          getBinaryStatus: localAI.getBinaryStatus || null,
          downloadBinary: localAI.downloadBinary || null,
          generate: localAI.generate || null,
          listModels: localAI.listModels || null,
          downloadModel: localAI.downloadModel || null,
          downloadAuxiliary: localAI.downloadAuxiliary || null,
          deleteModel: localAI.deleteModel || null,
          cancel: localAI.cancel || null,
          onProgress: localAI.onProgress || null,
          onDownloadProgress: localAI.onDownloadProgress || null,
        }
      : null,
    wan2gp,
    capabilities: {
      sdCpp: Boolean(localAI?.generate && localAI?.listModels),
      wan2gp: Boolean(wan2gp?.generate && wan2gp?.probe),
    },
  });
}

export function normalizeLocalRuntime(runtime = {}) {
  const capabilities = {
    sdCpp: Boolean(runtime.capabilities?.sdCpp || runtime.hasSdCpp),
    wan2gp: Boolean(runtime.capabilities?.wan2gp || runtime.hasWan2gp),
  };

  return {
    kind: runtime.kind || "none",
    isElectron: Boolean(runtime.isElectron),
    apiBase: runtime.apiBase || "",
    available: capabilities.sdCpp || capabilities.wan2gp,
    capabilities,
    bridge: runtime.bridge || null,
    sdCpp: runtime.sdCpp || null,
    wan2gp: runtime.wan2gp || null,
  };
}

export function isLocalRuntimeAvailable(runtime, capability = null) {
  const normalized = normalizeLocalRuntime(runtime);
  if (!capability) return normalized.available;
  return Boolean(normalized.capabilities?.[capability]);
}
