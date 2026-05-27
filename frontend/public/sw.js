const CACHE = "life-os-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE));
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((response) => {
        if (response.ok && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
      return cached || fetchPromise;
    })
  );
});
