"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type SVGProps,
} from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { Avatar } from "@/components/ui/Avatar";
import { RovexoAppIconMark } from "@/components/brand/RovexoLogo";
import { ChevronRightLineIcon } from "@/components/icons/RvxLineIcons";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { AccountIcon } from "@/components/account/AccountIcons";
import { CanonicalMenuRow } from "@/src/components/canonical";
import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";
import { enqueueOfflineNotificationAction } from "@/lib/notifications/offline-sync";
import { formatNotificationTime } from "@/lib/notifications/utils";
import type { Notification } from "@/lib/notifications/types";
import { formatInboxRelativeTime } from "@/lib/messages/utils";
import type { Conversation } from "@/lib/messages/types";
import { cn } from "@/lib/cn";
import { invalidateShareInflight } from "@/lib/performance/fetch";
import { tryCreateClient } from "@/lib/supabase/client";
import {
  INBOX_CANONICAL_VERSION,
  INBOX_HUB_MASTER_DOM,
  INBOX_ROUTES,
  buildUnreadCounter,
  filterInboxConversations,
  mapNotificationCategory,
  parseInboxTab,
  subscribeInboxRealtime,
  type InboxTab,
} from "@/lib/inbox";
import {
  getInboxConversationsCache,
  getInboxNotificationsCache,
  hasInboxConversationsCache,
  hasInboxNotificationsCache,
  peekInboxConversationsCache,
  peekInboxNotificationsCache,
  seedInboxNotificationsCache,
  setInboxConversationsCache,
  setInboxNotificationsCache,
} from "@/lib/inbox/inbox-list-cache";
import { resolveInboxNotificationRowIcon } from "@/lib/inbox/notification-row-icon";
import {
  buildInboxListingImageIndex,
  resolveNotificationListingImageSrc,
} from "@/lib/inbox/notification-listing-thumb";
import {
  resolveInboxMessageAvatar,
  resolveInboxNotificationAvatar,
} from "@/lib/inbox/official-rovexo-avatar";
import { isWalletHubNotificationHref } from "@/lib/notifications/routing";
import { resolveNotificationOpenHref } from "@/lib/notifications/resolve-notification-open-href";
import type { Order } from "@/lib/orders/types";
import {
  listMessagesLifecycleDemoInboxRows,
} from "@/lib/inbox/demo/messages-lifecycle-demo-fixtures-v1";
import { shouldShowOwnerDemoInboxRows } from "@/lib/inbox/demo/owner-demo-mode-v1";
import { useOwnerDemoMode } from "@/features/inbox/hooks/use-owner-demo-mode";
import { useProfile } from "@/features/auth/hooks/use-profile";
import { shareInflightJson } from "@/lib/performance/fetch";
import "@/styles/rovexo/inbox-hub-v1.css";

const PAGE_SIZE = 20;

type IconProps = SVGProps<SVGSVGElement>;

