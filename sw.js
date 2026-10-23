// Network first; falls back to the saved copy when offline.
const C = "quran-page-v1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(clients.claim()));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(fetch(e.request).then(r => {
    const u = new URL(e.request.url);
    if (r.ok && (u.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(u.host))) {
      const copy = r.clone(); caches.open(C).then(c => c.put(e.request, copy));
    }
    return r;
  }).catch(() => caches.match(e.request)));
});
