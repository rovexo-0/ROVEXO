export type OrdersEngineLifecycleStage =
  | "draft"
  | "checkout-started"
  | "payment-pending"
  | "payment-authorized"
  | "order-created"
  | "seller-accepted"
  | "preparing-shipment"
  | "awaiting-collection"
  | "collected"
  | "in-transit"
  | "out-for-delivery"
  | "delivered"
  | "buyer-confirmation-pending"
  | "completed"
  | "return-requested"
  | "returned"
  | "refunded"
  | "disputed"
  | "cancelled"
  | "archived";

export type OrdersEngineTimelineEventId =
  | "created"
  | "paid"
  | "accepted"
  | "packed"
  | "collected"
  | "dispatched"
  | "tracking-updated"
  | "delivered"
  | "confirmed"
  | "completed"
  | "returned"
  | "refunded"
  | "disputed"
  | "cancelled";

export type OrdersEngineType =
  | "marketplace"
  | "business"
  | "collection"
  | "digital-reservation"
  | "auction";

export type OrdersEngineFilterId =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "completed"
  | "returned"
  | "refunded"
  | "cancelled"
  | "disputed";

export type OrdersEngineProtectionStatus = "protected" | "active" | "waiting-confirmation" | "released" | "disputed" | "resolved";

export type OrdersEngineWalletStatus = "pending" | "protected" | "available" | "released" | "withdraw-eligible";

export type OrdersEngineReturnStatus =
  | "requested"
  | "seller-review"
  | "platform-review"
  | "approved"
  | "rejected"
  | "label-issued"
  | "returned"
  | "refund-completed";

export type OrdersEngineDisputeStatus = "open" | "evidence" | "communication" | "admin-review" | "decision" | "resolved";

export type OrdersEngineModule = {
  id: string;
  label: string;
  icon: string;
  description: string;
  href: string;
};

export type OrdersEngineTimelineEvent = {
  id: OrdersEngineTimelineEventId;
  label: string;
  timestamp?: string;
  done: boolean;
  current: boolean;
};

export type OrdersEngineOrderSummary = {
  orderId: string;
  orderNumber: string;
  status: string;
  lifecycleStage: OrdersEngineLifecycleStage;
  orderType: OrdersEngineType;
  buyerName: string;
  sellerName: string;
  productTitle: string;
  grandTotal: number;
  currency: string;
  createdAt: string;
  trackingNumber?: string;
  protectionStatus: OrdersEngineProtectionStatus;
  walletStatus: OrdersEngineWalletStatus;
  filterTags: OrdersEngineFilterId[];
};

export type OrdersEngineAnalytics = {
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
  revenue: number;
  averageOrderValue: number;
  completedOrders: number;
  cancelledOrders: number;
  returns: number;
  refunds: number;
  disputes: number;
};

export type OrdersEngineNotificationTemplate = {
  id: string;
  audience: "buyer" | "seller" | "administrator";
  event: string;
  enabled: boolean;
};

export type OrdersEngineHistoryEntry = {
  id: string;
  publishedAt: string;
  publishedBy?: string;
  label: string;
  bundle?: OrdersEngineDocument;
  rollbackAvailable: boolean;
};

export type OrdersEngineAuditEntry = {
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

export type OrdersEngineDocument = {
  version: number;
  updatedAt: string;
  label: string;
  marketplaceVersion: string;
  primaryCountry: string;
  currency: string;
  orderTypes: { id: OrdersEngineType; label: string; enabled: boolean }[];
  filters: { id: OrdersEngineFilterId; label: string; enabled: boolean }[];
  notifications: OrdersEngineNotificationTemplate[];
  analyticsEnabled: boolean;
  aiAssistant: {
    globalEnabled: boolean;
    orderSummaries: boolean;
    statusExplanations: boolean;
    sellerRecommendations: boolean;
    buyerAssistance: boolean;
    orderAnalytics: boolean;
    execution: "local" | "cloud" | "hybrid";
  };
  integrations: {
    shippingEngine: boolean;
    trackingEngine: boolean;
    shippingLabels: boolean;
    deliveryConfirmation: boolean;
    returns: boolean;
    wallet: boolean;
    payments: boolean;
    buyerProtection: boolean;
  };
  futureReady: string[];
  auditLog: OrdersEngineAuditEntry[];
};

export type OrdersEngineSnapshot = {
  scannedAt: string;
  modules: OrdersEngineModule[];
  draft: OrdersEngineDocument;
  live: OrdersEngineDocument;
  history: OrdersEngineHistoryEntry[];
};

export type OrdersEngineOrderContext = {
  summary: OrdersEngineOrderSummary;
  timeline: OrdersEngineTimelineEvent[];
  shippingIntegrated: boolean;
  documents: { id: string; label: string; available: boolean }[];
};
