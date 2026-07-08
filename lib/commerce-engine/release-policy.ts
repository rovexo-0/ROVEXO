import { DELIVERED_RELEASE_HOURS } from "@/lib/commerce-engine/escrow-constants";

export type ReleaseReason =
  | "released"
  | "not_delivered"
  | "within_hold_window"
  | "claim_open"
  | "refund_present"
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
  now?: number;
};

/**
 * PURE release gate (spec §3, §4). Deterministic, no I/O — the single source of
 * truth for whether escrow may release.
 */
export function decideRelease(input: ReleaseDecisionInput): ReleaseReason {
  const now = input.now ?? Date.now();

  if (input.status === "cancelled") return "cancelled";
  if (input.status === "issue_open") return "claim_open";

  const buyerConfirmed = input.status === "completed";
  const delivered = buyerConfirmed || input.status === "delivered" || Boolean(input.deliveredAt);
  if (!delivered) return "not_delivered";

  if (input.requireTimer && !buyerConfirmed) {
    if (!input.deliveredAt) return "not_delivered";
    const elapsedMs = now - new Date(input.deliveredAt).getTime();
    if (elapsedMs < DELIVERED_RELEASE_HOURS * 3600_000) return "within_hold_window";
  }

  if (input.hasRefund) return "refund_present";
  if (input.hasOpenClaim) return "claim_open";

  return "released";
}

export type ReleaseOutcome = { released: boolean; reason: ReleaseReason };
