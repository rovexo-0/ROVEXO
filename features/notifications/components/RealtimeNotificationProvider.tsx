"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { subscribeToUserNotifications, removeNotificationChannel } from "@/lib/notifications/realtime";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { flushOfflineNotificationQueue } from "@/lib/notifications/offline-sync";
import { createClient } from "@/lib/supabase/client";
import { fetchDeduped } from "@/lib/performance/fetch";
import { isDocumentVisible } from "@/lib/performance/visibility";
import type { Notification } from "@/lib/notifications/types";
import type { DashboardBadgeCounts } from "@/lib/notifications/badge-counts";
import type { MobileBadges } from "@/lib/mobile-ui/types";

type RealtimeNotificationContextValue = {
  unreadCount: number;
  notifications: Notification[];
  badgeCounts: DashboardBadgeCounts | null;
  mobileBadges: MobileBadges;
  refresh: () => Promise<void>;
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
};

async function fetchBadgeState(signal?: AbortSignal): Promise<{
  unreadCount: number;
  notifications: Notification[];
  badgeCounts: DashboardBadgeCounts | null;
  mobileBadges: MobileBadges;
}> {
  if (!isDocumentVisible()) {
    throw new DOMException("Document hidden", "AbortError");
  }

  const requestInit = { cache: "no-store" as const, signal };

  const [countRes, badgeRes, listRes, messagesRes, cartRes, savedRes, ordersRes] =
    await Promise.all([
      fetchDeduped("/api/notifications/count", { ...requestInit, dedupeKey: "badge:notifications-count" }),
      fetchDeduped("/api/notifications/badge-counts", { ...requestInit, dedupeKey: "badge:badge-counts" }),
      fetchDeduped("/api/notifications", { ...requestInit, dedupeKey: "badge:notifications-list" }),
      fetchDeduped("/api/messages", { ...requestInit, dedupeKey: "badge:messages" }),
      fetchDeduped("/api/cart", { ...requestInit, dedupeKey: "badge:cart" }),
      fetchDeduped("/api/saved", { ...requestInit, dedupeKey: "badge:saved" }),
      fetchDeduped("/api/orders", { ...requestInit, dedupeKey: "badge:orders" }),
    ]);

  let unreadCount = 0;
  let notifications: Notification[] = [];
  let badgeCounts: DashboardBadgeCounts | null = null;

  if (countRes.ok) {
    const payload = (await countRes.json()) as { count: number };
    unreadCount = payload.count;
  }

  if (badgeRes.ok) {
    const payload = (await badgeRes.json()) as { counts: DashboardBadgeCounts };
    badgeCounts = payload.counts;
  }

  if (listRes.ok) {
    const payload = (await listRes.json()) as { notifications: Notification[] };
    notifications = payload.notifications;
    unreadCount = payload.notifications.filter((item) => !item.read).length;
  }

  const messagesPayload = messagesRes.ok
    ? ((await messagesRes.json()) as { conversations?: Array<{ unreadCount?: number }> })
    : { conversations: [] };
  const cartPayload = cartRes.ok
    ? ((await cartRes.json()) as { cart?: { itemCount?: number } })
    : { cart: { itemCount: 0 } };
  const savedPayload = savedRes.ok
    ? ((await savedRes.json()) as { items?: unknown[] })
    : { items: [] };
  const ordersPayload = ordersRes.ok
    ? ((await ordersRes.json()) as { orders?: Array<{ status?: string }> })
    : { orders: [] };

  const active = new Set(["pending", "paid", "processing", "shipped", "confirmed"]);
  const orders = (ordersPayload.orders ?? []).filter((order) =>
    active.has(order.status ?? ""),
  ).length;

  return {
    unreadCount,
    notifications,
    badgeCounts,
    mobileBadges: {
      messages: (messagesPayload.conversations ?? []).reduce(
        (sum, conversation) => sum + (conversation.unreadCount ?? 0),
        0,
      ),
      notifications: unreadCount,
      cart: cartPayload.cart?.itemCount ?? 0,
      saved: savedPayload.items?.length ?? 0,
      orders,
      "wallet-payout": orders > 0 ? 1 : 0,
    },
  };
}

export function RealtimeNotificationProvider({
  children,
  initialUnreadCount = 0,
  initialNotifications = [],
}: RealtimeNotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [badgeCounts, setBadgeCounts] = useState<DashboardBadgeCounts | null>(null);
  const [mobileBadges, setMobileBadges] = useState<MobileBadges>({
    ...EMPTY_BADGES,
    notifications: initialUnreadCount,
  });
  const mountedRef = useRef(false);

  const applyState = useCallback((state: Awaited<ReturnType<typeof fetchBadgeState>>) => {
    setUnreadCount(state.unreadCount);
    setNotifications(state.notifications);
    setBadgeCounts(state.badgeCounts);
    setMobileBadges(state.mobileBadges);
  }, []);

  const refresh = useCallback(async () => {
    if (!isDocumentVisible()) return;
    try {
      const state = await fetchBadgeState();
      applyState(state);
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      // ignore network errors
    }
  }, [applyState]);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    let channel: ReturnType<typeof subscribeToUserNotifications> | null = null;
    let cancelled = false;
    let reconnectTimer: number | null = null;
    let reconnectAttempts = 0;

    const disconnect = () => {
      if (channel) {
        removeNotificationChannel(channel);
        channel = null;
      }
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const connect = async () => {
      if (!isSupabaseConfigured() || !isDocumentVisible() || cancelled) return;

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

      disconnect();

      channel = subscribeToUserNotifications(user.id, {
        onChange: () => {
          if (isDocumentVisible()) void refresh();
        },
        onStatus: (status) => {
          if (status === "SUBSCRIBED") {
            reconnectAttempts = 0;
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

      if (!channel) {
        return;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void flushOfflineNotificationQueue().then(() => refresh());
        void connect();
      } else {
        disconnect();
      }
    };

    if (isDocumentVisible()) void connect();

    const onOnline = () => {
      void flushOfflineNotificationQueue().then(() => refresh());
      void connect();
    };

    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibility);
      disconnect();
    };
  }, [refresh]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      if ((event.data as { type?: string })?.type === "notification-sync") {
        void refresh();
      }
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [refresh]);

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
