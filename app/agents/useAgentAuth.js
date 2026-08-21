"use client";

import axios from 'axios';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'muapi_key';

function isInternalApiUrl(rawUrl) {
  try {
    const url = new URL(String(rawUrl || ''), window.location.origin);
    return url.origin === window.location.origin && url.pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

export async function fetchWithApiKey(url, apiKey) {
  return fetch(url, {
    cache: 'no-store',
    headers: { 'x-api-key': apiKey },
  });
}

export function useAgentAuth() {
  const [state, setState] = useState({ status: 'loading', apiKey: null, userData: null });

  useEffect(() => {
    const legacyKey = window.localStorage.getItem(STORAGE_KEY)?.trim();
    const apiKey = window.sessionStorage.getItem(STORAGE_KEY)?.trim() || legacyKey;
    if (!apiKey) {
      setState({ status: 'missing', apiKey: null, userData: null });
      return undefined;
    }

    window.sessionStorage.setItem(STORAGE_KEY, apiKey);
    if (legacyKey) window.localStorage.removeItem(STORAGE_KEY);

    const interceptorId = axios.interceptors.request.use((config) => {
      if (isInternalApiUrl(config.url)) {
        config.headers = config.headers || {};
        config.headers['x-api-key'] = apiKey;
      }
      return config;
    });

    let cancelled = false;
    fetchWithApiKey('/api/api/v1/account/balance', apiKey)
      .then(async (response) => {
        if (cancelled) return;
        if (response.status === 401 || response.status === 403) {
          setState({ status: 'invalid', apiKey: null, userData: null });
          return;
        }
        const userData = response.ok ? await response.json() : null;
        if (!cancelled) setState({ status: 'ready', apiKey, userData });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'ready', apiKey, userData: null });
      });

    return () => {
      cancelled = true;
      axios.interceptors.request.eject(interceptorId);
    };
  }, []);

  return state;
}

export function AgentAuthState({ status }) {
  const message = status === 'loading'
    ? 'Loading…'
    : status === 'invalid'
      ? 'Your API key was rejected. Update it in Studio settings.'
      : 'An API key is required. Add one in Studio settings.';

  return (
    <div className="flex h-screen w-full items-center justify-center bg-black px-6 text-center text-white">
      <div>
        <p className="mb-4 text-sm text-white/70">{message}</p>
        {status !== 'loading' && (
          <a className="text-sm font-semibold text-cyan-400 hover:text-cyan-300" href="/studio">
            Open Studio
          </a>
        )}
      </div>
    </div>
  );
}
