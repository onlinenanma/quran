/* Unified Service Worker for Main Quran Site & Hifd Tracker */
'use strict';

const CFG = Object.assign({
  VERSION: 'v4',
  HOST_GAP_MS: { 'everyayah.com': 1000, 'api.alquran.cloud': 110 },
  DEFAULT_COOLDOWN_MS: { 'api.alquran.cloud': 5000, default: 60000 },
  MAX_COOLDOWN_MS: 300000,
  NAV_TIMEOUT_MS: 4000,
  API_TTL_MS: 30 * 24 * 3600 * 1000,
  EDITION_TTL_MS: 7 * 24 * 3600 * 1000,
  MAX_AUDIO: 400,
  MAX_IMAGES: 80
}, self.HIFZ_SW_CONFIG || {});

// Cache Names
const SITE_CACHE = 'quran-site-v4';
const STATIC_CACHE = `hifz-static-${CFG.VERSION}`;
const API_CACHE = `hifz-api-${CFG.VERSION}`;
const IMAGE_CACHE = `hifz-images-${CFG.VERSION}`;
const META_CACHE = `hifz-meta-${CFG.VERSION}`;
const AUDIO_CACHE = 'hifz-audio-v1';
const ALL_CACHES = [SITE_CACHE, STATIC_CACHE, API_CACHE, IMAGE_CACHE, META_CACHE, AUDIO_CACHE];

const SCOPE = self.registration.scope;
const AUDIO_HOSTS = new Set(['everyayah.com', 'cdn.islamic.network', 'cdn.islamic.ru']);
const IMAGE_HOSTS = new Set(['android.quran.com', 'mushaf.quran.com', 'api.islamic.app', 'cdn.islamic.network']);
const STATIC_HOSTS = new Set(['cdn.tailwindcss.com', 'fonts.googleapis.com', 'fonts.gstatic.com']);

const CORE_PAGES = [
  '/quran/',
  '/quran/surah-index',
  '/quran/tafsir',
  '/quran/site.js',
  '/quran/player.js',
  '/quran/translate.js',
  'https://cdn.tailwindcss.com/',
  'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Inter:wght@300;400;500;600;700&display=swap'
];

const sleep = ms => new Promise(r => setTimeout(r, ms));
const hostOf = url => new URL(url).hostname;
const isOffline = () => self.navigator && self.navigator.onLine === false;

// ------------------------------------------------------------------ Install & Activate
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(SITE_CACHE).then(c => Promise.all(CORE_PAGES.map(u => c.add(u).catch(() => {})))),
      precacheHifd()
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if ((name.startsWith('quran-site-') || name.startsWith('hifz-')) && !ALL_CACHES.includes(name)) {
        await caches.delete(name);
      }
    }
    await self.clients.claim();
  })());
});

async function precacheHifd() {
  const cache = await caches.open(STATIC_CACHE);
  await Promise.allSettled(CORE_PAGES.map(async url => {
    try {
      const sameOrigin = new URL(url, SCOPE).origin === self.location.origin;
      const res = await fetch(sameOrigin ? new Request(url) : new Request(url, { mode: 'no-cors' }));
      if (res.ok || (!sameOrigin && res.type === 'opaque')) await cache.put(url, res);
    } catch (e) { /* ignore offline errors during install */ }
  }));
}

self.addEventListener('message', event => {
  const data = event.data || {};
  if (data.type !== 'CACHE_URLS' || !Array.isArray(data.urls)) return;
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    for (const u of data.urls) {
      try {
        const url = new URL(u, SCOPE);
        if (url.origin !== self.location.origin) continue;
        const res = await fetch(url.href, { cache: 'reload' });
        if (res.ok) await cache.put(url.href, res);
      } catch (e) { /* offline */ }
    }
  })());
});

