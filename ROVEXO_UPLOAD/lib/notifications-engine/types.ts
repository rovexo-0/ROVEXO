export type NotificationsEngineTypeId =
  | "system"
  | "buyer"
  | "seller"
  | "business"
  | "administrator"
  | "security"
  | "marketing"
  | "support"
  | "platform";

export type NotificationsEngineChannelId =
  | "in-app"
  | "push"
  | "email"
  | "browser"
  | "sms"
  | "whatsapp"
  | "telegram"
  | "teams"
  | "slack";

export type NotificationsEnginePriorityId =
  | "information"
  | "success"
  | "warning"
  | "important"
  | "critical"
  | "emergency";

export type NotificationsEngineEventId =
  | "account-created"
  | "verification-completed"
  | "listing-published"
  | "listing-sold"
  | "offer-received"
  | "offer-accepted"
  | "offer-declined"
  | "new-message"
  | "order-created"
  | "payment-authorized"
  | "payment-failed"
  | "refund-issued"
  | "protection-activated"
  | "case-opened"
  | "shipping-label-created"
  | "parcel-collected"
  | "tracking-updated"
  | "out-for-delivery"
  | "delivered"
  | "order-completed"
  | "wallet-updated"
  | "withdrawal-approved"
  | "withdrawal-completed"
  | "review-received"
  | "system-maintenance"
  | "security-alert"
  | "admin-announcement";

export type NotificationsEngineFilterId =
  | "all"
  | "unread"
  | "read"
  | "messages"
  | "orders"
  | "payments"
  | "shipping"
  | "protection"
  | "security"
  | "system";

export type NotificationsEngineTemplateId =
  | "order"
  | "payment"
  | "shipping"
  | "wallet"
  | "protection"
  | "message"
  | "review"
  | "security"
  | "marketing"
  | "maintenance"
  | "system";

export type NotificationsEngineBadgeSurfaceId =
  | "homepage"
  | "messages"
  | "orders"
  | "wallet"
  | "notifications"
  | "saved"
  | "protection"
  | "support"
  | "account"
  | "super-admin";

export type NotificationsEngineBadgeColorId =
  | "blue"
  | "green"
  | "orange"
  | "red"
  | "purple"
  | "critical-flash";

export type NotificationsEngineModule = {
  id: string;
  label: string;
  icon: string;
  description: string;
  href: string;
};

export type NotificationsEngineNotificationSummary = {
  notificationId: string;
  legacyType: string;
  enterpriseType: NotificationsEngineTypeId;
  priority: NotificationsEnginePriorityId;
  title: string;
  subtitle: string;
  href: string;
  read: boolean;
  createdAt: string;
  filterTags: NotificationsEngineFilterId[];
};

export type NotificationsEngineAnalytics = {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  dismissed: number;
  failed: number;
  responseRate: number;
  averageOpenMinutes: number;
  deliveryPerformance: number;
};

export type NotificationsEngineHistoryEntry = {
  id: string;
  publishedAt: string;
  publishedBy?: string;
  label: string;
  bundle?: NotificationsEngineDocument;
  rollbackAvailable: boolean;
};

export type NotificationsEngineAuditEntry = {
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

export type NotificationsEngineDocument = {
  version: number;
  updatedAt: string;
  label: string;
  marketplaceVersion: string;
  primaryCountry: string;
  notificationTypes: { id: NotificationsEngineTypeId; label: string; enabled: boolean }[];
  channels: { id: NotificationsEngineChannelId; label: string; enabled: boolean }[];
  priorities: { id: NotificationsEnginePriorityId; label: string; enabled: boolean }[];
  events: { id: NotificationsEngineEventId; label: string; enabled: boolean }[];
  filters: { id: NotificationsEngineFilterId; label: string; enabled: boolean }[];
  templates: { id: NotificationsEngineTemplateId; label: string; enabled: boolean }[];
  badgeSurfaces: { id: NotificationsEngineBadgeSurfaceId; label: string; color: NotificationsEngineBadgeColorId; enabled: boolean }[];
  userPreferences: {
    enablePush: boolean;
    enableEmail: boolean;
    enableBrowser: boolean;
    enableMarketing: boolean;
    enableSystemAlerts: boolean;
    enableOrderAlerts: boolean;
    enablePaymentAlerts: boolean;
    enableShippingAlerts: boolean;
    enableProtectionAlerts: boolean;
    enableMessageAlerts: boolean;
    enableSecurityAlerts: boolean;
    doNotDisturb: boolean;
    quietHours: boolean;
  };
  adminAlerts: {
    platformErrors: boolean;
    paymentErrors: boolean;
    shippingFailures: boolean;
    walletErrors: boolean;
    securityAlerts: boolean;
    serverHealth: boolean;
    databaseHealth: boolean;
    apiHealth: boolean;
    failedJobs: boolean;
    fraudAlerts: boolean;
    pendingDisputes: boolean;
  };
  aiAssistant: {
    globalEnabled: boolean;
    prioritization: boolean;
    duplicateDetection: boolean;
    smartRouting: boolean;
    deliveryOptimization: boolean;
    summaries: boolean;
    suggestedNotifications: boolean;
    execution: "local" | "cloud" | "hybrid";
  };
  integrations: {
    messagesEngine: boolean;
    ordersEngine: boolean;
    shippingEngine: boolean;
    walletEngine: boolean;
    paymentsEngine: boolean;
    protectionEngine: boolean;
    listings: boolean;
    authentication: boolean;
    reviews: boolean;
    supportCenter: boolean;
    analytics: boolean;
  };
  futureReady: string[];
  auditLog: NotificationsEngineAuditEntry[];
};

export type NotificationsEngineSnapshot = {
  scannedAt: string;
  modules: NotificationsEngineModule[];
  draft: NotificationsEngineDocument;
  live: NotificationsEngineDocument;
  history: NotificationsEngineHistoryEntry[];
};

export type NotificationsEngineContext = {
  totalNotifications: number;
  unreadCount: number;
  readCount: number;
  badgeCounts: Record<string, number>;
  recentNotifications: NotificationsEngineNotificationSummary[];
};

export type NotificationsEngineNotificationContext = {
  summary: NotificationsEngineNotificationSummary;
  messagesIntegrated: boolean;
  ordersIntegrated: boolean;
  shippingIntegrated: boolean;
  walletIntegrated: boolean;
  paymentsIntegrated: boolean;
  protectionIntegrated: boolean;
};
