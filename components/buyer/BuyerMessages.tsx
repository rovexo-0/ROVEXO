"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { BuyerEmptyState } from "@/components/buyer/BuyerEmptyState";
import { BuyerSection } from "@/components/buyer/BuyerSection";
import { useBuyerDashboard } from "@/hooks/buyer";

export function BuyerMessages() {
  const { data } = useBuyerDashboard();

  return (
    <BuyerSection id="buyer-messages" title="Messages" href="/messages">
      {data.conversations.length === 0 ? (
        <BuyerEmptyState title="No conversations yet" message="Messages with sellers appear here." />
      ) : (
        <div className="flex flex-col gap-3">
          {data.conversations.map((conversation) => (
            <Link key={conversation.id} href={`/messages/${conversation.id}`} className="buyer-list-card">
              <Avatar
                src={conversation.participant.avatarUrl}
                alt={conversation.participant.name}
                name={conversation.participant.name}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="buyer-list-card__title">{conversation.participant.name}</p>
                <p className="buyer-list-card__meta">{conversation.lastMessage}</p>
              </div>
              {conversation.unreadCount > 0 ? (
                <span className="buyer-header__badge-count">{conversation.unreadCount}</span>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </BuyerSection>
  );
}
