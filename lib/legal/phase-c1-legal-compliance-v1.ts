/**
 * ROVEXO Phase C.1 — Legal & Compliance Alignment Lock (v1.0 public).
 *
 * STATUS: ACTIVE · PUBLIC LEGAL SSOT MUST MATCH VISIBLE PLATFORM
 *
 * Forbidden in public legal documents: Business Account, Business Dashboard,
 * Business Verification product surfaces, Following feed, Admin / Super Admin,
 * hidden beta / v2.0 product claims.
 */

export const PHASE_C1_LEGAL_COMPLIANCE_V1 = {
  id: "phase-c1-legal-compliance-v1",
  version: "1.0.0",
  status: "ACTIVE",
  personalAccountOnly: true as const,
  withdrawnPublicSlugs: ["business-seller-terms"] as const,
  withdrawnSlugRedirectsTo: "seller-terms" as const,
  canonicalTerminology: [
    "Personal Account",
    "Wallet",
    "Balance",
    "Order",
    "Conversation",
    "Offer",
    "Review",
    "Rating",
    "Shipping Label",
    "Holiday Mode",
    "Marketplace",
    "Saved",
  ] as const,
  forbiddenPublicLegalPhrases: [
    "Business Seller Terms",
    "Business Account",
    "Business Dashboard",
    "Business Store",
    "Business → Verification",
    "Business Verification product",
    "Following feed",
    "Super Admin",
    "legacy admin tools",
    "Become Seller",
  ] as const,
} as const;

export type PhaseC1LegalComplianceV1 = typeof PHASE_C1_LEGAL_COMPLIANCE_V1;
