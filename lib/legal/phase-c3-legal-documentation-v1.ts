import { LEGAL_EFFECTIVE_DATE } from "@/lib/legal/document-shared";

/**
 * ROVEXO Phase C.3 — Legal Documentation Rewrite Lock (v1.0).
 *
 * STATUS: ACTIVE · SSOT for the Phase C.3 legal documentation rewrite
 *
 * Scope: rewrote every canonical legal document in
 * `lib/legal/canonical-documents.ts` with a professional marketplace
 * structure (numbered chapters, plain-English What/Why/When/How/Example/
 * Notes/Important call-outs, a Common questions chapter, and a closing
 * Related Documents chapter). Personal Account only (Phase C.1 terminology
 * preserved). Slugs, titles, and document count are unchanged from the
 * pre-Phase-C.3 SSOT.
 */

export const PHASE_C3_LEGAL_LAST_UPDATED = "30 July 2026";

/** Cross-check: the runtime effective date used by every legal document. */
export const PHASE_C3_LEGAL_EFFECTIVE_DATE_REF = LEGAL_EFFECTIVE_DATE;

/**
 * Structural markers every document body must contain (case-sensitive,
 * substring match) so the rewrite is professional and consistently
 * navigable across the whole legal centre.
 */
export const PHASE_C3_REQUIRED_STRUCTURE_MARKERS = [
  "**What:**",
  "**How:**",
  "## ",
  "Common questions",
  "Related Documents",
] as const;

/**
 * Subsection vocabulary used across the documentation set. Not every
 * chapter uses every marker — "where natural" — but each marker below
 * appears at least once somewhere across the full document set.
 */
export const PHASE_C3_SUBSECTION_VOCABULARY = [
  "What",
  "Why",
  "When",
  "How",
  "Example",
  "Notes",
  "Important",
  "Common questions",
] as const;

/** The exact canonical legal slugs — Phase C.3 base + Legal Centre Consolidation v1.0 additions. */
export const PHASE_C3_LEGAL_SLUGS = [
  "terms-and-conditions",
  "privacy-policy",
  "cookie-policy",
  "buyer-terms",
  "seller-terms",
  "shipping-policy",
  "returns-refund-policy",
  "platform-fee-policy",
  "acceptable-use-policy",
  "community-guidelines",
  "prohibited-restricted-items",
  "intellectual-property-policy",
  "complaint-dispute-resolution",
  "account-suspension-policy",
  "digital-platform-reporting-tax-notice",
  "data-retention-policy",
  "accessibility-statement",
  "wallet-terms",
  "payment-terms",
  "delivery-policy",
  "verification-policy",
  "buyer-protection",
  "seller-protection",
  "gdpr-data-rights",
  "legal-changelog",
] as const;

export const PHASE_C3_LEGAL_DOCUMENTATION_V1 = {
  id: "phase-c3-legal-documentation-v1",
  version: "1.0.0",
  status: "ACTIVE",
  lastUpdated: PHASE_C3_LEGAL_LAST_UPDATED,
  slugCount: PHASE_C3_LEGAL_SLUGS.length,
  slugs: PHASE_C3_LEGAL_SLUGS,
  requiredStructureMarkers: PHASE_C3_REQUIRED_STRUCTURE_MARKERS,
  subsectionVocabulary: PHASE_C3_SUBSECTION_VOCABULARY,
  personalAccountOnly: true as const,
  withdrawnPublicSlugs: ["business-seller-terms"] as const,
} as const;

export type PhaseC3LegalDocumentationV1 = typeof PHASE_C3_LEGAL_DOCUMENTATION_V1;
