"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { INBOX_ROUTES } from "@/lib/inbox/canonical-routes";
import {
  INBOX_CONVERSATION_VIEWPORT_PREFETCH_BUCKET,
  INBOX_CONVERSATION_VIEWPORT_PREFETCH_CAP,
  useViewportRoutePrefetch,
} from "@/lib/navigation/viewport-route-prefetch-v1";
import { cn } from "@/lib/cn";

/**
 * Inbox conversation row link — capped viewport RSC prefetch + intent prefetch on tap.
 * Keeps Link navigation + prefetch={false} (no uncapped Next Link prefetch).
 */
export function InboxConversationPrefetchLink({
  conversationId,
  className,
  unread,
  children,
}: {
  conversationId: string;
  className?: string;
  unread: boolean;
  children: ReactNode;
}) {
  const href = INBOX_ROUTES.conversation(conversationId);
  const {
    ref: prefetchRef,
    onPointerDown,
    onTouchStart,
  } = useViewportRoutePrefetch(href, {
    enabled: true,
    bucket: INBOX_CONVERSATION_VIEWPORT_PREFETCH_BUCKET,
    cap: INBOX_CONVERSATION_VIEWPORT_PREFETCH_CAP,
  });

  return (
    <Link
      ref={prefetchRef as (node: HTMLAnchorElement | null) => void}
      href={href}
      prefetch={false}
      onPointerDown={onPointerDown}
      onTouchStart={onTouchStart}
      className={cn(className)}
      data-inbox-unread={unread ? "true" : "false"}
    >
      {children}
    </Link>
  );
}
