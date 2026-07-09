"use client";

import Link from "next/link";
import { HubPageMain } from "@/components/layout/HubPageMain";
import { useMemo, useState } from "react";
import { ModuleIcon } from "@/components/icons/ModuleIcon";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { ConversationCard } from "@/features/messages/components/ConversationCard";
import { MessagesEmptyState } from "@/features/messages/components/MessagesEmptyState";
import { cn } from "@/lib/cn";
import { filterConversations } from "@/lib/messages/utils";
import { MESSAGES_ENGINE_FILTERS } from "@/lib/messages-engine/registry";
import type {
  MessagesEngineAnalytics,
  MessagesEngineContext,
  MessagesEngineDocument,
  MessagesEngineFilterId,
  MessagesEngineModule,
  MessagesEngineConversationSummary,
} from "@/lib/messages-engine/types";
import type { Conversation, MessageFilter } from "@/lib/messages/types";

type MessagesEngineHubProps = {
  config: MessagesEngineDocument;
  context: MessagesEngineContext;
  modules: MessagesEngineModule[];
  summaries: MessagesEngineConversationSummary[];
  analytics: MessagesEngineAnalytics;
  conversations: Conversation[];
};

type HubTab = "conversations" | "overview" | "analytics" | "search" | "attachments" | "moderation";

const LEGACY_FILTERS: { id: MessageFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "buyers", label: "Buyers" },
  { id: "sellers", label: "Sellers" },
];

