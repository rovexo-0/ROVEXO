const CACHE_NAME = "rovexo-static-v5";
const OFFLINE_URL = "/offline";

const PRECACHE_URLS = ["/", OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"];

async function precacheUrls(cache) {
  await Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await precacheUrls(cache);
      await self.skipWaiting();
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && url.pathname.startsWith("/icons/")) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});

function parsePushPayload(event) {
  if (!event.data) return undefined;
  try {
    return event.data.json();
  } catch {
    try {
      const text = event.data.text();
      return text ? JSON.parse(text) : undefined;
    } catch {
      return undefined;
    }
  }
}

self.addEventListener("push", (event) => {
  const payload = parsePushPayload(event);
  const title = payload && payload.title ? payload.title : "ROVEXO";
  const silent = Boolean(payload && payload.silent);
  const tag = (payload && (payload.tag || payload.notificationId)) || "rovexo-default";
  const href = payload && payload.href ? payload.href : "/";
  const notificationId = payload && payload.notificationId ? payload.notificationId : null;

  const options = {
    body: payload && payload.body ? payload.body : "",
    data: { href, notificationId },
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag,
    renotify: true,
    silent,
    vibrate: payload && payload.vibration === false ? undefined : [120, 60, 120],
  };

  if (silent) {
    event.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: "notification-sync", notificationId });
        }
      }),
    );
    return;
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const href = typeof data.href === "string" && data.href ? data.href : "/";
  event.waitUntil(self.clients.openWindow(href));
});
