/**
 * Material qualifier prefixes for deterministic expansion.
 */

export const MATERIAL_QUALIFIERS: Record<string, readonly string[]> = {
  default: [
    "Organic", "Recycled", "Premium", "Heavy Duty", "Lightweight", "Industrial",
    "Commercial", "Domestic", "Professional", "Natural", "Synthetic", "Blend",
    "Woven", "Knitted", "Non-Woven", "Coated", "Laminated", "Reinforced",
    "Waterproof", "Breathable", "Anti-Bacterial", "Hypoallergenic", "Eco",
    "Sustainable", "Biodegradable", "Compostable", "Virgin", "Reclaimed",
  ],
  textiles: [
    "Organic", "Egyptian", "Pima", "Supima", "Mercerised", "Combed", "Ring-Spun",
    "Open-End", "Slub", "Heather", "Melange", "Brushed", "Peached", "Sanforised",
    "Anti-Pill", "Easy Care", "Wrinkle Resistant", "Stain Resistant", "UV Protective",
    "Moisture Wicking", "Quick Dry", "Thermal", "Insulated", "Quilted",
  ],
  bedding: [
    "Premium", "Luxury", "Hotel Quality", "Hypoallergenic", "Anti-Allergy",
    "Dust Mite Resistant", "Temperature Regulating", "Cooling", "Breathable",
    "Washable", "Removable Cover", "Organic", "Natural", "Eco",
  ],
  metals: [
    "Galvanised", "Stainless", "Brushed", "Polished", "Powder Coated", "Anodised",
    "Chrome", "Nickel", "Zinc Plated", "Hot-Dip", "Cold-Rolled", "Hot-Rolled",
    "Structural", "Mild", "Hardened", "Tempered", "Alloy",
  ],
  woods: [
    "Solid", "Engineered", "Reclaimed", "Sustainable", "FSC Certified", "Oiled",
    "Waxed", "Lacquered", "Stained", "Painted", "Whitewashed", "Distressed",
    "Hand-Scraped", "Wire-Brushed", "Smoked", "Carbonised",
  ],
  plastics: [
    "Food Grade", "Medical Grade", "UV Resistant", "Impact Resistant",
    "High-Density", "Low-Density", "Expanded", "Extruded", "Injection Moulded",
    "Blow Moulded", "Rotational Moulded", "Recycled",
  ],
  leather: [
    "Genuine", "Full Grain", "Top Grain", "Corrected Grain", "Aniline",
    "Semi-Aniline", "Pigmented", "Nubuck", "Distressed", "Vintage",
  ],
};
