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
import { subscribeToUserNotifications, removeNotificationChannel } from "@/lib/notifications/realtime";
import {
  subscribeToUserConversationUnread,
  removeConversationUnreadChannels,
} from "@/lib/inbox/conversation-unread-realtime";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { flushOfflineNotificationQueue } from "@/lib/notifications/offline-sync";
import { createClient } from "@/lib/supabase/client";
import { fetchDeduped, invalidateShareInflight } from "@/lib/performance/fetch";
import { isDocumentVisible } from "@/lib/performance/visibility";
import type { Notification } from "@/lib/notifications/types";
import type { DashboardBadgeCounts } from "@/lib/notifications/badge-counts";
import type { MobileBadges } from "@/lib/mobile-ui/types";

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
let inboxBadgeInflight: Promise<{
  messages: number;
  notifications: number;
  ok: boolean;
}> | null = null;

function fetchInboxBadgeCounts(signal?: AbortSignal): Promise<{
  messages: number;
  notifications: number;
  ok: boolean;
}> {
  if (inboxBadgeInflight) return inboxBadgeInflight;
  inboxBadgeInflight = (async () => {
    const res = await fetch("/api/inbox/badge", { cache: "no-store", signal });
    if (!res.ok) return { messages: 0, notifications: 0, ok: false };
    const payload = (await res.json()) as {
      messages?: number;
      notifications?: number;
    };
    return {
      messages: Math.max(0, Number(payload.messages) || 0),
      notifications: Math.max(0, Number(payload.notifications) || 0),
      ok: true,
    };
  })().finally(() => {
    inboxBadgeInflight = null;
  });
  return inboxBadgeInflight;
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
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [badgeCounts, setBadgeCounts] = useState<DashboardBadgeCounts | null>(null);
  const [mobileBadges, setMobileBadges] = useState<MobileBadges>({
    ...EMPTY_BADGES,
    notifications: initialUnreadCount,
  });

  const applyState = useCallback(
    (state: Awaited<ReturnType<typeof fetchBadgeState>>, includeTray: boolean) => {
      setUnreadCount(state.unreadCount);
      setMobileBadges(state.mobileBadges);
      if (includeTray) {
        setNotifications(state.notifications);
        setBadgeCounts(state.badgeCounts);
      }
    },
    [],
  );

  const refresh = useCallback(async (opts?: { includeTray?: boolean }) => {
    if (!enabled || !isDocumentVisible()) return;
    const includeTray = opts?.includeTray === true;
    try {
      const state = await fetchBadgeState(undefined, { includeTray });
      applyState(state, includeTray);
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      // ignore network errors
    }
  }, [applyState, enabled]);

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [enabled, refresh]);

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

      let lastInboxSyncAt = 0;
      const onRealtimeChange = () => {
        if (!isDocumentVisible()) return;
        void refresh();
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
    const onInboxSync = () => {
      void refresh();
    };
    window.addEventListener("rovexo:inbox-sync", onInboxSync);

    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("rovexo:inbox-sync", onInboxSync);
      disconnect();
    };
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled) return;
    if (!("serviceWorker" in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      if ((event.data as { type?: string })?.type === "notification-sync") {
        void refresh();
      }
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [enabled, refresh]);

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
