
const CACHE_NAME = "smash-special-offline-v2";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json"
];

// インストール時にサイト本体を保存
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(APP_FILES);
    }).then(() => self.skipWaiting())
  );
});

// 古いキャッシュを整理
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// サイトの表示に必要なファイルをキャッシュから返す

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // HTMLはオンラインなら最新版を優先
      if (
        event.request.mode === "navigate" ||
        url.pathname.endsWith("/index.html")
      ) {
        try {
          const response = await fetch(event.request);

          if (response.ok) {
            await cache.put(event.request, response.clone());
          }

          return response;
        } catch {
          return (
            await cache.match(event.request) ||
            await cache.match("./index.html") ||
            Response.error()
          );
        }
      }

      const cached = await cache.match(event.request);

      if (cached) return cached;

      return fetch(event.request);
    })()
  );
});
