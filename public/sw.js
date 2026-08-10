/** Aligned with lib/app/version.ts → ROVEXO_SW_CACHE_NAME (RC1 · White Pearl). */
const CACHE_NAME = "rovexo-static-v16";
const OFFLINE_URL = "/offline";

const PRECACHE_URLS = [
  "/",
  OFFLINE_URL,
  "/icons/icon-192.png?v=wp-20260805",
  "/icons/icon-512.png?v=wp-20260805",
  "/icons/android-chrome-192x192.png?v=wp-20260805",
  "/icons/android-chrome-512x512.png?v=wp-20260805",
];

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
  // TEMP P0 Apple Web Push device probe — remove after Owner Lock Screen certification
  try {
    console.log("[SW_INSTALL]");
  } catch (_) {
    /* ignore */
  }
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
  // TEMP P0 Apple Web Push device probe — remove after Owner Lock Screen certification
  try {
    console.log("[SW_ACTIVATE]");
  } catch (_) {
    /* ignore */
  }
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
  // TEMP P0 Apple Web Push device certification v2 — pushTraceId correlation
  // PushMessageData may be read only once — capture text then parse.
  event.waitUntil(
    (async () => {
      let parsedPayload = undefined;
      try {
        if (event.data) {
          const rawText = event.data.text();
          try {
            parsedPayload = rawText ? JSON.parse(rawText) : undefined;
          } catch {
            parsedPayload = undefined;
          }
        }
      } catch (_) {
        /* ignore */
      }

      const payload = parsedPayload;
      const data = payload && payload.data && typeof payload.data === "object" ? payload.data : {};
      const pushTraceId =
        (payload && payload.pushTraceId) ||
        (data && data.pushTraceId) ||
        null;
      const notificationId =
        (data && data.notificationId) ||
        (payload && payload.notificationId) ||
        null;
      const offerId = (data && data.offerId) || (payload && payload.offerId) || null;
      const conversationId =
        (data && data.conversationId) || (payload && payload.conversationId) || null;
      const title = payload && payload.title ? payload.title : "ROVEXO";
      const tag = (payload && (payload.tag || payload.notificationId)) || "rovexo-default";
      const href =
        (data && data.href) ||
        (payload && payload.href) ||
        "/inbox?tab=notifications";
      const destination =
        (data && data.destination) ||
        (payload && payload.destination) ||
        null;
      const type =
        (data && data.type) ||
        (payload && payload.type) ||
        (payload && payload.eventType) ||
        null;

      function isAllowedNotificationHref(candidate) {
        if (!candidate || typeof candidate !== "string") return false;
        var raw = candidate.trim();
        if (!raw) return false;
        if (/^(javascript|data|vbscript|file):/i.test(raw)) return false;
        if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw) && raw.charAt(0) !== "/") return false;
        if (raw.charAt(0) !== "/" || raw.indexOf("//") === 0) return false;
        var path = raw.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
        if (path === "/") return true;
        var allowed = [
          "/inbox",
          "/orders",
          "/wallet",
          "/balance",
          "/account/wallet",
          "/account/reviews",
          "/account/settings",
          "/account/addresses",
          "/saved",
          "/listing/",
          "/store/",
          "/user/",
          "/search",
          "/sell",
          "/checkout",
        ];
        for (var i = 0; i < allowed.length; i++) {
          var prefix = allowed[i];
          if (path === prefix.replace(/\/+$/, "") || path.indexOf(prefix) === 0) return true;
        }
        return false;
      }

      var safeHref = isAllowedNotificationHref(href) ? href : "/inbox?tab=notifications";
      if (safeHref === "/" || safeHref === "") {
        safeHref = "/inbox?tab=notifications";
      }

      try {
        console.log("[SW_PUSH_RECEIVED]", {
          pushTraceId,
          notificationId,
          offerId,
          conversationId,
          payload,
        });
      } catch (_) {
        /* ignore */
      }

      // Apple diagnostic minimal: title/body/tag/data only. Chromium keeps absolute icon/badge.
      const appleMinimal = Boolean(payload && payload.appleMinimal === true);
      const absoluteIcon = "https://www.rovexo.co.uk/icons/icon-192.png";
      const absoluteBadge = "https://www.rovexo.co.uk/icons/icon-192.png";

      const options = appleMinimal
        ? {
            body: payload && payload.body ? payload.body : "",
            tag,
            data: {
              href: safeHref,
              notificationId,
              pushTraceId,
              offerId,
              conversationId,
              type,
              destination,
              ...data,
              href: safeHref,
            },
          }
        : {
            body: payload && payload.body ? payload.body : "",
            data: {
              href: safeHref,
              notificationId,
              pushTraceId,
              offerId,
              conversationId,
              type,
              destination,
            },
            icon: absoluteIcon,
            badge: absoluteBadge,
            tag,
            renotify: true,
            silent: Boolean(payload && payload.silent),
            vibrate:
              (payload && payload.silent) || (payload && payload.vibration === false)
                ? undefined
                : [120, 60, 120],
          };

      try {
        console.log("[SW_SHOW_NOTIFICATION]", { pushTraceId, options });
      } catch (_) {
        /* ignore */
      }
      await self.registration.showNotification(title, options);
      try {
        console.log("[SW_SHOW_NOTIFICATION_DONE]", {
          pushTraceId,
          notificationId,
          notification: {
            tag,
            title,
            body: options.body,
            data: options.data,
          },
        });
      } catch (_) {
        /* ignore */
      }
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clients) {
        client.postMessage({ type: "notification-sync", notificationId, pushTraceId });
      }
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  // TEMP P0 Apple Web Push device certification v2
  const data = event.notification.data || {};
  try {
    console.log("[SW_NOTIFICATION_CLICK]", {
      pushTraceId: data.pushTraceId || null,
      notificationId: data.notificationId || null,
    });
  } catch (_) {
    /* ignore */
  }
  event.notification.close();

  function isAllowedNotificationHref(candidate) {
    if (!candidate || typeof candidate !== "string") return false;
    var raw = candidate.trim();
    if (!raw) return false;
    if (/^(javascript|data|vbscript|file):/i.test(raw)) return false;
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw) && raw.charAt(0) !== "/") return false;
    if (raw.charAt(0) !== "/" || raw.indexOf("//") === 0) return false;
    var path = raw.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
    if (path === "/") return true;
    var allowed = [
      "/inbox",
      "/orders",
      "/wallet",
      "/balance",
      "/account/wallet",
      "/account/reviews",
      "/account/settings",
      "/account/addresses",
      "/saved",
      "/listing/",
      "/store/",
      "/user/",
      "/search",
      "/sell",
      "/checkout",
    ];
    for (var i = 0; i < allowed.length; i++) {
      var prefix = allowed[i];
      if (path === prefix.replace(/\/+$/, "") || path.indexOf(prefix) === 0) return true;
    }
    return false;
  }

  let href = typeof data.href === "string" && data.href ? data.href : "/inbox?tab=notifications";
  if (!isAllowedNotificationHref(href) || href === "/" || href === "") {
    href = "/inbox?tab=notifications";
  }
  // iOS Home Screen / PWA: openWindow + navigate need absolute same-origin URLs.
  let absoluteHref = href;
  try {
    absoluteHref = new URL(href, self.location.origin).href;
  } catch (_) {
    absoluteHref = self.location.origin + (href.charAt(0) === "/" ? href : "/" + href);
  }
  const notificationId = data.notificationId || null;
  const destination = data.destination || null;
  const type = data.type || null;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.postMessage({
            type: "notification-open",
            href,
            notificationId,
            destination,
            type,
          });
          return client.focus().then(() => {
            if ("navigate" in client && typeof client.navigate === "function") {
              return client.navigate(absoluteHref);
            }
            return undefined;
          });
        }
      }
      return self.clients.openWindow(absoluteHref);
    }),
  );
});

self.addEventListener("notificationclose", (event) => {
  const data = event.notification.data || {};
  const notificationId = data.notificationId || null;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        client.postMessage({ type: "notification-close", notificationId });
      }
    }),
  );
});
