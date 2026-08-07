"use client";

import {
  detectPushOsPermission,
  isWebPushApiPresent,
  waitForServiceWorkerReady,
} from "@/lib/push/push-capability-v1";

export type SubscribeToBrowserPushOptions = {
  /**
   * When true, may call Notification.requestPermission().
   * Must only be set from a user gesture (toggle / button).
   * iOS WebKit never shows the permission dialog without a gesture.
   */
  allowPrompt?: boolean;
};

export type PushOsPermission = "default" | "granted" | "denied" | "unsupported";

/** Pure gate — used by subscribe + unit tests. */
export function resolvePushPermissionAction(
  permission: PushOsPermission,
  allowPrompt: boolean,
): "request" | "subscribe" | "abort" {
  if (permission === "unsupported" || permission === "denied") return "abort";
  if (permission === "granted") return "subscribe";
  return allowPrompt ? "request" : "abort";
}

function detectPlatform(): "web" | "android" | "ios" {
  if (typeof navigator === "undefined") return "web";
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "web";
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) {
    output[index] = raw.charCodeAt(index);
  }
  return output;
}

export async function getVapidPublicKey(): Promise<string | null> {
  const response = await fetch("/api/push/vapid-public-key", { cache: "no-store" });
  if (!response.ok) return null;
  const payload = (await response.json()) as { publicKey?: string };
  return payload.publicKey ?? null;
}

export async function subscribeToBrowserPush(
  options: SubscribeToBrowserPushOptions = {},
): Promise<boolean> {
  const allowPrompt = options.allowPrompt === true;

  // TEMP P0 Runtime Push Probe — remove after Owner Live Certification
  try {
    console.info("[ROVEXO][PUSH_PROBE] subscribeToBrowserPush:start", {
      allowPrompt,
    });
  } catch {
    // ignore
  }

  if (typeof window === "undefined" || !isWebPushApiPresent()) {
    try {
      console.info("[ROVEXO][PUSH_PROBE] subscribeToBrowserPush:abort", {
        reason: "window_undefined_or_not_push_capable",
        reachedRequestPermission: false,
      });
    } catch {
      // ignore
    }
    return false;
  }

  const osPermission = detectPushOsPermission();
  const action = resolvePushPermissionAction(osPermission, allowPrompt);

  if (action === "abort") {
    try {
      console.info("[ROVEXO][PUSH_PROBE] subscribeToBrowserPush:abort", {
        reason: "permission_action_abort",
        osPermission,
        allowPrompt,
        reachedRequestPermission: false,
      });
    } catch {
      // ignore
    }
    return false;
  }

  let permission: NotificationPermission =
    "Notification" in window && typeof Notification.permission === "string"
      ? Notification.permission
      : "denied";

  if (action === "request") {
    if (!("Notification" in window) || typeof Notification.requestPermission !== "function") {
      try {
        console.info("[ROVEXO][PUSH_PROBE] subscribeToBrowserPush:abort", {
          reason: "notification_api_missing",
          reachedRequestPermission: false,
        });
      } catch {
        // ignore
      }
      return false;
    }
    try {
      console.info("[ROVEXO][PUSH_PROBE] subscribeToBrowserPush:reachedRequestPermission", {
        reachedRequestPermission: true,
      });
    } catch {
      // ignore
    }
    permission = await Notification.requestPermission();
  } else {
    try {
      console.info("[ROVEXO][PUSH_PROBE] subscribeToBrowserPush:skipRequestPermission", {
        reason: "action_subscribe_already_granted",
        action,
        reachedRequestPermission: false,
      });
    } catch {
      // ignore
    }
  }

  if (permission !== "granted") {
    return false;
  }

  const publicKey = await getVapidPublicKey();
  if (!publicKey) {
    return false;
  }

  const registration = await waitForServiceWorkerReady(10_000);
  if (!registration) {
    return false;
  }

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });
  }

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return false;
  }

  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      platform: detectPlatform(),
    }),
  });

  return response.ok;
}

export async function unsubscribeFromBrowserPush(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  // Never await `ready` forever — that blocked Soft Permission on mobile when no SW exists.
  const registration = await waitForServiceWorkerReady(3_000);
  if (!registration) return;

  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });
}
