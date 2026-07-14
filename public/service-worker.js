const CACHE_NAME = "cap-4000-vtc-v5";
const BASE_PATH = self.location.pathname.replace(/service-worker\.js$/, "");
const INDEX_PATH = `${BASE_PATH}index.html`;
const MANIFEST_PATH = `${BASE_PATH}manifest.json`;
const ICON_PATH = `${BASE_PATH}icon.svg`;
const APPLE_ICON_PATH = `${BASE_PATH}apple-touch-icon.svg`;
const APP_SHELL = [BASE_PATH, INDEX_PATH, MANIFEST_PATH, ICON_PATH, APPLE_ICON_PATH];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch(async () => {
          const cachedPage =
            (await caches.match(event.request)) ||
            (await caches.match(BASE_PATH)) ||
            (await caches.match(INDEX_PATH));
          return cachedPage || Response.error();
        }),
    );
    return;
  }

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return response;
      });
    }),
  );
});
