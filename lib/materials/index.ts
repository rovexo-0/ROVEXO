/**
 * ROVEXO Material Database — canonical SSOT.
 * Target: 800+ materials with category-scoped loading.
 */

import { dedupeSorted, expandCombinations, slugify } from "@/lib/categories/taxonomy-utils";
import { MATERIAL_FAMILIES } from "@/lib/materials/families";
import { MATERIAL_QUALIFIERS } from "@/lib/materials/qualifiers";
import { MATERIAL_FINISHES } from "@/lib/materials/finishes";

export type MaterialRecord = {
  id: string;
  name: string;
  slug: string;
  family: string;
  aliases: readonly string[];
  keywords: readonly string[];
  verticals: readonly string[];
};

function buildMaterial(name: string, family: string, verticals: readonly string[]): MaterialRecord {
  const trimmed = name.trim();
  return {
    id: trimmed,
    name: trimmed,
    slug: slugify(trimmed),
    family,
    aliases: [],
    keywords: [trimmed.toLowerCase(), family.toLowerCase()],
    verticals,
  };
}

function generateMaterials(): MaterialRecord[] {
  const records: MaterialRecord[] = [];

  for (const [family, bases, verticals] of MATERIAL_FAMILIES) {
    for (const base of bases) {
      records.push(buildMaterial(base, family, verticals));
    }
    const qualifiers = MATERIAL_QUALIFIERS[family] ?? MATERIAL_QUALIFIERS.default ?? [];
    const finishes = MATERIAL_FINISHES[family] ?? [];
    const expanded = expandCombinations(bases, qualifiers, finishes);
    for (const name of expanded) {
      if (name !== bases.find((b) => b === name)) {
        records.push(buildMaterial(name, family, verticals));
      }
    }
  }

  const seen = new Set<string>();
  return records.filter((r) => {
    const key = r.id.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const MATERIAL_DATABASE: MaterialRecord[] = generateMaterials();

export const MARKETPLACE_MATERIALS: readonly string[] = MATERIAL_DATABASE.map((m) => m.name);

export const MATERIAL_COUNT = MATERIAL_DATABASE.length;

export const FASHION_MATERIALS = dedupeSorted(
  MATERIAL_DATABASE.filter((m) => m.verticals.includes("fashion")).map((m) => m.name),
);

export const HOME_MATERIALS = dedupeSorted(
  MATERIAL_DATABASE.filter((m) => m.verticals.includes("home")).map((m) => m.name),
);

export const PILLOW_MATERIALS = dedupeSorted(
  MATERIAL_DATABASE.filter((m) => m.verticals.includes("pillows") || m.verticals.includes("bedding")).map((m) => m.name),
);

export const BEDDING_MATERIALS = dedupeSorted(
  MATERIAL_DATABASE.filter((m) => m.verticals.includes("bedding")).map((m) => m.name),
);

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
