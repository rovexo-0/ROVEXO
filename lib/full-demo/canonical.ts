/**
 * ROVEXO v1.0 — Full Demo Certification Mode (SSOT)
 *
 * Two permanent Full Demo Accounts for end-to-end marketplace certification.
 * Virtual money only — never real Stripe, Sendcloud, or production payments.
 */

import { DEMO_USERS, type DemoUserDefinition } from "@/lib/demo-environment/config";

export const FULL_DEMO_VERSION = "v1.0" as const;

export const FULL_DEMO_VIRTUAL_FUNDS_GBP = 50_000;

/** Permanent Full Demo Account keys — never remove. */
export const FULL_DEMO_ACCOUNT_KEYS = ["live-buyer", "live-seller"] as const;
export type FullDemoAccountKey = (typeof FULL_DEMO_ACCOUNT_KEYS)[number];

export type FullDemoPermission =
  | "buy_now"
  | "make_offer"
  | "cart"
  | "checkout"
  | "wallet"
  | "escrow"
  | "reviews"
  | "refunds"
  | "disputes"
  | "tracking"
  | "notifications"
  | "messages"
  | "saved_items"
  | "search"
  | "categories"
  | "trust_centre"
  | "platform_fee"
  | "buyer_dashboard"
  | "sell"
  | "listings"
  | "orders"
  | "counter_offer"
  | "shipping_labels"
  | "sendcloud_demo"
  | "seller_dashboard"
  | "business_dashboard"
  | "promotions"
  | "analytics"
  | "cancel_orders"
  | "accept_offers"
  | "reject_offers"
  | "complete_deliveries"
  | "receive_payouts"
  | "manage_disputes"
  | "manage_listings";

export type FullDemoAccountDefinition = DemoUserDefinition & {
  key: FullDemoAccountKey;
  label: string;
  certificationRole: "buyer" | "seller";
  virtualFundsGbp: number;
  permissions: readonly FullDemoPermission[];
  verified: {
    user: true;
    email: true;
    phone: true;
    address: true;
    business?: true;
    trust?: true;
  };
};

const BUYER_PERMISSIONS: readonly FullDemoPermission[] = [
  "buy_now",
  "make_offer",
  "cart",
  "checkout",
  "wallet",
  "escrow",
  "reviews",
  "refunds",
  "disputes",
  "tracking",
  "notifications",
  "messages",
  "saved_items",
  "search",
  "categories",
  "trust_centre",
  "platform_fee",
  "buyer_dashboard",
  "cancel_orders",
] as const;

const SELLER_PERMISSIONS: readonly FullDemoPermission[] = [
  "sell",
  "listings",
  "orders",
  "wallet",
  "escrow",
  "make_offer",
  "counter_offer",
  "tracking",
  "shipping_labels",
  "sendcloud_demo",
  "messages",
  "reviews",
  "refunds",
  "disputes",
  "seller_dashboard",
  "business_dashboard",
  "promotions",
  "analytics",
  "accept_offers",
  "reject_offers",
  "complete_deliveries",
  "receive_payouts",
  "manage_disputes",
  "manage_listings",
] as const;

/** Permanent Full Demo Accounts — required before every production release. */
export const FULL_DEMO_ACCOUNTS: readonly FullDemoAccountDefinition[] = [
  {
    key: "live-buyer",
    email: "demo.buyer@rovexo.co.uk",
    username: "rovexo_live_buyer",
    fullName: "ROVEXO LIVE BUYER",
    role: "buyer",
    phone: "+447700900001",
    avatarSeed: "live-buyer",
    password: "RovexoBuyer@2026",
    label: "ROVEXO LIVE BUYER",
    certificationRole: "buyer",
    virtualFundsGbp: FULL_DEMO_VIRTUAL_FUNDS_GBP,
    permissions: BUYER_PERMISSIONS,
    verified: {
      user: true,
      email: true,
      phone: true,
      address: true,
    },
  },
  {
    key: "live-seller",
    email: "demo.seller@rovexo.co.uk",
    username: "rovexo_live_seller",
    fullName: "ROVEXO LIVE SELLER",
    role: "business",
    businessName: "ROVEXO LIVE SELLER Ltd",
    phone: "+447700900002",
    avatarSeed: "live-seller",
    password: "RovexoSeller@2026",
    label: "ROVEXO LIVE SELLER",
    certificationRole: "seller",
    virtualFundsGbp: FULL_DEMO_VIRTUAL_FUNDS_GBP,
    permissions: SELLER_PERMISSIONS,
    verified: {
      user: true,
      email: true,
      phone: true,
      address: true,
      business: true,
      trust: true,
    },
  },
] as const;

