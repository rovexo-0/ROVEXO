export type ProtectionEngineCaseTypeId =
  | "item-not-received"
  | "item-damaged"
  | "not-as-described"
  | "wrong-item"
  | "missing-parts"
  | "counterfeit"
  | "incomplete-order"
  | "lost-shipment"
  | "return-issue"
  | "payment-issue"
  | "other";

export type ProtectionEngineCaseStatusId =
  | "draft"
  | "submitted"
  | "under-review"
  | "waiting-for-buyer"
  | "waiting-for-seller"
  | "evidence-requested"
  | "evidence-received"
  | "admin-investigation"
  | "resolution-proposed"
  | "resolved"
  | "refund-approved"
  | "partial-refund"
  | "rejected"
  | "appealed"
  | "closed";

export type ProtectionEngineResolutionType =
  | "full-refund"
  | "partial-refund"
  | "replacement"
  | "return-required"
  | "return-not-required"
  | "seller-wins"
  | "buyer-wins"
  | "mutual-agreement"
  | "administrative-resolution";

export type ProtectionEngineEvidenceType =
  | "photos"
  | "videos"
  | "pdf"
  | "invoices"
  | "shipping-labels"
  | "tracking-screenshots"
  | "chat-history"
  | "carrier-documents"
  | "other";

export type ProtectionEngineFilterId =
  | "open"
  | "under-review"
  | "waiting"
  | "evidence"
  | "resolved"
  | "refunded"
  | "rejected"
  | "appealed"
  | "closed";

export type ProtectionEngineProtectionPhase =
  | "inactive"
  | "activated"
  | "review-period"
  | "disputed"
  | "released";

export type ProtectionEngineModule = {
  id: string;
  label: string;
  icon: string;
  description: string;
  href: string;
};

export type ProtectionEngineTimelineEventId =
  | "case-created"
  | "evidence-uploaded"
  | "seller-response"
  | "admin-review"
  | "additional-evidence"
  | "decision"
  | "refund"
  | "wallet-update"
  | "case-closed";

export type ProtectionEngineTimelineEvent = {
  id: ProtectionEngineTimelineEventId;
  label: string;
  timestamp?: string;
  done: boolean;
  current: boolean;
};

export type ProtectionEngineCaseSummary = {
  caseId: string;
  orderId: string;
  caseType: string;
  enterpriseStatus: ProtectionEngineCaseStatusId;
  legacyStatus: string;
  reason: string;
  outcome: string;
  refundAmount: number | null;
  role: "buyer" | "seller";
  createdAt: string;
  resolvedAt?: string | null;
  filterTags: ProtectionEngineFilterId[];
};

export type ProtectionEngineAnalytics = {
  openCases: number;
  closedCases: number;
  refundValue: number;
  partialRefunds: number;
  averageResolutionDays: number;
  buyerSatisfaction: number;
  sellerPerformance: number;
  protectionCost: number;
  disputeRate: number;
};

export type ProtectionEngineNotificationTemplate = {
  id: string;
  audience: "buyer" | "seller" | "administrator";
  event: string;
  enabled: boolean;
};

export type ProtectionEngineHistoryEntry = {
  id: string;
  publishedAt: string;
  publishedBy?: string;
  label: string;
  bundle?: ProtectionEngineDocument;
  rollbackAvailable: boolean;
};

export type ProtectionEngineAuditEntry = {
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

export type ProtectionEngineDocument = {
  version: number;
  updatedAt: string;
  label: string;
  marketplaceVersion: string;
  primaryCountry: string;
  currency: string;
  caseTypes: { id: ProtectionEngineCaseTypeId; label: string; enabled: boolean }[];
  caseStatuses: { id: ProtectionEngineCaseStatusId; label: string; enabled: boolean }[];
  resolutionTypes: { id: ProtectionEngineResolutionType; label: string; enabled: boolean }[];
  evidenceTypes: { id: ProtectionEngineEvidenceType; label: string; enabled: boolean }[];
  filters: { id: ProtectionEngineFilterId; label: string; enabled: boolean }[];
  notifications: ProtectionEngineNotificationTemplate[];
  analyticsEnabled: boolean;
  abuseDetection: {
    repeatedClaims: boolean;
    highRefundFrequency: boolean;
    suspiciousActivity: boolean;
    duplicateClaims: boolean;
    fraudIndicators: boolean;
    manualReviewQueue: boolean;
  };
  aiAssistant: {
    globalEnabled: boolean;
    caseSummaries: boolean;
    evidenceOrganization: boolean;
    duplicateCaseDetection: boolean;
    riskScoring: boolean;
    resolutionRecommendations: boolean;
    fraudIndicators: boolean;
    execution: "local" | "cloud" | "hybrid";
  };
  integrations: {
    ordersEngine: boolean;
    shippingEngine: boolean;
    walletEngine: boolean;
    paymentsEngine: boolean;
    notifications: boolean;
    analytics: boolean;
  };
  protectionRules: {
    beginsAfterPayment: boolean;
    releaseOnBuyerConfirm: boolean;
    releaseOnAutoPeriod: boolean;
    releaseOnDisputeResolved: boolean;
  };
  futureReady: string[];
  auditLog: ProtectionEngineAuditEntry[];
};

export type ProtectionEngineSnapshot = {
  scannedAt: string;
  modules: ProtectionEngineModule[];
  draft: ProtectionEngineDocument;
  live: ProtectionEngineDocument;
  history: ProtectionEngineHistoryEntry[];
};

export type ProtectionEngineContext = {
  protectionPhase: ProtectionEngineProtectionPhase;
  buyerCaseCount: number;
  sellerCaseCount: number;
  openCaseCount: number;
  protectionRate: number;
  recentCases: ProtectionEngineCaseSummary[];
};

export type ProtectionEngineCaseContext = {
  summary: ProtectionEngineCaseSummary;
  timeline: ProtectionEngineTimelineEvent[];
  evidenceCount: number;
  ordersIntegrated: boolean;
  shippingIntegrated: boolean;
  walletIntegrated: boolean;
  paymentsIntegrated: boolean;
};
