const ZT_BUILD_VERSION = "1789135571";
const ZT_CACHE_NAME = "zt-webgl-" + ZT_BUILD_VERSION;

self.addEventListener("install", function (event) {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (key) {
          return key.indexOf("zt-webgl-") === 0 && key !== ZT_CACHE_NAME ? caches.delete(key) : Promise.resolve(false);
        }));
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", function (event) {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const acceptsHtml = request.headers.get("accept") && request.headers.get("accept").indexOf("text/html") >= 0;
  const isNavigation = request.mode === "navigate" || acceptsHtml;
  const isBuildFile = url.pathname.indexOf("/Build/") >= 0 || url.pathname.endsWith(".js") || url.pathname.endsWith(".wasm") || url.pathname.endsWith(".data") || url.pathname.endsWith(".br") || url.pathname.endsWith(".gz");
  if (!isNavigation && !isBuildFile) return;

  event.respondWith(
    fetch(request, { cache: "no-cache" })
      .then(function (response) {
        const copy = response.clone();
        caches.open(ZT_CACHE_NAME).then(function (cache) {
          cache.put(request, copy).catch(function () {});
        }).catch(function () {});
        return response;
      })
      .catch(function () {
        return caches.match(request);
      })
  );
});
