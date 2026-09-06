(() => {
  "use strict";

  const CACHE = "cbg-protect46";
  const PRECACHE = [];

  self.addEventListener("install", (event) => {
    self.skipWaiting();
    event.waitUntil(
      caches.open(CACHE).then((cache) => cache.addAll(PRECACHE).catch(() => {}))
    );
  });

  self.addEventListener("activate", (event) => {
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      ).then(() => self.clients.claim())
    );
  });

  function isDocumentRequest(request, path) {
    if (request.destination === "document") return true;
    if (path.endsWith(".html")) return true;
    if (path.endsWith("/")) return true;
    return false;
  }

  const GOAT_COUNT = "https://velum.goatcounter.com/count";

  function isGoatHit(url) {
    return url.pathname === "/cbg-hit" || url.pathname.endsWith("/cbg-hit");
  }

  async function relayGoatHit(request) {
    const src = new URL(request.url);
    try {
      await fetch(GOAT_COUNT + src.search, {
        method: "GET",
        mode: "no-cors",
        credentials: "omit",
        cache: "no-store",
        keepalive: true,
      });
    } catch (_) {}
    return new Response("", { status: 204, headers: { "Cache-Control": "no-store" } });
  }

  self.addEventListener("fetch", (event) => {
    const request = event.request;
    const url = new URL(request.url);
    if (url.origin === self.location.origin && isGoatHit(url)) {
      event.respondWith(relayGoatHit(request));
      return;
    }
    if (request.method !== "GET") return;
    if (url.origin !== self.location.origin) return;
    if (url.pathname.endsWith("/sw.js")) return;

    if (isDocumentRequest(request, url.pathname)) {
      event.respondWith(
        fetch(request)
          .then((res) => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return res;
          })
          .catch(() => caches.match(request))
      );
      return;
    }

    event.respondWith(
      caches.match(request).then((hit) => {
        if (hit) return hit;
        return fetch(request).then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return res;
        });
      })
    );
  });
})();
