import type { TransactionMode } from "@/lib/transaction-mode/types";

export type TransactionCapabilities = {
  mode: TransactionMode;
  buyNow: boolean;
  addToCart: boolean;
  checkout: boolean;
  payment: boolean;
  wallet: boolean;
  buyerProtection: boolean;
  shipping: boolean;
  shippingQuotes: boolean;
  shippingLabel: boolean;
  tracking: boolean;
  returns: boolean;
  orderStatus: boolean;
  orderHistory: boolean;
  contactSeller: boolean;
  messaging: boolean;
};

const MARKETPLACE_CAPABILITIES: TransactionCapabilities = {
  mode: "MARKETPLACE",
  buyNow: true,
  addToCart: true,
  checkout: true,
  payment: true,
  wallet: true,
  buyerProtection: true,
  shipping: true,
  shippingQuotes: true,
  shippingLabel: true,
  tracking: true,
  returns: true,
  orderStatus: true,
  orderHistory: true,
  contactSeller: true,
  messaging: true,
};

const DIRECT_CONTACT_CAPABILITIES: TransactionCapabilities = {
  mode: "DIRECT_CONTACT",
  buyNow: false,
  addToCart: false,
  checkout: false,
  payment: false,
  wallet: false,
  buyerProtection: false,
  shipping: false,
  shippingQuotes: false,
  shippingLabel: false,
  tracking: false,
  returns: false,
  orderStatus: false,
  orderHistory: false,
  contactSeller: true,
  messaging: true,
};

export function getTransactionCapabilities(mode: TransactionMode): TransactionCapabilities {
  return mode === "DIRECT_CONTACT" ? DIRECT_CONTACT_CAPABILITIES : MARKETPLACE_CAPABILITIES;
}

export function isMarketplaceMode(mode: TransactionMode): boolean {
  return mode === "MARKETPLACE";
}

export function isDirectContactMode(mode: TransactionMode): boolean {
  return mode === "DIRECT_CONTACT";
}
