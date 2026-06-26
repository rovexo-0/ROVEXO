const CACHE_NAME = "rovexo-static-v3";
const OFFLINE_URL = "/offline";

const PRECACHE_URLS = ["/", OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ).then(() => self.clients.claim()),
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
          // Never cache redirects — stale 30x responses caused intermittent homepage failures.
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached ?? caches.match(OFFLINE_URL)),
        ),
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

self.addEventListener("push", (event) => {
  const payload = event.data?.json() as
    | {
        title?: string;
        body?: string;
        href?: string;
        tag?: string;
        silent?: boolean;
        priority?: string;
        sound?: boolean;
        vibration?: boolean;
        notificationId?: string;
      }
    | undefined;

  const title = payload?.title ?? "ROVEXO";
  const silent = payload?.silent ?? false;
  const tag = payload?.tag ?? payload?.notificationId ?? "rovexo-default";

  const options = {
    body: payload?.body ?? "",
    data: { href: payload?.href ?? "/", notificationId: payload?.notificationId ?? null },
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag,
    renotify: true,
    silent,
    vibrate: payload?.vibration === false ? undefined : [120, 60, 120],
  };

  if (silent) {
    event.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: "notification-sync", notificationId: payload?.notificationId });
        }
      }),
    );
    return;
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = (event.notification.data?.href as string | undefined) ?? "/";
  event.waitUntil(clients.openWindow(href));
});
