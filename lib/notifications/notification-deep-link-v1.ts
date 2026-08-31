/**
 * Notification deep-link layer — extends Cluster 8 Notifications SSOT.
 * NOT a second Notification Engine. Persisted wire format remains `href`.
 * Destination is a typed view of the same allowlisted path.
 */

import {
  recoverNotificationHref,
  type RecoverNotificationHrefContext,
} from "@/lib/notifications/routing";
import {
  PUSH_NOTIFICATION_FALLBACK_HREF,
  resolvePushNotificationHref,
} from "@/lib/push/resolve-push-notification-href-v1";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";

export const NOTIFICATION_DEEP_LINK_VERSION = "v1.0" as const;

/** sessionStorage key — cold start / slow hydration pending nav (PWA). */
export const PENDING_NOTIFICATION_DEEP_LINK_KEY = "rovexo:pending-notification-deep-link" as const;

export type NotificationDeepLinkParams = Record<string, string>;

export type NotificationDeepLinkDestination = {
  route: string;
  params?: NotificationDeepLinkParams;
};

export type NotificationDeepLinkData = {
  notificationId: string | null;
  type: string | null;
  href: string;
  destination: NotificationDeepLinkDestination;
};

/** Allowlisted path prefixes — fail closed for anything else. */
const ALLOWED_PREFIXES = [
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
] as const;

const BLOCKED_SCHEMES = /^(javascript|data|vbscript|file):/i;

function pathOnly(href: string): string {
  const raw = (href ?? "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw, "https://rovexo.local");
    return url.pathname.replace(/\/+$/, "") || "/";
  } catch {
    return raw.split("?")[0]?.split("#")[0]?.replace(/\/+$/, "") || "/";
  }
}

function readParams(href: string): NotificationDeepLinkParams {
  const out: NotificationDeepLinkParams = {};
  try {
    const url = new URL(href, "https://rovexo.local");
    url.searchParams.forEach((value, key) => {
      if (value) out[key] = value;
    });
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "inbox" && parts[1] === "conversation" && parts[2]) {
      out.conversationId = parts[2];
    }
    if (parts[0] === "orders" && parts[1] && parts[1] !== "tracking") {
      out.orderId = parts[1];
    }
    if (parts[0] === "store" && parts[1]) {
      out.username = parts[1];
    }
    if (parts[0] === "user" && parts[1]) {
      out.username = parts[1];
    }
    if (parts[0] === "wallet" && parts[1] === "transactions" && parts[2]) {
      out.transactionId = parts[2];
    }
  } catch {
    /* ignore */
  }
  return out;
}

/**
 * Fail-closed allowlist. Rejects absolute external URLs and dangerous schemes.
 */
export function isAllowedNotificationDeepLinkHref(href: string | null | undefined): boolean {
  const raw = (href ?? "").trim();
  if (!raw) return false;
  if (BLOCKED_SCHEMES.test(raw)) return false;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw) && !raw.startsWith("/")) return false;
  if (!raw.startsWith("/") || raw.startsWith("//")) return false;
  if (raw.includes("\\") || raw.includes("\0")) return false;

  const path = pathOnly(raw);
  if (path === "/") return true;
  return ALLOWED_PREFIXES.some(
    (prefix) => path === prefix.replace(/\/+$/, "") || path.startsWith(prefix),
  );
}

export function parseNotificationDeepLinkDestination(
  href: string | null | undefined,
): NotificationDeepLinkDestination {
  const safe = resolveNotificationDeepLinkHref(href);
  const route = pathOnly(safe);
  const params = readParams(safe);
  return Object.keys(params).length > 0 ? { route, params } : { route };
}

