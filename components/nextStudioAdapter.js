'use client';

const DEFAULT_TAB = 'image';

export function createNextStudioAdapter({
  router,
  slug = [],
  idFromParams = null,
  tabFromParams = null,
  tabs = [],
} = {}) {
  const tabIds = new Set(tabs.map((tab) => tab.id).filter(Boolean));
  const normalizedSlug = Array.isArray(slug) ? slug : slug ? [slug] : [];
  const workflowInfo = resolveWorkflowInfo(normalizedSlug, idFromParams, tabFromParams);

  return {
    kind: 'next',
    routing: {
      getWorkflowInfo() {
        return workflowInfo;
      },
      getActiveTab(fallback = DEFAULT_TAB) {
        if (workflowInfo.id || normalizedSlug.includes('workflow')) return 'workflows';
        if (normalizedSlug.includes('agents')) return 'agents';
        if (normalizedSlug.includes('apps')) return 'apps';

        const firstSegment = normalizedSlug[0];
        if (firstSegment && tabIds.has(firstSegment)) return firstSegment;
        return fallback;
      },
      setActiveTab(tabId) {
        if (!tabIds.has(tabId)) return;
        router?.push?.(`/studio/${tabId}`);
      },
    },
    storage: createBrowserStorageAdapter(),
    cookies: createBrowserCookieAdapter(),
  };
}

function resolveWorkflowInfo(slug, idFromParams, tabFromParams) {
  if (idFromParams) {
    return { id: idFromParams, tab: tabFromParams || null };
  }

  const wfIndex = slug.findIndex((segment) => segment === 'workflows' || segment === 'workflow');
  if (wfIndex === -1) return { id: null, tab: null };

  return {
    id: slug[wfIndex + 1] || null,
    tab: slug[wfIndex + 2] || null,
  };
}

function createBrowserStorageAdapter() {
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
        // Browser storage can be unavailable in private or restricted contexts.
      }
    },
    removeItem(key) {
      try {
        window.localStorage?.removeItem(key);
      } catch {
        // Browser storage can be unavailable in private or restricted contexts.
      }
    },
  };
}

function createBrowserCookieAdapter() {
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
        // Cookie sync is best-effort; hook state remains the source of truth.
      }
    },
    remove(name, options = {}) {
      try {
        const path = options.path ? `; path=${options.path}` : '';
        const sameSite = options.sameSite ? `; SameSite=${options.sameSite}` : '';
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT${path}${sameSite}`;
      } catch {
        // Cookie sync is best-effort; hook state remains the source of truth.
      }
    },
  };
}