/** Certification-facing order states (map onto DB order_status + shipping/protection). */
export const FULL_DEMO_ORDER_STATES = [
  "Pending",
  "Paid",
  "Accepted",
  "Rejected",
  "Packed",
  "Label Created",
  "Shipped",
  "In Transit",
  "Delivered",
  "Completed",
  "Refunded",
  "Cancelled",
  "Disputed",
  "Resolved",
] as const;

export type FullDemoOrderState = (typeof FULL_DEMO_ORDER_STATES)[number];

/** Parcel labels for demo shipping certification. */
export const FULL_DEMO_PARCEL_SPECS = [
  { parcelNumber: 1, totalParcels: 1, label: "Parcel 1 of 1" },
  { parcelNumber: 1, totalParcels: 2, label: "Parcel 1 of 2" },
  { parcelNumber: 2, totalParcels: 2, label: "Parcel 2 of 2" },
  { parcelNumber: 1, totalParcels: 3, label: "Parcel 1 of 3" },
  { parcelNumber: 2, totalParcels: 3, label: "Parcel 2 of 3" },
  { parcelNumber: 3, totalParcels: 3, label: "Parcel 3 of 3" },
] as const;

/** Minimum published products for Full Demo Certification. */
export const FULL_DEMO_PRODUCT_TARGET = 100;

/**
 * Permanent inventory quotas — Full Demo Certification contract.
 * DO NOT reduce. DO NOT delete. Seed restores to these floors.
 */
export const FULL_DEMO_BUYER_QUOTAS = {
  virtualBalanceGbp: FULL_DEMO_VIRTUAL_FUNDS_GBP,
  completedOrders: 100,
  cancelledOrders: 50,
  refundedOrders: 50,
  deliveredOrders: 50,
  disputes: 50,
  notifications: 20,
  reviews: 100,
  messages: 40,
  trackingHistoryOrders: 100,
} as const;

export const FULL_DEMO_SELLER_QUOTAS = {
  virtualBalanceGbp: FULL_DEMO_VIRTUAL_FUNDS_GBP,
  products: FULL_DEMO_PRODUCT_TARGET,
  completedSales: 100,
  cancelledSales: 50,
  refundedSales: 50,
  offers: 40,
  counterOffers: 20,
  disputes: 50,
  notifications: 20,
  messages: 40,
  promotions: 10,
  analyticsEvents: 50,
} as const;

/** Buyer E2E certification flow — required before every live deployment. */
export const FULL_DEMO_BUYER_CERT_FLOW = [
  "login",
  "buy",
  "checkout",
  "wallet",
  "tracking",
  "delivered",
  "review",
  "completed",
] as const;

/** Seller E2E certification flow — required before every live deployment. */
export const FULL_DEMO_SELLER_CERT_FLOW = [
  "login",
  "receive_offer",
  "accept_offer",
  "generate_label",
  "tracking",
  "delivered",
  "wallet_payout",
  "completed",
] as const;

/** Release gates that must all pass — no production without these. */
export const FULL_DEMO_RELEASE_REQUIREMENTS = [
  "demo_certification_passed",
  "authentication_passed",
  "orders_passed",
  "wallet_passed",
  "tracking_passed",
  "checkout_passed",
  "responsive_passed",
  "performance_passed",
] as const;

/** Complete executable pre-deployment gate matrix. */
export const FULL_DEMO_PREDEPLOY_GATES = [
  "typescript",
  "eslint",
  "production_build",
  "playwright",
  "responsive",
  "universal_ui",
  "performance",
  "authentication",
  "orders",
  "wallet",
  "tracking",
  "checkout",
  "inbox_hub",
  "refund",
  "cancel",
  "notifications",
  "messages",
  "full_demo",
  "homepage",
  "protected_contracts",
] as const;