export function MessagesEngineHub({
  config,
  context,
  modules,
  summaries,
  analytics,
  conversations,
}: MessagesEngineHubProps) {
  const [tab, setTab] = useState<HubTab>("conversations");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MessageFilter>("all");
  const [engineFilter, setEngineFilter] = useState<MessagesEngineFilterId>("all");

  const visibleConversations = useMemo(
    () => filterConversations(conversations, filter, query),
    [conversations, filter, query],
  );

  const filteredSummaries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return summaries.filter((item) => {
      const matchesQuery =
        !q ||
        item.participantName.toLowerCase().includes(q) ||
        item.lastMessage.toLowerCase().includes(q) ||
        item.productTitle.toLowerCase().includes(q);
      if (!matchesQuery) return false;
      if (engineFilter === "all") return true;
      return item.filterTags.includes(engineFilter);
    });
  }, [summaries, query, engineFilter]);

  return (
    <BetaAppShell showBottomNav={false}>
      <header className="me-hub__header sticky top-0 z-50">
        <div className="flex items-center justify-between gap-ds-3 px-ds-4 pb-ds-2 pt-[max(env(safe-area-inset-top),var(--ds-space-3))]">
          <div>
            <p className="me-hub__eyebrow">Messages Engine</p>
            <h1 className="min-w-0 truncate text-2xl font-bold text-text-primary">Messages</h1>
            <p className="text-sm text-text-muted">
              {config.marketplaceVersion} · {config.primaryCountry} · {context.unreadCount} unread
            </p>
          </div>
        </div>

        <div className="me-hub__tabs px-ds-4 pb-ds-3">
          {(
            [
              { id: "conversations", label: "Conversations" },
              { id: "overview", label: "Overview" },
              { id: "analytics", label: "Analytics" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn("me-hub__tab", tab === item.id && "me-hub__tab--active")}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <HubPageMain withBottomNav={false} className="me-hub mx-auto flex w-full max-w-2xl flex-col gap-ds-4 px-ds-4 py-ds-4 ">
        {tab === "analytics" ? (
          <section className="me-panel">
            <div className="me-analytics-grid">
              <MetricCard label="Total conversations" value={analytics.totalConversations} />
              <MetricCard label="Active" value={analytics.activeConversations} />
              <MetricCard label="Unread messages" value={analytics.unreadMessages} />
              <MetricCard label="Avg response" value={`${analytics.averageResponseHours}h`} />
              <MetricCard label="Seller response rate" value={`${(analytics.sellerResponseRate * 100).toFixed(0)}%`} />
              <MetricCard label="Buyer response rate" value={`${(analytics.buyerResponseRate * 100).toFixed(0)}%`} />
              <MetricCard label="Blocked users" value={analytics.blockedUsers} />
              <MetricCard label="Reported" value={analytics.reportedConversations} />
            </div>
          </section>
        ) : tab === "overview" ? (
          <>
            <section className="me-comm-banner">
              <p className="font-semibold">Secure marketplace communication between buyers, sellers, and administrators.</p>
              <p className="mt-ds-2 text-sm text-text-secondary">
                Real-time messaging · Attachments · Order & shipping integration · Purchase protection case chat
              </p>
            </section>
            <section className="me-panel">
              <h2 className="me-panel__title">Communication Flow</h2>
              <p className="text-sm text-text-secondary">
                Listing → Start Conversation → Real-Time Chat → Order Updates → Shipping → Protection → Resolution
              </p>
              <div className="me-stats-grid mt-ds-4">
                <StatChip label="Total" value={context.totalConversations} />
                <StatChip label="Active" value={context.activeCount} />
                <StatChip label="Pinned" value={context.pinnedCount} />
                <StatChip label="Archived" value={context.archivedCount} />
              </div>
            </section>
            <ConversationSummaryList summaries={context.recentConversations} title="Recent conversations" />
            <section className="me-panel">
              <h2 className="me-panel__title">Integrations</h2>
              <div className="me-module-grid">
                {modules.slice(3).map((module) => (
                  <Link key={module.id} href={module.href} className="me-module-card">
                    <ModuleIcon href={module.href} id={module.id} />
                    <span className="font-semibold">{module.label}</span>
                  </Link>
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            <input
              className="me-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations, users, listings…"
              type="search"
            />
            <div className="flex gap-ds-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {LEGACY_FILTERS.map((item) => (
                <CategoryChip
                  key={item.id}
                  label={item.label}
                  active={filter === item.id}
                  onClick={() => setFilter(item.id)}
                />
              ))}
            </div>
            <div className="me-chip-row">
              {MESSAGES_ENGINE_FILTERS.filter((f) => f.id !== "all").map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={cn("me-chip", engineFilter === item.id && "me-chip--active")}
                  onClick={() => setEngineFilter(engineFilter === item.id ? "all" : item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {visibleConversations.length === 0 ? (
              <MessagesEmptyState />
            ) : (
              <div className="flex flex-col gap-ds-3">
                {visibleConversations.map((conversation) => (
                  <ConversationCard key={conversation.id} conversation={conversation} />
                ))}
              </div>
            )}
            {filteredSummaries.length > 0 && engineFilter !== "all" ? (
              <ConversationSummaryList summaries={filteredSummaries} title="Engine filter matches" />
            ) : null}
          </>
        )}
      </HubPageMain>
    </BetaAppShell>
  );
}

function ConversationSummaryList({
  summaries,
  title,
}: {
  summaries: MessagesEngineConversationSummary[];
  title: string;
}) {
  return (
    <section className="me-panel">
      <h2 className="me-panel__title">{title}</h2>
      <div className="me-list">
        {summaries.length === 0 ? <p className="text-sm text-text-muted">No conversations yet.</p> : null}
        {summaries.map((item) => (
          <Link key={item.conversationId} href={`/messages/${item.conversationId}`} className="me-list__row me-list__row--link">
            <div>
              <p className="font-semibold">{item.participantName}</p>
              <p className="text-sm text-text-secondary">
                {item.enterpriseStatus} · {item.productTitle}
              </p>
            </div>
            {item.unreadCount > 0 ? (
              <span className="me-chip me-chip--active">{item.unreadCount}</span>
            ) : (
              <span className="text-xs text-text-muted">{item.lastMessage.slice(0, 40)}</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="me-metric-card">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="me-metric-card__value">{value}</p>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="me-stat-chip">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
