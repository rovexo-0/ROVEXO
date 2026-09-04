/**
 * Business access — never dump users onto My Account.
 * Stripe Connect is the only Business verification authority (no ROVEXO KYC hub).
 */
export const BUSINESS_VERIFICATION_ROUTE = "/business/connect" as const;
export const BUSINESS_DASHBOARD_ROUTE = "/business/dashboard" as const;

export function businessRequiresVerification(hasBusinessVerification: boolean): boolean {
  return !hasBusinessVerification;
}
