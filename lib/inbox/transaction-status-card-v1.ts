/**
 * ROVEXO v1.0 — Dynamic Transaction Status Card (canonical resolver)
 *
 * PRESENTATION MODEL ONLY — state content certification.
 * Reads existing Order / Offer / Shipping / Tracking signals.
 * No APIs · no mutations · no permissions · no JSX.
 */

import type { AccountIconName } from "@/components/account/AccountIcons";
import type { ConversationTrackingView } from "@/lib/inbox/conversation-view";
import type { SenderRole } from "@/lib/messages/types";
import type { Order } from "@/lib/orders/types";
import type { LostParcelLogicalState } from "@/lib/resolution-engine/lost-parcel-resolution-v1";
import {
  LOST_PARCEL_RESOLUTION_V1,
  classifyTrackingLossSignal,
  nextStateAfterSuspectedLoss,
  waitingCopyForRole,
} from "@/lib/resolution-engine/lost-parcel-resolution-v1";
import {
  isBuyerNonDeliveryWaitingState,
  isSellerBuyerReportedNonDelivery,
  NON_DELIVERY_RESOLUTION_CASE_V1,
  resolveBuyerNonDeliveryResolutionCase,
  type NonDeliveryResolutionCaseModel,
} from "@/lib/inbox/non-delivery-resolution-case-v1";
import {
  CANONICAL_BUYER_SELLER_RESOLUTION_V1,
  canRenderResolved,
  isCanonicalIssueCardActive,
  resolveCanonicalIssueCardCopy,
  resolveCanonicalProtectionStatus,
} from "@/lib/inbox/canonical-buyer-seller-resolution-v1";
import {
  SELLER_RESOLUTION_LIFECYCLE_V1,
  resolveSellerResolutionLifecycle,
} from "@/lib/inbox/seller-resolution-lifecycle-v1";
import type { ConversationDisputeView } from "@/lib/inbox/conversation-view";

export const TRANSACTION_STATUS_CARD_V1 = {
  version: "v1.0",
  name: "DYNAMIC_TRANSACTION_STATUS_CARD",
  placement: "PRODUCT_CARD → CARD → TIMELINE",
  oneCardOnly: true,
  oneStateOnly: true,
  renderOnlyWhenNeeded: true,
  presentationOnly: true,
  contentCertified: true,
} as const;

/** Canonical status enum — one current status only. */
export type TransactionStatusCardStatus =
  | "OFFER_ACCEPTED"
  | "CHECKOUT_PENDING"
  | "PAYMENT_PENDING"
  | "PAYMENT_COMPLETED"
  | "LABEL_CREATED"
  | "PARCEL_COLLECTED"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FUNDS_PENDING_RELEASE"
  | "FUNDS_RELEASED"
  | "UNKNOWN";

/** Action ids must map 1:1 to existing runOrderAction handlers. */
export type TransactionStatusCardActionId =
  | "buy_now"
  | "resume_payment"
  | "view_order"
  | "view_label"
  | "print_label"
  | "track_parcel"
  | "leave_review"
  | "report_issue"
  | "report_not_arrived"
  | "add_information"
  | "contact_seller"
  | "confirm_received"
  | "view_dispute"
  | "cancel_order"
  /** @deprecated Messages Master Rewrite — never emit in Messages UI (Wallet only). */
  | "withdraw";

export type TransactionStatusCardAction = {
  id: TransactionStatusCardActionId;
  label: string;
};

/** Existing conversation tracking copy — not a second status engine. */
export type TransactionStatusCardTrackingDetail = {
  activityTitle: string;
  activityDescription: string;
  carrierTracking: string;
};

/** Canonical presentation model — never JSX. */
export type TransactionStatusCardModel = {
  status: TransactionStatusCardStatus;
  title: string;
  description: string;
  icon: AccountIconName;
  primaryAction: TransactionStatusCardAction | null;
  secondaryAction: TransactionStatusCardAction | null;
  trackingDetail: TransactionStatusCardTrackingDetail | null;
  resolutionCase: NonDeliveryResolutionCaseModel | null;
};

