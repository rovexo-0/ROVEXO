/** TRANSACTION_HUB_MASTER_SPEC v1.0 — Document 1 SSOT */

export const TRANSACTION_HUB_VERSION = "v1.0" as const;

/** Canonical chat bottom action priority — primary → tertiary. */
export const CHAT_BOTTOM_ACTIONS = {
  buyNow: { id: "buy_now", label: "Buy Now", priority: "primary" },
  makeOffer: { id: "make_offer", label: "Make Offer", priority: "secondary" },
  addToCart: { id: "add_to_cart", label: "Add to Cart", priority: "tertiary" },
} as const;

/** Checkout Hub steps — buyer-only platform fee on summary. */
export const CHECKOUT_HUB_STEPS = [
  "delivery_method",
  "shipping_address",
  "payment_method",
  "order_summary",
  "pay_now",
] as const;

/** Order timeline visible inside chat. */
export const TRANSACTION_HUB_ORDER_TIMELINE = [
  "order_placed",
  "payment_received",
  "preparing_order",
  "shipping_label_generated",
  "parcel_collected",
  "in_transit",
  "delivered",
  "completed",
] as const;

export const TRANSACTION_HUB_COPY = {
  listingPublished: "Listing published",
  paymentSuccessful: "Payment Successful",
  addedToCart: "Added to Cart",
  linkCopied: "Link copied successfully.",
  viewOrder: "View Order",
  continueChat: "Continue Chat",
  getShippingLabel: "Get Shipping Label",
  trackParcel: "Track Parcel",
} as const;

export type TransactionHubOrderTimelineStep = (typeof TRANSACTION_HUB_ORDER_TIMELINE)[number];
export type CheckoutHubStep = (typeof CHECKOUT_HUB_STEPS)[number];
