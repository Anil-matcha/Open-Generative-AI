"use client";

import { CreateAgentPage } from "ai-agent";
import "ai-agent/dist/tailwind.css";
import { useCallback, useEffect, useRef } from "react";
import axios from "axios";
import {
  API_PROVIDER_STORAGE_KEY,
  buildProviderRequestHeaders,
  getActiveProvider,
  normalizeApiConfig,
  normalizeApiKey,
} from "studio";

const LEGACY_STORAGE_KEY = "muapi_key";

function getCookieValue(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function readProviderContext() {
  if (typeof window === "undefined") return { apiKey: null, headers: {} };

  let storedConfig = null;
  try {
    const raw = localStorage.getItem(API_PROVIDER_STORAGE_KEY);
    storedConfig = raw ? JSON.parse(raw) : null;
  } catch {
    storedConfig = null;
  }

  const legacyKey = normalizeApiKey(localStorage.getItem(LEGACY_STORAGE_KEY));
  const apiConfig = normalizeApiConfig(storedConfig, legacyKey || getCookieValue("provider_api_key"));
  const activeProvider = getActiveProvider(apiConfig);
  const apiKey =
    normalizeApiKey(activeProvider.apiKey) ||
    normalizeApiKey(getCookieValue("provider_api_key")) ||
    normalizeApiKey(getCookieValue("yunwu_api_key")) ||
    legacyKey ||
    normalizeApiKey(getCookieValue(LEGACY_STORAGE_KEY));

  return {
    apiKey,
    headers: {
      ...buildProviderRequestHeaders(apiConfig),
      ...(apiKey ? { "x-api-key": apiKey, Authorization: `Bearer ${apiKey}` } : {}),
    },
  };
}

export default function AgentCreateClient({ userData }) {
  const interceptorRef = useRef(null);

  useEffect(() => {
    const providerContext = readProviderContext();
    const apiKey = providerContext.apiKey;
    if (!apiKey) return;

    interceptorRef.current = axios.interceptors.request.use((config) => {
      const isRelative = config.url.startsWith("/") || !config.url.startsWith("http");
      const isInternalProxy = config.url.includes('/api/app') || config.url.includes('/api/workflow') || config.url.includes('/api/agents') || config.url.includes('/api/api') || config.url.includes('/api/v1');
      
      if (isRelative || isInternalProxy) {
        config.headers = {
          ...config.headers,
          ...providerContext.headers,
        };
      }
      return config;
    });

    return () => {
      if (interceptorRef.current !== null) {
        axios.interceptors.request.eject(interceptorRef.current);
      }
    };
  }, []);

  const useUser = useCallback(
    () => ({
      user: {
        username: userData?.email?.split("@")[0] || "Studio User",
        name: userData?.email?.split("@")[0] || "Studio User",
        email: userData?.email || null,
        profile_photo: null,
        balance: userData?.balance || 0,
      },
      isAuthorized: !!userData,
    }),
    [userData]
  );

  return (
    <CreateAgentPage
      useUser={useUser}
      usedIn="studio"
    />
  );
}
