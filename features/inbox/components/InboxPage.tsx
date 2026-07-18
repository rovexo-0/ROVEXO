"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type SVGProps,
} from "react";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { AccountIcon } from "@/components/account/AccountIcons";
import { CanonicalMenuRow } from "@/src/components/canonical";
import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";
import { enqueueOfflineNotificationAction } from "@/lib/notifications/offline-sync";
import { formatNotificationTime } from "@/lib/notifications/utils";
import type { Notification } from "@/lib/notifications/types";
import { formatMessageTime } from "@/lib/messages/utils";
import type { Conversation } from "@/lib/messages/types";
import { cn } from "@/lib/cn";
import {
  INBOX_CANONICAL_VERSION,
  INBOX_ROUTES,
  buildUnreadCounter,
  filterInboxConversations,
  mapNotificationCategory,
  parseInboxTab,
  subscribeInboxRealtime,
  type InboxTab,
} from "@/lib/inbox";
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
    <ul className="inbox-hub__list" aria-hidden>
      {Array.from({ length: 6 }).map((_, index) => (
        <li
          key={index}
          className={cn(
            "inbox-hub__skel",
            variant === "messages" ? "inbox-hub__skel--card" : "inbox-hub__skel--notif",
          )}
        />
      ))}
    </ul>
  );
}