function MessagesEmptyIllustration(props: IconProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden {...props}>
      <rect x="12" y="18" width="56" height="40" rx="10" stroke="currentColor" strokeWidth="2.5" />
      <path d="M12 28h56M28 48h24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function NotificationsEmptyIllustration(props: IconProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden {...props}>
      <path
        d="M40 14c-10 0-18 8-18 18v8c0 4-2 7-5 9h46c-3-2-5-5-5-9v-8c0-10-8-18-18-18Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M34 60a6 6 0 0 0 12 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function matchesConversationSearch(conversation: Conversation, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    conversation.id,
    conversation.participant.id,
    conversation.participant.name,
    conversation.product.id,
    conversation.product.slug,
    conversation.product.title,
    conversation.lastMessage,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function matchesNotificationSearch(notification: Notification, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [notification.title, notification.subtitle, notification.href, notification.id]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

function InboxListSkeleton({ variant }: { variant: "messages" | "notifications" }) {
  return (
    <ul className="inbox-hub__list inbox-hub__list--skeleton" aria-busy aria-hidden>
      {Array.from({ length: 8 }).map((_, index) => (
        <li
          key={index}
          className={cn(
            "inbox-hub__skel",
            variant === "messages" ? "inbox-hub__skel--card" : "inbox-hub__skel--notif",
          )}
        >
          {variant === "messages" ? (
            <span className="inbox-hub__skel-row">
              <span className="inbox-hub__skel-avatar" />
              <span className="inbox-hub__skel-lines">
                <span className="inbox-hub__skel-line inbox-hub__skel-line--title" />
                <span className="inbox-hub__skel-line inbox-hub__skel-line--party" />
                <span className="inbox-hub__skel-line inbox-hub__skel-line--preview" />
              </span>
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

type InboxNotificationRowProps = {
  notification: Notification;
  unreadRow: boolean;
  onOpen: (notification: Notification) => void;
  listingImageSrc: string | null;
};

function OfficialRovexoInboxMark() {
  return (
    <span className="inbox-hub__rx-mark" aria-hidden data-inbox-avatar="official-rx">
      <RovexoAppIconMark size={48} alt="" className="inbox-hub__rx-mark-img" />
    </span>
  );
}

const InboxNotificationRow = memo(function InboxNotificationRow({
  notification,
  unreadRow,
  onOpen,
  listingImageSrc,
}: InboxNotificationRowProps) {
  const rowIcon = resolveInboxNotificationRowIcon(notification);
  const avatar = resolveInboxNotificationAvatar(notification, listingImageSrc);

  let icon: ReactNode;
  if (avatar.kind === "official-rx") {
    icon = <OfficialRovexoInboxMark />;
  } else if (avatar.kind === "listing") {
    icon = (
      <span className="inbox-hub__notif-thumb" aria-hidden data-inbox-notif-thumb="listing">
        <SafeImage
          src={avatar.src}
          alt=""
          width={48}
          height={48}
          className="inbox-hub__notif-thumb-img"
          sizes="48px"
          loading="lazy"
        />
      </span>
    );
  } else {
    icon = (
      <span
        className="ac-canonical__menu-icon inbox-hub__notif-icon"
        style={{ color: rowIcon.color }}
        aria-hidden
        data-inbox-notif-icon={rowIcon.name}
      >
        <AccountIcon name={rowIcon.name} />
      </span>
    );
  }

  return (
    <li className="list-none">
      <CanonicalMenuRow
        title={notification.title}
        description={notification.subtitle || undefined}
        value={formatNotificationTime(notification.createdAt)}
        onClick={() => onOpen(notification)}
        badge={unreadRow ? 1 : undefined}
        icon={icon}
      />
    </li>
  );
});

export function InboxPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseInboxTab(searchParams.get("tab"));
  const messageFilter = searchParams.get("filter");
  const notificationCategory = searchParams.get("category");
  const { profile } = useProfile();
  const { enabled: ownerDemoModeEnabled, hydrated: ownerDemoHydrated } = useOwnerDemoMode();
  const {
    notifications: providerNotifications,
    setNotifications,
    refresh,
    mobileBadges,
  } = useRealtimeNotifications();

  const [conversations, setConversations] = useState<Conversation[]>(
    () => getInboxConversationsCache() ?? peekInboxConversationsCache(),
  );
  const [notifications, setLocalNotifications] = useState<Notification[]>(() => {
    const cached = getInboxNotificationsCache();
    if (cached) return cached;
    return peekInboxNotificationsCache();
  });
  const [loadingMessages, setLoadingMessages] = useState(() => !hasInboxConversationsCache());
  const [loadingNotifications, setLoadingNotifications] = useState(
    () => !hasInboxNotificationsCache(),
  );
  const [hubError, setHubError] = useState<string | null>(null);
  const query = "";
  const [messagePage, setMessagePage] = useState(1);
  const [notificationPage, setNotificationPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  /*
   * loadingNotifications is transition state for the Inbox fetch (B), not pure derived state.
   * Provider tray data is mirrored into local list during render when local is still empty —
   * same hydration as the former seed effect, without sync setState inside an effect.
   * setLoadingNotifications(false) on seed was redundant: skeleton/empty/unread already
   * gate on effectiveNotifications (which prefers provider when local is empty).
   */
  if (notifications.length === 0 && providerNotifications.length > 0) {
    setLocalNotifications(providerNotifications);
  }

  const applyConversations = useCallback((next: Conversation[]) => {
    setInboxConversationsCache(next);
    setConversations(next);
  }, []);

  const applyNotifications = useCallback(
    (next: Notification[]) => {
      setInboxNotificationsCache(next);
      setLocalNotifications(next);
      setNotifications(next);
    },
    [setNotifications],
  );

  const setTab = useCallback(
    (next: InboxTab) => {
      const href =
        next === "notifications" ? INBOX_ROUTES.notificationsTab : INBOX_ROUTES.messagesTab;
      router.replace(href);
    },
    [router],
  );

  const loadMessages = useCallback(async (opts?: { fresh?: boolean }) => {
    try {
      if (opts?.fresh) {
        invalidateShareInflight("GET:/api/messages");
        const response = await fetch("/api/messages", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { conversations?: Conversation[] };
        applyConversations(payload.conversations ?? []);
        return;
      }
      const payload = await shareInflightJson<{ conversations?: Conversation[] }>(
        "GET:/api/messages",
        "/api/messages",
        { ttlMs: 1200 },
      );
      applyConversations(payload.conversations ?? []);
    } catch {
      /* keep cache / fail closed */
    }
  }, [applyConversations]);

  const loadNotifications = useCallback(async (opts?: { fresh?: boolean }) => {
    try {
      if (opts?.fresh) {
        invalidateShareInflight("GET:/api/notifications");
        const response = await fetch("/api/notifications", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { notifications?: Notification[] };
        applyNotifications(payload.notifications ?? []);
        return;
      }
      const payload = await shareInflightJson<{ notifications?: Notification[] }>(
        "GET:/api/notifications",
        "/api/notifications",
        { ttlMs: 1200 },
      );
      applyNotifications(payload.notifications ?? []);
    } catch {
      /* keep cache / fail closed */
    }
  }, [applyNotifications]);

  /* External cache seed only — React list state is mirrored during render above. */
  useEffect(() => {
    if (providerNotifications.length === 0) return;
    if (notifications.length > 0) return;
    seedInboxNotificationsCache(providerNotifications);
  }, [providerNotifications, notifications.length]);

  useEffect(() => {
    let cancelled = false;
    const hasCachedLists =
      hasInboxConversationsCache() && hasInboxNotificationsCache();

    void (async () => {
      try {
        const [messagesPayload, notificationsPayload] = await Promise.all([
          shareInflightJson<{ conversations?: Conversation[] }>(
            "GET:/api/messages",
            "/api/messages",
            { ttlMs: 1200 },
          ).catch(() => null),
          shareInflightJson<{ notifications?: Notification[] }>(
            "GET:/api/notifications",
            "/api/notifications",
            { ttlMs: 1200 },
          ).catch(() => null),
        ]);

        if (cancelled) return;

        if (!messagesPayload && !notificationsPayload) {
          if (!hasCachedLists) {
            setHubError(
              typeof navigator !== "undefined" && !navigator.onLine
                ? "You’re offline."
                : "Unable to load Inbox.",
            );
          }
          return;
        }

        setHubError(null);
        if (messagesPayload) applyConversations(messagesPayload.conversations ?? []);
        if (notificationsPayload) applyNotifications(notificationsPayload.notifications ?? []);
      } catch {
        if (!cancelled && !hasCachedLists) {
          setHubError(
            typeof navigator !== "undefined" && !navigator.onLine
              ? "You’re offline."
              : "Unable to load Inbox.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingMessages(false);
          setLoadingNotifications(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applyConversations, applyNotifications]);

  /* Deep-link recovery: /inbox?order=… → Transaction Conversation (fallback when server could not resolve). */
  useEffect(() => {
    const orderId = searchParams.get("order");
    if (!orderId || loadingMessages || conversations.length === 0) return;

    let cancelled = false;
    void (async () => {
      try {
        const payload = await shareInflightJson<{ orders?: Order[] }>(
          "GET:/api/orders",
          "/api/orders",
          { ttlMs: 1500 },
        ).catch(() => null);
        if (!payload || cancelled) return;
        const order = (payload.orders ?? []).find((item) => item.id === orderId);
        if (!order || cancelled) return;

        const match = conversations.find(
          (item) =>
            item.product.id === order.product.id || item.product.slug === order.product.slug,
        );
        if (!match || cancelled) return;

        const qs = new URLSearchParams();
        qs.set("order", orderId);
        const focus = searchParams.get("focus");
        if (focus) qs.set("focus", focus);
        router.replace(`${INBOX_ROUTES.conversation(match.id)}?${qs.toString()}`);
      } catch {
        /* stay on Inbox — fail closed without 404 */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [conversations, loadingMessages, router, searchParams]);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadMessages({ fresh: true }),
        loadNotifications({ fresh: true }),
        refresh(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [loadMessages, loadNotifications, refresh]);

  const refreshAllRef = useRef(refreshAll);
  const realtimeRefreshTimer = useRef<number | null>(null);

  useLayoutEffect(() => {
    refreshAllRef.current = refreshAll;
  }, [refreshAll]);

  useEffect(() => {
    const scheduleRealtimeRefresh = () => {
      if (realtimeRefreshTimer.current != null) window.clearTimeout(realtimeRefreshTimer.current);
      realtimeRefreshTimer.current = window.setTimeout(() => {
        realtimeRefreshTimer.current = null;
        invalidateShareInflight("GET:/api/messages");
        invalidateShareInflight("GET:/api/notifications");
        void refreshAllRef.current();
      }, 250);
    };
    const patchConversationFromRealtime = (event: {
      conversationId?: string;
      payload?: Record<string, unknown>;
    }) => {
      const id = event.conversationId;
      const row = event.payload;
      if (!id || !row) return;
      setConversations((prev) => {
        const next = prev.map((item) => {
          if (item.id !== id) return item;
          const isBuyer = item.participant.role === "seller";
          const unreadRaw = isBuyer ? row.buyer_unread_count : row.seller_unread_count;
          return {
            ...item,
            lastMessage:
              typeof row.last_message === "string" ? row.last_message : item.lastMessage,
            lastMessageAt:
              typeof row.last_message_at === "string"
                ? row.last_message_at
                : item.lastMessageAt,
            unreadCount:
              typeof unreadRaw === "number" ? unreadRaw : item.unreadCount,
          };
        });
        const changed = next.some((item, index) => item !== prev[index]);
        if (!changed) return prev;
        setInboxConversationsCache(next);
        return next;
      });
    };
    const userId = profile?.id ?? null;
    const sub = subscribeInboxRealtime(
      (event) => {
        if (event.type === "conversation.updated" || event.type === "badge.updated") {
          patchConversationFromRealtime(event);
        }
        if (
          event.type === "conversation.updated" ||
          event.type === "notification.updated" ||
          event.type === "notification.created" ||
          event.type === "badge.updated" ||
          event.type === "message.created" ||
          event.type === "message.updated" ||
          event.type === "offer.updated" ||
          event.type === "order.updated"
        ) {
          scheduleRealtimeRefresh();
        }
      },
      { userId },
    );
    return () => {
      sub.unsubscribe();
      if (realtimeRefreshTimer.current != null) window.clearTimeout(realtimeRefreshTimer.current);
    };
  }, [profile?.id]);

  /* Conversation-scoped message INSERT → patch list preview in place. */
  const conversationIdsKey = useMemo(
    () =>
      conversations
        .slice(0, 10)
        .map((c) => c.id)
        .filter(Boolean)
        .sort()
        .join(","),
    [conversations],
  );

  useEffect(() => {
    const userId = profile?.id;
    if (!userId || !conversationIdsKey) return;
    const supabase = tryCreateClient();
    if (!supabase) return;

    // Prefer the top (most recent) conversation — primary certification path.
    const primaryId = conversations[0]?.id;
    if (!primaryId) return;

    const applyMessageInsert = (row: Record<string, unknown>) => {
      const conversationId = String(row.conversation_id ?? "");
      if (!conversationId) return;
      const content = row.deleted_at ? "Message deleted" : String(row.content ?? "");
      const sentAt = String(row.sent_at ?? new Date().toISOString());
      setConversations((prev) => {
        const existing = prev.find((item) => item.id === conversationId);
        if (!existing) {
          invalidateShareInflight("GET:/api/messages");
          void loadMessages({ fresh: true });
          return prev;
        }
        const patched = {
          ...existing,
          lastMessage: content || existing.lastMessage,
          lastMessageAt: sentAt,
          unreadCount: Math.max(existing.unreadCount + 1, 1),
        };
        const rest = prev.filter((item) => item.id !== conversationId);
        const next = [patched, ...rest];
        setInboxConversationsCache(next);
        return next;
      });
    };

    const channel = supabase
      .channel(`inbox-rt-msg-primary:${userId}:${primaryId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${primaryId}`,
        },
        (payload) => {
          applyMessageInsert(payload.new as Record<string, unknown>);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [profile?.id, conversations, conversationIdsKey, loadMessages]);

  /* XLIII / Hub open sync — realtime is primary; keep event bridge only. */
  useEffect(() => {
    const onInboxSync = () => {
      invalidateShareInflight("GET:/api/messages");
      invalidateShareInflight("GET:/api/notifications");
      void refreshAll();
    };
    window.addEventListener("rovexo:inbox-sync", onInboxSync);
    return () => {
      window.removeEventListener("rovexo:inbox-sync", onInboxSync);
    };
  }, [refreshAll]);

  const prevMessagesBadge = useRef<number | null>(null);
  /* When unread message badge bumps via provider RT, refresh conversation list. */
  useEffect(() => {
    if (!profile?.id) return;
    const prev = prevMessagesBadge.current;
    prevMessagesBadge.current = mobileBadges.messages;
    if (prev === null) return;
    if (mobileBadges.messages <= prev) return;
    invalidateShareInflight("GET:/api/messages");
    void loadMessages({ fresh: true });
  }, [mobileBadges.messages, profile?.id, loadMessages]);

  /* Prefer local/cache; fall back to provider tray so first paint never shows Empty. */
  const effectiveNotifications = useMemo(() => {
    if (notifications.length > 0) return notifications;
    if (providerNotifications.length > 0) return providerNotifications;
    return notifications;
  }, [notifications, providerNotifications]);

  const unread = useMemo(() => {
    const messagesUnread = conversations.reduce(
      (sum, item) => sum + (item.archived ? 0 : item.unreadCount),
      0,
    );
    const notificationsUnread = effectiveNotifications.filter((item) => !item.read).length;
    return buildUnreadCounter(
      loadingMessages && conversations.length === 0 ? mobileBadges.messages : messagesUnread,
      loadingNotifications && effectiveNotifications.length === 0
        ? mobileBadges.notifications
        : notificationsUnread,
    );
  }, [
    conversations,
    effectiveNotifications,
    loadingMessages,
    loadingNotifications,
    mobileBadges.messages,
    mobileBadges.notifications,
  ]);

  const filteredConversations = useMemo(() => {
    const base = conversations.filter((item) =>
      matchesConversationSearch(item, query),
    );
    const filter =
      messageFilter === "offers" ||
      messageFilter === "orders" ||
      messageFilter === "unread" ||
      messageFilter === "archived" ||
      messageFilter === "disputes"
        ? messageFilter
        : "all";
    const filtered = filterInboxConversations(base, filter);
    const allowDemoRows =
      ownerDemoHydrated &&
      shouldShowOwnerDemoInboxRows({
        authenticated: Boolean(profile?.id),
        role: profile?.role ?? null,
        ownerDemoModeEnabled,
      });
    const demoRows = allowDemoRows
      ? [
          ...listMessagesLifecycleDemoInboxRows("buyer"),
          ...listMessagesLifecycleDemoInboxRows("seller"),
        ]
      : [];
    const merged = [...demoRows, ...filtered];
    const seen = new Set<string>();
    return merged
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt));
  }, [
    conversations,
    query,
    messageFilter,
    profile?.id,
    profile?.role,
    ownerDemoModeEnabled,
    ownerDemoHydrated,
  ]);

  const filteredNotifications = useMemo(() => {
    return effectiveNotifications
      .filter((item) => matchesNotificationSearch(item, query))
      .filter((item) => {
        if (!notificationCategory) return true;
        if (notificationCategory === "shipping") {
          const haystack = `${item.title ?? ""} ${item.subtitle ?? ""} ${item.detail ?? ""}`.toLowerCase();
          return (
            mapNotificationCategory(item.type) === "orders" &&
            /ship|deliver|track|parcel|courier|label/.test(haystack)
          );
        }
        return mapNotificationCategory(item.type) === notificationCategory;
      })
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [effectiveNotifications, query, notificationCategory]);

  /* Reuse Messages product images — join in memory, no per-notification fetches. */
  const listingImageIndex = useMemo(
    () => buildInboxListingImageIndex(conversations),
    [conversations],
  );

  const unreadNotifications = useMemo(
    () => filteredNotifications.filter((item) => !item.read),
    [filteredNotifications],
  );
  const earlierNotifications = useMemo(
    () => filteredNotifications.filter((item) => item.read),
    [filteredNotifications],
  );

  const visibleConversations = filteredConversations.slice(0, messagePage * PAGE_SIZE);
  const visibleUnreadNotifications = unreadNotifications.slice(
    0,
    notificationPage * PAGE_SIZE,
  );
  const remainingSlots = Math.max(0, notificationPage * PAGE_SIZE - visibleUnreadNotifications.length);
  const visibleEarlierNotifications = earlierNotifications.slice(0, remainingSlots);
  const visibleNotificationCount =
    visibleUnreadNotifications.length + visibleEarlierNotifications.length;
  const hasMore =
    tab === "messages"
      ? visibleConversations.length < filteredConversations.length
      : visibleNotificationCount < filteredNotifications.length;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        if (tab === "messages") setMessagePage((page) => page + 1);
        else setNotificationPage((page) => page + 1);
      },
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, tab, visibleConversations.length, visibleNotificationCount]);

  const patchConversation = async (
    id: string,
    action: "read" | "archive" | "pin" | "delete",
  ) => {
    if (action === "delete") {
      await fetch(`/api/messages/${id}`, { method: "DELETE" });
      applyConversations(
        conversations.map((item) => (item.id === id ? { ...item, archived: true } : item)),
      );
      return;
    }
    const body =
      action === "read"
        ? { action: "read" }
        : action === "archive"
          ? { action: "archive", value: true }
          : { action: "pin", value: true };
    const response = await fetch(`/api/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { conversation?: Conversation };
    if (payload.conversation) {
      applyConversations(
        conversations.map((item) => (item.id === id ? payload.conversation! : item)),
      );
    } else if (action === "read") {
      applyConversations(
        conversations.map((item) => (item.id === id ? { ...item, unreadCount: 0 } : item)),
      );
    }
  };

  void patchConversation;

  const markNotificationRead = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      setLocalNotifications((current) => {
        const optimistic = current.map((item) =>
          ids.includes(item.id) ? { ...item, read: true } : item,
        );
        setInboxNotificationsCache(optimistic);
        setNotifications(optimistic);
        return optimistic;
      });
      if (!navigator.onLine) {
        enqueueOfflineNotificationAction({ type: "mark_read", ids });
        return;
      }
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, read: true }),
      });
      if (!response.ok) return;
      const payload = (await response.json()) as { notifications: Notification[] };
      applyNotifications(payload.notifications);
      void refresh();
    },
    [applyNotifications, refresh, setNotifications],
  );

  const markAllNotificationsRead = useCallback(async () => {
    if (!notifications.some((item) => !item.read)) return;
    setMarkingAllRead(true);
    try {
      const optimistic = notifications.map((item) => ({ ...item, read: true }));
      applyNotifications(optimistic);
      if (!navigator.onLine) {
        const unreadIds = notifications.filter((item) => !item.read).map((item) => item.id);
        enqueueOfflineNotificationAction({ type: "mark_read", ids: unreadIds });
        return;
      }
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (!response.ok) return;
      const payload = (await response.json()) as { notifications: Notification[] };
      applyNotifications(payload.notifications);
      void refresh();
    } finally {
      setMarkingAllRead(false);
    }
  }, [notifications, refresh, applyNotifications]);

  const openNotification = useCallback(
    async (notification: Notification) => {
      const hrefPromise = resolveNotificationOpenHref(notification);
      if (!notification.read) void markNotificationRead([notification.id]);
      const href = await hrefPromise;
      router.push(isWalletHubNotificationHref(href) ? INBOX_ROUTES.hub : href);
    },
    [router, markNotificationRead],
  );

  const showMarkAll = tab === "notifications" && unread.notifications > 0;

  const markAllAction: ReactNode = showMarkAll ? (
    <button
      type="button"
      className="inbox-hub__mark-all"
      disabled={markingAllRead}
      onClick={() => void markAllNotificationsRead()}
    >
      Mark all read
    </button>
  ) : null;

  const showMessagesSkeleton = loadingMessages && filteredConversations.length === 0;
  const showNotificationsSkeleton =
    loadingNotifications && effectiveNotifications.length === 0;
  const showMessagesEmpty = !loadingMessages && filteredConversations.length === 0;
  /* Never show Empty while a fetch is in flight or provider/cache already has rows. */
  const showNotificationsEmpty =
    !loadingNotifications && filteredNotifications.length === 0;

  return (
    <AccountCanonicalShell
      title="Inbox"
      showHeaderTitle
      backHref="/account"
      showBottomNav
      bottomNavTab="saved"
      rightAction={markAllAction}
    >
      <div
        className="inbox-hub"
        data-inbox-hub={INBOX_CANONICAL_VERSION}
        data-inbox-master={INBOX_HUB_MASTER_DOM}
        data-inbox-freeze="FINAL-LOCK"
        data-inbox-universal="v1.1-preview"
        data-inbox-realtime="v1"
      >
        {refreshing ? <div className="inbox-hub__refresh">Refreshing…</div> : null}

        {hubError ? (
          <div className="inbox-hub__banner" role="alert">
            <span>{hubError}</span>
            <button
              type="button"
              onClick={() => {
                setHubError(null);
                void refreshAll();
              }}
            >
              Retry
            </button>
          </div>
        ) : null}

        <div className="inbox-hub__tabs" role="tablist" aria-label="Inbox sections">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "messages"}
            className={cn("inbox-hub__tab", tab === "messages" && "inbox-hub__tab--on")}
            onClick={() => setTab("messages")}
          >
            Messages
            {unread.messages > 0 ? (
              <span className="inbox-hub__tab-count">{unread.messages > 99 ? "99+" : unread.messages}</span>
            ) : null}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "notifications"}
            className={cn("inbox-hub__tab", tab === "notifications" && "inbox-hub__tab--on")}
            onClick={() => setTab("notifications")}
          >
            Notifications
            {unread.notifications > 0 ? (
              <span className="inbox-hub__tab-count">
                {unread.notifications > 99 ? "99+" : unread.notifications}
              </span>
            ) : null}
          </button>
          <span
            className={cn(
              "inbox-hub__tab-indicator",
              tab === "notifications" && "inbox-hub__tab-indicator--notifications",
            )}
            aria-hidden
          />
        </div>

        {/* Both panes stay mounted — instant tab switch + preserved scroll. */}
        <div
          className="inbox-hub__pane"
          hidden={tab !== "messages"}
          data-inbox-pane="messages"
        >
          {showMessagesSkeleton ? (
            <InboxListSkeleton variant="messages" />
          ) : showMessagesEmpty ? (
            <div className="inbox-hub__empty">
              <MessagesEmptyIllustration className="inbox-hub__empty-illu" />
              <p className="inbox-hub__empty-title">No conversations yet</p>
              <Link href="/search" className="inbox-hub__empty-cta">
                Find something to buy
              </Link>
            </div>
          ) : (
            <ul className="inbox-hub__list" data-transaction-hub="v1.0">
              {visibleConversations.map((conversation) => {
                const avatar = resolveInboxMessageAvatar(conversation);
                return (
                <li key={conversation.id}>
                  <Link
                    href={INBOX_ROUTES.conversation(conversation.id)}
                    className="inbox-hub__card"
                  >
                    <span className="inbox-hub__media">
                      {avatar.kind === "official-rx" ? (
                        <OfficialRovexoInboxMark />
                      ) : avatar.kind === "listing" ? (
                        <span className="inbox-hub__thumb">
                          <SafeImage
                            src={avatar.src}
                            alt={conversation.product.title}
                            fill
                            className="inbox-hub__thumb-img"
                            sizes="56px"
                            loading="lazy"
                          />
                        </span>
                      ) : (
                        <span className="inbox-hub__user-avatar" data-inbox-avatar="user">
                          <Avatar
                            src={avatar.src}
                            alt={conversation.participant.name}
                            name={conversation.participant.name}
                            size="lg"
                            className="inbox-hub__user-avatar-face"
                          />
                        </span>
                      )}
                    </span>
                    <span className="inbox-hub__card-body">
                      <span className="inbox-hub__card-top">
                        <span className="inbox-hub__product-title">
                          {conversation.product.title}
                        </span>
                        <time
                          className="inbox-hub__time"
                          dateTime={conversation.lastMessageAt}
                        >
                          {formatInboxRelativeTime(conversation.lastMessageAt)}
                        </time>
                      </span>
                      <span className="inbox-hub__party">
                        <span className="inbox-hub__party-name">
                          {conversation.participant.name}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "inbox-hub__preview",
                          conversation.unreadCount > 0 && "inbox-hub__preview--unread",
                        )}
                      >
                        {conversation.lastMessage}
                      </span>
                    </span>
                    <span className="inbox-hub__card-aside">
                      {conversation.unreadCount > 0 ? (
                        <span
                          className="inbox-hub__unread"
                          aria-label={`${conversation.unreadCount} unread`}
                        >
                          {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                        </span>
                      ) : null}
                      <ChevronRightLineIcon className="inbox-hub__chevron" />
                    </span>
                  </Link>
                </li>
                );
              })}
            </ul>
          )}
        </div>

        <div
          className="inbox-hub__pane"
          hidden={tab !== "notifications"}
          data-inbox-pane="notifications"
        >
          {showNotificationsSkeleton ? (
            <InboxListSkeleton variant="notifications" />
          ) : showNotificationsEmpty ? (
            <div className="inbox-hub__empty">
              <NotificationsEmptyIllustration className="inbox-hub__empty-illu" />
              <p className="inbox-hub__empty-title">You&apos;re all caught up</p>
            </div>
          ) : (
            <div className="inbox-hub__notif-feed">
              {visibleUnreadNotifications.length > 0 ? (
                <section className="inbox-hub__section" aria-label="Unread notifications">
                  <h2 className="inbox-hub__section-label">
                    UNREAD ({unreadNotifications.length})
                  </h2>
                  <ul className="inbox-hub__list">
                    {visibleUnreadNotifications.map((notification) => (
                      <InboxNotificationRow
                        key={notification.id}
                        notification={notification}
                        unreadRow
                        onOpen={openNotification}
                        listingImageSrc={resolveNotificationListingImageSrc(
                          notification,
                          listingImageIndex,
                        )}
                      />
                    ))}
                  </ul>
                </section>
              ) : null}
              {visibleEarlierNotifications.length > 0 ||
              (visibleUnreadNotifications.length === 0 && earlierNotifications.length > 0) ? (
                <ul className="inbox-hub__list" aria-label="Notifications">
                  {(visibleUnreadNotifications.length === 0
                    ? earlierNotifications.slice(0, notificationPage * PAGE_SIZE)
                    : visibleEarlierNotifications
                  ).map((notification) => (
                    <InboxNotificationRow
                      key={notification.id}
                      notification={notification}
                      unreadRow={false}
                      onOpen={openNotification}
                      listingImageSrc={resolveNotificationListingImageSrc(
                        notification,
                        listingImageIndex,
                      )}
                    />
                  ))}
                </ul>
              ) : null}
            </div>
          )}
        </div>

        {hasMore ? <div ref={sentinelRef} className="inbox-hub__sentinel" aria-hidden /> : null}
      </div>
    </AccountCanonicalShell>
  );
}
