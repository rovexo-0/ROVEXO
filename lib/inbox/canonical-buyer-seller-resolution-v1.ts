/**
 * Canonical Buyer + Seller Resolution Model v1.0 — presentation / eligibility only.
 * Reuses Protection Engine, Resolution Engine, seller-resolution-lifecycle-v1,
 * buyer-issue-reason-v1, and cancellation `changed_mind`. Not a second engine.
 */

import {
  BUYER_ISSUE_REASON_OPTIONS,
  getBuyerIssueReasonOption,
  type BuyerIssueReasonId,
} from "@/lib/inbox/buyer-issue-reason-v1";
import {
  SELLER_RESOLUTION_LIFECYCLE_V1,
  isOpenProtectionStatus,
  parseProtectionCaseStatus,
  resolveSellerResolutionLifecycle,
} from "@/lib/inbox/seller-resolution-lifecycle-v1";
import { BUYER_CANCELLATION_REASON_OPTIONS } from "@/lib/orders/cancellation";
import type { ProtectionCaseStatus } from "@/lib/protection/service";
import type { ProtectionEngineResolutionType } from "@/lib/protection-engine/types";
import type { LostParcelLogicalState } from "@/lib/resolution-engine/lost-parcel-resolution-v1";
import { sellerResolutionDoesNotShowReturnForNonDelivery } from "@/lib/inbox/seller-resolution-lifecycle-v1";

export const CANONICAL_BUYER_SELLER_RESOLUTION_V1 = {
  version: "1.0",
  issueCardTitle: "Issue",
  issueCardBody: "Your order is suspended",
  viewDetailsLabel: "View Details",
  respondLabel: "Respond",
  addEvidenceLabel: "Add Evidence",
  contactBuyerLabel: "Contact Buyer",
  acceptReturnLabel: "Accept Return",
  partialRefundLabel: "Partial Refund",
  declineLabel: "Decline",
  partialRefundHint: "Keep product",
  returnFullRefundLabel: "Return + Full refund",
  damageSellerPaysReturn: "Seller pays return",
  acceptReturnRefundLabel: "Accept Return",
  buyerPaysReturn: "Buyer pays return",
  acceptOfferLabel: "Accept",
  declineOfferLabel: "Decline",
  doesNotLikeLabel: "Doesn't like",
  changedMindId: "changed_mind",
  buyerKeepsProduct: "Buyer keeps product",
  returnRequired: "Return required",
  payoutHeld: "Held pending resolution",
} as const;

export const CANONICAL_BUYER_ISSUE_REASON_IDS = [
  "item-not-received",
  "item-damaged",
  "not-as-described",
  "wrong-item",
  "other",
] as const satisfies readonly BuyerIssueReasonId[];

/** Reuses cancellation `changed_mind` — not a sixth buyer selector option. */
export type CanonicalIssueReasonId = BuyerIssueReasonId | "changed_mind";

export type CanonicalSellerOfferType =
  | "partial-refund"
  | "return-full-refund"
  | "accept-return-refund";

export type CanonicalSellerOfferStatus = "proposed" | "accepted" | "declined";

export type CanonicalReturnCostBearer = "seller" | "none";

export type CanonicalSellerOffer = {
  type: CanonicalSellerOfferType;
  status: CanonicalSellerOfferStatus;
  returnCost: CanonicalReturnCostBearer;
  resolutionType: ProtectionEngineResolutionType;
  amount?: number | null;
};

export type CanonicalResolutionActionId =
  | "view_dispute"
  | "respond"
  | "add_evidence"
  | "contact_buyer"
  | "propose_partial_refund"
  | "propose_return_full_refund"
  | "accept_return_refund"
  | "decline_resolution"
  | "accept_seller_offer"
  | "decline_seller_offer"
  | "mark_resolved"
  | "force_refund"
  | "force_payout";

export type CanonicalResolutionAction = {
  id: CanonicalResolutionActionId;
  label: string;
  hint?: string;
};

export function isCanonicalBuyerIssueReasonId(value: string | null | undefined): value is BuyerIssueReasonId {
  return CANONICAL_BUYER_ISSUE_REASON_IDS.some((id) => id === value);
}

export function resolveCanonicalIssueReasonLabel(
  reasonId: string | null | undefined,
): string | null {
  if (!reasonId) return null;
  if (reasonId === CANONICAL_BUYER_SELLER_RESOLUTION_V1.changedMindId) {
    return CANONICAL_BUYER_SELLER_RESOLUTION_V1.doesNotLikeLabel;
  }
  return getBuyerIssueReasonOption(reasonId as BuyerIssueReasonId)?.label ?? null;
}

