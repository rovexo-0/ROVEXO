/**
 * ROVEXO Catalog Master — Leaf Category Material Overrides (COD SÂNGE Normalization).
 * Every FINAL selectable product-type owns an independently curated Material universe.
 * Builder path-normalizes so sibling leaves do not clone identical lists.
 */

/** Travel / neck support pillows. */
export const LEAF_TRAVEL_PILLOW_MATERIALS = [
  "Memory Foam",
  "Foam",
  "Gel Foam",
  "Polyester",
  "Cotton",
  "Microfibre",
  "Velour",
  "Bamboo",
  "Latex",
  "Velvet",
  "Jersey",
  "Mesh",
  "Beans / Microbeads",
  "Inflatable",
  "Cooling Gel",
  "Air Chamber",
  "Soft Fleece",
] as const;

/** Maternity / pregnancy pillows. */
export const LEAF_MATERNITY_PILLOW_MATERIALS = [
  "Polyester Fibre",
  "Microfibre",
  "EPS Microbeads",
  "Cotton",
  "Organic Cotton",
  "Memory Foam",
  "Foam",
  "Bamboo",
  "Velvet",
  "Jersey",
  "Cooling Fabric",
  "Hypoallergenic Fill",
  "Down Alternative",
  "Shredded Foam",
] as const;

/** Memory foam sleep pillows. */
export const LEAF_MEMORY_FOAM_PILLOW_MATERIALS = [
  "Memory Foam",
  "Gel Memory Foam",
  "Shredded Memory Foam",
  "Foam",
  "Latex",
  "Bamboo Cover",
  "Cotton Cover",
  "Cooling Gel",
  "Polyester",
  "Ventilated Foam",
] as const;

/** Orthopedic pillows. */
export const LEAF_ORTHOPEDIC_PILLOW_MATERIALS = [
  "Memory Foam",
  "Firm Foam",
  "Latex",
  "Cervical Contour Foam",
  "Water Base",
  "Polyester",
  "Cotton",
  "Bamboo",
  "Cooling Gel",
  "Hypoallergenic Fill",
] as const;

/** Cooling pillows. */
export const LEAF_COOLING_PILLOW_MATERIALS = [
  "Gel Memory Foam",
  "Cooling Gel",
  "Phase Change Fabric",
  "Bamboo",
  "Memory Foam",
  "Foam",
  "Polyester",
  "Mesh",
  "Outlast",
  "Ventilated Foam",
] as const;

/** Feather pillows. */
export const LEAF_FEATHER_PILLOW_MATERIALS = [
  "Feather",
  "Duck Feather",
  "Goose Feather",
  "Feather & Down Mix",
  "Cotton",
  "Egyptian Cotton",
  "Polyester Cover",
  "Down-Proof Cotton",
] as const;

/** Down pillows. */
export const LEAF_DOWN_PILLOW_MATERIALS = [
  "Down",
  "Goose Down",
  "Duck Down",
  "Down Alternative",
  "Cotton",
  "Egyptian Cotton",
  "Silk",
  "Down-Proof Cotton",
  "Sateen",
] as const;

/** Decorative cushions. */
export const LEAF_DECORATIVE_CUSHION_MATERIALS = [
  "Cotton",
  "Linen",
  "Velvet",
  "Polyester",
  "Wool",
  "Silk",
  "Faux Fur",
  "Chenille",
  "Tweed",
  "Embroidery",
  "Canvas",
  "Bouclé",
] as const;

/** Seat / lumbar / floor cushions. */
export const LEAF_SEAT_CUSHION_MATERIALS = [
  "Foam",
  "Memory Foam",
  "Polyester",
  "Cotton",
  "Velvet",
  "Outdoor Fabric",
  "Water-Resistant",
  "Mesh",
  "Latex",
  "Canvas",
] as const;

/** Outdoor cushions. */
export const LEAF_OUTDOOR_CUSHION_MATERIALS = [
  "Outdoor Fabric",
  "Water-Resistant",
  "Polyester",
  "Olefin",
  "Solution-Dyed Acrylic",
  "Foam",
  "Quick-Dry Foam",
  "Mesh",
  "Canvas",
  "UV-Resistant Fabric",
] as const;