export type ResolveTransactionStatusCardInput = {
  viewerRole: SenderRole;
  order: Order | null | undefined;
  hasAcceptedOffer: boolean;
  hasShippingLabel: boolean;
  tracking: ConversationTrackingView | null | undefined;
  /** Existing hub flag — cancelled checkout resume sheet. */
  checkoutResumeAvailable?: boolean;
  /** Logical lost-parcel state from Resolution / local QA — not a second card engine. */
  lossState?: LostParcelLogicalState | null;
  /** Official Sendcloud ticket_id only. Never invent. */
  hasOfficialTicketId?: boolean;
  /** Existing protection case already loaded by Conversation Hub. */
  dispute?: ConversationDisputeView | null;
  /** Existing carrier_returns.status when already known — never invent. */
  returnStatus?: string | null;
  overlayProtectionStatus?: string | null;
  reasonId?: string | null;
  simulationAction?: string | null;
};

function trackingBlob(tracking: ConversationTrackingView | null | undefined): string {
  return [tracking?.statusLabel, tracking?.latestScan].filter(Boolean).join(" ").toLowerCase();
}

function investigationCardTitle(lossState: LostParcelLogicalState | null): string {
  if (lossState === "CARRIER_INVESTIGATION_OPEN") return "Carrier investigation in progress.";
  if (lossState === "CARRIER_ACTION_REQUIRED") return "Additional information required.";
  if (lossState === "CARRIER_RESOLVED") return "Carrier investigation resolved.";
  return "Waiting for carrier";
}

/** Existing shipping-UI phase — same blob checks already used by this card. */
export type ExistingShippingUiPhase =
  | "collected"
  | "in_transit"
  | "out_for_delivery"
  | "delivered";

export function resolveExistingShippingUiPhase(
  tracking: ConversationTrackingView | null | undefined,
  orderStatus?: Order["status"] | null,
): ExistingShippingUiPhase | null {
  const phaseFrom = (text: string): ExistingShippingUiPhase | null => {
    if (!text) return null;
    if (text.includes("out for delivery") || text.includes("out for")) return "out_for_delivery";
    if (
      text.includes("collected") ||
      text.includes("picked up") ||
      text.includes("accepted by carrier")
    ) {
      return "collected";
    }
    if (
      text.includes("in transit") ||
      text.includes("on the way") ||
      text.includes("en route") ||
      text.includes("progressing")
    ) {
      return "in_transit";
    }
    if (text.includes("delivered")) return "delivered";
    return null;
  };

  /* Prefer the live scan the shipping card already shows over a stale order label. */
  return (
    phaseFrom((tracking?.latestScan ?? "").toLowerCase()) ??
    phaseFrom((tracking?.statusLabel ?? "").toLowerCase()) ??
    (orderStatus === "shipped" ? "in_transit" : null) ??
    (orderStatus === "delivered" ? "delivered" : null)
  );
}

export function isBuyerDeliveryConfirmationVisible(
  tracking: ConversationTrackingView | null | undefined,
  orderStatus?: Order["status"] | null,
): boolean {
  void tracking;
  return orderStatus === "delivered";
}

/**
 * Presentation line from existing ConversationTrackingView / Order fields.
 * Same `carrier · value` pattern as conversation-view drop-off meta.
 * Does not import untracked shipping helpers or change tracking identity.
 */
function formatCanonicalCarrierTrackingLine(
  tracking: ConversationTrackingView | null | undefined,
  order: Order | null | undefined,
): string {
  const carrier = (tracking?.courierName || order?.deliveryCarrier || "").trim();
  if (!carrier) return "";
  const trackingNumber = (tracking?.trackingNumber || order?.trackingNumber || "").trim();
  return trackingNumber ? `${carrier} · ${trackingNumber}` : carrier;
}

export function resolveTransactionStatusTrackingDetail(
  tracking: ConversationTrackingView | null | undefined,
  order: Order | null | undefined,
): TransactionStatusCardTrackingDetail | null {
  const carrierTracking = formatCanonicalCarrierTrackingLine(tracking, order);
  if (!carrierTracking) return null;

  const blob = trackingBlob(tracking);
  return {
    activityTitle:
      blob.includes("out for delivery") || blob.includes("out for")
        ? "Out for delivery"
        : "Tracking Active",
    activityDescription:
      tracking?.latestScan?.trim() || "Shipment handed to carrier",
    carrierTracking,
  };
}

