/**
 * Seller Resolution Lifecycle — presentation mapper only.
 * Maps existing Protection / Resolution / Order refund IDs onto TransactionStatusCard.
 * Not a second dispute, return, or refund engine.
 */

import type { ProtectionCaseOutcome, ProtectionCaseStatus, ProtectionCaseType } from "@/lib/protection/service";
import type { OrderRefundStatus } from "@/lib/orders/refund-status";
import type { Order } from "@/lib/orders/types";
import type { LostParcelLogicalState } from "@/lib/resolution-engine/lost-parcel-resolution-v1";

export type SellerResolutionActionId = "view_order" | "view_dispute" | "track_parcel";

export type SellerResolutionAction = {
  id: SellerResolutionActionId;
  label: string;
};

export const SELLER_RESOLUTION_LIFECYCLE_V1 = {
  version: "1.0",
  respondLabel: "Respond",
  viewDetailsLabel: "View Details",
  issueOpenTitle: "Issue",
  issueOpenBody: "Your order is suspended",
  sellerResponseTitle: "Seller Response Required",
  sellerResponseBody: "Review the issue and respond.",
  buyerResponseTitle: "Buyer Response Required",
  buyerResponseBody: "Waiting for the buyer to respond.",
  evidenceTitle: "Evidence Required",
  evidenceBody: "Additional evidence is required to continue resolution.",
  returnRequestedTitle: "Return Requested",
  returnRequestedBody: "Buyer has requested a return.",
  returnInProgressTitle: "Return In Progress",
  returnInProgressBody: "Return is in progress.",
  returnReceivedTitle: "Return Received",
  returnReceivedBody: "The returned item has been received.",
  refundPendingTitle: "Refund Pending",
  refundPendingBody: "Refund processing is pending.",
  refundedTitle: "Refunded",
  refundedBody: "This issue has been refunded.",
  resolvedTitle: "Resolved",
  resolvedBody: "This issue has been resolved.",
  closedTitle: "Closed",
  closedBody: "This issue has been closed.",
  underReviewTitle: "Under Review",
  underReviewBody: "ROVEXO is reviewing this issue.",
} as const;

export type SellerResolutionLifecycleInput = {
  orderStatus: Order["status"] | null | undefined;
  refundStatus?: OrderRefundStatus | null;
  refundedAt?: string | null;
  protectionStatus?: ProtectionCaseStatus | null;
  protectionCaseType?: ProtectionCaseType | null;
  protectionOutcome?: ProtectionCaseOutcome | null;
  hasProtectionCase?: boolean;
  lossState?: LostParcelLogicalState | null;
  returnStatus?: string | null;
};

export type SellerResolutionPresentation = {
  title: string;
  description: string;
  primaryAction: SellerResolutionAction;
  secondaryAction: SellerResolutionAction | null;
  allowsRespond: boolean;
  allowsRefundAction: false;
  readOnly: boolean;
};

function viewDetails(): SellerResolutionAction {
  return {
    id: "view_dispute",
    label: SELLER_RESOLUTION_LIFECYCLE_V1.viewDetailsLabel,
  };
}

const RESPOND: SellerResolutionAction = {
  id: "view_dispute",
  label: SELLER_RESOLUTION_LIFECYCLE_V1.respondLabel,
};

function presentation(
  title: string,
  description: string,
  options?: {
    primary?: SellerResolutionAction;
    secondary?: SellerResolutionAction | null;
    allowsRespond?: boolean;
    readOnly?: boolean;
    hasProtectionCase?: boolean;
  },
): SellerResolutionPresentation {
  return {
    title,
    description,
    primaryAction: options?.primary ?? viewDetails(),
    secondaryAction: options?.secondary ?? null,
    allowsRespond: options?.allowsRespond === true,
    allowsRefundAction: false,
    readOnly: options?.readOnly !== false,
  };
}

const PROTECTION_STATUSES: readonly ProtectionCaseStatus[] = [
  "open",
  "awaiting_seller",
  "awaiting_buyer",
  "under_review",
  "resolved",
  "appealed",
  "closed",
];

const PROTECTION_CASE_TYPES: readonly ProtectionCaseType[] = [
  "refund",
  "return",
  "dispute",
  "appeal",
];

const PROTECTION_OUTCOMES: readonly ProtectionCaseOutcome[] = [
  "pending",
  "refund_full",
  "refund_partial",
  "return_accepted",
  "return_rejected",
  "no_action",
  "seller_favour",
  "buyer_favour",
];

export function parseProtectionCaseStatus(
  value: string | null | undefined,
): ProtectionCaseStatus | null {
  return PROTECTION_STATUSES.includes(value as ProtectionCaseStatus)
    ? (value as ProtectionCaseStatus)
    : null;
}

export function parseProtectionCaseType(
  value: string | null | undefined,
): ProtectionCaseType | null {
  return PROTECTION_CASE_TYPES.includes(value as ProtectionCaseType)
    ? (value as ProtectionCaseType)
    : null;
}

export function parseProtectionCaseOutcome(
  value: string | null | undefined,
): ProtectionCaseOutcome | null {
  return PROTECTION_OUTCOMES.includes(value as ProtectionCaseOutcome)
    ? (value as ProtectionCaseOutcome)
    : null;
}

export const OPEN_PROTECTION_STATUSES: readonly ProtectionCaseStatus[] = [
  "open",
  "awaiting_seller",
  "awaiting_buyer",
  "under_review",
  "appealed",
];