export function serializeNotificationDeepLinkHref(
  destination: NotificationDeepLinkDestination,
): string {
  const route = (destination.route ?? "").trim() || "/inbox";
  const params = destination.params ?? {};
  const qs = new URLSearchParams();

  let path = route;
  if (route.includes("[conversationId]") && params.conversationId) {
    path = `/inbox/conversation/${params.conversationId}`;
  } else if (route.includes("[orderId]") && params.orderId) {
    path = `/orders/${params.orderId}`;
  } else if (route.includes("[username]") && params.username) {
    path = route.startsWith("/store")
      ? `/store/${params.username}`
      : `/user/${params.username}`;
  } else if (route === "/account/wallet" || route === "/account/wallet/") {
    path = WALLET_ROUTES.hub;
  } else if (route === "/account/wallet/withdraw") {
    path = WALLET_ROUTES.withdraw;
  }

  for (const [key, value] of Object.entries(params)) {
    if (
      key === "conversationId" ||
      key === "orderId" ||
      key === "username" ||
      key === "transactionId"
    ) {
      continue;
    }
    if (value) qs.set(key, value);
  }

  const query = qs.toString();
  const href = query ? `${path}?${query}` : path;
  if (!isAllowedNotificationDeepLinkHref(href)) {
    return PUSH_NOTIFICATION_FALLBACK_HREF;
  }
  return href;
}

/**
 * Recover + allowlist + push fallback. Single open-path gate for push + Inbox.
 */
export function resolveNotificationDeepLinkHref(
  href: string | null | undefined,
  context?: RecoverNotificationHrefContext,
): string {
  const recovered = recoverNotificationHref((href ?? "").trim() || PUSH_NOTIFICATION_FALLBACK_HREF, context);
  const pushed = resolvePushNotificationHref(recovered, context);
  if (!isAllowedNotificationDeepLinkHref(pushed)) {
    return PUSH_NOTIFICATION_FALLBACK_HREF;
  }
  return pushed;
}

export function fallbackNotificationDeepLinkHref(kind?: string | null): string {
  const type = (kind ?? "").toLowerCase();
  if (type.includes("wallet") || type.includes("payout") || type.includes("withdraw")) {
    return WALLET_ROUTES.hub;
  }
  if (type.includes("order")) return "/orders";
  if (type.includes("store") || type.includes("follow") || type.includes("review")) {
    return "/";
  }
  return PUSH_NOTIFICATION_FALLBACK_HREF;
}

export function buildNotificationDeepLinkData(input: {
  href?: string | null;
  notificationId?: string | null;
  type?: string | null;
  title?: string;
  body?: string;
}): NotificationDeepLinkData {
  const href = resolveNotificationDeepLinkHref(input.href, {
    title: input.title,
    subtitle: input.body,
    type: input.type ?? undefined,
  });
  return {
    notificationId: input.notificationId ?? null,
    type: input.type ?? null,
    href,
    destination: parseNotificationDeepLinkDestination(href),
  };
}

export function stashPendingNotificationDeepLink(href: string): void {
  if (typeof window === "undefined") return;
  const safe = resolveNotificationDeepLinkHref(href);
  try {
    window.sessionStorage.setItem(PENDING_NOTIFICATION_DEEP_LINK_KEY, safe);
  } catch {
    /* ignore quota / private mode */
  }
}

export function consumePendingNotificationDeepLink(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_NOTIFICATION_DEEP_LINK_KEY);
    window.sessionStorage.removeItem(PENDING_NOTIFICATION_DEEP_LINK_KEY);
    if (!raw) return null;
    return resolveNotificationDeepLinkHref(raw);
  } catch {
    return null;
  }
}

/**
 * Canonical click handler — push + Notification Center.
 * Navigation starts immediately; mark-as-read is best-effort in parallel.
 * Deep-link href must already be resolved by the caller before invoke.
 */
export async function handleNotificationDeepLinkClick(input: {
  href: string;
  notificationId?: string | null;
  type?: string | null;
  markAsRead?: boolean;
  navigate: (href: string) => void;
}): Promise<string> {
  const target = resolveNotificationDeepLinkHref(input.href, { type: input.type ?? undefined });
  stashPendingNotificationDeepLink(target);

  /* Navigate first — do not wait on mark-read (unread optimistic update is caller-owned). */
  input.navigate(target);

  if (input.markAsRead && input.notificationId) {
    void fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [input.notificationId], read: true }),
    }).catch(() => {
      /* keep notification; navigation already proceeded */
    });
  }

  return target;
}
