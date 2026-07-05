/**
 * Enterprise marketplace size systems — SSOT for fashion, shoes, furniture, screens, tyres.
 */

export const FASHION_SIZES_UK = ["UK 4", "UK 6", "UK 8", "UK 10", "UK 12", "UK 14", "UK 16", "UK 18", "UK 20"] as const;
export const FASHION_SIZES_EU = ["EU 32", "EU 34", "EU 36", "EU 38", "EU 40", "EU 42", "EU 44", "EU 46", "EU 48"] as const;
export const FASHION_SIZES_US = ["US 0", "US 2", "US 4", "US 6", "US 8", "US 10", "US 12", "US 14"] as const;
export const FASHION_SIZES_ALPHA = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "One Size"] as const;

export const SHOE_SIZES_UK = [
  "UK 1", "UK 2", "UK 3", "UK 4", "UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12", "UK 13",
] as const;
export const SHOE_SIZES_EU = [
  "EU 35", "EU 36", "EU 37", "EU 38", "EU 39", "EU 40", "EU 41", "EU 42", "EU 43", "EU 44", "EU 45", "EU 46",
] as const;

export const CHILDREN_SIZES = [
  "0-3M", "3-6M", "6-9M", "9-12M", "12-18M", "18-24M", "2-3Y", "3-4Y", "4-5Y", "5-6Y", "7-8Y", "9-10Y", "11-12Y", "13-14Y",
] as const;

export const FURNITURE_SIZES = [
  "Small", "Medium", "Large", "Extra Large", "Single", "Double", "King", "Super King",
] as const;

export const SCREEN_SIZES = [
  '24"', '27"', '32"', '40"', '43"', '50"', '55"', '65"', '75"', '85"',
] as const;

export const TYRE_SIZES = [
  "175/65 R14", "185/65 R15", "195/55 R16", "205/55 R16", "215/55 R17", "225/45 R17", "235/45 R18", "255/40 R19",
] as const;

export const PROPERTY_UNITS = ["Sq Ft", "Sq M", "Acres", "Hectares"] as const;

export const ENGINE_SIZES = [
  "1.0L", "1.2L", "1.4L", "1.6L", "1.8L", "2.0L", "2.5L", "3.0L", "3.5L", "4.0L", "5.0L", "Electric",
] as const;

export const MARKETPLACE_SIZE_SYSTEMS = {
  fashionAlpha: FASHION_SIZES_ALPHA,
  fashionUk: FASHION_SIZES_UK,
  fashionEu: FASHION_SIZES_EU,
  fashionUs: FASHION_SIZES_US,
  shoesUk: SHOE_SIZES_UK,
  shoesEu: SHOE_SIZES_EU,
  children: CHILDREN_SIZES,
  furniture: FURNITURE_SIZES,
  screens: SCREEN_SIZES,
  tyres: TYRE_SIZES,
  property: PROPERTY_UNITS,
  engines: ENGINE_SIZES,
} as const;

/** Default picker sizes (fashion alpha + one size). */
export const MARKETPLACE_DEFAULT_SIZES = [...FASHION_SIZES_ALPHA];
