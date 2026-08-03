/**
 * Bundle Notification Matrix v1.0 — Owner labels SSOT (client-safe).
 */

export const BUNDLE_NOTIFICATION_MATRIX_V1 = {
  buyer: [
    "Added to Bundle",
    "Bundle Updated",
    "Bundle Ready",
    "Offer Sent",
    "Counter Received",
    "Offer Accepted",
    "Offer Declined",
    "Checkout Started",
    "Payment Successful",
    "Order Created",
    "Dispatched",
    "Delivered",
    "Funds Released",
    "Issue Updated",
    "Refund Completed",
  ] as const,
  seller: [
    "Bundle Created",
    "Bundle Updated",
    "Offer Received",
    "Counter Sent",
    "Bundle Purchased",
    "Prepare Order",
    "Print Label",
    "Issue Opened",
    "Return Requested",
    "Funds Released",
  ] as const,
} as const;
