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
import { SafeImage } from "@/components/ui/SafeImage";
import {
  ChevronRightLineIcon,
  SearchLineIcon,
} from "@/components/icons/RvxLineIcons";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { NotificationLineIcon } from "@/features/notifications/icons-v1";
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
  mapNotificationCategory,
  parseInboxTab,
  subscribeInboxRealtime,
  type InboxTab,
} from "@/lib/inbox";
import "@/styles/rovexo/inbox-hub-v1.css";

const PAGE_SIZE = 20;
const SWIPE_THRESHOLD = 72;
const MAX_SWIPE = 140;

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

function SwipeableConversationRow({
  children,
  onMarkRead,
  onPin,
  onArchive,
  onDelete,
}: {
  children: ReactNode;
  onMarkRead: () => void;
  onPin: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const [offset, setOffset] = useState(0);
  const [animating, setAnimating] = useState(false);
  const startX = useRef(0);
  const dragging = useRef(false);
  const currentOffset = useRef(0);

  const reset = () => {
    currentOffset.current = 0;
    setAnimating(true);
    setOffset(0);
    window.setTimeout(() => setAnimating(false), 200);
  };

  return (
    <div className="inbox-hub__swipe">
      <div className="inbox-hub__swipe-actions inbox-hub__swipe-actions--left" aria-hidden>
        <button type="button" className="inbox-hub__swipe-btn inbox-hub__swipe-btn--read" onClick={onMarkRead}>
          Read
        </button>
        <button type="button" className="inbox-hub__swipe-btn inbox-hub__swipe-btn--pin" onClick={onPin}>
          Pin
        </button>
      </div>
      <div className="inbox-hub__swipe-actions inbox-hub__swipe-actions--right" aria-hidden>
        <button
          type="button"
          className="inbox-hub__swipe-btn inbox-hub__swipe-btn--archive"
          onClick={onArchive}
        >
          Archive
        </button>
        <button
          type="button"
          className="inbox-hub__swipe-btn inbox-hub__swipe-btn--delete"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
      <div
        className={cn("inbox-hub__swipe-front", animating && "inbox-hub__swipe-front--anim")}
        style={{
          transform: `translateX(${offset}px)`,
          transition: animating ? "transform 200ms ease" : undefined,
        }}
        onPointerDown={(event) => {
          dragging.current = true;
          startX.current = event.clientX - currentOffset.current;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!dragging.current) return;
          const next = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, event.clientX - startX.current));
          currentOffset.current = next;
          setOffset(next);
        }}
        onPointerUp={() => {
          if (!dragging.current) return;
          dragging.current = false;
          if (currentOffset.current >= SWIPE_THRESHOLD) {
            onMarkRead();
            reset();
            return;
          }
          if (currentOffset.current <= -SWIPE_THRESHOLD) {
            onArchive();
            reset();
            return;
          }
          reset();
        }}
        onPointerCancel={reset}
      >
        {children}
      </div>
    </div>
  );
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
  const { setNotifications, refresh, mobileBadges } = useRealtimeNotifications();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setLocalNotifications] = useState<Notification[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [hubError, setHubError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(searchParams.get("search") === "1");
  const [query, setQuery] = useState("");
  const [messagePage, setMessagePage] = useState(1);
  const [notificationPage, setNotificationPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
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
    return [...base].sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt));
  }, [conversations, query]);

  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((item) => matchesNotificationSearch(item, query))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [notifications, query]);

  const visibleConversations = filteredConversations.slice(0, messagePage * PAGE_SIZE);
  const visibleNotifications = filteredNotifications.slice(0, notificationPage * PAGE_SIZE);
  const hasMore =
    tab === "messages"
      ? visibleConversations.length < filteredConversations.length
      : visibleNotifications.length < filteredNotifications.length;

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
  }, [hasMore, tab, visibleConversations.length, visibleNotifications.length]);

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

  const openNotification = async (notification: Notification) => {
    if (!notification.read) await markNotificationRead([notification.id]);
    router.push(notification.href);
  };

  const searchAction: ReactNode = (
    <button
      type="button"
      className="inbox-hub__search-btn"
      aria-label={searchOpen ? "Close search" : "Search inbox"}
      aria-pressed={searchOpen}
      onClick={() => setSearchOpen((open) => !open)}
    >
      <SearchLineIcon />
      {unread.total > 0 && !searchOpen ? (
        <span className="inbox-hub__search-badge" aria-hidden>
          {unread.total > 99 ? "99+" : unread.total}
        </span>
      ) : null}
    </button>
  );

  const loading = tab === "messages" ? loadingMessages : loadingNotifications;

  return (
    <AccountCanonicalShell
      title="Inbox"
      showHeaderTitle
      backHref="/account"
      bottomNavTab="saved"
      rightAction={searchAction}
    >
      <div
        className="inbox-hub"
        data-inbox-hub={INBOX_CANONICAL_VERSION}
        data-inbox-freeze="FROZEN"
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

        {searchOpen ? (
          <div className="inbox-hub__search">
            <input
              className="inbox-hub__search-input"
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setMessagePage(1);
                setNotificationPage(1);
              }}
              placeholder="Search conversations, users, products, order ID…"
              aria-label="Search inbox"
              autoFocus
            />
          </div>
        ) : null}

        {loading ? (
          <InboxListSkeleton variant={tab === "messages" ? "messages" : "notifications"} />
        ) : tab === "messages" ? (
          filteredConversations.length === 0 ? (
            <div className="inbox-hub__empty">
              <MessagesEmptyIllustration className="inbox-hub__empty-illu" />
              <p className="inbox-hub__empty-title">No conversations yet</p>
              <Link href="/search" className="inbox-hub__empty-cta">
                Browse Marketplace
              </Link>
            </div>
          ) : (
            <ul className="inbox-hub__list">
              {visibleConversations.map((conversation) => (
                <li key={conversation.id}>
                  <SwipeableConversationRow
                    onMarkRead={() => void patchConversation(conversation.id, "read")}
                    onPin={() => void patchConversation(conversation.id, "pin")}
                    onArchive={() => void patchConversation(conversation.id, "archive")}
                    onDelete={() => void patchConversation(conversation.id, "delete")}
                  >
                    <Link
                      href={INBOX_ROUTES.conversation(conversation.id)}
                      className="inbox-hub__card"
                    >
                      <span className="inbox-hub__media">
                        <span className="inbox-hub__thumb">
                          <SafeImage
                            src={conversation.product.imageUrl}
                            alt={conversation.product.title}
                            fill
                            className="inbox-hub__thumb-img"
                            sizes="52px"
                          />
                        </span>
                      </span>
                      <span className="inbox-hub__card-body">
                        <span className="inbox-hub__card-top">
                          <span className="inbox-hub__product-title">{conversation.product.title}</span>
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
                          {conversation.lastMessage}
                        </span>
                      </span>
                      <span className="inbox-hub__card-aside">
                        {conversation.unreadCount > 0 ? (
                          <span className="inbox-hub__unread" aria-label={`${conversation.unreadCount} unread`}>
                            {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                          </span>
                        ) : null}
                        <ChevronRightLineIcon className="inbox-hub__chevron" />
                      </span>
                    </Link>
                  </SwipeableConversationRow>
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
          <ul className="inbox-hub__list">
            {visibleNotifications.map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  className="inbox-hub__notif-card"
                  data-category={mapNotificationCategory(notification.type)}
                  onClick={() => void openNotification(notification)}
                >
                  <span className="inbox-hub__notif-icon">
                    <NotificationLineIcon icon={notification.icon} />
                  </span>
                  <span className="inbox-hub__notif-body">
                    <span className="inbox-hub__notif-title">{notification.title}</span>
                    <span className="inbox-hub__notif-sub">{notification.subtitle}</span>
                    <time className="inbox-hub__notif-time" dateTime={notification.createdAt}>
                      {formatNotificationTime(notification.createdAt)}
                    </time>
                  </span>
                  <span className="inbox-hub__notif-aside">
                    {!notification.read ? (
                      <span className="inbox-hub__notif-dot" aria-label="Unread" />
                    ) : (
                      <span className="inbox-hub__notif-dot-spacer" />
                    )}
                    <ChevronRightLineIcon className="inbox-hub__chevron" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {hasMore ? <div ref={sentinelRef} className="inbox-hub__sentinel" aria-hidden /> : null}
      </div>
    </AccountCanonicalShell>
  );
}
