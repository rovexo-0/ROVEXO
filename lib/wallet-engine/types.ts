export type WalletEngineWalletType = "buyer" | "seller" | "business" | "platform" | "administrator";

export type WalletEngineBalanceType =
  | "pending"
  | "protected"
  | "available"
  | "withdrawable"
  | "reserved"
  | "refund"
  | "processing"
  | "completed";

export type WalletEngineTransactionType =
  | "purchase"
  | "sale"
  | "buyer-protection-fee"
  | "shipping-fee"
  | "refund"
  | "partial-refund"
  | "withdrawal"
  | "payout"
  | "adjustment"
  | "promotion"
  | "reward"
  | "cashback"
  | "auction-payment"
  | "business-payment";

export type WalletEngineTransactionStatus =
  | "pending"
  | "protected"
  | "processing"
  | "available"
  | "completed"
  | "failed"
  | "cancelled"
  | "refunded";

export type WalletEngineWithdrawalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled";

export type WalletEnginePayoutMethodId =
  | "stripe-connect"
  | "bank-transfer"
  | "paypal"
  | "wise"
  | "revolut"
  | "instant-payout";

export type WalletEngineFilterId =
  | "pending"
  | "protected"
  | "processing"
  | "available"
  | "completed"
  | "failed"
  | "cancelled"
  | "refunded";

export type WalletEngineProtectionStatus = "protected" | "active" | "released" | "disputed" | "resolved";

export type WalletEngineModule = {
  id: string;
  label: string;
  icon: string;
  description: string;
  href: string;
};

export type WalletEngineBalanceSnapshot = {
  pending: number;
  protected: number;
  available: number;
  withdrawable: number;
  reserved: number;
  refund: number;
  processing: number;
  completed: number;
  currency: string;
};

export type WalletEngineEarningsSnapshot = {
  pending: number;
  protected: number;
  available: number;
  withdrawn: number;
  lifetime: number;
  monthly: number;
  weekly: number;
  today: number;
  currency: string;
};

export type WalletEngineTransactionSummary = {
  transactionId: string;
  orderNumber: string;
  productTitle: string;
  amount: number;
  currency: string;
  type: WalletEngineTransactionType;
  status: WalletEngineTransactionStatus;
  createdAt: string;
  description?: string;
  filterTags: WalletEngineFilterId[];
};

export type WalletEngineTimelineEventId =
  | "created"
  | "protected"
  | "processing"
  | "available"
  | "payout-initiated"
  | "payout-completed"
  | "refunded"
  | "failed"
  | "cancelled";

export type WalletEngineTimelineEvent = {
  id: WalletEngineTimelineEventId;
  label: string;
  timestamp?: string;
  done: boolean;
  current: boolean;
};

export type WalletEngineAnalytics = {
  walletBalance: number;
  revenue: number;
  pendingFunds: number;
  protectedFunds: number;
  availableFunds: number;
  withdrawals: number;
  refunds: number;
  averagePayoutTimeHours: number;
  monthlyRevenue: number;
  platformRevenue: number;
};

export type WalletEngineNotificationTemplate = {
  id: string;
  audience: "buyer" | "seller" | "administrator";
  event: string;
  enabled: boolean;
};

export type WalletEngineHistoryEntry = {
  id: string;
  publishedAt: string;
  publishedBy?: string;
  label: string;
  bundle?: WalletEngineDocument;
  rollbackAvailable: boolean;
};

export type WalletEngineAuditEntry = {
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

export type WalletEngineDocument = {
  version: number;
  updatedAt: string;
  label: string;
  marketplaceVersion: string;
  primaryCountry: string;
  currency: string;
  walletTypes: { id: WalletEngineWalletType; label: string; enabled: boolean }[];
  balanceTypes: { id: WalletEngineBalanceType; label: string; enabled: boolean }[];
  transactionTypes: { id: WalletEngineTransactionType; label: string; enabled: boolean }[];
  payoutMethods: { id: WalletEnginePayoutMethodId; label: string; enabled: boolean }[];
  filters: { id: WalletEngineFilterId; label: string; enabled: boolean }[];
  notifications: WalletEngineNotificationTemplate[];
  analyticsEnabled: boolean;
  aiAssistant: {
    globalEnabled: boolean;
    financialSummaries: boolean;
    walletInsights: boolean;
    revenueReports: boolean;
    withdrawalRecommendations: boolean;
    fraudIndicators: boolean;
    execution: "local" | "cloud" | "hybrid";
  };
  integrations: {
    ordersEngine: boolean;
    shippingEngine: boolean;
    payments: boolean;
    buyerProtection: boolean;
    deliveryConfirmation: boolean;
    trackingStatus: boolean;
    returns: boolean;
  };
  holdPeriodHours: number;
  platformFeeRate: number;
  futureReady: string[];
  auditLog: WalletEngineAuditEntry[];
};

export type WalletEngineSnapshot = {
  scannedAt: string;
  modules: WalletEngineModule[];
  draft: WalletEngineDocument;
  live: WalletEngineDocument;
  history: WalletEngineHistoryEntry[];
};

export type WalletEngineContext = {
  walletType: WalletEngineWalletType;
  balances: WalletEngineBalanceSnapshot;
  earnings: WalletEngineEarningsSnapshot;
  protectionStatus: WalletEngineProtectionStatus;
  connectEnabled: boolean;
  payoutsEnabled: boolean;
  transactions: WalletEngineTransactionSummary[];
};

export type WalletEngineTransactionContext = {
  summary: WalletEngineTransactionSummary;
  timeline: WalletEngineTimelineEvent[];
  ordersIntegrated: boolean;
  shippingIntegrated: boolean;
};
