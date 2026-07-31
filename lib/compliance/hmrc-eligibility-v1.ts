/**
 * HMRC Eligibility Engine v1.0 — seller-scoped reporting subjects.
 * Buyers with zero selling activity are never reporting subjects.
 * Unified Account: role alone is not the sole gate (canSell is always true).
 */

import type { UserRole } from "@/lib/supabase/types/database";
import { isAdmin, isSeller } from "@/lib/auth/roles";

export const HMRC_ELIGIBILITY_V1 = {
  id: "hmrc-eligibility-v1",
  version: "1.0.0",
  status: "ACTIVE",
} as const;

export type HmrcEligibilityInput = {
  authenticated: boolean;
  /** From AccountCapabilities.hasSellingActivity */
  hasSellingActivity: boolean;
  role: UserRole | null | undefined;
  /** Completed sales count in current tax year (seller-scoped). */
  completedSales?: number;
  /** Gross GBP in current tax year (seller-scoped). */
  grossSales?: number;
};

export type HmrcEligibilityResult = {
  /**
   * Seller Reporting Centre access — selling activity / seller-capable role / live sales.
   * Pure buyers are denied (fail closed).
   */
  canViewCentre: boolean;
  /**
   * Seller / business / staff or users with selling activity / sales —
   * subject to threshold monitoring and HMRC notifications.
   */
  isReportingSubject: boolean;
  /** Pure buyers (no selling activity, no sales) — excluded from obligations. */
  buyerExcludedFromObligation: boolean;
  /** Super Admin / Admin may configure platform settings; not seller subjects by role alone. */
  isPlatformOperator: boolean;
};

export function resolveHmrcEligibility(input: HmrcEligibilityInput): HmrcEligibilityResult {
  const authenticated = Boolean(input.authenticated);
  const sales = Math.max(0, input.completedSales ?? 0);
  const gross = Math.max(0, input.grossSales ?? 0);
  const hasLiveSales = sales > 0 || gross > 0;
  const isPlatformOperator = isAdmin(input.role);
  const isReportingSubject =
    Boolean(input.hasSellingActivity) ||
    isSeller(input.role) ||
    hasLiveSales;

  return {
    // Seller-only centre: authenticated reporting subjects only (buyers fail closed).
    canViewCentre: authenticated && isReportingSubject,
    isReportingSubject,
    buyerExcludedFromObligation: authenticated && !isReportingSubject,
    isPlatformOperator,
  };
}

/** True when the user may open /seller/compliance and download HMRC documents. */
export function canAccessHmrcSellerCentre(eligibility: HmrcEligibilityResult): boolean {
  return eligibility.canViewCentre;
}
