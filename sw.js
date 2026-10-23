/* 摘录 · 离线壳。版本号跟着每次构建变，旧缓存自动清掉 */
const CACHE = "excerpt-35b46492f3";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  // 页面走网络优先：更新后刷新就能拿到新版，断网回退缓存
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          const cp = r.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", cp)).catch(() => {});
          return r;
        })
        .catch(() => caches.match("./index.html").then((r) => r || caches.match("./")))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request).then((res) => {
      const cp = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, cp)).catch(() => {});
      return res;
    }))
  );
});
