/** LAUNCH_CERTIFICATION_MASTER_SPEC v1.1 — Document 2 SSOT */

export const CERTIFICATION_MODE_VERSION = "v1.1" as const;

export const CERTIFICATION_MODE_COPY = {
  mandatory:
    "Certification Mode is mandatory. Official Launch is impossible until Certification reaches 100%.",
  noRealCustomers: "No real customer should use the marketplace during Certification Mode.",
  noRealMoney: "No real money must be required.",
} as const;

/** Certification dashboard modules — Document 2 § CERTIFICATION DASHBOARD. */
export const CERTIFICATION_DASHBOARD_MODULES = [
  { id: "authentication", label: "Authentication" },
  { id: "sell", label: "Sell" },
  { id: "homepage", label: "Homepage" },
  { id: "search", label: "Search" },
  { id: "product", label: "Product" },
  { id: "messages", label: "Messages" },
  { id: "transaction_hub", label: "Transaction Hub" },
  { id: "checkout", label: "Checkout" },
  { id: "wallet", label: "Wallet" },
  { id: "shipping", label: "Shipping" },
  { id: "notifications", label: "Notifications" },
  { id: "admin", label: "Admin" },
  { id: "super_admin", label: "Super Admin" },
  { id: "performance", label: "Performance" },
  { id: "security", label: "Security" },
  { id: "accessibility", label: "Accessibility" },
  { id: "seo", label: "SEO" },
] as const;

export type CertificationDashboardModuleId =
  (typeof CERTIFICATION_DASHBOARD_MODULES)[number]["id"];
export const DEMO_PAYMENT_STATUSES = [
  "success",
  "failed",
  "pending",
  "refunded",
  "cancelled",
] as const;

export type DemoPaymentStatus = (typeof DEMO_PAYMENT_STATUSES)[number];

/** Virtual wallet states — Document 2 § DEMO WALLET. */
export const DEMO_WALLET_TYPES = ["buyer", "seller", "company"] as const;

export const DEMO_WALLET_STATES = [
  "pending",
  "available",
  "withdraw_requested",
  "approved",
  "completed",
  "rejected",
] as const;

/** Order flow — Document 2 § ORDER FLOW. */
export const CERTIFICATION_ORDER_FLOW_STEPS = [
  "publish_listing",
  "search",
  "open_product",
  "make_offer",
  "counter_offer",
  "accept_offer",
  "checkout",
  "virtual_payment",
  "order",
  "shipping_label",
  "dispatch",
  "tracking",
  "delivered",
  "everything_ok",
  "seller_wallet",
  "withdraw",
  "completed",
] as const;

/** Returns flow — Document 2 § RETURNS. */
export const CERTIFICATION_RETURN_FLOW_STEPS = [
  "buyer_request_return",
  "seller_review",
  "approve",
  "return_label",
  "parcel_returned",
  "refund",
] as const;

/** Email templates to verify — Document 2 § EMAILS. */
export const CERTIFICATION_EMAIL_TEMPLATES = [
  "welcome",
  "verify_email",
  "offer",
  "counter_offer",
  "order",
  "payment",
  "dispatch",
  "delivered",
  "refund",
  "withdraw",
  "return",
] as const;

/** Performance targets (ms) — Document 2 § PERFORMANCE. */
export const CERTIFICATION_PERFORMANCE_TARGETS_MS = {
  homepage: 2000,
  search: 500,
  checkout: 2000,
  listingPublish: 2000,
  wallet: 500,
} as const;

/** Launch conditions — Document 2 § LAUNCH CONDITIONS. */
export const CERTIFICATION_LAUNCH_CONDITIONS = [
  "certification_100_percent_passed",
  "zero_critical_bugs",
  "zero_payment_bugs",
  "zero_security_issues",
  "zero_data_loss",
  "zero_broken_flows",
] as const;

/** Official launch settings — Document 2 § OFFICIAL LAUNCH. */
export const OFFICIAL_LAUNCH_SETTINGS = {
  privateModeEnv: "ROVEXO_LAUNCH_PRIVATE_MODE=0",
  googleIndexing: true,
  publicRegistration: true,
  marketplaceStatus: "live",
} as const;
