/**
 * ROVEXO Material Database — Catalog Master SSOT (compact).
 */

import { CATALOG_MATERIALS } from "@/lib/catalog/materials";
import { slugify } from "@/lib/categories/taxonomy-utils";

export type MaterialRecord = {
  id: string;
  name: string;
  slug: string;
  family: string;
  aliases: readonly string[];
  keywords: readonly string[];
  verticals: readonly string[];
};

export const MATERIAL_DATABASE: MaterialRecord[] = [...CATALOG_MATERIALS].map((name) => ({
  id: name,
  name,
  slug: slugify(name),
  family: "catalog",
  aliases: [],
  keywords: [name.toLowerCase()],
  verticals: ["general", "fashion", "home", "pillows", "bedding"],
}));

export const MARKETPLACE_MATERIALS: readonly string[] = MATERIAL_DATABASE.map((m) => m.name);
export const MATERIAL_COUNT = MATERIAL_DATABASE.length;

export const FASHION_MATERIALS = MARKETPLACE_MATERIALS;
export const HOME_MATERIALS = MARKETPLACE_MATERIALS;
export const PILLOW_MATERIALS = MARKETPLACE_MATERIALS;
export const BEDDING_MATERIALS = MARKETPLACE_MATERIALS;

export const MARKETPLACE_MATERIALS_BY_VERTICAL = {
  default: MARKETPLACE_MATERIALS,
  fashion: FASHION_MATERIALS,
  home: HOME_MATERIALS,
  pillows: PILLOW_MATERIALS,
  bedding: BEDDING_MATERIALS,
} as const;

export const MARKETPLACE_MATERIALS_BY_SCOPE = MARKETPLACE_MATERIALS_BY_VERTICAL;

export function getMaterialsForVertical(vertical: string): readonly string[] {
  return (MARKETPLACE_MATERIALS_BY_VERTICAL as Record<string, readonly string[]>)[vertical] ?? MARKETPLACE_MATERIALS;
}

export function validateMaterial(name: string): boolean {
  const lower = name.trim().toLowerCase();
  return MATERIAL_DATABASE.some((m) => m.name.toLowerCase() === lower);
}
