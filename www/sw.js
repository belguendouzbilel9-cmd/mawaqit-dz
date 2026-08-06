const CACHE = "mawaqit-dz-v3";
const SHELL = [
  "./", "./index.html", "./manifest.json",
  "./icon-192.png", "./icon-512.png",
  "./icon-maskable-192.png", "./icon-maskable-512.png",
  "./adhan-1.mp3", "./adhan-2.mp3", "./adhan-3.mp3"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// Let the page tell a waiting worker to activate right away (see index.html)
self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Always go to network for the prayer-times API (needs fresh data)
  if (url.hostname.includes("aladhan.com")) return;

  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => cached))
  );
});
