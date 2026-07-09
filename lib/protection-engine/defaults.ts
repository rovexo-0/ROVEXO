import {
  PROTECTION_ENGINE_CASE_STATUSES,
  PROTECTION_ENGINE_CASE_TYPES,
  PROTECTION_ENGINE_EVIDENCE_TYPES,
  PROTECTION_ENGINE_FILTERS,
  PROTECTION_ENGINE_RESOLUTION_TYPES,
} from "@/lib/protection-engine/registry";
import type { ProtectionEngineDocument, ProtectionEngineHistoryEntry } from "@/lib/protection-engine/types";

const now = () => new Date().toISOString();

export function createDefaultProtectionEngineDocument(label = "ROVEXO Purchase Protection Engine"): ProtectionEngineDocument {
  return {
    version: 1,
    updatedAt: now(),
    label,
    marketplaceVersion: "ROVEXO v1.0",
    primaryCountry: "United Kingdom",
    currency: "GBP",
    caseTypes: PROTECTION_ENGINE_CASE_TYPES.map((t) => ({ ...t, enabled: true })),
    caseStatuses: PROTECTION_ENGINE_CASE_STATUSES.map((s) => ({ ...s, enabled: true })),
    resolutionTypes: PROTECTION_ENGINE_RESOLUTION_TYPES.map((r) => ({ ...r, enabled: true })),
    evidenceTypes: PROTECTION_ENGINE_EVIDENCE_TYPES.map((e) => ({ ...e, enabled: true })),
    filters: PROTECTION_ENGINE_FILTERS.map((f) => ({ ...f, enabled: true })),
    notifications: createDefaultNotifications(),
    analyticsEnabled: true,
    abuseDetection: {
      repeatedClaims: true,
      highRefundFrequency: true,
      suspiciousActivity: true,
      duplicateClaims: true,
      fraudIndicators: true,
      manualReviewQueue: true,
    },
    aiAssistant: {
      globalEnabled: false,
      caseSummaries: true,
      evidenceOrganization: true,
      duplicateCaseDetection: true,
      riskScoring: true,
      resolutionRecommendations: true,
      fraudIndicators: true,
      execution: "local",
    },
    integrations: {
      ordersEngine: true,
      shippingEngine: true,
      walletEngine: true,
      paymentsEngine: true,
      notifications: true,
      analytics: true,
    },
    protectionRules: {
      beginsAfterPayment: true,
      releaseOnBuyerConfirm: true,
      releaseOnAutoPeriod: true,
      releaseOnDisputeResolved: true,
    },
    futureReady: [
      "Video Verification",
      "AI Image Comparison",
      "Carrier API Verification",
      "Identity Verification",
      "International Protection",
      "Multi-Currency Protection",
      "Business Protection",
      "Auction Protection",
      "Premium Purchase Protection",
    ],
    auditLog: [],
  };
}

export function createDefaultProtectionEngineHistory(): ProtectionEngineHistoryEntry[] {
  return [];
}

function createDefaultNotifications(): ProtectionEngineDocument["notifications"] {
  return [
    { id: "buyer-activated", audience: "buyer", event: "protection_activated", enabled: true },
    { id: "buyer-updated", audience: "buyer", event: "case_updated", enabled: true },
    { id: "buyer-evidence", audience: "buyer", event: "evidence_requested", enabled: true },
    { id: "buyer-resolution", audience: "buyer", event: "resolution_available", enabled: true },
    { id: "buyer-refund", audience: "buyer", event: "refund_completed", enabled: true },
    { id: "seller-new", audience: "seller", event: "new_case", enabled: true },
    { id: "seller-evidence", audience: "seller", event: "evidence_requested", enabled: true },
    { id: "seller-decision", audience: "seller", event: "decision_issued", enabled: true },
    { id: "seller-refund", audience: "seller", event: "refund_approved", enabled: true },
    { id: "admin-priority", audience: "administrator", event: "high_priority_case", enabled: true },
    { id: "admin-escalated", audience: "administrator", event: "escalated_case", enabled: true },
    { id: "admin-fraud", audience: "administrator", event: "fraud_alert", enabled: true },
    { id: "admin-pending", audience: "administrator", event: "long_pending_case", enabled: true },
    { id: "admin-error", audience: "administrator", event: "system_error", enabled: true },
  ];
}

export { PLATFORM_FEE_RATE as PROTECTION_FEE_RATE } from "@/lib/orders/pricing";
