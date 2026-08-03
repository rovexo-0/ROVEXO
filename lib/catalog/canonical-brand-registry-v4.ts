/**
 * ROVEXO Catalog Master — Canonical Brand Registry V4 (COD SÂNGE).
 * DATA ONLY — every Brand exists once globally; leaf categories reference by official name.
 * Sell continues to receive `readonly string[]` of official names (no UI / search / filter change).
 */

import { slugify } from "@/lib/categories/taxonomy-utils";

export type CanonicalBrandStatus = "active" | "deprecated" | "merged";

export type CanonicalBrand = {
  officialName: string;
  normalizedName: string;
  slug: string;
  aliases: readonly string[];
  officialWebsite?: string;
  country?: string;
  /** Public asset path only when legally usable; omit otherwise. */
  logoReference?: string;
  status: CanonicalBrandStatus;
  /** Leaf-path frequency score (0–100). */
  popularity: number;
  supportedLeafCategories: readonly string[];
};

/** Accent-insensitive · case-insensitive · trademark-stripped key. */
export function normalizeBrandKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[®™©]/g, "")
    .replace(/['’]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Alias → Official Name.
 * Every alias collapses to exactly one global Brand.
 */
export const CANONICAL_BRAND_ALIAS_MAP: Readonly<Record<string, string>> = {
  // Bedding / pillows
  tempur: "Tempur",
  "tempur-pedic": "Tempur",
  tempurpedic: "Tempur",
  pharmedoc: "PharMeDoc",
  "phar me doc": "PharMeDoc",
  "dot&dot": "Dot & Dot",
  "dot and dot": "Dot & Dot",
  "lewis n clark": "Lewis N. Clark",
  "lewis n. clark": "Lewis N. Clark",
  "lewis and clark": "Lewis N. Clark",
  "panda london": "Panda London",
  "brook and wilde": "Brook + Wilde",
  "brook + wilde": "Brook + Wilde",
  "soak and sleep": "Soak&Sleep",
  "soak&sleep": "Soak&Sleep",
  "eve sleep": "Eve Sleep",
  "coop home goods": "Coop Home Goods",
  "utopia bedding": "Utopia Bedding",
  "bb hug me": "bbhugme",
  "bbhugme": "bbhugme",
  "queenrose": "Queen Rose",
  "queen rose": "Queen Rose",
  "dream genii": "Dreamgenii",
  "mamas and papas": "Mamas & Papas",
  "m&s": "Marks & Spencer",
  "marks and spencer": "Marks & Spencer",
  "marks & spencer": "Marks & Spencer",
  "john lewis & partners": "John Lewis",
  "the white company uk": "The White Company",

  // Fashion / footwear
  "dr martens": "Dr. Martens",
  "dr. martens": "Dr. Martens",
  drmartens: "Dr. Martens",
  "hugo boss": "Hugo Boss",
  boss: "Hugo Boss",
  "levis": "Levi's",
  "levi's": "Levi's",
  "h and m": "H&M",
  "h&m": "H&M",
  "lululemon athletica": "Lululemon",

  // Automotive
  vw: "Volkswagen",
  volkswagen: "Volkswagen",
  mercedes: "Mercedes-Benz",
  "mercedes benz": "Mercedes-Benz",
  "mercedes-benz": "Mercedes-Benz",
  "landrover": "Land Rover",
  "land rover": "Land Rover",
  "rolls royce": "Rolls-Royce",
  "alfa": "Alfa Romeo",

  // Electronics
  "hewlett packard": "HP",
  "hp inc": "HP",
  "hewlett-packard": "HP",
  "lg electronics": "LG",
  "samsung electronics": "Samsung",
  "google llc": "Google",
  "microsoft corporation": "Microsoft",

  // Home retail (store brands kept only when they manufacture / private-label lines used as brand)
  "made": "Made.com",
  "made.com": "Made.com",
  "and so to bed": "And So To Bed",
  uag: "Urban Armor Gear",
  "urban armor gear": "Urban Armor Gear",
  kindle: "Amazon",
  "amazon kindle": "Amazon",
  remarkable: "Remarkable",
  "reMarkable": "Remarkable",
  kobo: "Kobo",
  boox: "BOOX",
  "onyx boox": "BOOX",
};

/** Official metadata for known manufacturers (public sources only). */
export const CANONICAL_BRAND_METADATA: Readonly<
  Record<
    string,
    {
      aliases?: readonly string[];
      officialWebsite?: string;
      country?: string;
      logoReference?: string;
      status?: CanonicalBrandStatus;
    }
  >
> = {
  Tempur: {
    aliases: ["TEMPUR", "Tempur®", "Tempur-Pedic", "tempur"],
    officialWebsite: "https://www.tempur.com",
    country: "Denmark",
  },
  PharMeDoc: {
    aliases: ["Pharmedoc", "Phar Me Doc"],
    officialWebsite: "https://www.pharmedoc.com",
    country: "United States",
  },
  "Dot & Dot": {
    aliases: ["Dot&Dot", "Dot and Dot"],
    country: "United States",
  },
  "Lewis N. Clark": {
    aliases: ["Lewis N Clark", "Lewis and Clark"],
    country: "United States",
  },
  Cabeau: {
    aliases: ["CABEAU"],
    officialWebsite: "https://www.cabeau.com",
    country: "United States",
  },
  BCOZZY: {
    aliases: ["Bcozzy", "bcozzy"],
    officialWebsite: "https://www.bcozzy.com",
    country: "United States",
  },
  Trtl: {
    aliases: ["TRTL", "trtl pillow"],
    officialWebsite: "https://trtltravel.com",
    country: "United Kingdom",
  },
  Huzi: {
    aliases: ["HUZI", "Huzi Design"],
    country: "Hong Kong",
  },
  Napfun: {
    aliases: ["NAPFUN"],
  },
  Mulisoft: {
    aliases: ["MULISOFT", "Muli Soft"],
  },
  Elviros: {
    aliases: ["ELVIROS"],
  },
  Jinxia: {
    aliases: ["JINXIA"],
  },
  Emma: {
    aliases: ["EMMA", "Emma Mattress"],
    officialWebsite: "https://www.emma-sleep.co.uk",
    country: "Germany",
  },
  Simba: {
    aliases: ["SIMBA", "Simba Sleep"],
    officialWebsite: "https://simbasleep.com",
    country: "United Kingdom",
  },
  Silentnight: {
    aliases: ["SILENTNIGHT"],
    officialWebsite: "https://www.silentnight.co.uk",
    country: "United Kingdom",
  },
  "Panda London": {
    aliases: ["Panda", "PANDA LONDON"],
    officialWebsite: "https://uk.pandalondon.com",
    country: "United Kingdom",
  },
  "Utopia Bedding": {
    aliases: ["Utopia", "UTOPIA BEDDING"],
    country: "United States",
  },
  "Coop Home Goods": {
    aliases: ["Coop", "COOP HOME GOODS"],
    officialWebsite: "https://www.coophomegoods.com",
    country: "United States",
  },
  "Queen Rose": {
    aliases: ["QueenRose", "QUEEN ROSE"],
  },
  Dreamgenii: {
    aliases: ["Dream Genii", "DREAMGENII"],
    country: "United Kingdom",
  },
  Niimo: {
    aliases: ["NIIMO"],
  },
  bbhugme: {
    aliases: ["bb hug me", "BBHUGME"],
    officialWebsite: "https://bbhugme.com",
    country: "Norway",
  },
  Apple: {
    aliases: ["APPLE", "Apple Inc."],
    officialWebsite: "https://www.apple.com",
    country: "United States",
  },
  Samsung: {
    aliases: ["SAMSUNG", "Samsung Electronics"],
    officialWebsite: "https://www.samsung.com",
    country: "South Korea",
  },
  Volkswagen: {
    aliases: ["VW", "VOLKSWAGEN"],
    officialWebsite: "https://www.volkswagen.co.uk",
    country: "Germany",
  },
  "Mercedes-Benz": {
    aliases: ["Mercedes", "MERCEDES", "Mercedes Benz"],
    officialWebsite: "https://www.mercedes-benz.co.uk",
    country: "Germany",
  },
  "Dr. Martens": {
    aliases: ["Dr Martens", "DR MARTENS", "Doc Martens"],
    officialWebsite: "https://www.drmartens.com",
    country: "United Kingdom",
  },
  "Marks & Spencer": {
    aliases: ["M&S", "Marks and Spencer"],
    officialWebsite: "https://www.marksandspencer.com",
    country: "United Kingdom",
  },
  IKEA: {
    aliases: ["Ikea", "ikea"],
    officialWebsite: "https://www.ikea.com",
    country: "Sweden",
  },
  Nike: {
    aliases: ["NIKE", "Nike, Inc."],
    officialWebsite: "https://www.nike.com",
    country: "United States",
  },
  Adidas: {
    aliases: ["ADIDAS", "adidas"],
    officialWebsite: "https://www.adidas.co.uk",
    country: "Germany",
  },
  Bosch: {
    aliases: ["BOSCH", "Robert Bosch"],
    officialWebsite: "https://www.bosch.com",
    country: "Germany",
  },
  HP: {
    aliases: ["Hewlett Packard", "Hewlett-Packard", "Hp"],
    officialWebsite: "https://www.hp.com",
    country: "United States",
  },
};

/** Preferred display casing for names that appear with inconsistent capitalization. */
const CANONICAL_DISPLAY_CASING: Readonly<Record<string, string>> = Object.fromEntries(
  [
    ...Object.values(CANONICAL_BRAND_ALIAS_MAP),
    ...Object.keys(CANONICAL_BRAND_METADATA),
  ].map((name) => [normalizeBrandKey(name), name]),
);

export function resolveCanonicalBrandName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  const key = normalizeBrandKey(trimmed);
  if (!key) return trimmed;
  if (key === "no brand" || key === "other") return trimmed;

  const fromAlias = CANONICAL_BRAND_ALIAS_MAP[key];
  if (fromAlias) return fromAlias;

  const fromCasing = CANONICAL_DISPLAY_CASING[key];
  if (fromCasing) return fromCasing;

  // Strip trailing trademark punctuation while preserving intentional casing of unknown brands.
  return trimmed.replace(/[®™©]+$/g, "").replace(/\s+/g, " ").trim();
}

export function buildCanonicalBrandRecord(
  officialName: string,
  options?: {
    aliases?: readonly string[];
    supportedLeafCategories?: readonly string[];
    popularity?: number;
  },
): CanonicalBrand {
  const meta = CANONICAL_BRAND_METADATA[officialName];
  const aliasSet = new Set<string>([
    ...(meta?.aliases ?? []),
    ...(options?.aliases ?? []),
  ]);
  // Reverse-map aliases that point here.
  for (const [aliasKey, target] of Object.entries(CANONICAL_BRAND_ALIAS_MAP)) {
    if (target === officialName) aliasSet.add(aliasKey);
  }

  return {
    officialName,
    normalizedName: normalizeBrandKey(officialName),
    slug: slugify(officialName),
    aliases: [...aliasSet].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" })),
    officialWebsite: meta?.officialWebsite,
    country: meta?.country,
    logoReference: meta?.logoReference,
    status: meta?.status ?? "active",
    popularity: options?.popularity ?? 0,
    supportedLeafCategories: options?.supportedLeafCategories ?? [],
  };
}

let cachedRegistry: readonly CanonicalBrand[] | null = null;
let cachedByNormalized: Map<string, CanonicalBrand> | null = null;

export function resetCanonicalBrandRegistryCacheForTests(): void {
  cachedRegistry = null;
  cachedByNormalized = null;
}

/**
 * Build the global canonical Brand registry from leaf Brand databases.
 * One Brand record per official name. Leaf lists remain references by name.
 */
export function syncCanonicalBrandRegistry(
  leafBrandEntries: ReadonlyMap<string, readonly string[]>,
): readonly CanonicalBrand[] {
  const leafSupport = new Map<string, Set<string>>();
  const popularity = new Map<string, number>();
  const officialByKey = new Map<string, string>();

  for (const [path, brands] of leafBrandEntries) {
    const leafSlug = path.split("/").at(-1) ?? path;
    for (const raw of brands) {
      const official = resolveCanonicalBrandName(raw);
      if (!official || official === "No Brand" || official === "Other") continue;
      const key = normalizeBrandKey(official);
      officialByKey.set(key, official);
      const set = leafSupport.get(key) ?? new Set<string>();
      set.add(leafSlug);
      leafSupport.set(key, set);
      popularity.set(key, (popularity.get(key) ?? 0) + 1);
    }
  }

  const maxPop = Math.max(1, ...popularity.values());
  const records: CanonicalBrand[] = [];
  for (const [key, leaves] of leafSupport) {
    const official = officialByKey.get(key) ?? key;
    records.push(
      buildCanonicalBrandRecord(official, {
        supportedLeafCategories: [...leaves].sort(),
        popularity: Math.round(((popularity.get(key) ?? 1) / maxPop) * 100),
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

export function getCanonicalBrandRegistry(): readonly CanonicalBrand[] {
  return cachedRegistry ?? [];
}

export function findCanonicalBrand(nameOrAlias: string): CanonicalBrand | undefined {
  const official = resolveCanonicalBrandName(nameOrAlias);
  return cachedByNormalized?.get(normalizeBrandKey(official));
}

export function getCanonicalBrandStats(): {
  canonicalBrands: number;
  aliasesNormalized: number;
  withWebsite: number;
  withCountry: number;
} {
  const registry = cachedRegistry ?? [];
  return {
    canonicalBrands: registry.length,
    aliasesNormalized: Object.keys(CANONICAL_BRAND_ALIAS_MAP).length,
    withWebsite: registry.filter((b) => Boolean(b.officialWebsite)).length,
    withCountry: registry.filter((b) => Boolean(b.country)).length,
  };
}
