// Offline shell. Caches only Margin's own static files; never touches user data
// (that lives in IndexedDB) and never contacts any third party.
const CACHE = "margin-v1";
const SHELL = [
  "./", "index.html", "manifest.webmanifest",
  "css/tokens.css", "css/app.css",
  "js/app.js", "js/views.js", "js/dom.js", "js/store.js", "js/insight.js", "js/config.js",
  "fonts/newsreader-latin-wght-normal.woff2", "fonts/hanken-grotesk-latin-wght-normal.woff2", "fonts/spline-sans-mono-latin-wght-normal.woff2",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png",
];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
// Network-first so updates arrive; fall back to cache when offline.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request).then((r) => r ?? caches.match("index.html"))));
});
