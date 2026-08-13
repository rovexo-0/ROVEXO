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
  | "confirm_received"
  | "cancel_order"
  /** @deprecated Messages Master Rewrite — never emit in Messages UI (Wallet only). */
  | "withdraw";

export type TransactionStatusCardAction = {
  id: TransactionStatusCardActionId;
  label: string;
};

/** Canonical presentation model — never JSX. */
export type TransactionStatusCardModel = {
  status: TransactionStatusCardStatus;
  title: string;
  description: string;
  icon: AccountIconName;
  primaryAction: TransactionStatusCardAction | null;
  secondaryAction: TransactionStatusCardAction | null;
};

export type ResolveTransactionStatusCardInput = {
  viewerRole: SenderRole;
  order: Order | null | undefined;
  hasAcceptedOffer: boolean;
  hasShippingLabel: boolean;
  tracking: ConversationTrackingView | null | undefined;
  /** Existing hub flag — cancelled checkout resume sheet. */
  checkoutResumeAvailable?: boolean;
};

function trackingBlob(tracking: ConversationTrackingView | null | undefined): string {
  return [tracking?.statusLabel, tracking?.latestScan].filter(Boolean).join(" ").toLowerCase();
}

function model(
  partial: Omit<TransactionStatusCardModel, "secondaryAction"> & {
    secondaryAction?: TransactionStatusCardAction | null;
  },
): TransactionStatusCardModel {
  return {
    ...partial,
    secondaryAction: partial.secondaryAction ?? null,
  };
}

/**
 * Read existing state → one presentation model (certified copy per role).
 * Returns null when inactive (card must not mount).
 */
export function resolveTransactionStatusCard(
  input: ResolveTransactionStatusCardInput,
): TransactionStatusCardModel | null {
  const { viewerRole, order, hasAcceptedOffer, hasShippingLabel, tracking } = input;
  const blob = trackingBlob(tracking);
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

  if (order.status === "cancelled") return null;

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

  /* STATE 06–08 — shipped / tracking */
  if (order.status === "shipped") {
    if (blob.includes("out for delivery") || blob.includes("out for")) {
      if (isBuyer) {
        return model({
          status: "OUT_FOR_DELIVERY",
          icon: "tracking",
          title: "Out For Delivery",
          description: "Expected today.",
          primaryAction: { id: "track_parcel", label: "TRACK PARCEL" },
        });
      }
      return model({
        status: "OUT_FOR_DELIVERY",
        icon: "tracking",
        title: "Out For Delivery",
        description: "Parcel is arriving today.",
        primaryAction: { id: "track_parcel", label: "TRACK PARCEL" },
      });
    }
    if (
      blob.includes("collected") ||
      blob.includes("picked up") ||
      blob.includes("accepted by carrier")
    ) {
      if (isBuyer) {
        return model({
          status: "PARCEL_COLLECTED",
          icon: "shipping",
          title: "Parcel Collected",
          description: "Your parcel is now with the carrier.",
          primaryAction: { id: "track_parcel", label: "TRACK PARCEL" },
        });
      }
      return model({
        status: "PARCEL_COLLECTED",
        icon: "shipping",
        title: "Parcel Collected",
        description: "Carrier has collected the parcel.",
        primaryAction: { id: "track_parcel", label: "TRACK PARCEL" },
      });
    }
    if (isBuyer) {
      return model({
        status: "IN_TRANSIT",
        icon: "tracking",
        title: "Parcel In Transit",
        description: "Your parcel is on its way.",
        primaryAction: { id: "track_parcel", label: "TRACK PARCEL" },
      });
    }
    return model({
      status: "IN_TRANSIT",
      icon: "tracking",
      title: "Parcel In Transit",
      description: "Shipment is progressing.",
      primaryAction: { id: "track_parcel", label: "TRACK PARCEL" },
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
  if (order.status === "issue_open") {
    if (isBuyer) {
      return model({
        status: "FUNDS_PENDING_RELEASE",
        icon: "help",
        title: "Issue Open",
        description: "Resolution is in progress.",
        primaryAction: { id: "view_order", label: "View Details" },
      });
    }
    return model({
      status: "FUNDS_PENDING_RELEASE",
      icon: "help",
      title: "Issue Open",
      description: "Resolution is in progress.",
      primaryAction: { id: "view_order", label: "View Details" },
    });
  }

  /* STATE 11 — COMPLETED
     Buyer: Leave Review only. Seller: Sale completed — never Withdraw / Wallet CTAs. */
  if (order.status === "completed" || order.completedAt) {
    if (isBuyer) {
      return model({
        status: "FUNDS_RELEASED",
        icon: "verification",
        title: "Completed",
        description: "Leave a review when you're ready.",
        primaryAction: { id: "leave_review", label: "Leave Review" },
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
