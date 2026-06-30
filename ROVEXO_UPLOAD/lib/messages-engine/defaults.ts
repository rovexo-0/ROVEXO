import {
  MESSAGES_ENGINE_CONVERSATION_STATUSES,
  MESSAGES_ENGINE_CONVERSATION_TYPES,
  MESSAGES_ENGINE_FILTERS,
  MESSAGES_ENGINE_MESSAGE_STATUSES,
  MESSAGES_ENGINE_MESSAGE_TYPES,
  MESSAGES_ENGINE_SEARCH_SCOPES,
} from "@/lib/messages-engine/registry";
import type { MessagesEngineDocument, MessagesEngineHistoryEntry } from "@/lib/messages-engine/types";

const now = () => new Date().toISOString();

export const DEFAULT_MAX_IMAGE_MB = 10;
export const DEFAULT_MAX_VIDEO_MB = 50;
export const DEFAULT_MAX_DOCUMENT_MB = 25;

export function createDefaultMessagesEngineDocument(label = "ROVEXO Messages Engine"): MessagesEngineDocument {
  return {
    version: 1,
    updatedAt: now(),
    label,
    marketplaceVersion: "ROVEXO v1.0",
    primaryCountry: "United Kingdom",
    conversationTypes: MESSAGES_ENGINE_CONVERSATION_TYPES.map((t) => ({ ...t, enabled: true })),
    messageTypes: MESSAGES_ENGINE_MESSAGE_TYPES.map((t) => ({ ...t, enabled: t.id !== "voice-message" && t.id !== "video-call" })),
    conversationStatuses: MESSAGES_ENGINE_CONVERSATION_STATUSES.map((s) => ({ ...s, enabled: true })),
    messageStatuses: MESSAGES_ENGINE_MESSAGE_STATUSES.map((s) => ({ ...s, enabled: true })),
    filters: MESSAGES_ENGINE_FILTERS.map((f) => ({ ...f, enabled: true })),
    searchScopes: MESSAGES_ENGINE_SEARCH_SCOPES.map((s) => ({ ...s, enabled: true })),
    attachments: {
      maxImageMb: DEFAULT_MAX_IMAGE_MB,
      maxVideoMb: DEFAULT_MAX_VIDEO_MB,
      maxDocumentMb: DEFAULT_MAX_DOCUMENT_MB,
      allowedTypes: ["image/jpeg", "image/png", "image/webp", "video/mp4", "application/pdf"],
    },
    notifications: createDefaultNotifications(),
    moderation: {
      spamDetection: true,
      abuseDetection: true,
      profanityFilter: true,
      maliciousLinkDetection: true,
      rateLimiting: true,
      userReports: true,
      conversationLock: true,
      adminReview: true,
    },
    aiAssistant: {
      globalEnabled: false,
      automaticTranslation: true,
      conversationSummaries: true,
      spamDetection: true,
      suggestedReplies: true,
      messageClassification: true,
      supportRecommendations: true,
      execution: "local",
    },
    integrations: {
      ordersEngine: true,
      listingsEngine: true,
      shippingEngine: true,
      protectionEngine: true,
      walletEngine: true,
      paymentsEngine: true,
      notifications: true,
      analytics: true,
    },
    futureReady: [
      "Voice Messages",
      "Video Messages",
      "Voice Calls",
      "Video Calls",
      "Screen Sharing",
      "Group Conversations",
      "Business Channels",
      "Broadcast Messages",
      "AI Assistant",
      "Automatic Translation",
      "Message Reactions",
      "Emoji Packs",
      "Marketplace Communities",
    ],
    auditLog: [],
  };
}

export function createDefaultMessagesEngineHistory(): MessagesEngineHistoryEntry[] {
  return [];
}

function createDefaultNotifications(): MessagesEngineDocument["notifications"] {
  return [
    { id: "push-new", channel: "push", event: "new_message", enabled: true },
    { id: "desktop-new", channel: "desktop", event: "new_message", enabled: true },
    { id: "email-digest", channel: "email", event: "unread_digest", enabled: true },
    { id: "silent-typing", channel: "silent", event: "typing", enabled: true },
    { id: "priority-support", channel: "priority", event: "support_escalation", enabled: true },
    { id: "push-tracking", channel: "push", event: "tracking_update", enabled: true },
    { id: "push-dispute", channel: "push", event: "dispute_message", enabled: true },
    { id: "push-report", channel: "push", event: "report_received", enabled: true },
  ];
}
