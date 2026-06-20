"use client";

import { useMemo, useState } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { ConversationCard } from "@/features/messages/components/ConversationCard";
import { MessagesEmptyState } from "@/features/messages/components/MessagesEmptyState";
import { SearchIcon } from "@/features/messages/icons";
import { filterConversations } from "@/lib/messages/utils";
import type { Conversation, MessageFilter } from "@/lib/messages/types";

const FILTERS: { id: MessageFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "buyers", label: "Buyers" },
  { id: "sellers", label: "Sellers" },
];

type MessagesListPageProps = {
  conversations: Conversation[];
};

export function MessagesListPage({ conversations }: MessagesListPageProps) {
  const [filter, setFilter] = useState<MessageFilter>("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const visibleConversations = useMemo(
    () => filterConversations(conversations, filter, query),
    [conversations, filter, query],
  );

  return (
    <BetaAppShell showBottomNav={false}>
      <header className="sticky top-0 z-50 border-b border-border bg-surface/95 shadow-ds-soft backdrop-blur-xl backdrop-saturate-150">
        <div className="flex items-center justify-between gap-ds-3 px-ds-4 pb-ds-3 pt-[max(env(safe-area-inset-top),var(--ds-space-3))]">
          <h1 className="min-w-0 truncate text-2xl font-bold text-text-primary">Messages</h1>
          <IconButton
            label={searchOpen ? "Close search" : "Search messages"}
            variant="ghost"
            size="md"
            onClick={() => setSearchOpen((current) => !current)}
          >
            <SearchIcon className="h-5 w-5" />
          </IconButton>
        </div>

        {searchOpen && (
          <div className="px-ds-4 pb-ds-3">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search conversations"
              className={cn(
                "min-h-ds-7 w-full rounded-ds-md border border-border bg-surface px-ds-3 py-ds-2 text-sm text-text-primary placeholder:text-text-muted",
                focusRing,
              )}
            />
          </div>
        )}

        <div className="flex gap-ds-2 overflow-x-auto px-ds-4 pb-ds-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((item) => (
            <CategoryChip
              key={item.id}
              label={item.label}
              active={filter === item.id}
              onClick={() => setFilter(item.id)}
            />
          ))}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-ds-3 px-ds-4 py-ds-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
        {visibleConversations.length === 0 ? (
          <MessagesEmptyState />
        ) : (
          visibleConversations.map((conversation) => (
            <ConversationCard key={conversation.id} conversation={conversation} />
          ))
        )}
      </main>
    </BetaAppShell>
  );
}
