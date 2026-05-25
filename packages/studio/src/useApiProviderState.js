"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ACTIVE_PROVIDER_COOKIE,
  API_PROVIDER_STORAGE_KEY,
  LEGACY_MUAPI_KEY_STORAGE_KEY,
  LEGACY_REQUIRE_KEY_STORAGE_KEY,
  LEGACY_YUNWU_KEY_STORAGE_KEY,
  PROVIDER_API_KEY_COOKIE,
  PROVIDER_BASE_URL_COOKIE,
  REQUIRE_KEY_STORAGE_KEY,
  createDefaultApiConfig,
  getActiveProvider,
  isProviderReady,
  normalizeApiConfig,
  normalizeApiKey,
} from "./apiProviders.js";

const COOKIE_MAX_AGE_SECONDS = 31536000;
const EXPIRED_COOKIE_DATE = "Thu, 01 Jan 1970 00:00:00 GMT";

function canUseBrowserStorage() {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(window.localStorage);
  } catch {
    return false;
  }
}

function getStorageAdapter(environment) {
  const adapter = environment?.storage;
  if (
    adapter &&
    typeof adapter.getItem === "function" &&
    typeof adapter.setItem === "function" &&
    typeof adapter.removeItem === "function"
  ) {
    return adapter;
  }

  return {
    getItem(key) {
      if (!canUseBrowserStorage()) return null;
      return window.localStorage.getItem(key);
    },
    setItem(key, value) {
      if (!canUseBrowserStorage()) return;
      window.localStorage.setItem(key, value);
    },
    removeItem(key) {
      if (!canUseBrowserStorage()) return;
      window.localStorage.removeItem(key);
    },
  };
}

