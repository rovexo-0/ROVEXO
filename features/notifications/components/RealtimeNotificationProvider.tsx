"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { subscribeToUserNotifications, removeNotificationChannel } from "@/lib/notifications/realtime";
import {
  subscribeToUserConversationUnread,
  removeConversationUnreadChannels,
} from "@/lib/inbox/conversation-unread-realtime";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { flushOfflineNotificationQueue } from "@/lib/notifications/offline-sync";
import { createClient } from "@/lib/supabase/client";
import { fetchDeduped } from "@/lib/performance/fetch";
import { isDocumentVisible } from "@/lib/performance/visibility";
import type { Notification } from "@/lib/notifications/types";
import type { DashboardBadgeCounts } from "@/lib/notifications/badge-counts";
import type { MobileBadges } from "@/lib/mobile-ui/types";
import { triggerCheckoutSessionSelfHeal } from "@/lib/checkout/checkout-session-self-heal-client-v1";
import { useAuth } from "@/features/auth/providers/AuthProvider";
import { resolveAuthProviderSessionPhase } from "@/lib/auth/auth-provider-session-phase-v1";
import {
  clearInboxBadgeModuleCache,
  peekInboxBadgeModuleCache,
  readInboxBadgeInflight,
  setInboxBadgeInflight,
  writeInboxBadgeModuleCache,
} from "@/lib/notifications/inbox-badge-client-cache-v1";
import { clearPrivateClientSessionCachesOnLogout, preparePrivateClientSessionCachesForAuthHydrate } from "@/lib/auth/private-client-session-cache-v1";

type RealtimeNotificationContextValue = {
  unreadCount: number;
  notifications: Notification[];
  badgeCounts: DashboardBadgeCounts | null;
  mobileBadges: MobileBadges;
  refresh: (opts?: { includeTray?: boolean }) => Promise<void>;
  setNotifications: (notifications: Notification[]) => void;
};

const EMPTY_BADGES: MobileBadges = {
  messages: 0,
  notifications: 0,
  orders: 0,
  saved: 0,
  cart: 0,
  "wallet-payout": 0,
};

const RealtimeNotificationContext = createContext<RealtimeNotificationContextValue | null>(null);

type RealtimeNotificationProviderProps = {
  children: ReactNode;
  initialUnreadCount?: number;
  initialNotifications?: Notification[];
  enabled?: boolean;
};

/** Coalesce badge-only fetches — never abort mid-flight (DEFECT #007). */
function fetchInboxBadgeCounts(signal?: AbortSignal): Promise<{
  messages: number;
  notifications: number;
  ok: boolean;
}> {
  const cached = peekInboxBadgeModuleCache();
  if (cached) return Promise.resolve(cached);
  const existing = readInboxBadgeInflight();
  if (existing) return existing;
  const inflight = (async () => {
    const res = await fetch("/api/inbox/badge", { cache: "no-store", signal });
    if (!res.ok) return { messages: 0, notifications: 0, ok: false };
    const payload = (await res.json()) as {
      messages?: number;
      notifications?: number;
    };
    const value = {
      messages: Math.max(0, Number(payload.messages) || 0),
      notifications: Math.max(0, Number(payload.notifications) || 0),
      ok: true,
    };
    writeInboxBadgeModuleCache(value);
    return value;
  })().finally(() => {
    setInboxBadgeInflight(null);
  });
  setInboxBadgeInflight(inflight);
  return inflight;
}

async function fetchBadgeState(
  signal?: AbortSignal,
  options?: { includeTray?: boolean },
): Promise<{
  unreadCount: number;
  notifications: Notification[];
  badgeCounts: DashboardBadgeCounts | null;
  mobileBadges: MobileBadges;
}> {
  if (!isDocumentVisible()) {
    throw new DOMException("Document hidden", "AbortError");
  }

  const requestInit = { cache: "no-store" as const, signal };
  const includeTray = options?.includeTray === true;

  // DEFECT #004/#007 — bottom-nav uses one lightweight endpoint only.
  // Full notification tray / dashboard badge breakdown loads only when requested.
  const badgeFast = await fetchInboxBadgeCounts(signal);

  let unreadCount = badgeFast.ok ? badgeFast.notifications : 0;
  const messages = badgeFast.ok ? badgeFast.messages : 0;
  let notifications: Notification[] = [];
  let badgeCounts: DashboardBadgeCounts | null = null;

  if (includeTray) {
    const [listRes, badgeRes] = await Promise.all([
      fetchDeduped("/api/notifications", { ...requestInit, dedupeKey: "badge:notifications-list" }),
      fetchDeduped("/api/notifications/badge-counts", {
        ...requestInit,
        dedupeKey: "badge:badge-counts",
      }),
    ]);

    if (badgeRes.ok) {
      const payload = (await badgeRes.json()) as { counts: DashboardBadgeCounts };
      badgeCounts = payload.counts;
    }

    if (listRes.ok) {
      const payload = (await listRes.json()) as { notifications: Notification[] };
      notifications = payload.notifications;
      if (!badgeFast.ok) {
        unreadCount = payload.notifications.filter(
          (item) => !item.read && item.type !== "message",
        ).length;
      }
    }
  }

  return {
    unreadCount,
    notifications,
    badgeCounts,
    mobileBadges: {
      messages,
      notifications: unreadCount,
      cart: 0,
      saved: 0,
      orders: 0,
      "wallet-payout": 0,
    },
  };
}

