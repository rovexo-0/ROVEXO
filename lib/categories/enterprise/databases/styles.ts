/**
 * Canonical marketplace style database — SSOT for listing attributes and filters.
 */

export const MARKETPLACE_STYLES = [
  "Casual",
  "Formal",
  "Business",
  "Sporty",
  "Streetwear",
  "Vintage",
  "Bohemian",
  "Minimalist",
  "Modern",
  "Contemporary",
  "Traditional",
  "Rustic",
  "Industrial",
  "Scandinavian",
  "Mid-Century",
  "Art Deco",
  "Coastal",
  "Farmhouse",
  "Luxury",
  "Classic",
  "Party",
  "Elegant",
  "Preppy",
  "Gothic",
  "Retro",
] as const;

export const FASHION_STYLES = [
  "Casual",
  "Formal",
  "Business",
  "Sporty",
  "Streetwear",
  "Vintage",
  "Bohemian",
  "Minimalist",
  "Party",
  "Elegant",
  "Preppy",
  "Gothic",
  "Retro",
] as const;

export const HOME_STYLES = [
  "Modern",
  "Contemporary",
  "Traditional",
  "Rustic",
  "Industrial",
  "Scandinavian",
  "Mid-Century",
  "Art Deco",
  "Coastal",
  "Farmhouse",
  "Minimalist",
  "Luxury",
  "Classic",
] as const;

export const MARKETPLACE_STYLES_BY_VERTICAL = {
  default: MARKETPLACE_STYLES,
  fashion: FASHION_STYLES,
  home: HOME_STYLES,
} as const;
