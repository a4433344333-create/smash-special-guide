
const CACHE_NAME = "smash-special-offline-v1";

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

  // 自分のサイト以外の通信は対象外
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request);
    })
  );
});
