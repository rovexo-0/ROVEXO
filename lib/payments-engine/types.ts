export type PaymentsEnginePaymentStatus =
  | "checkout-started"
  | "authorization-pending"
  | "authorized"
  | "verification-pending"
  | "verified"
  | "captured"
  | "protected"
  | "released"
  | "refund-pending"
  | "refunded"
  | "partially-refunded"
  | "cancelled"
  | "failed"
  | "expired"
  | "disputed"
  | "resolved";

export type PaymentsEnginePaymentMethod =
  | "credit-card"
  | "debit-card"
  | "apple-pay"
  | "google-pay"
  | "bank-payment"
  | "wallet-payment"
  | "gift-card"
  | "marketplace-credits";

export type PaymentsEngineProviderId =
  | "stripe-checkout"
  | "stripe-connect"
  | "paypal"
  | "adyen"
  | "worldpay"
  | "square"
  | "mollie"
  | "checkout-com"
  | "amazon-pay"
  | "rovexo-payments";

export type PaymentsEngineFilterId =
  | "pending"
  | "authorized"
  | "captured"
  | "protected"
  | "completed"
  | "failed"
  | "refunded"
  | "cancelled"
  | "disputed";

export type PaymentsEngineProtectionStatus = "protected" | "active" | "released" | "disputed" | "resolved";

export type PaymentsEngineVerificationStatus = "pending" | "verified" | "failed";

export type PaymentsEngineModule = {
  id: string;
  label: string;
  icon: string;
  description: string;
  href: string;
};

export type PaymentsEngineTimelineEventId =
  | "checkout-started"
  | "authorization"
  | "verification"
  | "capture"
  | "protection-hold"
  | "shipping-started"
  | "delivered"
  | "buyer-confirmed"
  | "funds-released"
  | "withdrawal"
  | "completed";

export type PaymentsEngineTimelineEvent = {
  id: PaymentsEngineTimelineEventId;
  label: string;
  timestamp?: string;
  done: boolean;
  current: boolean;
};

export type PaymentsEngineSummary = {
  paymentId: string;
  orderId: string;
  orderNumber: string;
  status: PaymentsEnginePaymentStatus;
  provider: PaymentsEngineProviderId;
  method: PaymentsEnginePaymentMethod;
  currency: string;
  subtotal: number;
  shipping: number;
  buyerProtectionFee: number;
  platformFee: number;
  discount: number;
  tax: number;
  grandTotal: number;
  buyerName: string;
  sellerName: string;
  productTitle: string;
  createdAt: string;
  completedAt?: string;
  protectionStatus: PaymentsEngineProtectionStatus;
  filterTags: PaymentsEngineFilterId[];
};

export type PaymentsEngineAnalytics = {
  revenue: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  refundRate: number;
  averageTransaction: number;
  averageOrderValue: number;
  platformFees: number;
  buyerProtectionFees: number;
  payoutVolume: number;
};

export type PaymentsEngineNotificationTemplate = {
  id: string;
  audience: "buyer" | "seller" | "administrator";
  event: string;
  enabled: boolean;
};

export type PaymentsEngineHistoryEntry = {
  id: string;
  publishedAt: string;
  publishedBy?: string;
  label: string;
  bundle?: PaymentsEngineDocument;
  rollbackAvailable: boolean;
};

export type PaymentsEngineAuditEntry = {
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

export type PaymentsEngineDocument = {
  version: number;
  updatedAt: string;
  label: string;
  marketplaceVersion: string;
  primaryCountry: string;
  currency: string;
  paymentMethods: { id: PaymentsEnginePaymentMethod; label: string; enabled: boolean }[];
  providers: { id: PaymentsEngineProviderId; label: string; enabled: boolean }[];
  payoutMethods: { id: string; label: string; enabled: boolean }[];
  filters: { id: PaymentsEngineFilterId; label: string; enabled: boolean }[];
  notifications: PaymentsEngineNotificationTemplate[];
  analyticsEnabled: boolean;
  fraudPrevention: {
    velocityChecks: boolean;
    duplicateDetection: boolean;
    riskScoring: boolean;
    webhookValidation: boolean;
    deviceFingerprint: boolean;
    threeDSecure: boolean;
    suspiciousActivityFlag: boolean;
    manualReview: boolean;
  };
  aiAssistant: {
    globalEnabled: boolean;
    paymentSummaries: boolean;
    financialReports: boolean;
    fraudIndicators: boolean;
    revenueInsights: boolean;
    transactionAnalytics: boolean;
    execution: "local" | "cloud" | "hybrid";
  };
  integrations: {
    walletEngine: boolean;
    ordersEngine: boolean;
    shippingEngine: boolean;
    buyerProtection: boolean;
    stripeCheckout: boolean;
    stripeConnect: boolean;
  };
  futureReady: string[];
  auditLog: PaymentsEngineAuditEntry[];
};

export type PaymentsEngineSnapshot = {
  scannedAt: string;
  modules: PaymentsEngineModule[];
  draft: PaymentsEngineDocument;
  live: PaymentsEngineDocument;
  history: PaymentsEngineHistoryEntry[];
};

export type PaymentsEngineContext = {
  stripeConfigured: boolean;
  savedMethodsCount: number;
  recentPayments: PaymentsEngineSummary[];
  protectionStatus: PaymentsEngineProtectionStatus;
};

export type PaymentsEnginePaymentContext = {
  summary: PaymentsEngineSummary;
  timeline: PaymentsEngineTimelineEvent[];
  verification: {
    provider: boolean;
    amount: boolean;
    currency: boolean;
    webhookSignature: boolean;
    orderReference: boolean;
    status: PaymentsEngineVerificationStatus;
  };
  documents: { id: string; label: string; available: boolean }[];
  walletIntegrated: boolean;
  ordersIntegrated: boolean;
  shippingIntegrated: boolean;
};
