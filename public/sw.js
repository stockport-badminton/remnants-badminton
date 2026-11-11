/*
 * Service worker — makes the site installable and usable offline.
 *
 * Strategies:
 *   - Page navigations: network-first (fixtures change often), fall back to the
 *     last cached copy, then to /offline.
 *   - /_astro/* (content-hashed build assets): cache-first.
 *   - Other same-origin assets + Google Fonts: stale-while-revalidate.
 *   - /admin, Netlify internals, .ics feeds, non-GET: untouched (straight to network).
 *
 * Bump VERSION when changing this file's caching logic; old caches are purged on activate.
 * Push notification handlers will be added here later.
 */
const VERSION = 'v1';
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
    return (
      (await cache.match(request, { ignoreSearch: true })) ||
      (await caches.match(OFFLINE_URL)) ||
      Response.error()
    );
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
