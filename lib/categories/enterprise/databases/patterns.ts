/**
 * Canonical marketplace pattern database — SSOT for listing attributes and filters.
 */

export const MARKETPLACE_PATTERNS = [
  "Solid",
  "Striped",
  "Checked",
  "Gingham",
  "Floral",
  "Polka Dot",
  "Graphic",
  "Camouflage",
  "Animal Print",
  "Plaid",
  "Geometric",
  "Tie-Dye",
  "Paisley",
  "Herringbone",
  "Chevron",
  "Damask",
  "Jacquard",
  "Embroidered",
  "Quilted",
  "Textured",
  "Abstract",
  "Ombre",
  "Marble",
  "Houndstooth",
  "Toile",
] as const;

export const FASHION_PATTERNS = [
  "Solid",
  "Striped",
  "Checked",
  "Floral",
  "Polka Dot",
  "Graphic",
  "Animal Print",
  "Plaid",
  "Geometric",
  "Tie-Dye",
  "Camouflage",
] as const;

export const HOME_PATTERNS = [
  "Solid",
  "Striped",
  "Checked",
  "Floral",
  "Geometric",
  "Quilted",
  "Embroidered",
  "Jacquard",
  "Damask",
  "Textured",
  "Abstract",
] as const;

export const MARKETPLACE_PATTERNS_BY_VERTICAL = {
  default: MARKETPLACE_PATTERNS,
  fashion: FASHION_PATTERNS,
  home: HOME_PATTERNS,
} as const;
