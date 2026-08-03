/**
 * ROVEXO Catalog Master — Canonical Material Registry V4 (COD SÂNGE).
 * DATA ONLY — every Material exists once globally; leaf categories reference by official name.
 */

import { slugify } from "@/lib/categories/taxonomy-utils";

export type CanonicalMaterialStatus = "active" | "deprecated" | "merged";

export type CanonicalMaterial = {
  officialName: string;
  normalizedName: string;
  slug: string;
  aliases: readonly string[];
  supportedLeafCategories: readonly string[];
  status: CanonicalMaterialStatus;
};

export function normalizeMaterialKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[®™©]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Alias → Official Material Name. */
export const CANONICAL_MATERIAL_ALIAS_MAP: Readonly<Record<string, string>> = {
  "memory foam": "Memory Foam",
  memoryfoam: "Memory Foam",
  "memory-foam": "Memory Foam",
  "gel memory foam": "Gel Memory Foam",
  "gel-memory-foam": "Gel Memory Foam",
  "shredded memory foam": "Shredded Memory Foam",
  "polyester fiber": "Polyester Fibre",
  "polyester fibre": "Polyester Fibre",
  "polyester fill": "Polyester Fibre",
  microfiber: "Microfibre",
  microfibre: "Microfibre",
  "micro fiber": "Microfibre",
  "micro fibre": "Microfibre",
  "organic cotton": "Organic Cotton",
  "egyptian cotton": "Egyptian Cotton",
  "down alternative": "Down Alternative",
  "down-alternative": "Down Alternative",
  "goose down": "Goose Down",
  "duck down": "Duck Down",
  "duck feather": "Duck Feather",
  "goose feather": "Goose Feather",
  "feather and down": "Feather & Down Mix",
  "feather & down": "Feather & Down Mix",
  "feather & down mix": "Feather & Down Mix",
  "cooling gel": "Cooling Gel",
  "gel foam": "Gel Foam",
  "beans / microbeads": "Beans / Microbeads",
  microbeads: "Beans / Microbeads",
  "eps microbeads": "EPS Microbeads",
  "hypoallergenic fill": "Hypoallergenic Fill",
  "hypo-allergenic fill": "Hypoallergenic Fill",
  "anti-allergy fill": "Anti-Allergy Fill",
  "anti allergy fill": "Anti-Allergy Fill",
  "bamboo cover": "Bamboo Cover",
  "cotton cover": "Cotton Cover",
  "phase change fabric": "Phase Change Fabric",
  "cooling fabric": "Cooling Fabric",
  "water-resistant": "Water-Resistant",
  "water resistant": "Water-Resistant",
  "uv-resistant fabric": "UV-Resistant Fabric",
  "uv resistant": "UV-Resistant Fabric",
  "outdoor fabric": "Outdoor Fabric",
  "quick-dry foam": "Quick-Dry Foam",
  "quick dry foam": "Quick-Dry Foam",
  "solution-dyed acrylic": "Solution-Dyed Acrylic",
  "down-proof cotton": "Down-Proof Cotton",
  "ventilated foam": "Ventilated Foam",
  "firm foam": "Firm Foam",
  "cervical contour foam": "Cervical Contour Foam",
  "shredded foam": "Shredded Foam",
  "air chamber": "Air Chamber",
  "soft fleece": "Soft Fleece",
  fauxfur: "Faux Fur",
  "faux fur": "Faux Fur",
  boucle: "Bouclé",
  "bouclé": "Bouclé",
};

export const CANONICAL_MATERIAL_METADATA: Readonly<
  Record<string, { aliases?: readonly string[]; status?: CanonicalMaterialStatus }>
> = {
  "Memory Foam": {
    aliases: ["memory foam", "Memory foam", "MEMORY FOAM", "memory-foam"],
  },
  "Gel Memory Foam": {
    aliases: ["gel memory foam", "Gel-Infused Memory Foam"],
  },
  "Polyester Fibre": {
    aliases: ["Polyester Fiber", "polyester fibre", "Polyester Fill"],
  },
  Microfibre: {
    aliases: ["Microfiber", "microfibre", "Micro fiber"],
  },
  "Organic Cotton": {
    aliases: ["organic cotton"],
  },
  "Down Alternative": {
    aliases: ["down alternative", "Down-Alternative"],
  },
  "Hypoallergenic Fill": {
    aliases: ["Hypo-allergenic Fill", "hypoallergenic fill"],
  },
  "Water-Resistant": {
    aliases: ["Water Resistant", "water-resistant"],
  },
  Bouclé: {
    aliases: ["Boucle", "bouclé"],
  },
};