/** Standard bed pillows. */
export const LEAF_STANDARD_PILLOW_MATERIALS = [
  "Cotton",
  "Polyester",
  "Microfibre",
  "Polyester Fibre",
  "Memory Foam",
  "Foam",
  "Feather",
  "Down",
  "Down Alternative",
  "Bamboo",
  "Latex",
  "Wool",
  "Silk",
  "Gel Foam",
  "Hypoallergenic Fill",
  "Egyptian Cotton",
] as const;

/** Body pillows (non-maternity). */
export const LEAF_BODY_PILLOW_MATERIALS = [
  "Polyester Fibre",
  "Microfibre",
  "Memory Foam",
  "Foam",
  "Cotton",
  "Bamboo",
  "Down Alternative",
  "Velvet",
  "Jersey",
  "Cooling Gel",
  "Hypoallergenic Fill",
] as const;

/** Children's pillows. */
export const LEAF_CHILDRENS_PILLOW_MATERIALS = [
  "Polyester Fibre",
  "Microfibre",
  "Cotton",
  "Organic Cotton",
  "Foam",
  "Memory Foam",
  "Bamboo",
  "Hypoallergenic Fill",
  "Anti-Allergy Fill",
  "Jersey",
] as const;

/** Pillowcases. */
export const LEAF_PILLOWCASE_MATERIALS = [
  "Cotton",
  "Egyptian Cotton",
  "Percale",
  "Sateen",
  "Linen",
  "Silk",
  "Bamboo",
  "Polyester",
  "Jersey",
  "Flannel",
  "Satin",
  "Organic Cotton",
  "Tencel",
] as const;

export const LEAF_CATEGORY_MATERIAL_OVERRIDES: Readonly<Record<string, readonly string[]>> = {
  "travel-pillows": LEAF_TRAVEL_PILLOW_MATERIALS,
  "neck-pillows": LEAF_TRAVEL_PILLOW_MATERIALS,
  "maternity-pillows": LEAF_MATERNITY_PILLOW_MATERIALS,
  "pregnancy-pillows": LEAF_MATERNITY_PILLOW_MATERIALS,
  "memory-foam-pillows": LEAF_MEMORY_FOAM_PILLOW_MATERIALS,
  "orthopedic-pillows": LEAF_ORTHOPEDIC_PILLOW_MATERIALS,
  "cooling-pillows": LEAF_COOLING_PILLOW_MATERIALS,
  "feather-pillows": LEAF_FEATHER_PILLOW_MATERIALS,
  "down-pillows": LEAF_DOWN_PILLOW_MATERIALS,
  "decorative-cushions": LEAF_DECORATIVE_CUSHION_MATERIALS,
  cushions: [
    "Cotton",
    "Linen",
    "Chenille",
    "Polyester",
    "Wool",
    "Faux Fur",
    "Tweed",
    "Canvas",
    "Jacquard",
    "Embroidery",
    "Silk",
    "Satin",
  ],
  "seat-cushions": LEAF_SEAT_CUSHION_MATERIALS,
  "lumbar-cushions": LEAF_SEAT_CUSHION_MATERIALS,
  "floor-cushions": LEAF_SEAT_CUSHION_MATERIALS,
  "outdoor-cushions": LEAF_OUTDOOR_CUSHION_MATERIALS,
  pillows: LEAF_STANDARD_PILLOW_MATERIALS,
  "body-pillows": LEAF_BODY_PILLOW_MATERIALS,
  "children-s-pillows": LEAF_CHILDRENS_PILLOW_MATERIALS,
  pillowcases: LEAF_PILLOWCASE_MATERIALS,
};

export function resolveLeafMaterialOverride(
  rootSlug: string,
  subcategorySlug: string,
  productTypeSlug: string,
): readonly string[] | null {
  const pathKey = `${rootSlug}/${subcategorySlug}/${productTypeSlug}`;
  return (
    LEAF_CATEGORY_MATERIAL_OVERRIDES[pathKey] ??
    LEAF_CATEGORY_MATERIAL_OVERRIDES[productTypeSlug] ??
    null
  );
}
