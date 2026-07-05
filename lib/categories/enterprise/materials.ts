/**
 * Enterprise marketplace materials database — SSOT for Sell attributes and filters.
 */

export const MARKETPLACE_MATERIALS = [
  "Acrylic", "Aluminium", "Bamboo", "Brass", "Bronze", "Canvas", "Carbon Fiber", "Cashmere",
  "Ceramic", "Chrome", "Copper", "Corduroy", "Cotton", "Denim", "Down", "Elastane", "Faux Fur",
  "Faux Leather", "Faux Suede", "Felt", "Fibreglass", "Glass", "Gold", "Hemp", "Jersey", "Jute",
  "Latex", "Leather", "Linen", "Lycra", "Merino Wool", "Mesh", "Metal", "Microfibre", "Nylon",
  "Organic Cotton", "Paper", "Plastic", "Platinum", "Polyester", "Polypropylene", "Porcelain",
  "PVC", "Rayon", "Recycled Polyester", "Rubber", "Satin", "Silicone", "Silk", "Silver",
  "Stainless Steel", "Steel", "Stone", "Suede", "Synthetic", "Tencel", "Titanium", "Tweed",
  "Velvet", "Vinyl", "Viscose", "Wood", "Wool", "Zinc", "Other",
] as const;

export const FASHION_MATERIALS = [
  "Cotton", "Polyester", "Wool", "Silk", "Linen", "Denim", "Leather", "Suede", "Cashmere",
  "Merino Wool", "Velvet", "Satin", "Jersey", "Fleece", "Nylon", "Elastane", "Viscose",
] as const;

export const HOME_MATERIALS = [
  "Wood", "Metal", "Glass", "Ceramic", "Stone", "Marble", "Granite", "Plastic", "Rattan",
  "Wicker", "Fabric", "Leather", "Velvet", "Cotton", "Linen", "Wool", "Bamboo",
] as const;

export const MARKETPLACE_MATERIALS_BY_VERTICAL = {
  default: MARKETPLACE_MATERIALS,
  fashion: FASHION_MATERIALS,
  home: HOME_MATERIALS,
} as const;
