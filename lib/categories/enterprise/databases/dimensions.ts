/**
 * Canonical marketplace dimension presets — SSOT for furniture and home listings.
 */

export const FURNITURE_WIDTHS = [
  "Under 50cm",
  "50–80cm",
  "80–120cm",
  "120–160cm",
  "160–200cm",
  "200–240cm",
  "Over 240cm",
] as const;

export const FURNITURE_HEIGHTS = [
  "Under 40cm",
  "40–60cm",
  "60–80cm",
  "80–100cm",
  "100–140cm",
  "140–180cm",
  "Over 180cm",
] as const;

export const FURNITURE_DEPTHS = [
  "Under 40cm",
  "40–60cm",
  "60–80cm",
  "80–100cm",
  "100–120cm",
  "Over 120cm",
] as const;

export const PILLOW_SIZES = [
  "Standard",
  "Super Standard",
  "King",
  "Super King",
  "Square",
  "Body Pillow",
  "Travel",
  "Toddler",
  "Cot",
  "Euro",
  "V-Shaped",
  "Wedge",
] as const;

export const DUVET_SIZES = [
  "Single",
  "Double",
  "King",
  "Super King",
  "Emperor",
  "Toddler",
  "Cot",
] as const;

export const MARKETPLACE_DIMENSIONS_BY_SCOPE = {
  default: FURNITURE_WIDTHS,
  furniture: FURNITURE_WIDTHS,
  pillows: PILLOW_SIZES,
  bedding: DUVET_SIZES,
} as const;
