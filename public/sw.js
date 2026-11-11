/*
 * Service worker — makes the site installable and usable offline.
 *
 * Strategies:
 *   - Page navigations: network-first (fixtures change often), fall back to the
 *     last cached copy, then to /offline.
 *   - /_astro/* (content-hashed build assets): cache-first.
 *   - Other same-origin assets + Google Fonts: stale-while-revalidate.
 *   - Fixture data (fetched at runtime from raw.githubusercontent.com): network-first,
 *     so the fixtures page still has data offline.
 *   - /admin, Netlify internals, .ics feeds, non-GET: untouched (straight to network).
 *
 * Bump VERSION when changing this file's caching logic; old caches are purged on activate.
 * Push notification handlers are at the bottom.
 */
const VERSION = 'v2';
const DATA_HOSTS = ['raw.githubusercontent.com'];
const PRECACHE = `precache-${VERSION}`;
const PAGES = `pages-${VERSION}`;
const ASSETS = `assets-${VERSION}`;
const MAX_PAGES = 30;
const MAX_ASSETS = 100;

const OFFLINE_URL = '/offline/';
const PRECACHE_URLS = [OFFLINE_URL, '/icons/icon-192.png', '/favicon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((c) => c.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  const keep = new Set([PRECACHE, PAGES, ASSETS]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

  if (DATA_HOSTS.includes(url.hostname) && url.pathname.endsWith('.json')) {
    event.respondWith(networkFirst(request));
    return;
  }
  if (!sameOrigin && !isFont) return;
  if (sameOrigin && (
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/.netlify') ||
    url.pathname.endsWith('.ics') ||
    url.pathname === '/sw.js'
  )) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
  } else if (sameOrigin && url.pathname.startsWith('/_astro/')) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request, event));
  }
});

async function networkFirst(request) {
  const cache = await caches.open(PAGES);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      trim(PAGES, MAX_PAGES);
    }
    return response;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    if (request.mode === 'navigate') return (await caches.match(OFFLINE_URL)) || Response.error();
    return Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(ASSETS);
    await cache.put(request, response.clone());
    trim(ASSETS, MAX_ASSETS);
  }
  return response;
}

async function staleWhileRevalidate(request, event) {
  const cache = await caches.open(ASSETS);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok || response.type === 'opaque') {
        cache.put(request, response.clone()).then(() => trim(ASSETS, MAX_ASSETS));
      }
      return response;
    })
    .catch(() => cached || Response.error());
  if (cached) {
    event.waitUntil(network);
    return cached;
  }
  return network;
}

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

/* ── Push notifications ──────────────────────────────────────────────────────
 * Payload (from netlify/functions/push-send.mjs): { title, body, url, tag }
 */
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data?.text() }; }
  const title = data.title || 'Remnants Badminton';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      tag: data.tag,          // same tag replaces rather than stacks
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-96.png',
      data: { url: data.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((w) => new URL(w.url).origin === self.location.origin);
      if (existing) return existing.navigate(target).then((w) => (w || existing).focus());
      return self.clients.openWindow(target);
    }),
  );
});
