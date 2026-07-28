/**
 * ROVEXO Absolute Blood Law XLIV — client-safe contract constants.
 * No server imports. Shared by engine, E2E, and Blood Law SSOT.
 */

export const DEMO_SESSION_ENGINE_V1 = {
  version: "1.0",
  bloodLaw: "XLIV",
  name: "Full Demo Certification Environment",
  equation:
    "EXISTING_LISTINGS → DEMO_COPIES_ONLY → VIRTUAL_MONEY → TEARDOWN → PRODUCTION_UNCHANGED",
  host: "http://localhost:3000",
} as const;

export const XLIV_DEMO_WALLET_GBP = {
  buyer: 100_000,
  seller: 100_000,
  business: 100_000,
  admin: Number.POSITIVE_INFINITY,
} as const;

export const XLIV_VISUAL_STEPS = [
  "01_home",
  "02_listing",
  "03_messages",
  "04_offer",
  "05_counter_offer",
  "06_buyer_notification",
  "07_seller_notification",
  "08_checkout",
  "09_wallet",
  "10_payment",
  "11_order",
  "12_shipping_label",
  "13_tracking",
  "14_delivered",
  "15_review",
  "16_notifications",
  "17_orders",
  "18_wallet_history",
  "19_dashboard",
  "20_success",
] as const;

export type XlivVisualStepId = (typeof XLIV_VISUAL_STEPS)[number];

export type XlivModuleResult = "PASS" | "FAIL" | "WARNING";