function model(
  partial: Omit<TransactionStatusCardModel, "secondaryAction" | "trackingDetail" | "resolutionCase"> & {
    secondaryAction?: TransactionStatusCardAction | null;
    trackingDetail?: TransactionStatusCardTrackingDetail | null;
    resolutionCase?: NonDeliveryResolutionCaseModel | null;
  },
): TransactionStatusCardModel {
  return {
    ...partial,
    secondaryAction: partial.secondaryAction ?? null,
    trackingDetail: partial.trackingDetail ?? null,
    resolutionCase: partial.resolutionCase ?? null,
  };
}

function resolveSellerLifecycleCard(
  order: Order,
  dispute: ConversationDisputeView | null | undefined,
  extras?: {
    lossState?: LostParcelLogicalState | null;
    returnStatus?: string | null;
    protectionStatus?: import("@/lib/protection/service").ProtectionCaseStatus | null;
    reasonId?: string | null;
    simulationAction?: string | null;
  },
): TransactionStatusCardModel | null {
  const protectionStatus =
    extras?.protectionStatus ??
    resolveCanonicalProtectionStatus({
      disputeStatus: dispute?.status,
      reasonId: extras?.reasonId,
      simulationAction: extras?.simulationAction,
      returnStatus: extras?.returnStatus,
    });
  const lifecycle = resolveSellerResolutionLifecycle({
    orderStatus: order.status,
    refundStatus: order.refundStatus,
    refundedAt: order.refundedAt,
    protectionStatus,
    protectionCaseType: dispute?.caseType ?? null,
    protectionOutcome: dispute?.outcome ?? null,
    hasProtectionCase: Boolean(dispute?.id || extras?.reasonId || extras?.simulationAction === "report_issue"),
    lossState: extras?.lossState ?? null,
    returnStatus: extras?.returnStatus ?? null,
  });
  if (!lifecycle) return null;
  const terminal = canRenderResolved({
    protectionStatus,
    orderStatus: order.status,
  });
  const refunded = Boolean(order.refundedAt) || order.refundStatus === "completed";
  const cardCopy = resolveCanonicalIssueCardCopy();
  if (!terminal && !refunded) {
    return model({
      status: "FUNDS_PENDING_RELEASE",
      icon: "help",
      title: cardCopy.title,
      description: cardCopy.description,
      primaryAction: { id: "view_dispute", label: CANONICAL_BUYER_SELLER_RESOLUTION_V1.viewDetailsLabel },
    });
  }
  if (!terminal && refunded && lifecycle.title === SELLER_RESOLUTION_LIFECYCLE_V1.resolvedTitle) {
    return model({
      status: "FUNDS_PENDING_RELEASE",
      icon: "help",
      title: cardCopy.title,
      description: cardCopy.description,
      primaryAction: { id: "view_dispute", label: CANONICAL_BUYER_SELLER_RESOLUTION_V1.viewDetailsLabel },
    });
  }
  return model({
    status: terminal ? "FUNDS_RELEASED" : "FUNDS_PENDING_RELEASE",
    icon: terminal ? "verification" : "help",
    title: lifecycle.title,
    description: lifecycle.description,
    primaryAction: { id: "view_dispute", label: CANONICAL_BUYER_SELLER_RESOLUTION_V1.viewDetailsLabel },
    secondaryAction: lifecycle.secondaryAction,
  });
}

/**
 * Read existing state → one presentation model (certified copy per role).
 * Returns null when inactive (card must not mount).
 */
