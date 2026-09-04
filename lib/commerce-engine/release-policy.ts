import {
  INDIVIDUAL_PROTECTION_HOURS,
  normalizeSellerContext,
  protectionHoursForSellerContext,
  type SellerContext,
} from "@/lib/seller-context/seller-context-v1";

export type ReleaseReason =
  | "released"
  | "not_delivered"
  | "within_hold_window"
  | "claim_open"
  | "refund_present"
  | "sale_refunded"
  | "order_missing"
  | "cancelled"
  | "connect_not_ready"
  | "transfer_failed"
  | "no_pending_sale";

export type ReleaseDecisionInput = {
  status: string;
  deliveredAt: string | null;
  hasRefund: boolean;
  hasOpenClaim: boolean;
  requireTimer: boolean;
  /** Canonical seller sale ledger is already refunded — never releasable. */
  saleRefunded?: boolean;
  /** Immutable order seller_context — NEVER the active UI switch. */
  sellerContext?: SellerContext | string | null;
  now?: number;
};

/**
 * PURE release gate. Deterministic, no I/O — the single source of
 * truth for whether escrow may release to Available.
 *
 * Individual = 48h after delivery · Business = 14 days after delivery.
 */
export function decideRelease(input: ReleaseDecisionInput): ReleaseReason {
  const now = input.now ?? Date.now();
  const context = normalizeSellerContext(input.sellerContext);
  const holdHours = protectionHoursForSellerContext(context);

  if (input.status === "cancelled") return "cancelled";
  if (input.saleRefunded) return "sale_refunded";
  if (input.status === "issue_open") return "claim_open";
  if (input.hasOpenClaim) return "claim_open";
  if (input.hasRefund) return "refund_present";

  const buyerConfirmed = input.status === "completed";
  const delivered = buyerConfirmed || input.status === "delivered" || Boolean(input.deliveredAt);
  if (!delivered) return "not_delivered";

  if (input.requireTimer && !buyerConfirmed) {
    if (!input.deliveredAt) return "not_delivered";
    const elapsedMs = now - new Date(input.deliveredAt).getTime();
    if (elapsedMs < holdHours * 3600_000) return "within_hold_window";
  }

  return "released";
}

export type ReleaseOutcome = { released: boolean; reason: ReleaseReason };

/** @deprecated Use protectionHoursForSellerContext — Individual default only. */
export const LEGACY_HOLD_HOURS = INDIVIDUAL_PROTECTION_HOURS;
