/**
 * Business access — never dump users onto My Account (PO Final Authorization).
 * Unverified users stay in Business and open Verification in-context.
 */
export const BUSINESS_VERIFICATION_ROUTE = "/business/verification" as const;
export const BUSINESS_DASHBOARD_ROUTE = "/business/dashboard" as const;

export function businessRequiresVerification(hasBusinessVerification: boolean): boolean {
  return !hasBusinessVerification;
}
