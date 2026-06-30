export type MessagesEngineConversationTypeId =
  | "buyer-seller"
  | "buyer-business"
  | "seller-buyer"
  | "seller-administrator"
  | "business-customer"
  | "administrator-user"
  | "support"
  | "order"
  | "dispute"
  | "system";

export type MessagesEngineMessageTypeId =
  | "text"
  | "image"
  | "video"
  | "pdf"
  | "documents"
  | "location"
  | "product-card"
  | "listing-share"
  | "order-share"
  | "tracking-update"
  | "system"
  | "voice-message"
  | "video-call";

export type MessagesEngineConversationStatusId =
  | "new"
  | "active"
  | "archived"
  | "muted"
  | "pinned"
  | "blocked"
  | "reported"
  | "deleted";

export type MessagesEngineMessageStatusId =
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "edited"
  | "deleted"
  | "failed";

export type MessagesEngineFilterId =
  | "all"
  | "unread"
  | "active"
  | "archived"
  | "pinned"
  | "muted"
  | "blocked"
  | "reported";

export type MessagesEngineSearchScopeId =
  | "conversations"
  | "users"
  | "listings"
  | "orders"
  | "attachments"
  | "messages";

export type MessagesEngineModule = {
  id: string;
  label: string;
  icon: string;
  description: string;
  href: string;
};

export type MessagesEngineConversationSummary = {
  conversationId: string;
  conversationType: MessagesEngineConversationTypeId;
  enterpriseStatus: MessagesEngineConversationStatusId;
  participantName: string;
  participantRole: "buyer" | "seller";
  productTitle: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  pinned: boolean;
  archived: boolean;
  muted: boolean;
  blocked: boolean;
  online: boolean;
  filterTags: MessagesEngineFilterId[];
};

export type MessagesEngineAnalytics = {
  totalConversations: number;
  activeConversations: number;
  unreadMessages: number;
  averageResponseHours: number;
  sellerResponseRate: number;
  buyerResponseRate: number;
  supportResponseHours: number;
  reportedConversations: number;
  blockedUsers: number;
};

export type MessagesEngineNotificationTemplate = {
  id: string;
  channel: "push" | "desktop" | "email" | "silent" | "priority";
  event: string;
  enabled: boolean;
};

export type MessagesEngineHistoryEntry = {
  id: string;
  publishedAt: string;
  publishedBy?: string;
  label: string;
  bundle?: MessagesEngineDocument;
  rollbackAvailable: boolean;
};

export type MessagesEngineAuditEntry = {
  id: string;
  administrator: string;
  timestamp: string;
  module: string;
  component?: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  rollbackAvailable: boolean;
};

export type MessagesEngineDocument = {
  version: number;
  updatedAt: string;
  label: string;
  marketplaceVersion: string;
  primaryCountry: string;
  conversationTypes: { id: MessagesEngineConversationTypeId; label: string; enabled: boolean }[];
  messageTypes: { id: MessagesEngineMessageTypeId; label: string; enabled: boolean }[];
  conversationStatuses: { id: MessagesEngineConversationStatusId; label: string; enabled: boolean }[];
  messageStatuses: { id: MessagesEngineMessageStatusId; label: string; enabled: boolean }[];
  filters: { id: MessagesEngineFilterId; label: string; enabled: boolean }[];
  searchScopes: { id: MessagesEngineSearchScopeId; label: string; enabled: boolean }[];
  attachments: {
    maxImageMb: number;
    maxVideoMb: number;
    maxDocumentMb: number;
    allowedTypes: string[];
  };
  notifications: MessagesEngineNotificationTemplate[];
  moderation: {
    spamDetection: boolean;
    abuseDetection: boolean;
    profanityFilter: boolean;
    maliciousLinkDetection: boolean;
    rateLimiting: boolean;
    userReports: boolean;
    conversationLock: boolean;
    adminReview: boolean;
  };
  aiAssistant: {
    globalEnabled: boolean;
    automaticTranslation: boolean;
    conversationSummaries: boolean;
    spamDetection: boolean;
    suggestedReplies: boolean;
    messageClassification: boolean;
    supportRecommendations: boolean;
    execution: "local" | "cloud" | "hybrid";
  };
  integrations: {
    ordersEngine: boolean;
    listingsEngine: boolean;
    shippingEngine: boolean;
    protectionEngine: boolean;
    walletEngine: boolean;
    paymentsEngine: boolean;
    notifications: boolean;
    analytics: boolean;
  };
  futureReady: string[];
  auditLog: MessagesEngineAuditEntry[];
};

export type MessagesEngineSnapshot = {
  scannedAt: string;
  modules: MessagesEngineModule[];
  draft: MessagesEngineDocument;
  live: MessagesEngineDocument;
  history: MessagesEngineHistoryEntry[];
};

export type MessagesEngineContext = {
  totalConversations: number;
  unreadCount: number;
  activeCount: number;
  pinnedCount: number;
  archivedCount: number;
  recentConversations: MessagesEngineConversationSummary[];
};

export type MessagesEngineConversationContext = {
  summary: MessagesEngineConversationSummary;
  messageCount: number;
  ordersIntegrated: boolean;
  listingsIntegrated: boolean;
  shippingIntegrated: boolean;
  protectionIntegrated: boolean;
};
