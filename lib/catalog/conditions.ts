/**
 * ROVEXO Catalog Master — Conditions (UK marketplace, courier goods only).
 */

export const CATALOG_CONDITIONS = [
  "New",
  "New with tags",
  "New without tags",
  "Like new",
  "Excellent",
  "Good",
  "Fair",
  "Refurbished",
] as const;

/** Electronics / tech vertical (open box + refurbished emphasis). */
export const CATALOG_CONDITIONS_ELECTRONICS = [
  "New",
  "Open box",
  "Refurbished",
  "Like new",
  "Good",
  "Fair",
] as const;

/** Parts / components (includes for spares). */
export const CATALOG_CONDITIONS_PARTS = [
  "New",
  "Like new",
  "Good",
  "Fair",
  "For spares",
] as const;

export const CATALOG_CONDITIONS_BY_VERTICAL = {
  default: CATALOG_CONDITIONS,
  electronics: CATALOG_CONDITIONS_ELECTRONICS,
  parts: CATALOG_CONDITIONS_PARTS,
} as const;

export type CatalogCondition = (typeof CATALOG_CONDITIONS)[number];