const CANONICAL_MATERIAL_DISPLAY: Readonly<Record<string, string>> = Object.fromEntries(
  [
    ...Object.values(CANONICAL_MATERIAL_ALIAS_MAP),
    ...Object.keys(CANONICAL_MATERIAL_METADATA),
  ].map((name) => [normalizeMaterialKey(name), name]),
);

export function resolveCanonicalMaterialName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  const key = normalizeMaterialKey(trimmed);
  if (!key || key === "other") return trimmed === "other" ? "Other" : trimmed;

  const fromAlias = CANONICAL_MATERIAL_ALIAS_MAP[key];
  if (fromAlias) return fromAlias;

  const fromDisplay = CANONICAL_MATERIAL_DISPLAY[key];
  if (fromDisplay) return fromDisplay;

  // Title-case common single/multi-word materials that slipped through inconsistently.
  if (trimmed !== trimmed.toUpperCase() && trimmed === trimmed.toLowerCase()) {
    return trimmed.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return trimmed.replace(/[®™©]+$/g, "").replace(/\s+/g, " ").trim();
}

export function buildCanonicalMaterialRecord(
  officialName: string,
  options?: {
    aliases?: readonly string[];
    supportedLeafCategories?: readonly string[];
  },
): CanonicalMaterial {
  const meta = CANONICAL_MATERIAL_METADATA[officialName];
  const aliasSet = new Set<string>([
    ...(meta?.aliases ?? []),
    ...(options?.aliases ?? []),
  ]);
  for (const [aliasKey, target] of Object.entries(CANONICAL_MATERIAL_ALIAS_MAP)) {
    if (target === officialName) aliasSet.add(aliasKey);
  }
  return {
    officialName,
    normalizedName: normalizeMaterialKey(officialName),
    slug: slugify(officialName),
    aliases: [...aliasSet].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" })),
    supportedLeafCategories: options?.supportedLeafCategories ?? [],
    status: meta?.status ?? "active",
  };
}

let cachedRegistry: readonly CanonicalMaterial[] | null = null;
let cachedByNormalized: Map<string, CanonicalMaterial> | null = null;

export function resetCanonicalMaterialRegistryCacheForTests(): void {
  cachedRegistry = null;
  cachedByNormalized = null;
}

export function syncCanonicalMaterialRegistry(
  leafMaterialEntries: ReadonlyMap<string, readonly string[]>,
): readonly CanonicalMaterial[] {
  const leafSupport = new Map<string, Set<string>>();

  for (const [path, materials] of leafMaterialEntries) {
    const leafSlug = path.split("/").at(-1) ?? path;
    for (const raw of materials) {
      const official = resolveCanonicalMaterialName(raw);
      if (!official || official === "Other") continue;
      const key = normalizeMaterialKey(official);
      const set = leafSupport.get(key) ?? new Set<string>();
      set.add(leafSlug);
      leafSupport.set(key, set);
    }
  }

  const allOfficial = new Map<string, string>();
  for (const materials of leafMaterialEntries.values()) {
    for (const raw of materials) {
      const official = resolveCanonicalMaterialName(raw);
      if (!official || official === "Other") continue;
      allOfficial.set(normalizeMaterialKey(official), official);
    }
  }

  const records: CanonicalMaterial[] = [];
  for (const [key, leaves] of leafSupport) {
    const official = allOfficial.get(key) ?? key;
    records.push(
      buildCanonicalMaterialRecord(official, {
        supportedLeafCategories: [...leaves].sort(),
      }),
    );
  }

  records.sort((a, b) =>
    a.officialName.localeCompare(b.officialName, "en", { sensitivity: "base" }),
  );
  cachedRegistry = records;
  cachedByNormalized = new Map(records.map((r) => [r.normalizedName, r]));
  return cachedRegistry;
}

export function getCanonicalMaterialRegistry(): readonly CanonicalMaterial[] {
  return cachedRegistry ?? [];
}

export function findCanonicalMaterial(nameOrAlias: string): CanonicalMaterial | undefined {
  const official = resolveCanonicalMaterialName(nameOrAlias);
  return cachedByNormalized?.get(normalizeMaterialKey(official));
}

export function getCanonicalMaterialStats(): {
  canonicalMaterials: number;
  aliasesNormalized: number;
} {
  return {
    canonicalMaterials: (cachedRegistry ?? []).length,
    aliasesNormalized: Object.keys(CANONICAL_MATERIAL_ALIAS_MAP).length,
  };
}