export function isOpenProtectionStatus(
  value: ProtectionCaseStatus | null | undefined,
): boolean {
  return Boolean(value && OPEN_PROTECTION_STATUSES.includes(value));
}

export function isSellerResolutionLifecycleActive(input: SellerResolutionLifecycleInput): boolean {
  if (input.orderStatus === "issue_open") return true;
  if (input.hasProtectionCase) return true;
  if (input.refundedAt) return true;
  if (
    input.refundStatus === "initiated" ||
    input.refundStatus === "processing" ||
    input.refundStatus === "completed"
  ) {
    return true;
  }
  return false;
}

export function resolveSellerResolutionLifecycle(
  input: SellerResolutionLifecycleInput,
): SellerResolutionPresentation | null {
  if (!isSellerResolutionLifecycleActive(input)) return null;

  const details = { hasProtectionCase: input.hasProtectionCase === true };
  const refunded =
    Boolean(input.refundedAt) ||
    input.refundStatus === "completed" ||
    input.protectionOutcome === "refund_full" ||
    input.protectionOutcome === "refund_partial";
  if (refunded) {
    return presentation(
      SELLER_RESOLUTION_LIFECYCLE_V1.refundedTitle,
      SELLER_RESOLUTION_LIFECYCLE_V1.refundedBody,
      details,
    );
  }

  if (input.refundStatus === "initiated" || input.refundStatus === "processing") {
    return presentation(
      SELLER_RESOLUTION_LIFECYCLE_V1.refundPendingTitle,
      SELLER_RESOLUTION_LIFECYCLE_V1.refundPendingBody,
      details,
    );
  }

  const openIssue = isOpenProtectionStatus(input.protectionStatus ?? (input.orderStatus === "issue_open" ? "open" : null));

  if (!openIssue && input.protectionStatus === "closed") {
    return presentation(
      SELLER_RESOLUTION_LIFECYCLE_V1.closedTitle,
      SELLER_RESOLUTION_LIFECYCLE_V1.closedBody,
      details,
    );
  }

  if (!openIssue && input.protectionStatus === "resolved") {
    return presentation(
      SELLER_RESOLUTION_LIFECYCLE_V1.resolvedTitle,
      SELLER_RESOLUTION_LIFECYCLE_V1.resolvedBody,
      details,
    );
  }

  const hideReturn = sellerResolutionDoesNotShowReturnForNonDelivery(input.lossState);

  if (!hideReturn && input.returnStatus === "received") {
    return presentation(
      SELLER_RESOLUTION_LIFECYCLE_V1.returnReceivedTitle,
      SELLER_RESOLUTION_LIFECYCLE_V1.returnReceivedBody,
      details,
    );
  }

  if (
    !hideReturn &&
    (input.returnStatus === "label_generated" || input.returnStatus === "in_transit")
  ) {
    return presentation(
      SELLER_RESOLUTION_LIFECYCLE_V1.returnInProgressTitle,
      SELLER_RESOLUTION_LIFECYCLE_V1.returnInProgressBody,
      details,
    );
  }

  if (
    !hideReturn &&
    (input.protectionCaseType === "return" || input.returnStatus === "requested")
  ) {
    return presentation(
      SELLER_RESOLUTION_LIFECYCLE_V1.returnRequestedTitle,
      SELLER_RESOLUTION_LIFECYCLE_V1.returnRequestedBody,
      details,
    );
  }

  if (input.protectionCaseType === "refund") {
    return presentation(
      SELLER_RESOLUTION_LIFECYCLE_V1.refundPendingTitle,
      SELLER_RESOLUTION_LIFECYCLE_V1.refundPendingBody,
      details,
    );
  }

  if (input.protectionStatus === "awaiting_seller") {
    return presentation(
      SELLER_RESOLUTION_LIFECYCLE_V1.sellerResponseTitle,
      SELLER_RESOLUTION_LIFECYCLE_V1.sellerResponseBody,
      {
        primary: RESPOND,
        secondary: viewDetails(),
        allowsRespond: true,
        readOnly: false,
        hasProtectionCase: details.hasProtectionCase,
      },
    );
  }

  if (input.protectionStatus === "awaiting_buyer") {
    return presentation(
      SELLER_RESOLUTION_LIFECYCLE_V1.evidenceTitle,
      SELLER_RESOLUTION_LIFECYCLE_V1.evidenceBody,
      details,
    );
  }

  if (input.protectionStatus === "under_review" || input.protectionStatus === "appealed") {
    return presentation(
      SELLER_RESOLUTION_LIFECYCLE_V1.underReviewTitle,
      SELLER_RESOLUTION_LIFECYCLE_V1.underReviewBody,
      details,
    );
  }

  return presentation(
    SELLER_RESOLUTION_LIFECYCLE_V1.issueOpenTitle,
    SELLER_RESOLUTION_LIFECYCLE_V1.issueOpenBody,
    details,
  );
}

export function sellerResolutionDoesNotShowReturnForNonDelivery(
  lossState: LostParcelLogicalState | null | undefined,
): boolean {
  return (
    lossState === "POSSIBLY_LOST" ||
    lossState === "WAITING_FOR_CARRIER" ||
    lossState === "CARRIER_INVESTIGATION_OPEN" ||
    lossState === "CARRIER_ACTION_REQUIRED" ||
    lossState === "CARRIER_RESOLVED" ||
    lossState === "CARRIER_CONFIRMED_LOST"
  );
}
