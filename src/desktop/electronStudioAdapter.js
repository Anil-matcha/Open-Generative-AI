import { createElectronLocalRuntime } from '@studio/localRuntime.js';

const DESKTOP_TOKEN_HEADER = 'x-mozenaigc-desktop-token';
const DEFAULT_TAB = 'image';

export async function createElectronStudioAdapter() {
  const proxyConfig = await getDesktopApiProxyConfig();
  installDesktopApiPathRewrite(proxyConfig);

  return {
    kind: 'electron',
    proxyConfig,
    runtime: getRuntimeSnapshot(proxyConfig),
    routing: createRoutingAdapter(),
    storage: createStorageAdapter(),
    cookies: createCookieAdapter(),
  };
}

async function getDesktopApiProxyConfig() {
  try {
    const config = window.desktopAPI?.getProxyConfig?.();
    return config && typeof config.then === 'function' ? await config : config || {};
  } catch (error) {
    console.warn('[desktop] Failed to read desktop API proxy config:', error);
    return {};
  }
}

function getRuntimeSnapshot(proxyConfig = {}) {
  const localAI = window.localAI || null;
  const wan2gp = localAI && localAI.wan2gp ? localAI.wan2gp : null;
  const apiBase = proxyConfig.origin || window.__MOZEN_DESKTOP_API_BASE__ || '';

  return {
    isElectron: Boolean(localAI && localAI.isElectron),
    hasSdCpp: Boolean(localAI && localAI.generate && localAI.listModels),
    hasWan2gp: Boolean(wan2gp && wan2gp.generate && wan2gp.probe),
    apiBase,
    localRuntime: createElectronLocalRuntime(localAI, { ...proxyConfig, origin: apiBase }),
  };
}

function createRoutingAdapter() {
  return {
    getActiveTab(fallback = DEFAULT_TAB) {
      const params = new URLSearchParams(window.location.search);
      const tabFromQuery = normalizeTabId(params.get('tab'));
      if (tabFromQuery) return tabFromQuery;

      const hashParams = new URLSearchParams(String(window.location.hash || '').replace(/^#/, ''));
      return normalizeTabId(hashParams.get('tab')) || fallback;
    },

    setActiveTab(tabId) {
      const normalizedTab = normalizeTabId(tabId);
      if (!normalizedTab) return;

      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set('tab', normalizedTab);
      nextUrl.hash = '';
      window.history.replaceState({}, '', nextUrl.toString());
    },

    openLegacyRenderer() {
      const legacyUrl = new URL(window.location.href);
      legacyUrl.searchParams.set('renderer', 'legacy');
      legacyUrl.hash = '';
      window.location.href = legacyUrl.toString();
    },
  };
}

function normalizeTabId(value) {
  const tabId = String(value || '').trim();
  return /^[a-z0-9_-]+$/i.test(tabId) ? tabId : '';
}

function createStorageAdapter() {
  return {
    getItem(key) {
      try {
        return window.localStorage?.getItem(key) || null;
      } catch {
        return null;
      }
    },

    setItem(key, value) {
      try {
        window.localStorage?.setItem(key, value);
      } catch {
        // localStorage can be unavailable in restricted Electron contexts.
      }
    },

    removeItem(key) {
      try {
        window.localStorage?.removeItem(key);
      } catch {
        // localStorage can be unavailable in restricted Electron contexts.
      }
    },
  };
}

function createCookieAdapter() {
  return {
    get(name) {
      try {
        const encodedName = `${name}=`;
        const match = document.cookie
          .split(';')
          .map((item) => item.trim())
          .find((item) => item.startsWith(encodedName));
        return match ? decodeURIComponent(match.slice(encodedName.length)) : null;
      } catch {
        return null;
      }
    },

    set(name, value, options = {}) {
      try {
        const path = options.path ? `; path=${options.path}` : '';
        const maxAge = Number.isFinite(options.maxAge) ? `; max-age=${options.maxAge}` : '';
        const sameSite = options.sameSite ? `; SameSite=${options.sameSite}` : '';
        document.cookie = `${name}=${encodeURIComponent(value || '')}${path}${maxAge}${sameSite}`;
      } catch {
        // Cookie sync is best-effort for desktop API compatibility.
      }
    },

    remove(name, options = {}) {
      try {
        const path = options.path ? `; path=${options.path}` : '';
        const sameSite = options.sameSite ? `; SameSite=${options.sameSite}` : '';
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT${path}${sameSite}`;
      } catch {
        // Cookie sync is best-effort for desktop API compatibility.
      }
    },
  };
}

function rewriteApiUrl(value, proxyOrigin) {
  if (!proxyOrigin || !value) return null;
  const raw = String(value);

  if (raw.startsWith('/api/')) {
    return `${proxyOrigin}${raw}`;
  }

  try {
    const parsed = new URL(raw, window.location.href);
    const localOrigin = window.location.origin;
    const isLocalPageRequest = parsed.origin === localOrigin || parsed.protocol === 'file:';
    if (isLocalPageRequest && parsed.pathname.startsWith('/api/')) {
      return `${proxyOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    return null;
  }

  return null;
}

function installDesktopApiPathRewrite(proxyConfig = {}) {
  if (!proxyConfig.origin || !proxyConfig.token || window.__mozenDesktopApiRewriteInstalled) {
    return;
  }

  window.__mozenDesktopApiRewriteInstalled = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const candidateUrl = input instanceof Request ? input.url : input;
    const rewrittenUrl = rewriteApiUrl(candidateUrl, proxyConfig.origin);
    if (!rewrittenUrl) return originalFetch(input, init);

    const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
    headers.set(DESKTOP_TOKEN_HEADER, proxyConfig.token);

    if (input instanceof Request) {
      return originalFetch(new Request(rewrittenUrl, input), { ...init, headers });
    }

    return originalFetch(rewrittenUrl, { ...init, headers });
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function open(method, url, ...rest) {
    const rewrittenUrl = rewriteApiUrl(url, proxyConfig.origin);
    this.__mozenDesktopApiRequest = Boolean(rewrittenUrl);
    return originalOpen.call(this, method, rewrittenUrl || url, ...rest);
  };

  XMLHttpRequest.prototype.send = function send(...args) {
    if (this.__mozenDesktopApiRequest) {
      this.setRequestHeader(DESKTOP_TOKEN_HEADER, proxyConfig.token);
    }
    return originalSend.apply(this, args);
  };
}