export function resolveTransactionStatusCard(
  input: ResolveTransactionStatusCardInput,
): TransactionStatusCardModel | null {
  const { viewerRole, order, hasAcceptedOffer, hasShippingLabel, tracking } = input;
  const isBuyer = viewerRole === "buyer";

  if (!order) {
    if (!hasAcceptedOffer) return null;

    /* STATE 02 — mid-checkout resume (existing hub flag). */
    if (input.checkoutResumeAvailable) {
      if (isBuyer) {
        return model({
          status: "CHECKOUT_PENDING",
          icon: "checkout",
          title: "Checkout Ready",
          description: "Complete your purchase to reserve this item.",
          primaryAction: { id: "resume_payment", label: "CONTINUE CHECKOUT" },
        });
      }
      return model({
        status: "CHECKOUT_PENDING",
        icon: "checkout",
        title: "Waiting for Buyer",
        description: "Buyer has not completed checkout yet.",
        primaryAction: { id: "view_order", label: "View Details" },
      });
    }

    /* STATE 01 — Offer Accepted */
    if (isBuyer) {
      return model({
        status: "OFFER_ACCEPTED",
        icon: "verification",
        title: "Offer Accepted",
        description: "Your offer has been accepted.",
        primaryAction: { id: "buy_now", label: "BUY NOW" },
        secondaryAction: { id: "view_order", label: "View Details" },
      });
    }
    return model({
      status: "OFFER_ACCEPTED",
      icon: "verification",
      title: "Offer Accepted",
      description: "Waiting for the buyer to complete checkout.",
      primaryAction: { id: "view_order", label: "View Details" },
    });
  }

  const protectionStatus = resolveCanonicalProtectionStatus({
    overlayProtectionStatus: input.overlayProtectionStatus,
    disputeStatus: input.dispute?.status,
    reasonId: input.reasonId,
    simulationAction: input.simulationAction,
    returnStatus: input.returnStatus,
  });
  const sellerLifecycleExtras = {
    lossState: input.lossState,
    returnStatus: input.returnStatus,
    protectionStatus,
    reasonId: input.reasonId,
    simulationAction: input.simulationAction,
  };
  const activeIssue = isCanonicalIssueCardActive({
    orderStatus: order.status,
    protectionStatus,
    refundedAt: order.refundedAt,
    refundStatus: order.refundStatus,
    reasonId: input.reasonId,
    simulationAction: input.simulationAction,
  });

  if (order.status === "cancelled") {
    if (!isBuyer) {
      const refundedSeller = resolveSellerLifecycleCard(order, input.dispute, sellerLifecycleExtras);
      if (refundedSeller) return refundedSeller;
    }
    return null;
  }

  const trackingDetail = resolveTransactionStatusTrackingDetail(tracking, order);

  /* STATE 03 — Payment Pending */
  if (order.status === "awaiting_payment") {
    if (isBuyer) {
      return model({
        status: "PAYMENT_PENDING",
        icon: "payment",
        title: "Payment Required",
        description: "Complete payment to continue.",
        primaryAction: { id: "resume_payment", label: "PAY NOW" },
      });
    }
    return model({
      status: "PAYMENT_PENDING",
      icon: "payment",
      title: "Awaiting Payment",
      description: "Waiting for buyer payment.",
      primaryAction: { id: "view_order", label: "View Details" },
    });
  }

  /* STATE 04 / 05 — paid, awaiting shipment */
  if (order.status === "awaiting_shipment") {
    if (hasShippingLabel) {
      /* STATE 05 — LABEL_CREATED
         MES: carrier scan owns handoff — no MARK AS HANDED TO CARRIER secondary. */
      if (isBuyer) {
        /* Buyer never sees label PDF controls — Track Parcel only when tracking exists. */
        return model({
          status: "LABEL_CREATED",
          icon: "shipping",
          title: "Shipping Label Created",
          description: "Seller is preparing dispatch.",
          primaryAction: tracking?.trackingNumber
            ? { id: "track_parcel", label: "TRACK PARCEL" }
            : { id: "view_order", label: "VIEW ORDER" },
          trackingDetail: tracking?.trackingNumber ? trackingDetail : null,
        });
      }
      return model({
        status: "LABEL_CREATED",
        icon: "shipping",
        title: "Shipping Label Ready",
        description: "Parcel is ready to hand over.",
        primaryAction: { id: "print_label", label: "PRINT LABEL" },
      });
    }

    /* STATE 04 — PAYMENT_COMPLETED */
    if (isBuyer) {
      return model({
        status: "PAYMENT_COMPLETED",
        icon: "verification",
        title: "Payment Successful",
        description: "Your payment has been confirmed.",
        primaryAction: { id: "view_order", label: "VIEW ORDER" },
        /* Cancel lives compactly inside Order Details (BuyerCancelOrderCard) — not on this card. */
        secondaryAction: null,
      });
    }
    return model({
      status: "PAYMENT_COMPLETED",
      icon: "verification",
      title: "Payment Received",
      description: "Prepare the parcel for shipment.",
      primaryAction: { id: "print_label", label: "CREATE SHIPPING LABEL" },
    });
  }

  /* STATE 06–08 — shipped / tracking. Canonical order.status owns delivered vs in-progress. */
  if (order.status === "shipped") {
    const inferredLoss = classifyTrackingLossSignal(
      `${tracking?.statusLabel ?? ""} ${tracking?.latestScan ?? ""}`,
    );
    const lossState =
      input.lossState ??
      (inferredLoss.state === "POSSIBLY_LOST" ? nextStateAfterSuspectedLoss() : null);
    const waitingForCarrier =
      lossState === "DELAYED" ||
      lossState === "POSSIBLY_LOST" ||
      lossState === "WAITING_FOR_CARRIER" ||
      lossState === "CARRIER_INVESTIGATION_OPEN" ||
      lossState === "CARRIER_ACTION_REQUIRED" ||
      lossState === "CARRIER_RESOLVED" ||
      lossState === "CARRIER_CONFIRMED_LOST";
    const notArrivedAction =
      isBuyer && !waitingForCarrier
        ? { id: "report_not_arrived" as const, label: LOST_PARCEL_RESOLUTION_V1.notArrivedLabel }
        : null;
    const preparedInvestigation =
      lossState === "CARRIER_INVESTIGATION_OPEN" ||
      lossState === "CARRIER_ACTION_REQUIRED" ||
      lossState === "CARRIER_RESOLVED";
    const buyerResolutionCase =
      isBuyer && isBuyerNonDeliveryWaitingState(lossState)
        ? resolveBuyerNonDeliveryResolutionCase({
            state: lossState,
            hasOfficialTicketId: input.hasOfficialTicketId === true,
          })
        : null;
    const sellerReportedNonDelivery =
      !isBuyer && isSellerBuyerReportedNonDelivery(lossState);
    const sellerWaitingDescription =
      waitingForCarrier && !isBuyer && !sellerReportedNonDelivery
        ? `${
            preparedInvestigation &&
            (lossState === "CARRIER_INVESTIGATION_OPEN" ||
              lossState === "CARRIER_ACTION_REQUIRED" ||
              lossState === "CARRIER_RESOLVED")
              ? investigationCardTitle(lossState)
              : waitingCopyForRole("seller")
          } ${LOST_PARCEL_RESOLUTION_V1.sellerCompensationCopy}`
        : null;
    const sellerOverridesShipping = Boolean(sellerWaitingDescription);
    const sellerViewDetails = {
      id: "view_order" as const,
      label: NON_DELIVERY_RESOLUTION_CASE_V1.sellerViewDetails,
    };
    const trackParcelAction = {
      id: "track_parcel" as const,
      label: "TRACK PARCEL",
    };
    const shippedPrimaryAction = sellerReportedNonDelivery
      ? sellerViewDetails
      : trackParcelAction;
    const shippedSecondaryAction = sellerReportedNonDelivery
      ? trackParcelAction
      : preparedInvestigation && !isBuyer
        ? sellerViewDetails
        : notArrivedAction;

    const shippingPhase = resolveExistingShippingUiPhase(tracking, order.status);
    if (shippingPhase === "out_for_delivery") {
      return model({
        status: "OUT_FOR_DELIVERY",
        icon: "tracking",
        title: sellerReportedNonDelivery
          ? NON_DELIVERY_RESOLUTION_CASE_V1.sellerNonDeliveryTitle
          : sellerOverridesShipping
            ? investigationCardTitle(lossState)
            : trackingDetail?.activityTitle ?? "Out for delivery",
        description: sellerReportedNonDelivery
          ? NON_DELIVERY_RESOLUTION_CASE_V1.sellerNonDeliveryBody
          : sellerWaitingDescription ?? trackingDetail?.activityDescription ?? "Expected today.",
        primaryAction: shippedPrimaryAction,
        secondaryAction: shippedSecondaryAction,
        trackingDetail,
        resolutionCase: buyerResolutionCase,
      });
    }
    if (shippingPhase === "collected") {
      return model({
        status: "PARCEL_COLLECTED",
        icon: "shipping",
        title: sellerReportedNonDelivery
          ? NON_DELIVERY_RESOLUTION_CASE_V1.sellerNonDeliveryTitle
          : sellerOverridesShipping
            ? investigationCardTitle(lossState)
            : trackingDetail?.activityTitle ?? "Tracking Active",
        description: sellerReportedNonDelivery
          ? NON_DELIVERY_RESOLUTION_CASE_V1.sellerNonDeliveryBody
          : sellerWaitingDescription ??
            trackingDetail?.activityDescription ??
            "Shipment handed to carrier",
        primaryAction: shippedPrimaryAction,
        secondaryAction: shippedSecondaryAction,
        trackingDetail,
        resolutionCase: buyerResolutionCase,
      });
    }
    return model({
      status: "IN_TRANSIT",
      icon: "tracking",
      title: sellerReportedNonDelivery
        ? NON_DELIVERY_RESOLUTION_CASE_V1.sellerNonDeliveryTitle
        : sellerOverridesShipping
          ? investigationCardTitle(lossState)
          : trackingDetail?.activityTitle ?? "Tracking Active",
      description: sellerReportedNonDelivery
        ? NON_DELIVERY_RESOLUTION_CASE_V1.sellerNonDeliveryBody
        : sellerWaitingDescription ??
          (lossState === "DELAYED"
            ? trackingDetail?.activityDescription ?? "Shipment handed to carrier"
            : trackingDetail?.activityDescription ?? "Shipment handed to carrier"),
      primaryAction: shippedPrimaryAction,
      secondaryAction: shippedSecondaryAction,
      trackingDetail,
      resolutionCase: buyerResolutionCase,
    });
  }

  /* STATE 09 — DELIVERED (Messages Master Rewrite — role-separated, no wallet CTAs) */
  if (order.status === "delivered") {
    if (isBuyer) {
      return model({
        status: "DELIVERED",
        icon: "orders",
        title: "Parcel Delivered",
        description: "Is everything OK?",
        primaryAction: { id: "confirm_received", label: "Everything OK" },
        secondaryAction: order.disputesDisabled
          ? null
          : { id: "report_issue", label: "I Have an Issue" },
      });
    }
    return model({
      status: "DELIVERED",
      icon: "orders",
      title: "Waiting for buyer confirmation...",
      description: "The buyer will confirm Everything OK or report an issue.",
      primaryAction: null,
    });
  }

  /* STATE 10 — ISSUE OPEN (dispute — never wallet / funds language in Messages) */
  if (order.status === "issue_open" || (activeIssue && !canRenderResolved({ protectionStatus, orderStatus: order.status }))) {
    const issueCard = resolveCanonicalIssueCardCopy();
    if (isBuyer) {
      return model({
        status: "FUNDS_PENDING_RELEASE",
        icon: "help",
        title: issueCard.title,
        description: issueCard.description,
        primaryAction: { id: "view_dispute", label: CANONICAL_BUYER_SELLER_RESOLUTION_V1.viewDetailsLabel },
      });
    }
    return (
      resolveSellerLifecycleCard(order, input.dispute, sellerLifecycleExtras) ??
      model({
        status: "FUNDS_PENDING_RELEASE",
        icon: "help",
        title: issueCard.title,
        description: issueCard.description,
        primaryAction: { id: "view_dispute", label: CANONICAL_BUYER_SELLER_RESOLUTION_V1.viewDetailsLabel },
      })
    );
  }

  /* STATE 11 — COMPLETED
     Buyer: Leave Review only. Seller: Sale completed — never Withdraw / Wallet CTAs. */
  if (order.status === "completed" || order.completedAt) {
    if (!isBuyer) {
      const refundActive =
        Boolean(order.refundedAt) ||
        order.refundStatus === "initiated" ||
        order.refundStatus === "processing" ||
        order.refundStatus === "completed";
      if (refundActive) {
        const refundedSeller = resolveSellerLifecycleCard(order, input.dispute, sellerLifecycleExtras);
        if (refundedSeller) return refundedSeller;
      }
    }
    if (isBuyer) {
      return model({
        status: "FUNDS_RELEASED",
        icon: "verification",
        title: "Completed",
        description: "Leave feedback when you're ready.",
        primaryAction: { id: "leave_review", label: "Leave Feedback" },
      });
    }
    return model({
      status: "FUNDS_RELEASED",
      icon: "verification",
      title: "Sale completed",
      description: "Thank you for selling on ROVEXO.",
      primaryAction: null,
    });
  }

  return null;
}

/** Inactive when null or UNKNOWN — caller must render null (no DOM). */
export function isTransactionStatusCardActive(
  card: TransactionStatusCardModel | null | undefined,
): card is TransactionStatusCardModel {
  return Boolean(card && card.status !== "UNKNOWN");
}