export function isCanonicalIssueReasonId(value: string | null | undefined): value is CanonicalIssueReasonId {
  return isCanonicalBuyerIssueReasonId(value) || value === CANONICAL_BUYER_SELLER_RESOLUTION_V1.changedMindId;
}

export function changedMindReusesCancellationId(): boolean {
  return BUYER_CANCELLATION_REASON_OPTIONS.some(
    (option) => option.id === CANONICAL_BUYER_SELLER_RESOLUTION_V1.changedMindId,
  );
}

export function buyerSelectorDoesNotIncludeChangedMind(): boolean {
  return !BUYER_ISSUE_REASON_OPTIONS.map((option) => option.id as string).includes(
    CANONICAL_BUYER_SELLER_RESOLUTION_V1.changedMindId,
  );
}

const NON_TERMINAL_RESOLUTION_STATES = [
  "open",
  "awaiting_seller",
  "awaiting_buyer",
  "under_review",
  "appealed",
  "return_required",
  "refund_offered",
  "seller_response_pending",
  "buyer_response_pending",
] as const;

export function isNonTerminalResolutionState(value: string | null | undefined): boolean {
  return Boolean(value && (NON_TERMINAL_RESOLUTION_STATES as readonly string[]).includes(value));
}

export function resolveCanonicalProtectionStatus(input: {
  overlayProtectionStatus?: string | null;
  disputeStatus?: string | null;
  reasonId?: string | null;
  simulationAction?: string | null;
  returnStatus?: string | null;
}): ProtectionCaseStatus | null {
  const overlay = parseProtectionCaseStatus(input.overlayProtectionStatus);
  const dispute = parseProtectionCaseStatus(input.disputeStatus);
  const hasActiveOverlayCase = Boolean(
    input.reasonId ||
      input.simulationAction === "report_issue" ||
      input.returnStatus ||
      isNonTerminalResolutionState(input.overlayProtectionStatus),
  );
  if (isNonTerminalResolutionState(input.overlayProtectionStatus)) {
    return overlay ?? "open";
  }
  if (isOpenProtectionStatus(overlay)) return overlay;
  if (isOpenProtectionStatus(dispute)) return dispute;
  if (hasActiveOverlayCase) {
    if (overlay === "resolved" || overlay === "closed") return overlay;
    if (overlay == null && (dispute === "resolved" || dispute === "closed")) {
      return dispute;
    }
    return overlay ?? "open";
  }
  return overlay ?? dispute;
}

export function isCanonicalIssueCardActive(input: {
  orderStatus?: string | null;
  protectionStatus?: ProtectionCaseStatus | null;
  refundedAt?: string | null;
  refundStatus?: string | null;
  reasonId?: string | null;
  simulationAction?: string | null;
}): boolean {
  if (input.refundedAt || input.refundStatus === "completed") return false;
  if (canRenderResolved({ protectionStatus: input.protectionStatus, orderStatus: input.orderStatus })) {
    return false;
  }
  return (
    input.orderStatus === "issue_open" ||
    isOpenProtectionStatus(input.protectionStatus) ||
    isNonTerminalResolutionState(input.protectionStatus) ||
    Boolean(input.reasonId) ||
    input.simulationAction === "report_issue"
  );
}

export function resolveCanonicalIssueCardCopy(): {
  title: string;
  description: string;
} {
  return {
    title: CANONICAL_BUYER_SELLER_RESOLUTION_V1.issueCardTitle,
    description: CANONICAL_BUYER_SELLER_RESOLUTION_V1.issueCardBody,
  };
}

export function canRenderResolved(input: {
  protectionStatus?: ProtectionCaseStatus | string | null;
  orderStatus?: string | null;
}): boolean {
  if (isNonTerminalResolutionState(input.protectionStatus)) return false;
  if (isOpenProtectionStatus(input.protectionStatus as ProtectionCaseStatus | null | undefined)) return false;
  if (
    input.orderStatus === "issue_open" &&
    isOpenProtectionStatus((input.protectionStatus as ProtectionCaseStatus | null | undefined) ?? "open")
  ) {
    return false;
  }
  return input.protectionStatus === "resolved" || input.protectionStatus === "closed";
}

export function sellerPaysReturnCost(input: {
  reasonId: string | null | undefined;
  offerType: CanonicalSellerOfferType | null | undefined;
}): boolean {
  return (
    input.reasonId === "item-damaged" &&
    (input.offerType === "return-full-refund" || input.offerType === "accept-return-refund")
  );
}

export function returnApplicableForReason(
  reasonId: string | null | undefined,
  lossState?: LostParcelLogicalState | null,
): boolean {
  if (reasonId === "item-not-received") return false;
  if (sellerResolutionDoesNotShowReturnForNonDelivery(lossState)) return false;
  return (
    reasonId === "item-damaged" ||
    reasonId === "not-as-described" ||
    reasonId === "wrong-item" ||
    reasonId === "changed_mind"
  );
}

