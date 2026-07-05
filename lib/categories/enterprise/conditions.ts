/**
 * Enterprise marketplace condition values — SSOT for listing attributes and filters.
 */

export const MARKETPLACE_CONDITIONS = [
  "New",
  "New with tags",
  "New without tags",
  "Like New",
  "Excellent",
  "Very Good",
  "Good",
  "Fair",
  "Well Used",
  "For Parts",
  "Not Working",
  "Refurbished",
  "Vintage",
  "Antique",
] as const;

export const VEHICLE_CONDITIONS = [
  "New",
  "Nearly New",
  "Used",
  "Pre-Owned",
  "Cat N",
  "Cat S",
  "For Spares",
] as const;

export const ELECTRONICS_CONDITIONS = [
  "New",
  "Open Box",
  "Refurbished",
  "Like New",
  "Good",
  "Fair",
  "For Parts",
] as const;

export const MARKETPLACE_CONDITIONS_BY_VERTICAL = {
  default: MARKETPLACE_CONDITIONS,
  vehicles: VEHICLE_CONDITIONS,
  electronics: ELECTRONICS_CONDITIONS,
} as const;
