/* /quran/sw.js – network first, falls back to the saved copy when offline.
   Every page you open once is saved automatically. Add pages to CORE to have them saved at once. */
const V = 'quran-site-v1';
const CORE = ['/quran/', '/quran/surah-index', '/quran/tafsir', '/quran/site.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V)
    .then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {}))))   // a missing page must not break install
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('quran-site-') && k !== V).map(k => caches.delete(k))))
    .then(() => clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || r.headers.has('range')) return;                       // audio streaming etc.
  if (u.pathname.endsWith('.mp3')) return;                                         // audio files: the page saves these itself (size-limited)
  if (!(u.origin === location.origin || /(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.host))) return;
  e.respondWith(
    fetch(r).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(V).then(c => c.put(r, copy)); }
      return res;
    }).catch(() => caches.match(r, { ignoreSearch: true })
      .then(hit => hit || (r.mode === 'navigate' ? caches.match('/quran/') : Response.error())))
  );
});