export function isUnauthorizedSellerResolutionAction(
  actionId: CanonicalResolutionActionId,
): boolean {
  return actionId === "mark_resolved" || actionId === "force_refund" || actionId === "force_payout";
}

const ACCEPT_RETURN: CanonicalResolutionAction = {
  id: "accept_return_refund",
  label: CANONICAL_BUYER_SELLER_RESOLUTION_V1.acceptReturnLabel,
};

const PARTIAL_REFUND: CanonicalResolutionAction = {
  id: "propose_partial_refund",
  label: CANONICAL_BUYER_SELLER_RESOLUTION_V1.partialRefundLabel,
};

const DECLINE: CanonicalResolutionAction = {
  id: "decline_resolution",
  label: CANONICAL_BUYER_SELLER_RESOLUTION_V1.declineLabel,
};

export function resolveSellerResolutionActions(input: {
  reasonId: string | null | undefined;
  lossState?: LostParcelLogicalState | null;
  offer?: CanonicalSellerOffer | null;
  protectionStatus?: ProtectionCaseStatus | null;
}): CanonicalResolutionAction[] {
  if (canRenderResolved({ protectionStatus: input.protectionStatus })) return [];
  if (input.protectionStatus === "awaiting_buyer" || input.protectionStatus === "under_review") return [];
  if (input.offer?.status === "proposed" || input.offer?.status === "accepted") return [];
  if (input.reasonId === "item-not-received" || sellerResolutionDoesNotShowReturnForNonDelivery(input.lossState)) {
    return [];
  }
  if (input.reasonId === "changed_mind" || input.reasonId === "not-as-described" || input.reasonId === "wrong-item") {
    return [ACCEPT_RETURN, DECLINE];
  }
  if (input.reasonId === "item-damaged") {
    return [ACCEPT_RETURN, PARTIAL_REFUND, DECLINE];
  }
  if (input.reasonId === "other") {
    return [ACCEPT_RETURN, DECLINE];
  }
  return [ACCEPT_RETURN, PARTIAL_REFUND, DECLINE];
}

export function resolveEligibleRefundAmount(input: {
  itemPrice?: number | null;
  orderTotal?: number | null;
}): number {
  if (input.itemPrice != null && input.itemPrice > 0) return Math.round(input.itemPrice * 100) / 100;
  if (input.orderTotal != null && input.orderTotal > 0) return Math.round(input.orderTotal * 100) / 100;
  return 0;
}

export function validatePartialRefundAmount(input: {
  amount: number;
  eligibleAmount: number;
}): { ok: true } | { ok: false; code: "INVALID_AMOUNT" } {
  if (!Number.isFinite(input.amount) || input.amount <= 0) return { ok: false, code: "INVALID_AMOUNT" };
  if (input.amount > input.eligibleAmount) return { ok: false, code: "INVALID_AMOUNT" };
  return { ok: true };
}

export function resolveBuyerProposedRefundContext(offer: CanonicalSellerOffer | null | undefined): {
  amount: number;
  status: "proposed";
  requiresBuyerAccept: true;
  finalized: false;
} | null {
  if (offer?.type !== "partial-refund" || offer.status !== "proposed") return null;
  if (offer.amount == null || !Number.isFinite(offer.amount) || offer.amount <= 0) return null;
  return {
    amount: offer.amount,
    status: "proposed",
    requiresBuyerAccept: true,
    finalized: false,
  };
}

export function resolveBuyerOfferActions(input: {
  offer?: CanonicalSellerOffer | null;
}): CanonicalResolutionAction[] {
  if (input.offer?.status !== "proposed") return [];
  return [
    { id: "accept_seller_offer", label: CANONICAL_BUYER_SELLER_RESOLUTION_V1.acceptOfferLabel },
    { id: "decline_seller_offer", label: CANONICAL_BUYER_SELLER_RESOLUTION_V1.declineOfferLabel },
  ];
}

export function resolveOfferFromAction(
  actionId: CanonicalResolutionActionId,
  reasonId: string | null | undefined,
  amount?: number | null,
): CanonicalSellerOffer | null {
  if (actionId === "propose_partial_refund") {
    return {
      type: "partial-refund",
      status: "proposed",
      returnCost: "none",
      resolutionType: "partial-refund",
      amount: amount ?? null,
    };
  }
  if (actionId === "propose_return_full_refund" || actionId === "accept_return_refund") {
    return {
      type: "accept-return-refund",
      status: "proposed",
      returnCost: sellerPaysReturnCost({ reasonId, offerType: "return-full-refund" }) ? "seller" : "none",
      resolutionType: "return-required",
    };
  }
  return null;
}

