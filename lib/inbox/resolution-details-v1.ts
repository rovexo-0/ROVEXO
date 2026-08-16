/**
 * Resolution / Dispute Details — presentation model only.
 * Maps existing Protection / Seller Resolution / Buyer issue reason IDs.
 * Not a second dispute engine.
 */

import {
  CANONICAL_BUYER_SELLER_RESOLUTION_V1,
  canRenderResolved,
  resolveBuyerOfferActions,
  resolveBuyerProposedRefundContext,
  resolveCanonicalIssueCardCopy,
  resolveCanonicalIssueReasonLabel,
  resolveCanonicalProtectionStatus,
  resolveEligibleRefundAmount,
  resolveSellerResolutionActions,
  type CanonicalResolutionAction,
  type CanonicalSellerOffer,
} from "@/lib/inbox/canonical-buyer-seller-resolution-v1";
import type { ConversationDisputeView, ConversationTrackingView } from "@/lib/inbox/conversation-view";
import { resolveSprint1PaymentUi } from "@/lib/inbox/conversation-payment-sprint1";
import {
  SELLER_RESOLUTION_LIFECYCLE_V1,
  resolveSellerResolutionLifecycle,
} from "@/lib/inbox/seller-resolution-lifecycle-v1";
import type { SenderRole } from "@/lib/messages/types";
import type { OrderRefundStatus } from "@/lib/orders/refund-status";
import type { Order } from "@/lib/orders/types";
import type { ProtectionCaseOutcome, ProtectionCaseType } from "@/lib/protection/service";
import type { LostParcelLogicalState } from "@/lib/resolution-engine/lost-parcel-resolution-v1";

export type ResolutionDetailsOverlay = {
  protectionStatus?: string | null;
  protectionCaseType?: string | null;
  protectionOutcome?: string | null;
  returnStatus?: string | null;
  refundStatus?: string | null;
  refundedAt?: string | null;
  reasonId?: string | null;
  description?: string | null;
  evidenceUrls?: string[];
  sellerEvidenceUrls?: string[];
  sellerOffer?: CanonicalSellerOffer | null;
  lossState?: LostParcelLogicalState | null;
  openedAt?: string | null;
  simulation?: { action?: string } | null;
};

export const RESOLUTION_DETAILS_V1 = {
  version: "1.0",
  title: "Resolution Details",
  reasonLabel: "Reason",
  descriptionLabel: "Description",
  evidenceLabel: "Buyer evidence",
  sellerEvidenceLabel: "Seller evidence",
  disputeLabel: "Dispute",
  disputeOpened: "Opened",
  resolutionLabel: "Resolution",
  nextStepLabel: "Next step",
  returnLabel: "Return",
  refundLabel: "Refund",
  orderLabel: "Order",
  trackingLabel: "Tracking",
  sellingPriceLabel: "Selling price",
  receivableLabel: "You will receive",
  payoutLabel: "Payout",
  proposedRefundLabel: "Proposed refund",
} as const;

export type ResolutionDetailsRow = {
  label: string;
  value: string;
};

export type ResolutionDetailsModel = {
  title: string;
  compactSeller: boolean;
  statusTitle: string;
  statusDescription: string;
  reason: ResolutionDetailsRow | null;
  description: ResolutionDetailsRow | null;
  evidenceUrls: string[];
  evidenceLabel: string;
  sellerEvidenceUrls: string[];
  sellerEvidenceLabel: string;
  dispute: ResolutionDetailsRow | null;
  resolution: ResolutionDetailsRow | null;
  nextStep: ResolutionDetailsRow | null;
  orderReference: ResolutionDetailsRow | null;
  tracking: ResolutionDetailsRow | null;
  returnStatus: ResolutionDetailsRow | null;
  refundStatus: ResolutionDetailsRow | null;
  sellerFinancials: {
    sellingPrice: ResolutionDetailsRow;
    receivable: ResolutionDetailsRow;
    payout: ResolutionDetailsRow;
  } | null;
  sellerActions: CanonicalResolutionAction[];
  buyerOfferActions: CanonicalResolutionAction[];
  offer: CanonicalSellerOffer | null;
  proposedRefund: ResolutionDetailsRow | null;
  eligibleRefundAmount: number;
  showBuyerFinancials: false;
};

