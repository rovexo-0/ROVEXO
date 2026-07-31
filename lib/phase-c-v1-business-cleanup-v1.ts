/**
 * ROVEXO Phase C — Business Cleanup & Branding Lock (v1.0 public release).
 *
 * STATUS: ACTIVE · V1.0 UX ONLY · BUSINESS v2.0 POSTPONED
 *
 * User-facing Business Account / hub / bank / verification / directory are removed
 * from the v1.0 experience. Implementation may remain isolated for v2.0.
 * Admin / Super Admin business tools are out of scope (ops only).
 */

export const PHASE_C_V1_BUSINESS_CLEANUP_V1 = {
  id: "phase-c-v1-business-cleanup-v1",
  version: "1.0.0",
  status: "ACTIVE",
  /** When true, all end-user Business UX is hidden / redirected. */
  businessUxRemovedFromV1: true as const,
  personalAccountOnly: true as const,
  followingFeedRemovedFromHomepage: true as const,
  holidayBannerRemoved: true as const,
  continueWhereYouLeftOffRemoved: true as const,
  brandingLevel: {
    pwa: "III_APP_ICON",
    appleTouch: "III_APP_ICON",
    favicon: "IV_FAVICON",
    auth: "II_PRIMARY_EMBLEM",
    marketing: "I_MASTER_EMBLEM",
  } as const,
  redirectBusinessRoutesTo: "/account" as const,
} as const;

export type PhaseCV1BusinessCleanupV1 = typeof PHASE_C_V1_BUSINESS_CLEANUP_V1;

/** End-user Business UX is postponed to v2.0. */
export function isV1BusinessUxRemoved(): boolean {
  return PHASE_C_V1_BUSINESS_CLEANUP_V1.businessUxRemovedFromV1;
}
