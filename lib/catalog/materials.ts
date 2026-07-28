/**
 * ROVEXO Catalog Master — Materials (compact, publish-speed friendly).
 */

export const CATALOG_MATERIALS = [
  "Cotton",
  "Polyester",
  "Wool",
  "Silk",
  "Linen",
  "Leather",
  "Faux leather",
  "Suede",
  "Denim",
  "Cashmere",
  "Acrylic",
  "Nylon",
  "Viscose",
  "Elastane",
  "Metal",
  "Stainless steel",
  "Aluminium",
  "Plastic",
  "Glass",
  "Wood",
  "Bamboo",
  "Ceramic",
  "Porcelain",
  "Rubber",
  "Silicone",
  "Foam",
  "Memory foam",
  "Down",
  "Feather",
  "Paper",
  "Cardboard",
  "Canvas",
  "Mesh",
  "Velvet",
  "Fleece",
  "Other",
] as const;

export type CatalogMaterial = (typeof CATALOG_MATERIALS)[number];