// ------------------------------------------------------------------ Unified Routing & Fetch
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return;

  const url = new URL(request.url);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return;

  const sameOrigin = url.origin === self.location.origin;

  // 1. API (alquran.cloud)
  if (url.hostname === 'api.alquran.cloud') {
    return event.respondWith(handleApi(request));
  }

  // 2. Remote audio (EveryAyah, etc.)
  if (AUDIO_HOSTS.has(url.hostname) && /\.mp3$/i.test(url.pathname)) {
    return event.respondWith(handleAudio(request));
  }

  // 3. Mus'haf images
  if (request.destination === 'image' && IMAGE_HOSTS.has(url.hostname)) {
    return event.respondWith(handleImage(request));
  }

  // 3b. Same-origin audio (your own meaning/translation mp3s: audio/001/001001-ml.mp3)
  //     Must come BEFORE the navigation/site rule, otherwise the 4s timeout breaks playback.
  if (sameOrigin && /\.(mp3|m4a|ogg|wav)$/i.test(url.pathname)) {
    return event.respondWith(handleLocalAudio(request));
  }

  // 4. Navigation & same-origin pages/assets (network first with cache fallback)
  if (request.mode === 'navigate' || (sameOrigin && !request.headers.has('range'))) {
    return event.respondWith(handleNavigationAndSite(event, request));
  }

  // 5. External static assets
  if (STATIC_HOSTS.has(url.hostname)) {
    return event.respondWith(staleWhileRevalidate(event, request));
  }
});

// ------------------------------------------------------------------ The Polite Gate
const lastSlot = new Map();
const corsBlocked = new Set();
const putCounter = new Map();
const metaRequest = () => new Request(SCOPE + '__hifz-meta.json');

async function readMeta() {
  try {
    const cache = await caches.open(META_CACHE);
    const res = await cache.match(metaRequest());
    return res ? await res.json() : {};
  } catch (e) { return {}; }
}

async function writeMeta(meta) {
  try {
    const cache = await caches.open(META_CACHE);
    await cache.put(metaRequest(), new Response(JSON.stringify(meta), { headers: { 'Content-Type': 'application/json' } }));
  } catch (e) { /* ignore */ }
}

const cooldownStatuses = host => host === 'everyayah.com' ? [429, 403, 503] : [429, 503];

function cooldownResponse(until) {
  const secs = Math.max(1, Math.ceil((until - Date.now()) / 1000));
  return new Response('', { status: 429, statusText: 'Cooling down', headers: { 'Retry-After': String(secs) } });
}

async function politeFetch(request) {
  const host = hostOf(request.url);
  const meta = await readMeta();
  const until = (meta.cooldowns && meta.cooldowns[host]) || 0;
  if (Date.now() < until) return cooldownResponse(until);

  const gap = CFG.HOST_GAP_MS[host] || 0;
  if (gap) {
    const now = Date.now();
    const slot = Math.max(now, (lastSlot.get(host) || 0) + gap);
    lastSlot.set(host, slot);
    if (slot > now) await sleep(slot - now);
  }

  const res = await fetch(request);
  if (cooldownStatuses(host).includes(res.status)) {
    const asked = parseInt(res.headers.get('Retry-After'));
    const wait = Math.min((asked > 0 ? asked * 1000 : (CFG.DEFAULT_COOLDOWN_MS[host] || CFG.DEFAULT_COOLDOWN_MS.default)), CFG.MAX_COOLDOWN_MS);
    const fresh = await readMeta();
    fresh.cooldowns = Object.assign({}, fresh.cooldowns, { [host]: Date.now() + wait });
    await writeMeta(fresh);
  }
  return res;
}

async function trim(cache, max) {
  try {
    const keys = await cache.keys();
    for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
  } catch (e) { /* ignore */ }
}

function remember(cache, name, request, response, max) {
  const n = (putCounter.get(name) || 0) + 1;
  putCounter.set(name, n);
  return cache.put(request, response).then(() => { if (n % 20 === 0) return trim(cache, max); });
}