export const FULL_DEMO_PERMANENCE_CONTRACT = {
  neverExpire: true,
  neverDelete: true,
  neverDisable: true,
  neverSuspend: true,
  neverReset: true,
  neverLock: true,
  noEmailVerificationRequired: true,
  noPhoneVerificationRequired: true,
  noStripeVerificationRequired: true,
  noSendcloudVerificationRequired: true,
  noRealMoneyRequired: true,
  alwaysAvailable: true,
  unlimitedVirtualTransactions: true,
  unlimitedTestingMode: true,
  virtualStripeMode: true,
  virtualSendcloudMode: true,
  privateLaunchMode: true,
  fullCertificationMode: true,
  neverRemoveProducts: true,
  neverRemoveBalances: true,
  neverRemovePermissions: true,
  officialCertificationAccounts: true,
} as const;

/** Mandatory runtime E2E sequence. Every step must pass before deployment. */
export const FULL_DEMO_MANDATORY_E2E_STEPS = [
  "buyer_login",
  "seller_login",
  "create_product",
  "product_appears_on_homepage",
  "buyer_searches_product",
  "buy_now",
  "checkout",
  "virtual_payment_success",
  "order_created",
  "seller_receives_order",
  "accept_order",
  "generate_virtual_label",
  "tracking_generated",
  "parcel_created",
  "shipped",
  "delivered",
  "review_created",
  "completed",
  "wallet_updated",
  "notifications_verified",
  "messages_verified",
  "refund_verified",
  "cancel_verified",
  "logout_verified",
  "login_again_verified",
] as const;

/** Surfaces that must pass 100% under Full Demo Certification. */
export const FULL_DEMO_CERTIFICATION_SURFACES = [
  "Homepage",
  "Search",
  "Categories",
  "Product page",
  "Buy now",
  "Cart",
  "Checkout",
  "Wallet",
  "Orders",
  "Inbox Hub",
  "Tracking",
  "Notifications",
  "Reviews",
  "Refunds",
  "Business Dashboard",
  "Seller Dashboard",
  "Settings",
  "Trust Centre",
  "Business Verification",
  "Promotions",
  "Analytics",
] as const;

export function isFullDemoAccountKey(key: string): key is FullDemoAccountKey {
  return (FULL_DEMO_ACCOUNT_KEYS as readonly string[]).includes(key);
}

export function isFullDemoEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return FULL_DEMO_ACCOUNTS.some((account) => account.email === normalized);
}

export function resolveFullDemoAccount(key: FullDemoAccountKey): FullDemoAccountDefinition {
  const account = FULL_DEMO_ACCOUNTS.find((entry) => entry.key === key);
  if (!account) {
    throw new Error(`Full Demo Account not configured: ${key}`);
  }
  return account;
}

export function listFullDemoAccounts(): readonly FullDemoAccountDefinition[] {
  return FULL_DEMO_ACCOUNTS;
}

/** Demo user definitions including legacy QA accounts + permanent Full Demo Accounts. */
export function resolveAllDemoUserDefinitions(): DemoUserDefinition[] {
  const fullDemoAsUsers: DemoUserDefinition[] = FULL_DEMO_ACCOUNTS.map((account) => ({
    key: account.key,
    email: account.email,
    username: account.username,
    fullName: account.fullName,
    role: account.role,
    businessName: account.businessName,
    phone: account.phone,
    avatarSeed: account.avatarSeed,
  }));

  const existingKeys = new Set(DEMO_USERS.map((user) => user.key));
  const merged = [...DEMO_USERS];
  for (const account of fullDemoAsUsers) {
    if (!existingKeys.has(account.key)) {
      merged.push(account);
    }
  }
  return merged;
}

export function generateDemoTrackingNumber(seed: string): string {
  const clean = seed.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 12);
  return `RVXDEMO${clean.padEnd(12, "0")}`;
}

export function generateDemoDeliveryDate(daysFromNow: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromNow);
  date.setUTCHours(17, 0, 0, 0);
  return date.toISOString();
}