export function applyCanonicalResolutionAction(input: {
  actionId: CanonicalResolutionActionId;
  viewerRole: "buyer" | "seller";
  reasonId?: string | null;
  offer?: CanonicalSellerOffer | null;
  protectionStatus?: ProtectionCaseStatus | null;
  lossState?: LostParcelLogicalState | null;
  amount?: number | null;
  eligibleAmount?: number | null;
}):
  | {
      ok: true;
      protectionStatus: ProtectionCaseStatus;
      offer: CanonicalSellerOffer | null;
      returnStatus: string | null;
      refundStatus: string | null;
    }
  | { ok: false; code: "UNAUTHORIZED" | "NOT_ELIGIBLE" | "NO_OFFER" | "INVALID_AMOUNT" } {
  if (isUnauthorizedSellerResolutionAction(input.actionId)) {
    return { ok: false, code: "UNAUTHORIZED" };
  }

  if (input.viewerRole === "seller") {
    const allowed = resolveSellerResolutionActions({
      reasonId: input.reasonId,
      lossState: input.lossState,
      offer: input.offer,
      protectionStatus: input.protectionStatus,
    }).map((action) => action.id);
    if (!allowed.includes(input.actionId)) {
      return { ok: false, code: "NOT_ELIGIBLE" };
    }
    if (input.actionId === "propose_partial_refund") {
      const eligible = input.eligibleAmount ?? 0;
      const amount = input.amount ?? 0;
      if (!validatePartialRefundAmount({ amount, eligibleAmount: eligible }).ok) {
        return { ok: false, code: "INVALID_AMOUNT" };
      }
    }
    if (input.actionId === "decline_resolution") {
      return {
        ok: true,
        protectionStatus: "under_review",
        offer: input.offer ? { ...input.offer, status: "declined" } : null,
        returnStatus: null,
        refundStatus: null,
      };
    }
    const offer = resolveOfferFromAction(input.actionId, input.reasonId, input.amount);
    if (!offer) return { ok: false, code: "NOT_ELIGIBLE" };
    return {
      ok: true,
      protectionStatus: "awaiting_buyer",
      offer,
      returnStatus: null,
      refundStatus: null,
    };
  }

  if (input.actionId === "accept_seller_offer") {
    if (input.offer?.status !== "proposed") return { ok: false, code: "NO_OFFER" };
    const needsReturn = input.offer.type !== "partial-refund";
    return {
      ok: true,
      protectionStatus: needsReturn ? "awaiting_buyer" : "under_review",
      offer: { ...input.offer, status: "accepted" },
      returnStatus: needsReturn ? "requested" : null,
      refundStatus: needsReturn ? null : "initiated",
    };
  }
  if (input.actionId === "decline_seller_offer") {
    if (input.offer?.status !== "proposed") return { ok: false, code: "NO_OFFER" };
    return {
      ok: true,
      protectionStatus: "awaiting_seller",
      offer: { ...input.offer, status: "declined" },
      returnStatus: null,
      refundStatus: null,
    };
  }
  return { ok: false, code: "NOT_ELIGIBLE" };
}

export function resolveOpenLifecycleTitle(input: {
  orderStatus?: import("@/lib/orders/types").Order["status"] | null;
  protectionStatus?: ProtectionCaseStatus | null;
  protectionCaseType?: "refund" | "return" | "dispute" | "appeal" | null;
  protectionOutcome?: string | null;
  returnStatus?: string | null;
  refundStatus?: string | null;
  refundedAt?: string | null;
  lossState?: LostParcelLogicalState | null;
}): string {
  if (canRenderResolved({ protectionStatus: input.protectionStatus, orderStatus: input.orderStatus })) {
    return input.protectionStatus === "closed"
      ? SELLER_RESOLUTION_LIFECYCLE_V1.closedTitle
      : SELLER_RESOLUTION_LIFECYCLE_V1.resolvedTitle;
  }
  const lifecycle = resolveSellerResolutionLifecycle({
    orderStatus: input.orderStatus ?? "issue_open",
    protectionStatus: input.protectionStatus,
    protectionCaseType: input.protectionCaseType,
    protectionOutcome: input.protectionOutcome as never,
    hasProtectionCase: true,
    returnStatus: input.returnStatus,
    refundStatus: input.refundStatus as never,
    refundedAt: input.refundedAt,
    lossState: input.lossState,
  });
  if (lifecycle?.title === SELLER_RESOLUTION_LIFECYCLE_V1.resolvedTitle && !canRenderResolved(input)) {
    return SELLER_RESOLUTION_LIFECYCLE_V1.issueOpenTitle;
  }
  return lifecycle?.title ?? SELLER_RESOLUTION_LIFECYCLE_V1.issueOpenTitle;
}
