/**
 * ROVEXO Catalog Master — Leaf Category Attribute Overrides (COD SÂNGE V3).
 * DATA ONLY — applicable Pattern / Style / Size / Features per leaf family.
 * Consumed by category-scoped taxonomy loader when a leaf match exists.
 */

export const LEAF_TRAVEL_PILLOW_PATTERNS = [
  "Solid",
  "Textured",
  "Mesh Panel",
  "Quilted",
  "Two-Tone",
] as const;

export const LEAF_TRAVEL_PILLOW_STYLES = [
  "U-Shape",
  "J-Shape",
  "Scarf Wrap",
  "Contoured",
  "Inflatable",
  "Compact Fold",
  "360° Support",
  "Chin Support",
] as const;

export const LEAF_TRAVEL_PILLOW_SIZES = [
  "One Size",
  "Travel",
  "Kids Travel",
  "Compact",
  "Standard Travel",
] as const;

export const LEAF_TRAVEL_PILLOW_FEATURES = [
  "Travel Compact",
  "Inflatable",
  "Foldable",
  "Washable Cover",
  "Removable Cover",
  "Breathable",
  "Cooling",
  "Hypoallergenic",
  "Machine Washable",
  "Carry Bag Included",
  "Seat Strap",
  "Adjustable",
  "Memory Foam",
  "Lightweight",
  "Packable",
] as const;

export const LEAF_MATERNITY_PILLOW_PATTERNS = [
  "Solid",
  "Textured",
  "Quilted",
  "Jersey Knit",
] as const;

export const LEAF_MATERNITY_PILLOW_STYLES = [
  "U-Shape",
  "C-Shape",
  "J-Shape",
  "G-Shape",
  "I-Shape / Bolster",
  "Wedge",
  "Full Body",
  "Nursing Convertible",
] as const;

export const LEAF_MATERNITY_PILLOW_SIZES = [
  "Standard Maternity",
  "Full Body",
  "Compact",
  "Wedge",
  "V-Shaped",
  "One Size",
] as const;

export const LEAF_MATERNITY_PILLOW_FEATURES = [
  "Adjustable",
  "Removable Cover",
  "Washable Cover",
  "Hypoallergenic",
  "Cooling Fabric",
  "Pregnancy Support",
  "Nursing Support",
  "Side Sleeper",
  "Back Support",
  "Belly Support",
  "Knee Support",
  "Breathable",
  "Machine Washable",
  "Organic",
] as const;

export const LEAF_STANDARD_PILLOW_PATTERNS = [
  "Solid",
  "Quilted",
  "Textured",
  "Piping Edge",
  "Hotel Stripe",
] as const;

export const LEAF_STANDARD_PILLOW_STYLES = [
  "Classic Bed Pillow",
  "Hotel Style",
  "Firm Support",
  "Medium Support",
  "Soft Plush",
  "Gusseted",
  "Down Alternative",
] as const;

export const LEAF_MEMORY_FOAM_PILLOW_STYLES = [
  "Contoured",
  "Classic Rectangle",
  "Shredded Adjustable",
  "Cervical",
  "Side Sleeper Cut-Out",
  "Dual Height",
] as const;

export const LEAF_DECORATIVE_CUSHION_PATTERNS = [
  "Solid",
  "Floral",
  "Geometric",
  "Striped",
  "Checked",
  "Embroidered",
  "Jacquard",
  "Damask",
  "Abstract",
  "Textured",
  "Velvet",
  "Bouclé",
] as const;

export const LEAF_DECORATIVE_CUSHION_STYLES = [
  "Scatter Cushion",
  "Throw Pillow",
  "Lumbar Accent",
  "Floor Cushion",
  "Bolster",
  "Modern",
  "Scandinavian",
  "Coastal",
  "Farmhouse",
  "Luxury",
] as const;

