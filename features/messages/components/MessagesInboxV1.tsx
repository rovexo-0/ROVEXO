"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { NotificationsBellLink } from "@/components/header/NotificationsBellLink";
import { RvxTopBar, RvxTopBarIconLink } from "@/components/header/RvxTopBar";
import { ComposeLineIcon, SearchLineIcon } from "@/components/icons/RvxLineIcons";
import { Avatar } from "@/components/ui/Avatar";
import { MessagesEmptyState } from "@/features/messages/components/MessagesEmptyState";
import { formatMessageTime } from "@/lib/messages/utils";
import type { Conversation } from "@/lib/messages/types";

function ConversationRow({ conversation }: { conversation: Conversation }) {
  const { participant, lastMessage, lastMessageAt, unreadCount } = conversation;

  return (
    <Link href={`/messages/${conversation.id}`} className="msg-row">
      <Avatar
        src={participant.avatarUrl}
        alt={participant.name}
        name={participant.name}
        size="lg"
        className="msg-row__avatar"
      />
      <div className="msg-row__body">
        <div className="msg-row__top">
          <span className="msg-row__name">{participant.name}</span>
          <time className="msg-row__time" dateTime={lastMessageAt}>
            {formatMessageTime(lastMessageAt)}
          </time>
        </div>
        <div className="msg-row__bottom">
          <span className={unreadCount > 0 ? "msg-row__preview msg-row__preview--unread" : "msg-row__preview"}>
            {lastMessage}
          </span>
          {unreadCount > 0 ? (
            <span className="msg-row__badge" aria-label={`${unreadCount} unread`}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function MessagesListSkeleton() {
  return (
    <ul className="msg-v1__list" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <li key={index} className="msg-row" style={{ pointerEvents: "none" }}>
          <span className="msg-row__avatar h-12 w-12 rounded-full bg-[var(--ds-color-surface-muted)]" />
          <span className="msg-row__body flex flex-col gap-2">
            <span className="h-4 w-2/3 rounded bg-[var(--ds-color-surface-muted)]" />
            <span className="h-3 w-full rounded bg-[var(--ds-color-surface-muted)]" />
          </span>
        </li>
      ))}
    </ul>
  );
}

type MessagesInboxV1Props = {
  initialConversations?: Conversation[];
};

export function MessagesInboxV1({ initialConversations = [] }: MessagesInboxV1Props) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [loading, setLoading] = useState(initialConversations.length === 0);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/messages", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { conversations?: Conversation[] } | null) => {
        if (!cancelled && payload?.conversations) {
          setConversations(payload.conversations);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <BetaAppShell className="msg-v1-shell">
      <div className="msg-v1" data-messages-version="v1.0">
        <RvxTopBar>
          <RvxTopBarIconLink href="/search" label="Search">
            <SearchLineIcon />
          </RvxTopBarIconLink>
          <NotificationsBellLink />
        </RvxTopBar>

        <div className="msg-v1__titlebar">
          <h1 className="msg-v1__title">Messages</h1>
          <Link href="/search" className="msg-v1__compose" aria-label="Start a new conversation">
            <ComposeLineIcon />
          </Link>
        </div>

        {loading ? (
          <MessagesListSkeleton />
        ) : conversations.length === 0 ? (
          <div className="mx-auto w-full max-w-[640px] px-5 py-10">
            <MessagesEmptyState />
          </div>
        ) : (
          <ul className="msg-v1__list">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <ConversationRow conversation={conversation} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </BetaAppShell>
  );
}
