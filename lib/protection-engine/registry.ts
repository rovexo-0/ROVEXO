import type { ProtectionEngineFilterId, ProtectionEngineModule } from "@/lib/protection-engine/types";

export const PROTECTION_ENGINE_MODULES: ProtectionEngineModule[] = [
  { id: "dashboard", label: "Protection Dashboard", icon: "🛡️", description: "Coverage and fund protection status", href: "/protection" },
  { id: "disputes", label: "Dispute Centre", icon: "⚖️", description: "Open and track protection cases", href: "/resolution" },
  { id: "evidence", label: "Evidence Center", icon: "📎", description: "Upload photos, documents, and tracking", href: "/resolution" },
  { id: "orders", label: "Orders Integration", icon: "📦", description: "Order timeline and completion", href: "/orders" },
  { id: "shipping", label: "Shipping Integration", icon: "🚚", description: "Tracking and delivery confirmation", href: "/shipping" },
  { id: "wallet", label: "Wallet Integration", icon: "👛", description: "Protection hold and fund release", href: "/wallet" },
  { id: "payments", label: "Payments Integration", icon: "💳", description: "Payment verification and refunds", href: "/payments" },
  { id: "seller-performance", label: "Seller Performance", icon: "⭐", description: "Dispute rate and resolution time", href: "/protection?tab=performance" },
  { id: "analytics", label: "Analytics", icon: "📈", description: "Cases, refunds, and dispute metrics", href: "/protection?tab=analytics" },
];

export const PROTECTION_ENGINE_CASE_TYPES = [
  { id: "item-not-received", label: "Item Not Received" },
  { id: "item-damaged", label: "Item Damaged" },
  { id: "not-as-described", label: "Item Not As Described" },
  { id: "wrong-item", label: "Wrong Item" },
  { id: "missing-parts", label: "Missing Parts" },
  { id: "counterfeit", label: "Counterfeit Item" },
  { id: "incomplete-order", label: "Incomplete Order" },
  { id: "lost-shipment", label: "Lost Shipment" },
  { id: "return-issue", label: "Return Issue" },
  { id: "payment-issue", label: "Payment Issue" },
  { id: "other", label: "Other" },
] as const;

export const PROTECTION_ENGINE_CASE_STATUSES = [
  { id: "draft", label: "Draft" },
  { id: "submitted", label: "Submitted" },
  { id: "under-review", label: "Under Review" },
  { id: "waiting-for-buyer", label: "Waiting For Buyer" },
  { id: "waiting-for-seller", label: "Waiting For Seller" },
  { id: "evidence-requested", label: "Evidence Requested" },
  { id: "evidence-received", label: "Evidence Received" },
  { id: "admin-investigation", label: "Admin Investigation" },
  { id: "resolution-proposed", label: "Resolution Proposed" },
  { id: "resolved", label: "Resolved" },
  { id: "refund-approved", label: "Refund Approved" },
  { id: "partial-refund", label: "Partial Refund" },
  { id: "rejected", label: "Rejected" },
  { id: "appealed", label: "Appealed" },
  { id: "closed", label: "Closed" },
] as const;

export const PROTECTION_ENGINE_RESOLUTION_TYPES = [
  { id: "full-refund", label: "Full Refund" },
  { id: "partial-refund", label: "Partial Refund" },
  { id: "replacement", label: "Replacement" },
  { id: "return-required", label: "Return Required" },
  { id: "return-not-required", label: "Return Not Required" },
  { id: "seller-wins", label: "Seller Wins" },
  { id: "buyer-wins", label: "Buyer Wins" },
  { id: "mutual-agreement", label: "Mutual Agreement" },
  { id: "administrative-resolution", label: "Administrative Resolution" },
] as const;

export const PROTECTION_ENGINE_EVIDENCE_TYPES = [
  { id: "photos", label: "Photos" },
  { id: "videos", label: "Videos" },
  { id: "pdf", label: "PDF Documents" },
  { id: "invoices", label: "Invoices" },
  { id: "shipping-labels", label: "Shipping Labels" },
  { id: "tracking-screenshots", label: "Tracking Screenshots" },
  { id: "chat-history", label: "Chat History" },
  { id: "carrier-documents", label: "Carrier Documents" },
  { id: "other", label: "Other Files" },
] as const;

export const PROTECTION_ENGINE_FILTERS: { id: ProtectionEngineFilterId; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "under-review", label: "Under Review" },
  { id: "waiting", label: "Waiting" },
  { id: "evidence", label: "Evidence" },
  { id: "resolved", label: "Resolved" },
  { id: "refunded", label: "Refunded" },
  { id: "rejected", label: "Rejected" },
  { id: "appealed", label: "Appealed" },
  { id: "closed", label: "Closed" },
];

export const PROTECTION_ENGINE_TIMELINE_EVENTS = [
  { id: "case-created", label: "Case Created" },
  { id: "evidence-uploaded", label: "Evidence Uploaded" },
  { id: "seller-response", label: "Seller Response" },
  { id: "admin-review", label: "Admin Review" },
  { id: "additional-evidence", label: "Additional Evidence" },
  { id: "decision", label: "Decision" },
  { id: "refund", label: "Refund" },
  { id: "wallet-update", label: "Wallet Update" },
  { id: "case-closed", label: "Case Closed" },
] as const;

export function registerProtectionEngineModule(module: ProtectionEngineModule): ProtectionEngineModule[] {
  const index = PROTECTION_ENGINE_MODULES.findIndex((item) => item.id === module.id);
  if (index >= 0) {
    const next = [...PROTECTION_ENGINE_MODULES];
    next[index] = module;
    return next;
  }
  return [...PROTECTION_ENGINE_MODULES, module];
}
