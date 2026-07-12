import { trackGaEvent } from "@/lib/analytics/ga4-events";

type HubAnalyticsContext = {
  conversationId: string;
  productSlug: string;
  productId?: string;
};

function hubParams(context: HubAnalyticsContext, extra?: Record<string, string | number | boolean>) {
  return {
    conversation_id: context.conversationId,
    item_id: context.productSlug,
    ...(context.productId ? { product_id: context.productId } : {}),
    source: "transaction_hub",
    ...extra,
  };
}

export function trackTransactionHubViewListing(context: HubAnalyticsContext): void {
  trackGaEvent("view_listing_hub", hubParams(context));
}

export function trackTransactionHubBuyNow(context: HubAnalyticsContext): void {
  trackGaEvent("begin_checkout", hubParams(context, { action: "buy_now" }));
}

export function trackTransactionHubCheckoutStarted(context: HubAnalyticsContext): void {
  trackGaEvent("checkout_started", hubParams(context));
}

export function trackTransactionHubCheckoutCompleted(
  context: HubAnalyticsContext,
  orderId?: string,
): void {
  const extra: Record<string, string | number | boolean> = {};
  if (orderId) extra.order_id = orderId;
  trackGaEvent("checkout_completed", hubParams(context, extra));
  trackGaEvent("purchase", hubParams(context, extra));
}

export function trackTransactionHubAddToCart(context: HubAnalyticsContext): void {
  trackGaEvent("add_to_cart", hubParams(context));
}

export function trackTransactionHubOfferOpened(context: HubAnalyticsContext): void {
  trackGaEvent("offer_opened", hubParams(context));
}

export function trackTransactionHubMakeOffer(context: HubAnalyticsContext, amount: number): void {
  trackGaEvent("make_offer", hubParams(context, { value: amount }));
  trackGaEvent("offer_sent", hubParams(context, { value: amount }));
}

export function trackTransactionHubOfferAccepted(context: HubAnalyticsContext, amount: number): void {
  trackGaEvent("offer_accepted", hubParams(context, { value: amount }));
}

export function trackTransactionHubOfferDeclined(context: HubAnalyticsContext): void {
  trackGaEvent("offer_declined", hubParams(context));
}

export function trackTransactionHubShareListing(context: HubAnalyticsContext): void {
  trackGaEvent("share_listing_hub", hubParams(context));
}

export function trackTransactionHubShippingLabel(context: HubAnalyticsContext, orderId: string): void {
  trackGaEvent("shipping_label", hubParams(context, { order_id: orderId }));
}

export function trackTransactionHubOrderDelivered(context: HubAnalyticsContext, orderId: string): void {
  trackGaEvent("order_delivered", hubParams(context, { order_id: orderId }));
}

export function trackTransactionHubWalletReleased(context: HubAnalyticsContext, orderId: string): void {
  trackGaEvent("wallet_released", hubParams(context, { order_id: orderId }));
}
