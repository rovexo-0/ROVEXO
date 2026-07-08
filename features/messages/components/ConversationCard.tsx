"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { formatMessageTime } from "@/lib/messages/utils";
import type { Conversation } from "@/lib/messages/types";

type ConversationCardProps = {
  conversation: Conversation;
};

export function ConversationCard({ conversation }: ConversationCardProps) {
  const { participant, product, lastMessage, lastMessageAt, unreadCount } = conversation;

  return (
    <Link href={`/messages/${conversation.id}`} className="block">
      <Card padding="sm" interactive className="min-h-[56px]">
        <div className="flex items-center gap-ds-3">
          <Avatar
            src={participant.avatarUrl}
            alt={participant.name}
            name={participant.name}
            size="md"
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-ds-2">
              <p className="truncate text-sm font-semibold text-text-primary">{participant.name}</p>
              <time
                dateTime={lastMessageAt}
                className="shrink-0 text-xs text-text-muted"
              >
                {formatMessageTime(lastMessageAt)}
              </time>
            </div>

            <p className="mt-0.5 line-clamp-1 text-sm text-text-secondary">{lastMessage}</p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-ds-2">
            <div className="relative h-11 w-11 overflow-hidden rounded-ds-md bg-surface-muted">
              <SafeImage
                src={product.imageUrl}
                alt={product.title}
                fill
                className="object-cover"
                sizes="44px"
              />
            </div>

            {unreadCount > 0 && (
              <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-ds-full bg-primary px-ds-1 text-[0.625rem] font-bold text-primary-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
