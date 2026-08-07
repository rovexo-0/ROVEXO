/**
 * Web Push capability detection — identical on iPhone / Android / Desktop.
 * Soft Permission Sheet must appear when push is supported and permission is undecided.
 */

export type PushOsPermission = "default" | "granted" | "denied" | "unsupported";

/** True when this browsing context can use the Web Push APIs. */
export function isWebPushApiPresent(
  env: {
    isSecureContext?: boolean;
    hasServiceWorker?: boolean;
    hasPushManager?: boolean;
  } = typeof window !== "undefined"
    ? {
        isSecureContext: window.isSecureContext,
        hasServiceWorker: "serviceWorker" in navigator,
        hasPushManager: "PushManager" in window,
      }
    : {},
): boolean {
  const result =
    env.isSecureContext === true &&
    env.hasServiceWorker === true &&
    env.hasPushManager === true;

  // TEMP P0 Runtime Push Probe — remove after Owner Live Certification
  try {
    console.info("[ROVEXO][PUSH_PROBE] isWebPushApiPresent", {
      isSecureContext:
        typeof window !== "undefined" ? window.isSecureContext : env.isSecureContext,
      serviceWorkerInNavigator:
        typeof navigator !== "undefined"
          ? "serviceWorker" in navigator
          : env.hasServiceWorker,
      pushManagerInWindow:
        typeof window !== "undefined" ? "PushManager" in window : env.hasPushManager,
      typeofNotification: typeof Notification,
      typeofNotificationRequestPermission:
        typeof Notification !== "undefined"
          ? typeof Notification.requestPermission
          : "Notification_ABSENT",
      returnValue: result,
    });
  } catch {
    // ignore
  }

  return result;
}

/**
 * Read OS notification permission without throwing.
 * When Push APIs exist but `Notification` is missing (some WebKit builds),
 * treat as `default` so the Soft Sheet can still run the Enable gesture path.
 */
export function detectPushOsPermission(
  env: {
    pushCapable?: boolean;
    notificationPermission?: NotificationPermission | null;
    hasNotification?: boolean;
  } = typeof window !== "undefined"
    ? {
        pushCapable: isWebPushApiPresent(),
        hasNotification: "Notification" in window,
        notificationPermission:
          "Notification" in window ? Notification.permission : null,
      }
    : { pushCapable: false, hasNotification: false, notificationPermission: null },
): PushOsPermission {
  if (!env.pushCapable) return "unsupported";

  if (!env.hasNotification) {
    return "default";
  }

  const permission = env.notificationPermission;
  if (permission === "default" || permission === "granted" || permission === "denied") {
    return permission;
  }
  return "unsupported";
}

/**
 * Resolve an existing SW registration without awaiting `ready` forever.
 * `navigator.serviceWorker.ready` never resolves when no worker is registered —
 * that hung the Soft Permission Sheet behind background unsubscribe on mobile.
 */
export async function getServiceWorkerRegistrationIfPresent(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration ?? null;
  } catch {
    return null;
  }
}

/** Wait for SW ready with a hard timeout — never block UI indefinitely. */
export async function waitForServiceWorkerReady(
  timeoutMs = 8_000,
): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  const existing = await getServiceWorkerRegistrationIfPresent();
  if (existing?.active) return existing;

  try {
    const ready = navigator.serviceWorker.ready;
    const timedOut = new Promise<null>((resolve) => {
      window.setTimeout(() => resolve(null), timeoutMs);
    });
    return await Promise.race([ready, timedOut]);
  } catch {
    return null;
  }
}
