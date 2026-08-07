/**
 * Push Permission Flow diagnostics — COD SÂNGE Phase 1 mobile investigation.
 * Every decision is logged. Every early return has exactly one skip reason.
 */

import {
  detectPushOsPermission,
  isWebPushApiPresent,
  type PushOsPermission,
} from "@/lib/push/push-capability-v1";
import {
  readPushSoftPromptRecord,
  shouldShowPushSoftPermissionPrompt,
  type PushSoftPromptRecord,
} from "@/lib/push/soft-permission-prompt-v1";

export const PUSH_PERMISSION_FLOW_LOG_PREFIX = "[ROVEXO][PUSH_PERMISSION_FLOW]" as const;

export type PushPermissionSkipReason =
  | "auth_route"
  | "document_not_visible"
  | "supabase_client_unavailable"
  | "not_authenticated"
  | "not_secure_context"
  | "unsupported_browser"
  | "permission_granted"
  | "permission_denied"
  | "permission_unsupported"
  | "prompt_already_enabled"
  | "prompt_already_denied"
  | "prompt_cooldown_active"
  | "none";

export type PushPermissionFlowSnapshot = {
  event: string;
  pathname: string;
  notificationPermission: string;
  serviceWorkerSupported: boolean;
  pushManagerSupported: boolean;
  secureContext: boolean;
  pwaDisplayModeStandalone: boolean;
  pwaNavigatorStandalone: boolean;
  browser: string;
  platform: string;
  userAuthenticated: boolean;
  pushCapable: boolean;
  osPermission: PushOsPermission;
  promptRecord: PushSoftPromptRecord | null;
  promptAlreadyShown: boolean;
  promptDismissedLater: boolean;
  promptCooldownActive: boolean;
  existingSubscriptionHint: "unknown" | "none" | "present";
  featureFlag: "none";
  shouldShowPrompt: boolean;
  skipReason: PushPermissionSkipReason;
};

function detectBrowser(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/CriOS/i.test(ua)) return "chrome_ios";
  if (/FxiOS/i.test(ua)) return "firefox_ios";
  if (/EdgiOS/i.test(ua)) return "edge_ios";
  if (/Chrome/i.test(ua) && /Android/i.test(ua)) return "chrome_android";
  if (/SamsungBrowser/i.test(ua)) return "samsung_internet";
  if (/Firefox/i.test(ua)) return "firefox";
  if (/Edg/i.test(ua)) return "edge";
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return "safari";
  if (/Chrome/i.test(ua)) return "chrome";
  return "other";
}

function detectPlatformLabel(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipod/.test(ua)) return "iphone";
  if (/ipad/.test(ua)) return "ipad";
  if (/android/.test(ua)) return "android";
  if (/mac/.test(ua)) return "mac";
  if (/win/.test(ua)) return "windows";
  if (/linux/.test(ua)) return "linux";
  return "other";
}

function isStandalonePwa(): { displayMode: boolean; navigatorStandalone: boolean } {
  if (typeof window === "undefined") {
    return { displayMode: false, navigatorStandalone: false };
  }
  const displayMode =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  const navigatorStandalone = Boolean(
    (window.navigator as Navigator & { standalone?: boolean }).standalone,
  );
  return { displayMode, navigatorStandalone };
}

export function logPushPermissionFlow(
  event: string,
  detail?: Record<string, unknown>,
): void {
  try {
    console.info(PUSH_PERMISSION_FLOW_LOG_PREFIX, event, detail ?? {});
  } catch {
    // ignore
  }
}

export function resolveSoftPromptSkipReason(input: {
  authenticated: boolean;
  pushCapable: boolean;
  osPermission: PushOsPermission;
  record: PushSoftPromptRecord | null;
  nowMs?: number;
  laterCooldownMs?: number;
}): PushPermissionSkipReason {
  if (!input.authenticated) return "not_authenticated";
  if (!input.pushCapable) {
    if (typeof window !== "undefined" && window.isSecureContext !== true) {
      return "not_secure_context";
    }
    return "unsupported_browser";
  }
  if (input.osPermission === "granted") return "permission_granted";
  if (input.osPermission === "denied") return "permission_denied";
  if (input.osPermission === "unsupported") return "permission_unsupported";

  const record = input.record;
  if (record?.outcome === "enabled") return "prompt_already_enabled";
  if (record?.outcome === "denied") return "prompt_already_denied";
  if (record?.outcome === "later") {
    const show = shouldShowPushSoftPermissionPrompt({
      authenticated: true,
      pushCapable: true,
      osPermission: "default",
      record,
      nowMs: input.nowMs,
      laterCooldownMs: input.laterCooldownMs,
    });
    if (!show) return "prompt_cooldown_active";
  }

  return "none";
}

export function buildPushPermissionFlowSnapshot(input: {
  event: string;
  pathname: string;
  authenticated: boolean;
  existingSubscriptionHint?: "unknown" | "none" | "present";
}): PushPermissionFlowSnapshot {
  const standalone = isStandalonePwa();
  const pushCapable = isWebPushApiPresent();
  const osPermission = detectPushOsPermission();
  const record = readPushSoftPromptRecord();
  const skipReason = resolveSoftPromptSkipReason({
    authenticated: input.authenticated,
    pushCapable,
    osPermission,
    record,
  });
  const shouldShowPrompt =
    skipReason === "none" &&
    shouldShowPushSoftPermissionPrompt({
      authenticated: input.authenticated,
      pushCapable,
      osPermission,
      record,
    });

  return {
    event: input.event,
    pathname: input.pathname,
    notificationPermission:
      typeof Notification !== "undefined" ? Notification.permission : "Notification_API_absent",
    serviceWorkerSupported: typeof navigator !== "undefined" && "serviceWorker" in navigator,
    pushManagerSupported: typeof window !== "undefined" && "PushManager" in window,
    secureContext: typeof window !== "undefined" && window.isSecureContext === true,
    pwaDisplayModeStandalone: standalone.displayMode,
    pwaNavigatorStandalone: standalone.navigatorStandalone,
    browser: detectBrowser(),
    platform: detectPlatformLabel(),
    userAuthenticated: input.authenticated,
    pushCapable,
    osPermission,
    promptRecord: record,
    promptAlreadyShown: Boolean(record),
    promptDismissedLater: record?.outcome === "later",
    promptCooldownActive: skipReason === "prompt_cooldown_active",
    existingSubscriptionHint: input.existingSubscriptionHint ?? "unknown",
    featureFlag: "none",
    shouldShowPrompt,
    skipReason: shouldShowPrompt ? "none" : skipReason,
  };
}

export async function probeExistingPushSubscription(): Promise<"none" | "present" | "unknown"> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return "none";
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return "none";
    const subscription = await registration.pushManager.getSubscription();
    return subscription ? "present" : "none";
  } catch {
    return "unknown";
  }
}
