/**
 * Lost-parcel logical states — evolves Resolution Engine in place.
 * Not a second dispute/refund/claim engine.
 *
 * A tracking message containing "lost" is POSSIBLY_LOST only.
 * CARRIER_CONFIRMATION_SIGNAL is not available in the current Sendcloud integration.
 */

export const LOST_PARCEL_RESOLUTION_V1 = {
  version: "1.0",
  carrierClaimApi: "NOT_AVAILABLE" as const,
  carrierConfirmationSignal: "NOT_AVAILABLE" as const,
  buyerWaitingCopy:
    "Your parcel may be delayed or lost. ROVEXO is waiting for the carrier to confirm the shipment status.",
  sellerWaitingCopy:
    "Your parcel may be delayed or lost. ROVEXO is waiting for carrier confirmation before any resolution is made.",
  sellerCompensationCopy:
    "Carrier compensation is subject to the carrier's applicable terms.",
  notArrivedLabel: "My order hasn't arrived",
  preDeliveryAllowedReason: "not_arrived" as const,
  preDeliveryBlockedReasons: ["damaged", "not_as_described", "missing_item", "wrong_item"] as const,
} as const;

export type LostParcelLogicalState =
  | "NORMAL"
  | "DELAYED"
  | "POSSIBLY_LOST"
  | "WAITING_FOR_CARRIER"
  | "CARRIER_INVESTIGATION_OPEN"
  | "CARRIER_ACTION_REQUIRED"
  | "CARRIER_RESOLVED"
  | "CARRIER_CONFIRMED_LOST";

export type LostParcelQaState =
  | "in_transit"
  | "delayed"
  | "possibly_lost"
  | "waiting_for_carrier"
  | "carrier_investigation_open"
  | "carrier_action_required"
  | "carrier_resolved"
  | "carrier_confirmed_lost"
  | "buyer_refunded_after_confirmed_loss"
  | "delivered";

const SUSPECTED_LOSS_TOKENS = [
  "lost",
  "failed",
  "missing",
  "stalled",
  "no movement",
  "not found",
] as const;

export function isSuspectedLossTrackingText(text: string | null | undefined): boolean {
  const normalized = (text ?? "").trim().toLowerCase();
  if (!normalized) return false;
  return SUSPECTED_LOSS_TOKENS.some((token) => normalized.includes(token));
}

/** Tracking "lost" is never carrier-confirmed. Signal is not available. */
export function classifyTrackingLossSignal(text: string | null | undefined): {
  state: "POSSIBLY_LOST" | "NORMAL";
  confirmed: false;
} {
  if (isSuspectedLossTrackingText(text)) {
    return { state: "POSSIBLY_LOST", confirmed: false };
  }
  return { state: "NORMAL", confirmed: false };
}

export function nextStateAfterSuspectedLoss(): "WAITING_FOR_CARRIER" {
  return "WAITING_FOR_CARRIER";
}

export function canAuthorizeBuyerRefund(state: LostParcelLogicalState): boolean {
  return state === "CARRIER_CONFIRMED_LOST";
}

export function canInventSellerCarrierPayout(): false {
  return false;
}

export function isPreDeliveryIssueReasonAllowed(reason: string): boolean {
  return reason === LOST_PARCEL_RESOLUTION_V1.preDeliveryAllowedReason;
}

export function isPreDeliveryIssueReasonBlocked(reason: string): boolean {
  return (LOST_PARCEL_RESOLUTION_V1.preDeliveryBlockedReasons as readonly string[]).includes(
    reason,
  );
}

export function waitingCopyForRole(role: "buyer" | "seller"): string {
  return role === "buyer"
    ? LOST_PARCEL_RESOLUTION_V1.buyerWaitingCopy
    : LOST_PARCEL_RESOLUTION_V1.sellerWaitingCopy;
}

export function resolveLogicalStateFromQa(qaState: LostParcelQaState): LostParcelLogicalState {
  switch (qaState) {
    case "delayed":
      return "DELAYED";
    case "possibly_lost":
      return "POSSIBLY_LOST";
    case "waiting_for_carrier":
      return "WAITING_FOR_CARRIER";
    case "carrier_investigation_open":
      return "CARRIER_INVESTIGATION_OPEN";
    case "carrier_action_required":
      return "CARRIER_ACTION_REQUIRED";
    case "carrier_resolved":
      return "CARRIER_RESOLVED";
    case "carrier_confirmed_lost":
    case "buyer_refunded_after_confirmed_loss":
      return "CARRIER_CONFIRMED_LOST";
    case "delivered":
    case "in_transit":
    default:
      return "NORMAL";
  }
}

export function isLostAutoRefundRule(input: {
  ruleId?: string | null;
  reason?: string | null;
}): boolean {
  const rule = (input.ruleId ?? "").trim();
  const reason = (input.reason ?? "").trim();
  return (
    rule === "lost_auto_refund" ||
    rule === "damaged_auto_refund" ||
    rule === "failed_delivery_auto_refund" ||
    reason === "automatic_lost" ||
    reason === "automatic_failed_delivery" ||
    reason === "automatic_carrier_exception" ||
    reason === "automatic_damaged"
  );
}