export function resolveResolutionDetailsView(input: {
  viewerRole: SenderRole;
  order: Order | null | undefined;
  overlay: ResolutionDetailsOverlay | null | undefined;
  dispute: ConversationDisputeView | null | undefined;
  tracking?: ConversationTrackingView | null;
}): ResolutionDetailsModel | null {
  const overlay = input.overlay ?? null;
  const dispute = input.dispute ?? null;
  const issueOpen =
    input.order?.status === "issue_open" ||
    overlay?.simulation?.action === "report_issue" ||
    Boolean(dispute?.id) ||
    Boolean(overlay?.reasonId);
  if (!issueOpen) return null;

  const protectionStatus =
    resolveCanonicalProtectionStatus({
      overlayProtectionStatus: overlay?.protectionStatus,
      disputeStatus: dispute?.status,
      reasonId: overlay?.reasonId,
      simulationAction: overlay?.simulation?.action,
      returnStatus: overlay?.returnStatus,
    }) ?? "open";
  const lifecycle = resolveSellerResolutionLifecycle({
    orderStatus: input.order?.status ?? "issue_open",
    refundStatus: (overlay?.refundStatus ?? input.order?.refundStatus ?? null) as
      | OrderRefundStatus
      | null,
    refundedAt: overlay?.refundedAt ?? input.order?.refundedAt,
    protectionStatus,
    protectionCaseType: (overlay?.protectionCaseType ??
      dispute?.caseType ??
      "dispute") as ProtectionCaseType,
    protectionOutcome: (overlay?.protectionOutcome ??
      dispute?.outcome ??
      null) as ProtectionCaseOutcome | null,
    hasProtectionCase: Boolean(dispute?.id || overlay?.reasonId || overlay?.simulation),
    returnStatus: overlay?.returnStatus ?? null,
    lossState: overlay?.lossState ?? null,
  });

  const cardCopy = resolveCanonicalIssueCardCopy();
  const terminal = canRenderResolved({
    protectionStatus,
    orderStatus: input.order?.status,
  });
  const statusTitle = terminal
    ? lifecycle?.title ?? SELLER_RESOLUTION_LIFECYCLE_V1.resolvedTitle
    : cardCopy.title;
  const statusDescription = terminal
    ? lifecycle?.description ?? SELLER_RESOLUTION_LIFECYCLE_V1.resolvedBody
    : cardCopy.description;

  const reasonId = overlay?.reasonId ?? null;
  const reasonLabel = resolveCanonicalIssueReasonLabel(reasonId);
  const description = overlay?.description?.trim() || null;
  const openedAt = overlay?.openedAt ?? dispute?.updatedAt ?? null;
  const offer = overlay?.sellerOffer ?? null;
  const tracking = input.tracking ?? null;
  const compactSeller = input.viewerRole === "seller";
  const evidenceUrls = (overlay?.evidenceUrls ?? []).filter((url) => url.trim().length > 0);
  const sellerEvidenceUrls = (overlay?.sellerEvidenceUrls ?? []).filter((url) => url.trim().length > 0);

  const sellerPay = compactSeller
    ? resolveSprint1PaymentUi({
        viewerRole: "seller",
        order: input.order,
        listingPrice: input.order?.product.price ?? 0,
      })
    : null;
  const eligibleRefundAmount = resolveEligibleRefundAmount({
    itemPrice: input.order?.totals.itemPrice ?? input.order?.product.price ?? null,
  });
  const proposedRefundContext = resolveBuyerProposedRefundContext(offer);
  const proposedRefund = proposedRefundContext
    ? {
        label: RESOLUTION_DETAILS_V1.proposedRefundLabel,
        value: `£${proposedRefundContext.amount.toLocaleString("en-GB", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
      }
    : null;

  return {
    title: RESOLUTION_DETAILS_V1.title,
    compactSeller,
    statusTitle,
    statusDescription,
    reason: reasonLabel
      ? { label: RESOLUTION_DETAILS_V1.reasonLabel, value: reasonLabel }
      : null,
    description: description
      ? { label: RESOLUTION_DETAILS_V1.descriptionLabel, value: description }
      : null,
    evidenceUrls,
    evidenceLabel: RESOLUTION_DETAILS_V1.evidenceLabel,
    sellerEvidenceUrls,
    sellerEvidenceLabel: RESOLUTION_DETAILS_V1.sellerEvidenceLabel,
    dispute: compactSeller
      ? null
      : {
          label: RESOLUTION_DETAILS_V1.disputeLabel,
          value: openedAt
            ? `${RESOLUTION_DETAILS_V1.disputeOpened} · ${new Date(openedAt).toLocaleString("en-GB")}`
            : RESOLUTION_DETAILS_V1.disputeOpened,
        },
    resolution: compactSeller
      ? null
      : {
          label: RESOLUTION_DETAILS_V1.resolutionLabel,
          value: lifecycle?.title ?? SELLER_RESOLUTION_LIFECYCLE_V1.issueOpenTitle,
        },
    nextStep: compactSeller
      ? null
      : {
          label: RESOLUTION_DETAILS_V1.nextStepLabel,
          value: lifecycle?.description ?? cardCopy.description,
        },
    orderReference: input.order?.orderNumber
      ? { label: RESOLUTION_DETAILS_V1.orderLabel, value: input.order.orderNumber }
      : null,
    tracking:
      compactSeller || !tracking?.trackingNumber
        ? null
        : {
            label: RESOLUTION_DETAILS_V1.trackingLabel,
            value: [tracking.courierName, tracking.trackingNumber, tracking.statusLabel]
              .filter(Boolean)
              .join(" · "),
          },
    returnStatus:
      compactSeller || !overlay?.returnStatus
        ? null
        : { label: RESOLUTION_DETAILS_V1.returnLabel, value: lifecycle?.title ?? overlay.returnStatus },
    refundStatus:
      compactSeller || !(overlay?.refundStatus || overlay?.refundedAt)
        ? null
        : { label: RESOLUTION_DETAILS_V1.refundLabel, value: lifecycle?.title ?? "Refund Pending" },
    sellerFinancials: sellerPay
      ? {
          sellingPrice: {
            label: RESOLUTION_DETAILS_V1.sellingPriceLabel,
            value: sellerPay.priceValue,
          },
          receivable: {
            label: RESOLUTION_DETAILS_V1.receivableLabel,
            value: sellerPay.secondaryValue,
          },
          payout: {
            label: RESOLUTION_DETAILS_V1.payoutLabel,
            value: CANONICAL_BUYER_SELLER_RESOLUTION_V1.payoutHeld,
          },
        }
      : null,
    sellerActions:
      input.viewerRole === "seller"
        ? resolveSellerResolutionActions({
            reasonId,
            lossState: overlay?.lossState ?? null,
            offer,
            protectionStatus,
          })
        : [],
    buyerOfferActions:
      input.viewerRole === "buyer" ? resolveBuyerOfferActions({ offer }) : [],
    offer,
    proposedRefund,
    eligibleRefundAmount,
    showBuyerFinancials: false,
  };
}
