export type ShippingEngineProfileType = "buyer" | "seller" | "business" | "administrator";

export type ShippingEngineMethodId =
  | "standard"
  | "express"
  | "next-day"
  | "collection"
  | "local-pickup"
  | "seller-delivery"
  | "rovexo-delivery";

export type ShippingEngineZoneId = "uk" | "eu" | "international";

export type ShippingEngineTrackingStage =
  | "order-created"
  | "awaiting-dispatch"
  | "dispatched"
  | "collected"
  | "in-transit"
  | "out-for-delivery"
  | "delivered"
  | "delivery-confirmed"
  | "returned"
  | "cancelled";

export type ShippingEngineLabelType = "seller-own" | "rovexo" | "carrier";

export type ShippingEngineReturnStatus =
  | "requested"
  | "seller-approved"
  | "auto-approved"
  | "label-issued"
  | "returned"
  | "refund-pending"
  | "refunded"
  | "rejected";

export type ShippingEngineHealth = "healthy" | "warning" | "critical";

export type ShippingEnginePublishStatus = "draft" | "published" | "archived";

export type ShippingEngineParcelConfig = {
  weightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  packageType?: string;
  fragile: boolean;
  insurance: boolean;
  signatureRequired: boolean;
  collectionRequired: boolean;
};

export type ShippingEngineProfile = {
  id: string;
  type: ShippingEngineProfileType;
  userId?: string;
  shippingAddressConfirmed: boolean;
  returnAddressConfirmed: boolean;
  collectionAddressConfirmed: boolean;
  preferredMethod?: ShippingEngineMethodId;
  preferredCarrier?: string;
  parcelPreferences?: ShippingEngineParcelConfig;
  updatedAt: string;
};

export type ShippingEngineMethod = {
  id: ShippingEngineMethodId;
  label: string;
  description: string;
  enabled: boolean;
  zoneIds: ShippingEngineZoneId[];
  estimatedDays: { min: number; max: number };
};

export type ShippingEngineZone = {
  id: ShippingEngineZoneId;
  label: string;
  countryCodes: string[];
  currency: string;
  enabled: boolean;
};

export type ShippingEngineRule = {
  id: string;
  name: string;
  description?: string;
  condition: string;
  action: string;
  enabled: boolean;
  priority: number;
};

export type ShippingEngineCarrierSetting = {
  id: string;
  name: string;
  enabled: boolean;
  integrationReady: boolean;
  trackingSupported: boolean;
  labelSupported: boolean;
};

export type ShippingEngineReturnRule = {
  id: string;
  label: string;
  autoApprovalDays?: number;
  enabled: boolean;
};

export type ShippingEngineTrackingRule = {
  id: string;
  label: string;
  requireTrackingBeforeDispatch: boolean;
  notifyOnStatusChange: boolean;
};

export type ShippingEngineNotificationTemplate = {
  id: string;
  audience: "buyer" | "seller" | "administrator";
  event: string;
  enabled: boolean;
};

export type ShippingEngineAnalyticsMetric = {
  id: string;
  label: string;
  ready: boolean;
};

export type ShippingEngineTimelineEvent = {
  id: ShippingEngineTrackingStage;
  label: string;
  timestamp?: string;
  done: boolean;
  current: boolean;
  description?: string;
};

export type ShippingEngineReturn = {
  id: string;
  orderId: string;
  status: ShippingEngineReturnStatus;
  reason?: string;
  requestedAt: string;
  updatedAt: string;
};

export type ShippingEngineLabel = {
  id: string;
  orderId: string;
  type: ShippingEngineLabelType;
  carrier?: string;
  previewUrl?: string;
  downloadUrl?: string;
  archived: boolean;
  createdAt: string;
};

export type ShippingEngineModule = {
  id: string;
  label: string;
  icon: string;
  description: string;
  href: string;
};

export type ShippingEngineHistoryEntry = {
  id: string;
  publishedAt: string;
  publishedBy?: string;
  label: string;
  bundle?: ShippingEngineDocument;
  rollbackAvailable: boolean;
};

export type ShippingEngineAuditEntry = {
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

export type ShippingEngineDocument = {
  version: number;
  updatedAt: string;
  label: string;
  marketplaceVersion: string;
  primaryCountry: string;
  currency: string;
  methods: ShippingEngineMethod[];
  zones: ShippingEngineZone[];
  rules: ShippingEngineRule[];
  carriers: ShippingEngineCarrierSetting[];
  returnRules: ShippingEngineReturnRule[];
  trackingRules: ShippingEngineTrackingRule[];
  notifications: ShippingEngineNotificationTemplate[];
  analyticsMetrics: ShippingEngineAnalyticsMetric[];
  addressValidation: {
    buyerConfirmBeforePayment: boolean;
    sellerConfirmBeforeDispatch: boolean;
    blockUntilConfirmed: boolean;
  };
  buyerProtection: {
    enabled: boolean;
    fundsProtectedUntilDeliveryConfirmed: boolean;
    integratesWithWallet: boolean;
    integratesWithOrders: boolean;
    integratesWithPayments: boolean;
  };
  aiAssistant: {
    globalEnabled: boolean;
    shipmentSummaries: boolean;
    trackingAssistance: boolean;
    addressSuggestions: boolean;
    deliveryInsights: boolean;
    execution: "local" | "cloud" | "hybrid";
  };
  auditLog: ShippingEngineAuditEntry[];
};

export type ShippingEngineSnapshot = {
  scannedAt: string;
  modules: ShippingEngineModule[];
  draft: ShippingEngineDocument;
  live: ShippingEngineDocument;
  history: ShippingEngineHistoryEntry[];
};

export type ShippingEngineOrderContext = {
  orderId: string;
  orderNumber: string;
  status: string;
  carrier?: string;
  trackingNumber?: string;
  timeline: ShippingEngineTimelineEvent[];
  buyerProtectionActive: boolean;
  fundsProtected: boolean;
};
