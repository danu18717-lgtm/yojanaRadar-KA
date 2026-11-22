const CACHE_VERSION = "yr-v2";
const CACHE = "yojanaradar-" + CACHE_VERSION;
const PRECACHE = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.indexOf("yojanaradar-") === 0 && name !== CACHE)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const networkFirst =
    request.destination === "document" ||
    request.mode === "navigate" ||
    url.pathname === "/" ||
    /\.(html|css|js)$/.test(url.pathname);

  if (networkFirst) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch((err) =>
          caches.match(request).then((hit) =>
            hit ||
            (request.mode === "navigate"
              ? caches.match("/index.html")
              : Promise.reject(err))
          )
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((hit) =>
      hit ||
      fetch(request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch((err) => {
          if (request.mode === "navigate") return caches.match("/index.html");
          throw err;
        })
    )
  );
});