export function InboxPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseInboxTab(searchParams.get("tab"));
  const messageFilter = searchParams.get("filter");
  const notificationCategory = searchParams.get("category");
  const { setNotifications, refresh, mobileBadges } = useRealtimeNotifications();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setLocalNotifications] = useState<Notification[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [hubError, setHubError] = useState<string | null>(null);
  const query = "";
  const [messagePage, setMessagePage] = useState(1);
  const [notificationPage, setNotificationPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const pullStartY = useRef<number | null>(null);

  const setTab = useCallback(
    (next: InboxTab) => {
      const href =
        next === "notifications" ? INBOX_ROUTES.notificationsTab : INBOX_ROUTES.messagesTab;
      router.replace(href);
    },
    [router],
  );

  const loadMessages = useCallback(async () => {
    const response = await fetch("/api/messages", { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as { conversations?: Conversation[] };
    setConversations(payload.conversations ?? []);
  }, []);

  const loadNotifications = useCallback(async () => {
    const response = await fetch("/api/notifications", { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as { notifications?: Notification[] };
    const next = payload.notifications ?? [];
    setLocalNotifications(next);
    setNotifications(next);
  }, [setNotifications]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [messagesResponse, notificationsResponse] = await Promise.all([
          fetch("/api/messages", { cache: "no-store" }),
          fetch("/api/notifications", { cache: "no-store" }),
        ]);

        if (cancelled) return;

        if (!messagesResponse.ok && !notificationsResponse.ok) {
          setHubError(
            typeof navigator !== "undefined" && !navigator.onLine
              ? "You’re offline."
              : "Unable to load Inbox.",
          );
          return;
        }

        setHubError(null);

        if (messagesResponse.ok) {
          const payload = (await messagesResponse.json()) as { conversations?: Conversation[] };
          if (!cancelled) setConversations(payload.conversations ?? []);
        }

        if (notificationsResponse.ok) {
          const payload = (await notificationsResponse.json()) as {
            notifications?: Notification[];
          };
          if (!cancelled) {
            const next = payload.notifications ?? [];
            setLocalNotifications(next);
            setNotifications(next);
          }
        }
      } catch {
        if (!cancelled) {
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
  }, [setNotifications]);

  useEffect(() => {
    const sub = subscribeInboxRealtime(() => {
      /* Sprint 2+: apply realtime patches */
    });
    return () => sub.unsubscribe();
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadMessages(), loadNotifications(), refresh()]);
    setRefreshing(false);
  }, [loadMessages, loadNotifications, refresh]);

  const unread = useMemo(() => {
    const messagesUnread = conversations.reduce(
      (sum, item) => sum + (item.archived ? 0 : item.unreadCount),
      0,
    );
    const notificationsUnread = notifications.filter((item) => !item.read).length;
    return buildUnreadCounter(
      loadingMessages ? mobileBadges.messages : messagesUnread,
      loadingNotifications ? mobileBadges.notifications : notificationsUnread,
    );
  }, [
    conversations,
    notifications,
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
    return [...filtered].sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt));
  }, [conversations, query, messageFilter]);

  const filteredNotifications = useMemo(() => {
    return notifications
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
  }, [notifications, query, notificationCategory]);

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
      setConversations((prev) =>
        prev.map((item) => (item.id === id ? { ...item, archived: true } : item)),
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
      setConversations((prev) =>
        prev.map((item) => (item.id === id ? payload.conversation! : item)),
      );
    } else if (action === "read") {
      setConversations((prev) =>
        prev.map((item) => (item.id === id ? { ...item, unreadCount: 0 } : item)),
      );
    }
  };

  const syncNotifications = (next: Notification[]) => {
    setLocalNotifications(next);
    setNotifications(next);
  };

  const markNotificationRead = async (ids: string[]) => {
    if (ids.length === 0) return;
    if (!navigator.onLine) {
      enqueueOfflineNotificationAction({ type: "mark_read", ids });
      syncNotifications(
        notifications.map((item) => (ids.includes(item.id) ? { ...item, read: true } : item)),
      );
      return;
    }
    const response = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, read: true }),
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { notifications: Notification[] };
    syncNotifications(payload.notifications);
    await refresh();
  };

  const markAllNotificationsRead = useCallback(async () => {
    if (!notifications.some((item) => !item.read)) return;
    setMarkingAllRead(true);
    try {
      if (!navigator.onLine) {
        const unreadIds = notifications.filter((item) => !item.read).map((item) => item.id);
        enqueueOfflineNotificationAction({ type: "mark_read", ids: unreadIds });
        const next = notifications.map((item) => ({ ...item, read: true }));
        setLocalNotifications(next);
        setNotifications(next);
        return;
      }
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (!response.ok) return;
      const payload = (await response.json()) as { notifications: Notification[] };
      setLocalNotifications(payload.notifications);
      setNotifications(payload.notifications);
      await refresh();
    } finally {
      setMarkingAllRead(false);
    }
  }, [notifications, refresh, setNotifications]);

  const openNotification = async (notification: Notification) => {
    if (!notification.read) await markNotificationRead([notification.id]);
    router.push(notification.href);
  };

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

  const loading = tab === "messages" ? loadingMessages : loadingNotifications;

  const renderNotificationRow = (notification: Notification, unreadRow: boolean) => (
    <li key={notification.id} className="list-none">
      <CanonicalMenuRow
        title={notification.title}
        description={formatNotificationTime(notification.createdAt)}
        onClick={() => void openNotification(notification)}
        badge={unreadRow ? 1 : undefined}
        icon={
          <span className="ac-canonical__menu-icon" aria-hidden>
            <AccountIcon name="notifications" />
          </span>
        }
      />
    </li>
  );

  return (
    <AccountCanonicalShell
      title="Inbox"
      showHeaderTitle
      backHref="/account"
      showBottomNav={false}
      rightAction={markAllAction}
    >
      <div
        className="inbox-hub"
        data-inbox-hub={INBOX_CANONICAL_VERSION}
        data-inbox-freeze="FINAL-LOCK"
        data-inbox-universal="v1.1-preview"
        data-inbox-realtime="foundation"
        onTouchStart={(event) => {
          if (window.scrollY <= 0) pullStartY.current = event.touches[0]?.clientY ?? null;
        }}
        onTouchEnd={(event) => {
          if (pullStartY.current == null) return;
          const endY = event.changedTouches[0]?.clientY ?? pullStartY.current;
          if (endY - pullStartY.current > 72) void refreshAll();
          pullStartY.current = null;
        }}
      >
        {refreshing ? <div className="inbox-hub__refresh">Refreshing…</div> : null}

        {hubError ? (
          <div className="inbox-hub__banner" role="alert">
            <span>{hubError}</span>
            <button
              type="button"
              onClick={() => {
                setLoadingMessages(true);
                setLoadingNotifications(true);
                setHubError(null);
                void refreshAll().finally(() => {
                  setLoadingMessages(false);
                  setLoadingNotifications(false);
                });
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

        {loading ? (
          <InboxListSkeleton variant={tab === "messages" ? "messages" : "notifications"} />
        ) : tab === "messages" ? (
          filteredConversations.length === 0 ? (
            <div className="inbox-hub__empty">
              <MessagesEmptyIllustration className="inbox-hub__empty-illu" />
              <p className="inbox-hub__empty-title">No conversations yet</p>
              <Link href="/search" className="inbox-hub__empty-cta">
                Find something to buy
              </Link>
            </div>
          ) : (
            <ul className="inbox-hub__list" data-transaction-hub="v1.0">
              {visibleConversations.map((conversation) => (
                <li key={conversation.id}>
                  <Link
                    href={INBOX_ROUTES.conversation(conversation.id)}
                    className="inbox-hub__card"
                  >
                    <span className="inbox-hub__card-body">
                      <span className="inbox-hub__card-top">
                        <span className="inbox-hub__product-title">
                          {conversation.product?.title ?? conversation.participant.name}
                        </span>
                        <time
                          className="inbox-hub__time"
                          dateTime={conversation.lastMessageAt}
                        >
                          {formatMessageTime(conversation.lastMessageAt)}
                        </time>
                      </span>
                      <span
                        className={cn(
                          "inbox-hub__preview",
                          conversation.unreadCount > 0 && "inbox-hub__preview--unread",
                        )}
                      >
                        {conversation.product?.title
                          ? `${conversation.participant.name} · ${conversation.lastMessage}`
                          : conversation.lastMessage}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )
        ) : filteredNotifications.length === 0 ? (
          <div className="inbox-hub__empty">
            <NotificationsEmptyIllustration className="inbox-hub__empty-illu" />
            <p className="inbox-hub__empty-title">You&apos;re all caught up</p>
          </div>
        ) : (
          <div className="inbox-hub__notif-sections">
            {visibleUnreadNotifications.length > 0 ? (
              <section className="inbox-hub__section" aria-label="Unread notifications">
                <h2 className="inbox-hub__section-label">
                  UNREAD ({unreadNotifications.length})
                </h2>
                <ul className="inbox-hub__list">
                  {visibleUnreadNotifications.map((notification) =>
                    renderNotificationRow(notification, true),
                  )}
                </ul>
              </section>
            ) : null}
            {visibleEarlierNotifications.length > 0 ||
            (visibleUnreadNotifications.length === 0 && earlierNotifications.length > 0) ? (
              <section className="inbox-hub__section" aria-label="Earlier notifications">
                <h2 className="inbox-hub__section-label">EARLIER</h2>
                <ul className="inbox-hub__list">
                  {(visibleUnreadNotifications.length === 0
                    ? earlierNotifications.slice(0, notificationPage * PAGE_SIZE)
                    : visibleEarlierNotifications
                  ).map((notification) => renderNotificationRow(notification, false))}
                </ul>
              </section>
            ) : null}
          </div>
        )}

        {hasMore ? <div ref={sentinelRef} className="inbox-hub__sentinel" aria-hidden /> : null}
      </div>
    </AccountCanonicalShell>
  );
}