function readStorage(key, environment) {
  try {
    return getStorageAdapter(environment).getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value, environment) {
  try {
    getStorageAdapter(environment).setItem(key, value);
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

function removeStorage(key, environment) {
  try {
    getStorageAdapter(environment).removeItem(key);
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

function readStoredApiProviderConfig(environment) {
  const raw = readStorage(API_PROVIDER_STORAGE_KEY, environment);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function canUseCookies() {
  return typeof document !== "undefined";
}

function getCookieAdapter(environment) {
  const adapter = environment?.cookies;
  if (adapter && typeof adapter.set === "function" && typeof adapter.remove === "function") {
    return adapter;
  }

  return {
    set(name, value, options = {}) {
      if (!canUseCookies()) return;
      const maxAge = Number.isFinite(options.maxAge) ? `; max-age=${options.maxAge}` : "";
      const sameSite = options.sameSite ? `; SameSite=${options.sameSite}` : "";
      const path = options.path ? `; path=${options.path}` : "";
      document.cookie = `${name}=${encodeURIComponent(value || "")}${path}${maxAge}${sameSite}`;
    },
    remove(name, options = {}) {
      if (!canUseCookies()) return;
      const sameSite = options.sameSite ? `; SameSite=${options.sameSite}` : "";
      const path = options.path ? `; path=${options.path}` : "";
      document.cookie = `${name}=; expires=${EXPIRED_COOKIE_DATE}${path}${sameSite}`;
    },
  };
}

function writeCookie(name, value, environment) {
  try {
    getCookieAdapter(environment).set(name, value, {
      path: "/",
      maxAge: COOKIE_MAX_AGE_SECONDS,
      sameSite: "Lax",
    });
  } catch {
    // Cookie sync is a convenience for API routes; the hook state remains source of truth.
  }
}

function clearCookie(name, environment) {
  try {
    getCookieAdapter(environment).remove(name, {
      path: "/",
      sameSite: "Lax",
    });
  } catch {
    // Cookie sync is a convenience for API routes; the hook state remains source of truth.
  }
}

export function syncApiProviderCookies(config, environment = null) {
  const normalizedConfig = normalizeApiConfig(config);
  const activeProvider = getActiveProvider(normalizedConfig);
  const activeKey = normalizeApiKey(activeProvider.apiKey);
  const activeBaseUrl = activeProvider.baseUrl?.trim();

  writeCookie(ACTIVE_PROVIDER_COOKIE, activeProvider.id, environment);
  if (activeBaseUrl) {
    writeCookie(PROVIDER_BASE_URL_COOKIE, activeBaseUrl, environment);
  } else {
    clearCookie(PROVIDER_BASE_URL_COOKIE, environment);
  }

  if (activeKey) {
    writeCookie(PROVIDER_API_KEY_COOKIE, activeKey, environment);
    if (activeProvider.id === "yunwu") {
      writeCookie(LEGACY_YUNWU_KEY_STORAGE_KEY, activeKey, environment);
    } else {
      clearCookie(LEGACY_YUNWU_KEY_STORAGE_KEY, environment);
    }
  } else {
    clearCookie(PROVIDER_API_KEY_COOKIE, environment);
    clearCookie(LEGACY_YUNWU_KEY_STORAGE_KEY, environment);
  }

  clearCookie(LEGACY_MUAPI_KEY_STORAGE_KEY, environment);
  return normalizedConfig;
}

export function loadApiProviderState(environment = null) {
  const storedConfig = readStoredApiProviderConfig(environment);
  const storedYunwuKey = normalizeApiKey(readStorage(LEGACY_YUNWU_KEY_STORAGE_KEY, environment));
  const legacyMuapiKey = normalizeApiKey(readStorage(LEGACY_MUAPI_KEY_STORAGE_KEY, environment));
  const apiConfig = normalizeApiConfig(storedConfig, storedYunwuKey || legacyMuapiKey);
  const activeProvider = getActiveProvider(apiConfig);
  const requireApiKey =
    readStorage(REQUIRE_KEY_STORAGE_KEY, environment) === "true" ||
    readStorage(LEGACY_REQUIRE_KEY_STORAGE_KEY, environment) === "true";

  return {
    apiConfig,
    apiKey: normalizeApiKey(activeProvider.apiKey),
    requireApiKey,
  };
}

export function persistApiProviderConfig(config, environment = null) {
  const normalizedConfig = normalizeApiConfig(config);
  const yunwuKey = normalizeApiKey(normalizedConfig.providers?.yunwu?.apiKey);

  writeStorage(API_PROVIDER_STORAGE_KEY, JSON.stringify(normalizedConfig), environment);
  if (yunwuKey) {
    writeStorage(LEGACY_YUNWU_KEY_STORAGE_KEY, yunwuKey, environment);
  } else {
    removeStorage(LEGACY_YUNWU_KEY_STORAGE_KEY, environment);
  }
  removeStorage(LEGACY_MUAPI_KEY_STORAGE_KEY, environment);
  syncApiProviderCookies(normalizedConfig, environment);

  return normalizedConfig;
}

export function persistRequireApiKey(enabled, environment = null) {
  const nextValue = Boolean(enabled);
  writeStorage(REQUIRE_KEY_STORAGE_KEY, String(nextValue), environment);
  removeStorage(LEGACY_REQUIRE_KEY_STORAGE_KEY, environment);
  return nextValue;
}

export default function useApiProviderState(environment = null) {
  const [apiConfig, setApiConfig] = useState(() => normalizeApiConfig(createDefaultApiConfig()));
  const [requireApiKey, setRequireApiKeyState] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    const loaded = loadApiProviderState(environment);
    const normalizedConfig = persistApiProviderConfig(loaded.apiConfig, environment);
    const normalizedRequireApiKey = persistRequireApiKey(loaded.requireApiKey, environment);

    setApiConfig(normalizedConfig);
    setRequireApiKeyState(normalizedRequireApiKey);
    setHasMounted(true);
  }, [environment]);

  const saveApiConfig = useCallback((nextConfig) => {
    const normalizedConfig = persistApiProviderConfig(nextConfig, environment);
    setApiConfig(normalizedConfig);
    return normalizedConfig;
  }, [environment]);

  const activeProvider = useMemo(() => getActiveProvider(apiConfig), [apiConfig]);
  const apiKey = useMemo(() => normalizeApiKey(activeProvider.apiKey), [activeProvider]);
  const apiReady = useMemo(() => isProviderReady(activeProvider), [activeProvider]);

  const saveApiKey = useCallback(
    (key) => {
      const normalizedKey = normalizeApiKey(key);
      if (!normalizedKey) return null;

      const nextConfig = normalizeApiConfig({
        ...apiConfig,
        providers: {
          ...apiConfig.providers,
          [activeProvider.id]: {
            ...apiConfig.providers[activeProvider.id],
            apiKey: normalizedKey,
            enabled: true,
          },
        },
      });

      return saveApiConfig(nextConfig);
    },
    [activeProvider.id, apiConfig, saveApiConfig],
  );

  const setRequireApiKey = useCallback(
    (enabled) => {
      const nextValue = persistRequireApiKey(enabled, environment);
      setRequireApiKeyState(nextValue);
      if (!nextValue) syncApiProviderCookies(apiConfig, environment);
      return nextValue;
    },
    [apiConfig, environment],
  );

  const reloadApiConfig = useCallback(() => {
    const loaded = loadApiProviderState(environment);
    setApiConfig(loaded.apiConfig);
    setRequireApiKeyState(loaded.requireApiKey);
    return loaded;
  }, [environment]);

  return {
    apiConfig,
    apiKey,
    activeProvider,
    apiReady,
    requireApiKey,
    hasMounted,
    saveApiConfig,
    saveApiKey,
    setRequireApiKey,
    reloadApiConfig,
  };
}

export { useApiProviderState };
