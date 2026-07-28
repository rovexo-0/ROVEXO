/**
 * Dynamic Offer Action Engine v1.0 — PRODUCT PAGE UI visibility only.
 * Reuses existing offer rows + mapOfferDbStatus. No API / DB / engine changes.
 */

import { mapOfferDbStatus, type ConversationOfferState } from "@/lib/inbox/conversation-view";
import { formatCurrency } from "@/lib/wallet/utils";

export const DYNAMIC_OFFER_ACTION_ENGINE_V1 = {
  version: "1.0",
  surface: "product-page" as const,
  status: "UI_ONLY" as const,
} as const;

export type OfferActionRole = "buyer" | "seller";

export type OfferActionOfferInput = {
  id: string;
  amount: number;
  status: string;
  fromRole: OfferActionRole;
  createdAt: string;
  parentOfferId?: string | null;
};

export type ProductOfferActionMode =
  | "idle"
  | "buyer_pending"
  | "seller_counter"
  | "accepted"
  | "declined"
  | "expired"
  | "out_of_stock";

export type ProductOfferActionView = {
  mode: ProductOfferActionMode;
  /** Active offer id for accept / decline / cancel / counter / buy. */
  offerId: string | null;
  amount: number | null;
  statusLabel: string | null;
  amountLabel: string | null;
  showBuyNow: boolean;
  showMakeOffer: boolean;
  showCancelOffer: boolean;
  showAccept: boolean;
  showDecline: boolean;
  showCounterOffer: boolean;
  buyUsesNegotiatedPrice: boolean;
};

function sortNewestFirst(offers: OfferActionOfferInput[]): OfferActionOfferInput[] {
  return [...offers].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/**
 * Resolve the single logical product-page action state for the buyer viewer.
 * Only one mode is active. Conflicting CTAs never render together.
 */
export function resolveProductOfferActionView(input: {
  outOfStock: boolean;
  offers: OfferActionOfferInput[];
}): ProductOfferActionView {
  if (input.outOfStock) {
    return {
      mode: "out_of_stock",
      offerId: null,
      amount: null,
      statusLabel: null,
      amountLabel: null,
      showBuyNow: false,
      showMakeOffer: false,
      showCancelOffer: false,
      showAccept: false,
      showDecline: false,
      showCounterOffer: false,
      buyUsesNegotiatedPrice: false,
    };
  }

  const offers = sortNewestFirst(input.offers);
  const withState = offers.map((offer) => ({
    ...offer,
    state: mapOfferDbStatus(offer.status) as ConversationOfferState,
  }));

  const accepted = withState.find((offer) => offer.state === "accepted");
  if (accepted) {
    return {
      mode: "accepted",
      offerId: accepted.id,
      amount: accepted.amount,
      statusLabel: "Offer Accepted",
      amountLabel: `Final Price ${formatCurrency(accepted.amount)}`,
      showBuyNow: true,
      showMakeOffer: false,
      showCancelOffer: false,
      showAccept: false,
      showDecline: false,
      showCounterOffer: false,
      buyUsesNegotiatedPrice: true,
    };
  }

  const open = withState.find((offer) => offer.state === "open");
  if (open) {
    if (open.fromRole === "seller") {
      return {
        mode: "seller_counter",
        offerId: open.id,
        amount: open.amount,
        statusLabel: "Seller Counter Offer",
        amountLabel: formatCurrency(open.amount),
        showBuyNow: false,
        showMakeOffer: false,
        showCancelOffer: false,
        showAccept: true,
        showDecline: true,
        showCounterOffer: true,
        buyUsesNegotiatedPrice: false,
      };
    }

    return {
      mode: "buyer_pending",
      offerId: open.id,
      amount: open.amount,
      statusLabel: "Offer Pending",
      amountLabel: formatCurrency(open.amount),
      showBuyNow: false,
      showMakeOffer: false,
      showCancelOffer: true,
      showAccept: false,
      showDecline: false,
      showCounterOffer: false,
      buyUsesNegotiatedPrice: false,
    };
  }

  const latestTerminal = withState.find(
    (offer) => offer.state === "declined" || offer.state === "expired",
  );
  if (latestTerminal?.state === "declined") {
    return {
      mode: "declined",
      offerId: null,
      amount: null,
      statusLabel: "Offer Declined",
      amountLabel: null,
      showBuyNow: true,
      showMakeOffer: true,
      showCancelOffer: false,
      showAccept: false,
      showDecline: false,
      showCounterOffer: false,
      buyUsesNegotiatedPrice: false,
    };
  }
  if (latestTerminal?.state === "expired") {
    return {
      mode: "expired",
      offerId: null,
      amount: null,
      statusLabel: "Offer Expired",
      amountLabel: null,
      showBuyNow: true,
      showMakeOffer: true,
      showCancelOffer: false,
      showAccept: false,
      showDecline: false,
      showCounterOffer: false,
      buyUsesNegotiatedPrice: false,
    };
  }

  return {
    mode: "idle",
    offerId: null,
    amount: null,
    statusLabel: null,
    amountLabel: null,
    showBuyNow: true,
    showMakeOffer: true,
    showCancelOffer: false,
    showAccept: false,
    showDecline: false,
    showCounterOffer: false,
    buyUsesNegotiatedPrice: false,
  };
}
