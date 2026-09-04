/**
 * ROVEXO Seller Financial Context v1.0 — SSOT
 * individual | business — Bidzzy-style switch; never merges funds.
 */

export const SELLER_CONTEXTS = ["individual", "business"] as const;
export type SellerContext = (typeof SELLER_CONTEXTS)[number];

export const INDIVIDUAL_PROTECTION_HOURS = 48;
/** Business cancellation/return protection window after delivery. */
export const BUSINESS_PROTECTION_HOURS = 14 * 24; // 336 hours = 14 days

/** Maximum ROVEXO Lost Parcel Guarantee paid to seller (£). Not a buyer refund cap. */
export const LOST_PARCEL_SELLER_GUARANTEE_MAX_GBP = 100;

export const MIN_WITHDRAW_GBP = 0.01;

export function isSellerContext(value: unknown): value is SellerContext {
  return value === "individual" || value === "business";
}

export function normalizeSellerContext(value: unknown): SellerContext {
  return value === "business" ? "business" : "individual";
}

/** Protection hold hours from immutable order seller_context — never UI switch. */
export function protectionHoursForSellerContext(context: SellerContext): number {
  return context === "business" ? BUSINESS_PROTECTION_HOURS : INDIVIDUAL_PROTECTION_HOURS;
}

export function resolveSellerContextFromBusinessProfile(input: {
  businessName?: string | null;
  businessType?: string | null;
  companyType?: string | null;
  verifiedBusiness?: boolean | null;
} | null | undefined): SellerContext {
  const businessName = input?.businessName?.replace(/\s+/g, " ").trim() || "";
  const businessType =
    input?.businessType?.replace(/\s+/g, " ").trim() ||
    input?.companyType?.replace(/\s+/g, " ").trim() ||
    "";
  if (input?.verifiedBusiness || businessName || businessType) {
    return "business";
  }
  return "individual";
}

export function connectAccountColumn(context: SellerContext):
  | "stripe_connect_account_id_individual"
  | "stripe_connect_account_id_business" {
  return context === "business"
    ? "stripe_connect_account_id_business"
    : "stripe_connect_account_id_individual";
}

export function connectCapabilityColumns(context: SellerContext): {
  charges: "stripe_connect_charges_enabled_individual" | "stripe_connect_charges_enabled_business";
  payouts: "stripe_connect_payouts_enabled_individual" | "stripe_connect_payouts_enabled_business";
  details: "stripe_connect_details_submitted_individual" | "stripe_connect_details_submitted_business";
} {
  if (context === "business") {
    return {
      charges: "stripe_connect_charges_enabled_business",
      payouts: "stripe_connect_payouts_enabled_business",
      details: "stripe_connect_details_submitted_business",
    };
  }
  return {
    charges: "stripe_connect_charges_enabled_individual",
    payouts: "stripe_connect_payouts_enabled_individual",
    details: "stripe_connect_details_submitted_individual",
  };
}

/**
 * Fail-closed: wallet row must match withdraw sellerContext.
 * Business never debits Individual. Individual never debits Business.
 * Legacy null wallet_context is allowed only for individual.
 */
export function walletContextMatchesSellerContext(
  walletContext: string | null | undefined,
  sellerContext: SellerContext,
): boolean {
  const normalized = normalizeSellerContext(sellerContext);
  if (normalized === "business") {
    return walletContext === "business";
  }
  return walletContext === "individual" || walletContext == null || walletContext === "";
}

/**
 * Ledger filter for wallet reads.
 * Business: only seller_context=business (never legacy null → Individual contamination).
 * Individual: individual + legacy null rows.
 */
export function walletLedgerSellerContextFilter(context: SellerContext): {
  mode: "eq" | "or";
  value: string;
} {
  const normalized = normalizeSellerContext(context);
  if (normalized === "business") {
    return { mode: "eq", value: "business" };
  }
  return { mode: "or", value: "seller_context.eq.individual,seller_context.is.null" };
}

/**
 * withdraw_methods isolation — same Individual legacy-null rule as the ledger.
 * Business never matches Individual / null rows.
 */
export function withdrawMethodSellerContextFilter(context: SellerContext): {
  mode: "eq" | "or";
  value: string;
} {
  return walletLedgerSellerContextFilter(context);
}

/** Client/API snapshot share key — Individual ≠ Business. */
export function accountSnapshotCacheKey(context: SellerContext): string {
  return `GET:/api/account/snapshot?sellerContext=${normalizeSellerContext(context)}`;
}