// ------------------------------------------------------------------ Handlers
async function handleNavigationAndSite(event, request) {
  const siteCache = await caches.open(SITE_CACHE);
  try {
    const res = await Promise.race([fetch(request), sleep(CFG.NAV_TIMEOUT_MS).then(() => { throw new Error('slow'); })]);
    if (res && res.status === 200) {
      siteCache.put(request, res.clone()).catch(() => {});
    }
    return res;
  } catch (e) {
    const staticCache = await caches.open(STATIC_CACHE);
    return (await siteCache.match(request, { ignoreSearch: true }))
      || (await staticCache.match(request, { ignoreSearch: true }))
      || (request.mode === 'navigate' ? await siteCache.match('/quran/') : null)
      || (request.mode === 'navigate'
        ? new Response('Offline - please open the site online once.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
        : Response.error());
  }
}

async function staleWhileRevalidate(event, request) {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(request);
  const refresh = fetch(request).then(res => {
    if (res && (res.ok || res.type === 'opaque')) cache.put(request, res.clone());
    return res;
  }).catch(() => null);
  if (hit) { event.waitUntil(refresh); return hit; }
  return (await refresh) || Response.error();
}

async function handleApi(request) {
  const cache = await caches.open(API_CACHE);
  const hit = await cache.match(request.url);
  let stale = null;
  if (hit) {
    const ttl = /\/v1\/edition/.test(request.url) ? CFG.EDITION_TTL_MS : CFG.API_TTL_MS;
    const age = Date.now() - Number(hit.headers.get('x-hifz-cached-at') || 0);
    if (age < ttl) return hit;
    stale = hit;
  }
  try {
    const res = await politeFetch(request);
    if (res.ok) {
      const headers = new Headers(res.headers);
      headers.set('x-hifz-cached-at', String(Date.now()));
      const copy = new Response(await res.clone().blob(), { status: res.status, statusText: res.statusText, headers });
      await remember(cache, 'api', request.url, copy, 2000);
      return res;
    }
    if (stale && (res.status === 429 || res.status >= 500)) return stale;
    return res;
  } catch (e) {
    if (stale) return stale;
    throw e;
  }
}

async function withRange(request, response) {
  const range = request.headers && request.headers.get('range');
  if (!range || response.status !== 200 || response.type === 'opaque') return response;
  const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!m || (m[1] === '' && m[2] === '')) return response;
  const buf = await response.clone().arrayBuffer();
  const size = buf.byteLength;
  let start, end;
  if (m[1] === '') { start = Math.max(0, size - parseInt(m[2])); end = size - 1; }
  else { start = parseInt(m[1]); end = m[2] === '' ? size - 1 : Math.min(parseInt(m[2]), size - 1); }
  if (start >= size || start > end) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes'
    }
  });
}

// Same-origin audio: cache-first, fetch the FULL file (no Range) so it can be cached, then slice.
async function handleLocalAudio(request) {
  const cache = await caches.open(AUDIO_CACHE);
  // Key = full URL including ?v=hash, so a re-recorded file (new hash) is fetched again
  const hit = await cache.match(request.url);
  if (hit) return withRange(request, hit);
  try {
    const res = await fetch(new Request(request.url, { credentials: 'same-origin' }));
    if (res.status === 200) {
      try { await remember(cache, 'audio', request.url, res.clone(), CFG.MAX_AUDIO); } catch (e) { /* quota */ }
      return withRange(request, res);
    }
    return res; // e.g. 404 - let the player see the real status
  } catch (e) {
    return Response.error();
  }
}

async function handleAudio(request) {
  const cache = await caches.open(AUDIO_CACHE);
  const hit = await cache.match(request.url);
  if (hit) return withRange(request, hit);

  const host = hostOf(request.url);
  if (!corsBlocked.has(host)) {
    try {
      const res = await politeFetch(new Request(request.url, { mode: 'cors', credentials: 'omit' }));
      if (res.status === 200) {
        await remember(cache, 'audio', request.url, res.clone(), CFG.MAX_AUDIO);
        return withRange(request, res);
      }
      return res;
    } catch (e) {
      if (isOffline()) return Response.error();
      corsBlocked.add(host);
      if (request.mode === 'cors') return Response.error();
    }
  }
  return politeFetch(request);
}

async function handleImage(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const hit = await cache.match(request.url);
  if (hit) return hit;

  const host = hostOf(request.url);
  if (!corsBlocked.has(host)) {
    try {
      const res = await politeFetch(new Request(request.url, { mode: 'cors', credentials: 'omit' }));
      if (res.ok) await remember(cache, 'image', request.url, res.clone(), CFG.MAX_IMAGES);
      return res;
    } catch (e) {
      if (isOffline()) return Response.error();
      corsBlocked.add(host);
      if (request.mode === 'cors') return Response.error();
    }
  }
  return politeFetch(request);
}
