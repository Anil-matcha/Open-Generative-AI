import { useMemo } from 'react';

function readPathParts() {
  if (typeof window === 'undefined') return [];
  return window.location.pathname.split('/').filter(Boolean);
}

function notifyRouteChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function navigate(path, replace = false) {
  if (typeof window === 'undefined') return;
  const target = typeof path === 'string' && path ? path : '/';
  if (replace) {
    window.history.replaceState({}, '', target);
  } else {
    window.history.pushState({}, '', target);
  }
  notifyRouteChange();
}

export function useParams() {
  return useMemo(() => {
    const parts = readPathParts();
    if (parts[0] === 'workflow') {
      return {
        id: parts[1],
        tab: parts[2],
      };
    }
    if (parts[0] === 'studio') {
      return {
        slug: parts.slice(1),
      };
    }
    return {};
  }, []);
}

export function useRouter() {
  return useMemo(
    () => ({
      push: (path) => navigate(path, false),
      replace: (path) => navigate(path, true),
      back: () => {
        if (typeof window !== 'undefined') window.history.back();
      },
      refresh: () => notifyRouteChange(),
      prefetch: () => Promise.resolve(),
    }),
    [],
  );
}

export function useSearchParams() {
  return useMemo(() => {
    if (typeof window === 'undefined') return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, []);
}