export const LEAF_DECORATIVE_CUSHION_SIZES = [
  "30×30cm",
  "40×40cm",
  "45×45cm",
  "50×50cm",
  "60×60cm",
  "30×50cm",
  "40×60cm",
  "Filled",
  "Cover Only",
] as const;

export type LeafAttributeBundle = {
  patterns?: readonly string[];
  styles?: readonly string[];
  sizes?: readonly string[];
  features?: readonly string[];
};

export const LEAF_CATEGORY_ATTRIBUTE_OVERRIDES: Readonly<Record<string, LeafAttributeBundle>> = {
  "travel-pillows": {
    patterns: LEAF_TRAVEL_PILLOW_PATTERNS,
    styles: LEAF_TRAVEL_PILLOW_STYLES,
    sizes: LEAF_TRAVEL_PILLOW_SIZES,
    features: LEAF_TRAVEL_PILLOW_FEATURES,
  },
  "neck-pillows": {
    patterns: LEAF_TRAVEL_PILLOW_PATTERNS,
    styles: LEAF_TRAVEL_PILLOW_STYLES,
    sizes: LEAF_TRAVEL_PILLOW_SIZES,
    features: LEAF_TRAVEL_PILLOW_FEATURES,
  },
  "maternity-pillows": {
    patterns: LEAF_MATERNITY_PILLOW_PATTERNS,
    styles: LEAF_MATERNITY_PILLOW_STYLES,
    sizes: LEAF_MATERNITY_PILLOW_SIZES,
    features: LEAF_MATERNITY_PILLOW_FEATURES,
  },
  "pregnancy-pillows": {
    patterns: LEAF_MATERNITY_PILLOW_PATTERNS,
    styles: LEAF_MATERNITY_PILLOW_STYLES,
    sizes: LEAF_MATERNITY_PILLOW_SIZES,
    features: LEAF_MATERNITY_PILLOW_FEATURES,
  },
  pillows: {
    patterns: LEAF_STANDARD_PILLOW_PATTERNS,
    styles: LEAF_STANDARD_PILLOW_STYLES,
    sizes: [
      "Standard",
      "Super Standard",
      "King",
      "Super King",
      "Square",
      "Euro",
    ],
    features: [
      "Hypoallergenic",
      "Washable Cover",
      "Removable Cover",
      "Breathable",
      "Hotel Quality",
      "Machine Washable",
      "Anti-Allergy",
      "Dust Mite Resistant",
    ],
  },
  "memory-foam-pillows": {
    patterns: LEAF_STANDARD_PILLOW_PATTERNS,
    styles: LEAF_MEMORY_FOAM_PILLOW_STYLES,
    sizes: ["Standard", "King", "Queen", "Super King", "Contoured"],
    features: [
      "Cooling",
      "Gel Infused",
      "Shredded Fill",
      "Adjustable",
      "Pressure Relief",
      "Cervical Support",
      "Side Sleeper",
      "Back Sleeper",
      "Removable Cover",
      "Hypoallergenic",
    ],
  },
  "orthopedic-pillows": {
    patterns: ["Solid", "Contoured", "Textured"],
    styles: ["Cervical", "Contoured", "Wedge", "Firm Support"],
    sizes: ["Standard", "Contoured", "Wedge", "Travel Ortho"],
    features: [
      "Orthopaedic",
      "Cervical Support",
      "Pressure Relief",
      "Firm Support",
      "Contoured",
      "Hypoallergenic",
      "Removable Cover",
    ],
  },
  "decorative-cushions": {
    patterns: LEAF_DECORATIVE_CUSHION_PATTERNS,
    styles: LEAF_DECORATIVE_CUSHION_STYLES,
    sizes: LEAF_DECORATIVE_CUSHION_SIZES,
    features: ["Removable Cover", "Washable Cover", "Filled", "Cover Only", "Piping", "Zippered"],
  },
  cushions: {
    patterns: LEAF_DECORATIVE_CUSHION_PATTERNS,
    styles: LEAF_DECORATIVE_CUSHION_STYLES,
    sizes: LEAF_DECORATIVE_CUSHION_SIZES,
    features: ["Removable Cover", "Washable Cover", "Filled", "Cover Only"],
  },
  "cooling-pillows": {
    patterns: ["Solid", "Mesh Panel", "Textured"],
    styles: LEAF_MEMORY_FOAM_PILLOW_STYLES,
    sizes: ["Standard", "King", "Queen"],
    features: [
      "Cooling",
      "Gel Infused",
      "Temperature Regulating",
      "Breathable",
      "Phase Change",
      "Removable Cover",
    ],
  },
  "feather-pillows": {
    patterns: LEAF_STANDARD_PILLOW_PATTERNS,
    styles: ["Classic Bed Pillow", "Hotel Style", "Firm Support", "Soft Plush"],
    sizes: ["Standard", "Super Standard", "King", "Super King"],
    features: ["Hotel Quality", "Breathable", "Washable Cover", "Hypoallergenic"],
  },
  "down-pillows": {
    patterns: LEAF_STANDARD_PILLOW_PATTERNS,
    styles: ["Classic Bed Pillow", "Hotel Style", "Luxury", "Soft Plush"],
    sizes: ["Standard", "King", "Super King", "Euro"],
    features: ["Hotel Quality", "Luxury", "Breathable", "Hypoallergenic"],
  },
  "body-pillows": {
    patterns: ["Solid", "Textured", "Quilted"],
    styles: ["Full Body", "Long Bolster", "U-Shape", "I-Shape / Bolster"],
    sizes: ["Body Pillow", "Full Body", "Long"],
    features: ["Side Sleeper", "Pressure Relief", "Removable Cover", "Washable Cover"],
  },
  "children-s-pillows": {
    patterns: ["Solid", "Printed", "Character"],
    styles: ["Toddler", "Kids", "Cot"],
    sizes: ["Toddler", "Cot", "Junior", "Standard"],
    features: ["Hypoallergenic", "Anti-Allergy", "Washable Cover", "Soft"],
  },
  "seat-cushions": {
    patterns: ["Solid", "Textured", "Quilted"],
    styles: ["Seat Pad", "Lumbar", "Floor"],
    sizes: ["Standard Seat", "Large", "One Size"],
    features: ["Memory Foam", "Non-Slip", "Removable Cover", "Washable Cover"],
  },
  "lumbar-cushions": {
    patterns: ["Solid", "Textured"],
    styles: ["Lumbar", "Contoured", "Roll"],
    sizes: ["Standard", "One Size"],
    features: ["Lumbar Support", "Memory Foam", "Removable Cover", "Portable"],
  },
  "floor-cushions": {
    patterns: LEAF_DECORATIVE_CUSHION_PATTERNS,
    styles: ["Floor Cushion", "Pouffe Style", "Large Square"],
    sizes: ["50×50cm", "60×60cm", "Large", "Extra Large"],
    features: ["Filled", "Removable Cover", "Washable Cover"],
  },
  "outdoor-cushions": {
    patterns: ["Solid", "Striped", "Geometric"],
    styles: ["Outdoor Seat", "Lounger", "Bench"],
    sizes: ["Standard Seat", "Lounger", "Bench Pad"],
    features: ["Water-Resistant", "UV-Resistant", "Quick-Dry", "Removable Cover"],
  },
  pillowcases: {
    patterns: [
      "Solid",
      "Striped",
      "Floral",
      "Geometric",
      "Embroidered",
      "Hotel Stripe",
    ],
    styles: ["Oxford", "Housewife", "Envelope", "Zippered"],
    sizes: ["Standard", "King", "Super King", "Square", "Euro"],
    features: ["Easy Care", "Wrinkle Resistant", "Fade Resistant", "Machine Washable"],
  },
};

export function resolveLeafAttributeOverride(
  productTypeSlug: string,
): LeafAttributeBundle | null {
  return LEAF_CATEGORY_ATTRIBUTE_OVERRIDES[productTypeSlug] ?? null;
}
