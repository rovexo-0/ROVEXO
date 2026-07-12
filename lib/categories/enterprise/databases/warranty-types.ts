/**
 * Canonical marketplace warranty type database — SSOT for listing attributes.
 */

export const MARKETPLACE_WARRANTY_TYPES = [
  "No Warranty",
  "Manufacturer Warranty",
  "Seller Warranty",
  "Extended Warranty",
  "Lifetime Warranty",
  "12 Month Warranty",
  "24 Month Warranty",
  "36 Month Warranty",
  "Expired",
  "Transferable Warranty",
  "International Warranty",
] as const;

export const ELECTRONICS_WARRANTY_TYPES = [
  "No Warranty",
  "Manufacturer Warranty",
  "AppleCare",
  "Samsung Care+",
  "Extended Warranty",
  "Seller Warranty",
  "Expired",
] as const;

export const HOME_WARRANTY_TYPES = [
  "No Warranty",
  "Manufacturer Warranty",
  "Seller Warranty",
  "10 Year Warranty",
  "15 Year Warranty",
  "Lifetime Warranty",
  "Expired",
] as const;

export const MARKETPLACE_WARRANTY_BY_VERTICAL = {
  default: MARKETPLACE_WARRANTY_TYPES,
  electronics: ELECTRONICS_WARRANTY_TYPES,
  home: HOME_WARRANTY_TYPES,
} as const;
