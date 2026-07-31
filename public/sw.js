/** Aligned with lib/app/version.ts → ROVEXO_SW_CACHE_NAME (RC1). */
const CACHE_NAME = "rovexo-static-v15";
const OFFLINE_URL = "/offline";

const PRECACHE_URLS = ["/", OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"];

/** Localhost / private LAN — never control the page (dev CSS/JS hashes change constantly). */
function isLocalDevelopmentHost(hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".local") ||
    /^192\.168\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
}

/** Blood XXIV — never mask checkout/financial navigations as /offline. */
function isFinancialNavigationPath(pathname) {
  return (
    pathname === "/checkout" ||
    pathname.startsWith("/checkout/") ||
    pathname.startsWith("/api/checkout") ||
    pathname.startsWith("/api/orders/checkout") ||
    pathname.startsWith("/api/orders/")
  );
}

/**
 * Blood XXIV Task 002 — Next.js App Router RSC / flight requests.
 * Must NEVER be intercepted or cache-matched by the SW.
 * Intercepting them returns document HTML (or fails fetch) →
 * "Failed to fetch RSC payload" → soft-nav fallback → retry storm.
 */
function isNextAppRouterFlightRequest(request, pathname) {
  if (pathname.startsWith("/_next/")) return true;
  if (request.headers.get("RSC") === "1") return true;
  if (request.headers.get("Next-Router-State-Tree") != null) return true;
  if (request.headers.get("Next-Router-Prefetch") != null) return true;
  if (request.headers.get("Next-Url") != null) return true;
  return false;
}

/**
 * Offline financial navigate — Absolute Error Classification Law v1.0.
 * Must never use canonical RVX-2010 (payment session failed ONLY).
 * Must never be the generic /offline page.
 * Uses non-canonical RVX-2099 until Owner assigns a dedicated offline code.
 */
function financialCheckoutUnavailableResponse(retryPath) {
  const safePath = typeof retryPath === "string" && retryPath.startsWith("/") ? retryPath : "/";
  const html = `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>RVX-2099</title>
  <style>
    body{font-family:system-ui,-apple-system,sans-serif;margin:0;padding:24px;color:#111}
    h1{font-size:18px;margin:0 0 8px}
    p{font-size:14px;margin:0 0 8px;color:#444}
    a{display:inline-block;margin-top:16px;margin-right:12px;min-height:44px;line-height:44px;color:#7c3aed;font-weight:600;text-decoration:none}
  </style>
</head>
<body data-blood-code-xxiv="1.0" data-rvx-error="RVX-2099">
  <h1>RVX-2099</h1>
  <p>Checkout unavailable.</p>
  <a href="${safePath}">Retry</a>
  <a href="/">Home</a>
</body>
</html>`;
  return new Response(html, {
    status: 503,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function precacheUrls(cache) {
  await Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      // If this SW was registered on localhost by an older build, exit immediately
      // so it cannot serve stale document shells against a fresh Turbopack CSS graph.
      if (isLocalDevelopmentHost(self.location.hostname)) {
        await self.skipWaiting();
        return;
      }
      const cache = await caches.open(CACHE_NAME);
      await precacheUrls(cache);
      await self.skipWaiting();
    })(),
  );
});

// Localhost self-heal: older SW builds may still be controlling until activate runs.
// Drop control immediately so Turbopack CSS/JS hashes are never served from cache.
if (isLocalDevelopmentHost(self.location.hostname)) {
  self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "ROVEXO_DEV_UNREGISTER") {
      event.waitUntil(self.registration.unregister());
    }
  });
}

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));

      if (isLocalDevelopmentHost(self.location.hostname)) {
        await Promise.all(keys.map((key) => caches.delete(key)));
        await self.registration.unregister();
        const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        for (const client of clients) {
          try {
            client.postMessage({ type: "ROVEXO_DEV_SW_CLEARED" });
          } catch {
            /* ignore */
          }
        }
        return;
      }

      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept on local development hosts — pass through to the network.
  if (isLocalDevelopmentHost(url.hostname)) return;

  // Pass through App Router RSC / flight / _next — do not respondWith.
  if (isNextAppRouterFlightRequest(request, url.pathname)) return;

  if (request.mode === "navigate") {
    const financial = isFinancialNavigationPath(url.pathname);

    event.respondWith(
      fetch(request)
        .then((response) => {
          // Never cache financial checkout navigations into the SW offline shell.
          if (!financial && response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          if (financial) {
            // Blood XXIV OFFLINE ROOT CAUSE FIX:
            // BUY NOW → ORDER → SESSION → LOAD /checkout must NEVER land on /offline.
            return financialCheckoutUnavailableResponse(url.pathname + url.search);
          }
          const cached = await caches.match(request);
          return cached || caches.match(OFFLINE_URL);
        }),
    );
    return;
  }

  // Static icons and category renders are mutable assets that ship without
  // content hashes. Use stale-while-revalidate so a replaced asset self-heals
  // on the next load instead of being pinned forever by a cache-first strategy.
  if (url.pathname.startsWith("/icons/") || url.pathname.startsWith("/categories/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);

        if (cached) {
          event.waitUntil(network);
          return cached;
        }
        return network;
      }),
    );
    return;
  }

  // Financial APIs: network only — never cache-first offline masquerade.
  if (isFinancialNavigationPath(url.pathname)) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
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
