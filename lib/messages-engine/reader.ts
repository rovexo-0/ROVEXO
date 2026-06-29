import { listConversations, getConversationById } from "@/lib/messages/store";
import type { Conversation } from "@/lib/messages/types";
import { readLiveMessagesEngineDocument, getMessagesEngineSnapshotForAdmin } from "@/lib/messages-engine/engine";
import { MESSAGES_ENGINE_MODULES } from "@/lib/messages-engine/registry";
import {
  computeAverageResponseHours,
  computeResponseRate,
  mapConversationToSummary,
  matchesSearch,
  matchesSummaryFilter,
} from "@/lib/messages-engine/timeline";
import type {
  MessagesEngineAnalytics,
  MessagesEngineContext,
  MessagesEngineConversationContext,
  MessagesEngineFilterId,
  MessagesEngineConversationSummary,
  MessagesEngineSnapshot,
} from "@/lib/messages-engine/types";

export async function getPublicMessagesEngineConfig() {
  return readLiveMessagesEngineDocument();
}

export async function getMessagesEngineSnapshot(): Promise<MessagesEngineSnapshot> {
  const { draft, live, history } = await getMessagesEngineSnapshotForAdmin();
  return {
    scannedAt: new Date().toISOString(),
    modules: MESSAGES_ENGINE_MODULES,
    draft,
    live,
    history,
  };
}

export function computeMessagesAnalytics(conversations: Conversation[]): MessagesEngineAnalytics {
  const active = conversations.filter((c) => !c.archived && !c.blocked);
  const unreadMessages = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const blockedUsers = conversations.filter((c) => c.blocked).length;

  return {
    totalConversations: conversations.length,
    activeConversations: active.length,
    unreadMessages,
    averageResponseHours: computeAverageResponseHours(conversations),
    sellerResponseRate: computeResponseRate(conversations, "seller"),
    buyerResponseRate: computeResponseRate(conversations, "buyer"),
    supportResponseHours: computeAverageResponseHours(conversations),
    reportedConversations: 0,
    blockedUsers,
  };
}

export async function getMessagesEngineContext(userId: string): Promise<MessagesEngineContext> {
  const conversations = await listConversations(userId);
  const summaries = conversations.map(mapConversationToSummary);

  return {
    totalConversations: conversations.length,
    unreadCount: conversations.reduce((sum, c) => sum + c.unreadCount, 0),
    activeCount: conversations.filter((c) => !c.archived && !c.blocked).length,
    pinnedCount: conversations.filter((c) => c.pinned).length,
    archivedCount: conversations.filter((c) => c.archived).length,
    recentConversations: summaries.slice(0, 5),
  };
}

export async function getMessagesEngineConversationContext(
  conversationId: string,
  viewerId: string,
): Promise<MessagesEngineConversationContext | null> {
  const [conversation, config] = await Promise.all([
    getConversationById(conversationId, viewerId),
    readLiveMessagesEngineDocument(),
  ]);
  if (!conversation) return null;

  return {
    summary: mapConversationToSummary(conversation),
    messageCount: conversation.messages.length,
    ordersIntegrated: config.integrations.ordersEngine,
    listingsIntegrated: config.integrations.listingsEngine,
    shippingIntegrated: config.integrations.shippingEngine,
    protectionIntegrated: config.integrations.protectionEngine,
  };
}

export async function listMessagesEngineSummaries(
  userId: string,
  options?: { filter?: MessagesEngineFilterId; query?: string },
): Promise<MessagesEngineConversationSummary[]> {
  const conversations = await listConversations(userId);
  return conversations
    .map(mapConversationToSummary)
    .filter((summary) => (options?.filter ? matchesSummaryFilter(summary, options.filter) : true))
    .filter((summary) => (options?.query ? matchesSearch(options.query, summary) : true));
}

export async function getMessagesEngineAnalyticsForUser(userId: string): Promise<MessagesEngineAnalytics> {
  const conversations = await listConversations(userId);
  return computeMessagesAnalytics(conversations);
}
