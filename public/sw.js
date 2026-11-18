/**
 * Open Generative AI — Service Worker
 *
 * Provides:
 * 1. Static asset caching (CSS, JS, fonts, images) for offline access
 * 2. Stale-while-revalidate strategy for API responses
 * 3. Generation history caching for offline viewing
 * 4. Offline generation queue (prompts saved, submitted when online)
 *
 * @version 1.0.0
 */

const CACHE_NAME = 'open-gen-ai-v1';
const STATIC_CACHE = 'open-gen-ai-static-v1';
const API_CACHE = 'open-gen-ai-api-v1';
const HISTORY_CACHE = 'open-gen-ai-history-v1';

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/studio/image',
  '/manifest.json',
];

// API routes to cache with stale-while-revalidate
const API_ROUTES = [
  '/api/v1/account/balance',
];

// Maximum history items to cache
const MAX_HISTORY_ITEMS = 100;

// ─── Install ────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-cache failed (some assets may be unavailable):', err.message);
      });
    })
  );
  self.skipWaiting();
});

// ─── Activate ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== API_CACHE && key !== HISTORY_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// ─── Fetch ──────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and non-HTTP requests
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Skip chrome-extension and other non-app URLs
  if (!url.pathname.startsWith('/') && !url.hostname.includes('muapi.ai')) {
    return;
  }

  // ── Static assets: Cache-first ──────────────────────────
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    request.destination === 'image' ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$/i)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // ── API balance: Stale-while-revalidate ─────────────────
  if (API_ROUTES.some((route) => url.pathname.startsWith(route))) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // ── Generation results: Cache for offline viewing ───────
  if (url.pathname.includes('/api/v1/predictions/') && url.pathname.endsWith('/result')) {
    event.respondWith(
      fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          clone.json().then((data) => {
            if (data.status === 'completed' || data.status === 'succeeded') {
              caches.open(HISTORY_CACHE).then((cache) => {
                cache.put(request, new Response(JSON.stringify(data), {
                  headers: { 'Content-Type': 'application/json' },
                }));
                // Prune old history entries
                pruneHistoryCache(cache);
              });
            }
          });
        }
        return response;
      })
    );
    return;
  }

  // ── Default: Network-first with offline fallback ────────
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request).then((cached) => {
        return cached || new Response(
          JSON.stringify({ error: 'You are offline. Please check your connection.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      });
    })
  );
});

// ─── Message Handlers ────────────────────────────────────────
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CLEAR_CACHES':
      event.waitUntil(
        caches.keys().then((keys) => {
          return Promise.all(keys.map((key) => caches.delete(key)));
        })
      );
      break;

    case 'QUEUE_GENERATION':
      // Store generation request for offline queue
      event.waitUntil(
        storeOfflineGeneration(payload).then(() => {
          event.ports?.[0]?.postMessage({ queued: true });
        })
      );
      break;

    case 'GET_QUEUED_GENERATIONS':
      event.waitUntil(
        getOfflineGenerations().then((items) => {
          event.ports?.[0]?.postMessage({ items });
        })
      );
      break;

    default:
      break;
  }
});

// ─── Offline Generation Queue ────────────────────────────────
async function storeOfflineGeneration(generation) {
  const db = await openQueueDB();
  const tx = db.transaction('queue', 'readwrite');
  tx.objectStore('queue').add({
    ...generation,
    timestamp: Date.now(),
    status: 'queued',
  });
  return tx.complete;
}

async function getOfflineGenerations() {
  const db = await openQueueDB();
  const tx = db.transaction('queue', 'readonly');
  return tx.objectStore('queue').getAll();
}

function openQueueDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('OpenGenAIQueue', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('queue')) {
        db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ─── History Cache Pruning ───────────────────────────────────
async function pruneHistoryCache(cache) {
  const keys = await cache.keys();
  if (keys.length > MAX_HISTORY_ITEMS) {
    const toDelete = keys.slice(0, keys.length - MAX_HISTORY_ITEMS);
    await Promise.all(toDelete.map((key) => cache.delete(key)));
  }
}