export function RealtimeNotificationProvider({
  children,
  initialUnreadCount = 0,
  initialNotifications = [],
  enabled = true,
}: RealtimeNotificationProviderProps) {
  const router = useRouter();
  const auth = useAuth();
  const sessionPhase = resolveAuthProviderSessionPhase(auth);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [badgeCounts, setBadgeCounts] = useState<DashboardBadgeCounts | null>(null);
  const [mobileBadges, setMobileBadges] = useState<MobileBadges>({
    ...EMPTY_BADGES,
    notifications: initialUnreadCount,
  });

  const resetBadgeUiToGuest = useCallback(() => {
    clearInboxBadgeModuleCache();
    setUnreadCount(0);
    setNotifications([]);
    setBadgeCounts(null);
    setMobileBadges(EMPTY_BADGES);
  }, []);

  const applyState = useCallback(
    (state: Awaited<ReturnType<typeof fetchBadgeState>>, includeTray: boolean) => {
      // Bail when badge payloads are identical — refresh/poll must not force
      // a new context value (and full consumer tree render) on no-op syncs.
      setUnreadCount((prev) => (prev === state.unreadCount ? prev : state.unreadCount));
      setMobileBadges((prev) => {
        const next = state.mobileBadges;
        if (
          prev.messages === next.messages &&
          prev.notifications === next.notifications &&
          prev.orders === next.orders &&
          prev.saved === next.saved &&
          prev.cart === next.cart &&
          prev["wallet-payout"] === next["wallet-payout"]
        ) {
          return prev;
        }
        return next;
      });
      if (includeTray) {
        setNotifications(state.notifications);
        setBadgeCounts(state.badgeCounts);
      }
    },
    [],
  );

  const refresh = useCallback(async (opts?: { includeTray?: boolean }) => {
    if (!enabled || !isDocumentVisible()) return;
    // OPT-P0-PERF-07: never treat PENDING as guest; never badge-fetch as guest.
    const phase = resolveAuthProviderSessionPhase(auth);
    if (phase === "pending") return;
    if (phase === "guest") {
      resetBadgeUiToGuest();
      return;
    }
    const includeTray = opts?.includeTray === true;
    try {
      /* Realtime / inbox-sync must not reuse stale 2.5s badge TTL (Messages vs Notifications desync). */
      clearInboxBadgeModuleCache();
      const state = await fetchBadgeState(undefined, { includeTray });
      applyState(state, includeTray);
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      // ignore network errors
    }
  }, [applyState, auth, enabled, resetBadgeUiToGuest]);

  useEffect(() => {
    if (!enabled) return;
    if (sessionPhase === "pending") return;
    if (sessionPhase === "guest") {
      const timer = window.setTimeout(() => {
        resetBadgeUiToGuest();
      }, 0);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [enabled, refresh, resetBadgeUiToGuest, sessionPhase]);

  useEffect(() => {
    if (!enabled) return;
    let channel: ReturnType<typeof subscribeToUserNotifications> | null = null;
    let conversationChannels: ReturnType<typeof subscribeToUserConversationUnread> = {
      buyer: null,
      seller: null,
    };
    let cancelled = false;
    let reconnectTimer: number | null = null;
    let reconnectAttempts = 0;

    const disconnect = () => {
      if (channel) {
        removeNotificationChannel(channel);
        channel = null;
      }
      removeConversationUnreadChannels(conversationChannels);
      conversationChannels = { buyer: null, seller: null };
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const connect = async () => {
      if (!isSupabaseConfigured() || cancelled) return;
      // Foreground only for new subscribe; keep existing channels when backgrounded.
      if (!isDocumentVisible()) return;

      let supabase;
      try {
        supabase = createClient();
      } catch {
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled || !isDocumentVisible()) return;

      // Avoid duplicate channels: tear down before re-subscribe.
      disconnect();

      let lastInboxSyncAt = 0;
      const onRealtimeChange = () => {
        if (!isDocumentVisible()) return;
        void refresh({ includeTray: true });
        const now = Date.now();
        // Debounced bridge so Inbox list refreshes when unread RT fires (no storm).
        if (now - lastInboxSyncAt < 400) return;
        lastInboxSyncAt = now;
        window.dispatchEvent(new CustomEvent("rovexo:inbox-sync"));
      };

      channel = subscribeToUserNotifications(user.id, {
        onChange: onRealtimeChange,
        onStatus: (status) => {
          if (status === "SUBSCRIBED") {
            reconnectAttempts = 0;
            try {
              // eslint-disable-next-line no-console -- TEMP P0 live repair probe
              console.info("[ROVEXO][PUSH_RT_FLOW]", "SUBSCRIBE_OK", {
                channel: "notifications",
              });
            } catch {
              /* ignore */
            }
            triggerCheckoutSessionSelfHeal("realtime-subscribed");
            return;
          }
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            if (cancelled || reconnectTimer !== null || !isDocumentVisible()) return;
            const delay = Math.min(30_000, 1_000 * 2 ** reconnectAttempts);
            reconnectAttempts += 1;
            reconnectTimer = window.setTimeout(() => {
              reconnectTimer = null;
              void connect();
            }, delay);
          }
        },
      });

      conversationChannels = subscribeToUserConversationUnread(user.id, {
        onChange: onRealtimeChange,
      });
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void flushOfflineNotificationQueue().then(() => refresh({ includeTray: true }));
        void connect();
      }
      // Do NOT disconnect on hidden — sleep/wake + brief background must not drop RT.
    };

    if (isDocumentVisible()) void connect();

    const onOnline = () => {
      triggerCheckoutSessionSelfHeal("realtime-online");
      void flushOfflineNotificationQueue().then(() => refresh({ includeTray: true }));
      void connect();
    };

    let authUnsub: (() => void) | null = null;
    try {
      const supabase = createClient();
      const { data } = supabase.auth.onAuthStateChange((event) => {
        if (cancelled) return;
        if (event === "SIGNED_OUT") {
          disconnect();
          clearPrivateClientSessionCachesOnLogout();
          resetBadgeUiToGuest();
          return;
        }
        if (event === "SIGNED_IN") {
          preparePrivateClientSessionCachesForAuthHydrate();
          void connect();
          void refresh({ includeTray: true });
          return;
        }
        // After sleep/wake token refresh: only resubscribe if channels were dropped.
        if (event === "TOKEN_REFRESHED" && !channel) {
          void connect();
        }
      });
      authUnsub = () => data.subscription.unsubscribe();
    } catch {
      authUnsub = null;
    }

    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibility);
    const onInboxSync = () => {
      void refresh({ includeTray: true });
    };
    window.addEventListener("rovexo:inbox-sync", onInboxSync);

    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("rovexo:inbox-sync", onInboxSync);
      authUnsub?.();
      disconnect();
    };
  }, [enabled, refresh, resetBadgeUiToGuest]);

  useEffect(() => {
    if (!enabled) return;
    if (!("serviceWorker" in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      const data = event.data as {
        type?: string;
        href?: string;
        notificationId?: string | null;
      } | null;
      if (!data) return;
      if (data.type === "notification-sync") {
        void refresh();
        return;
      }
      if (data.type === "notification-open" && typeof data.href === "string" && data.href) {
        void (async () => {
          void refresh({ includeTray: true });
          const { handleNotificationDeepLinkClick } = await import(
            "@/lib/notifications/notification-deep-link-v1"
          );
          await handleNotificationDeepLinkClick({
            href: data.href!,
            notificationId: data.notificationId,
            markAsRead: Boolean(data.notificationId),
            navigate: (href) => {
              if (href.startsWith("/") && !href.startsWith("//")) {
                router.push(href);
              }
            },
          });
        })();
      }
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [enabled, refresh, router]);

  /* Cold start / slow hydration — consume pending deep-link after auth session is ready. */
  useEffect(() => {
    if (!enabled) return;
    void (async () => {
      const { consumePendingNotificationDeepLink } = await import(
        "@/lib/notifications/notification-deep-link-v1"
      );
      const pending = consumePendingNotificationDeepLink();
      if (!pending) return;
      if (pending.startsWith("/") && !pending.startsWith("//")) {
        router.push(pending);
      }
    })();
  }, [enabled, router]);

  const value = useMemo(
    () => ({
      unreadCount,
      notifications,
      badgeCounts,
      mobileBadges,
      refresh,
      setNotifications,
    }),
    [unreadCount, notifications, badgeCounts, mobileBadges, refresh],
  );

  return (
    <RealtimeNotificationContext.Provider value={value}>
      {children}
    </RealtimeNotificationContext.Provider>
  );
}

export function useRealtimeNotifications(): RealtimeNotificationContextValue {
  const context = useContext(RealtimeNotificationContext);
  if (!context) {
    return {
      unreadCount: 0,
      notifications: [],
      badgeCounts: null,
      mobileBadges: EMPTY_BADGES,
      refresh: async () => {},
      setNotifications: () => {},
    };
  }
  return context;
}
