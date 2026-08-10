/**
 * HMRC Eligibility Engine v1.0 — seller-scoped reporting subjects.
 * Buyers with zero selling activity are never reporting subjects.
 *
 * Owner architecture (COD SÂNGE consolidated release — LOCKED):
 * - Reporting Centre access: any authenticated ROVEXO account (Unified Account).
 * - Settings → HMRC must open (no Settings → HMRC → Settings redirect loop).
 * - Unauthenticated: fail closed (login redirect).
 * - Obligations / threshold notifications: seller-activity scoped via isReportingSubject.
 */

import type { UserRole } from "@/lib/supabase/types/database";
import { isAdmin, isSeller } from "@/lib/auth/roles";

export const HMRC_ELIGIBILITY_V1 = {
  id: "hmrc-eligibility-v1",
  version: "1.0.2",
  status: "ACTIVE",
  ownerDecision: "UNIFIED_ACCOUNT_CENTRE_ACCESS",
  canViewCentrePolicy: "authenticated",
  reportingSubjectPolicy: "seller_activity_scoped",
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
   * Reporting Centre page access — any authenticated ROVEXO account
   * (Unified Account: Settings LEGAL exposes HMRC to all signed-in users).
   * Unauthenticated users fail closed (login redirect).
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
    // Unified Account: Settings → HMRC must open for every signed-in account.
    // Do not gate the page on legacy role=seller / hasSellingActivity alone —
    // that created Settings → HMRC → Settings redirect loops for buyer-role sellers.
    canViewCentre: authenticated,
    isReportingSubject,
    buyerExcludedFromObligation: authenticated && !isReportingSubject,
    isPlatformOperator,
  };
}

/** True when the user may open /seller/compliance and download own HMRC documents. */
export function canAccessHmrcSellerCentre(eligibility: HmrcEligibilityResult): boolean {
  return eligibility.canViewCentre;
}
