/**
 * ROVEXO Sell — Smart Attribute Engine.
 *
 * Category-aware definition of the optional listing attributes. Each attribute
 * either targets an existing listing column (Brand/Colour/Size/Material) or a
 * generic client-side `draft.attributes` map that is folded into the listing
 * description on publish. Nothing here changes the DB schema, API contract or
 * validation flow — it is purely a UI + serialisation layer.
 */

import type { FlatCategoryPath } from "@/lib/categories/types";
import type { SellListingDraft } from "@/features/sell/types";
import {
  BRAND_OPTIONS,
  BRAND_POPULAR_IDS,
  COLOUR_OPTIONS,
  MATERIAL_OPTIONS,
  SIZE_OPTIONS,
  type SelectionOption,
} from "@/lib/sell/attribute-options";
import { MARKETPLACE_CONDITIONS_BY_VERTICAL } from "@/lib/categories/enterprise/conditions";
import { loadCategoryScopedTaxonomy } from "@/lib/category-loaders/scoped";
import {
  resolveAaQuickSellAttributeIds,
} from "@/lib/sell/aa-quick-sell-attributes";
import {
  catalogPathRequiresSize,
  catalogSizeOptionsForPath,
} from "@/lib/sell/catalog-size-visibility-v1";
import { resolveSellAttributeIdsFromCatalog } from "@/lib/sell/catalog-attribute-bridge-v1";
import { SELL_QUICK_CONDITIONS } from "@/lib/sell/sell-condition-options";

export type AttributeInput = "select-single" | "select-multi" | "grid-single" | "text";

/** Attribute value target: a real listing column, or the generic attribute map. */
export type AttributeTarget =
  | { kind: "field"; field: "brand" | "color" | "size" | "material" }
  | { kind: "map" };

export type AttributeDef = {
  id: string;
  label: string;
  input: AttributeInput;
  target: AttributeTarget;
  options?: readonly SelectionOption[];
  searchable?: boolean;
  searchPlaceholder?: string;
  popularIds?: readonly string[];
  allowCustomFromSearch?: boolean;
  showSwatch?: boolean;
  placeholder?: string;
  inputMode?: "text" | "numeric";
  /**
   * When false, attribute is shown but never blocks Publish / progressive completion.
   * Default: required for taxonomy-driven core attrs (Brand, Condition, Size, …).
   */
  required?: boolean;
};

/** Camping / product detail fields — OPTIONAL. Never block Publish when empty. */
export const OPTIONAL_SELL_ATTRIBUTE_IDS = new Set<string>([
  "temperatureRating",
  "seasonRating",
  "length",
  "weight",
  "dimensions",
]);

export function isSellAttributeRequired(attributeId: string): boolean {
  return !OPTIONAL_SELL_ATTRIBUTE_IDS.has(attributeId);
}

function toOptions(labels: readonly string[]): SelectionOption[] {
  return labels.map((label) => ({ id: label, label }));
}

const STYLE_OPTIONS = toOptions([
  "Casual",
  "Formal",
  "Business",
  "Sporty",
  "Streetwear",
  "Vintage",
  "Bohemian",
  "Minimalist",
  "Party",
  "Elegant",
]);

const PATTERN_OPTIONS = toOptions([
  "Solid",
  "Striped",
  "Checked",
  "Floral",
  "Polka Dot",
  "Graphic",
  "Camouflage",
  "Animal Print",
  "Plaid",
  "Geometric",
  "Tie-Dye",
]);

const STORAGE_OPTIONS = toOptions([
  "16GB",
  "32GB",
  "64GB",
  "128GB",
  "256GB",
  "512GB",
  "1TB",
  "2TB",
]);

const RAM_OPTIONS = toOptions(["2GB", "4GB", "6GB", "8GB", "12GB", "16GB", "32GB", "64GB"]);

const FUEL_OPTIONS = toOptions(["Petrol", "Diesel", "Electric", "Hybrid", "Plug-in Hybrid", "LPG"]);

const TRANSMISSION_OPTIONS = toOptions(["Manual", "Automatic", "Semi-Automatic"]);

const BODY_TYPE_OPTIONS = toOptions([
  "Hatchback",
  "Saloon",
  "Estate",
  "SUV",
  "Coupe",
  "Convertible",
  "MPV",
  "Van",
  "Pickup",
  "Other",
]);

const GENDER_OPTIONS = toOptions(["Men", "Women", "Unisex", "Girls", "Boys", "Baby"]);

const SEASON_OPTIONS = toOptions(["Spring", "Summer", "Autumn", "Winter", "All Season"]);

const WARRANTY_OPTIONS = toOptions([
  "No Warranty",
  "Manufacturer Warranty",
  "Seller Warranty",
  "Extended Warranty",
  "Lifetime Warranty",
  "Expired",
]);

const ELECTRONICS_SLUGS = new Set(["electronics", "phones", "computers", "gaming", "tv-audio"]);

export function conditionOptionsForCategorySlug(slug: string | undefined): SelectionOption[] {
  if (slug === "vehicles") return toOptions([...MARKETPLACE_CONDITIONS_BY_VERTICAL.vehicles]);
  if (slug && ELECTRONICS_SLUGS.has(slug)) {
    return toOptions([...MARKETPLACE_CONDITIONS_BY_VERTICAL.electronics]);
  }
  return toOptions([...MARKETPLACE_CONDITIONS_BY_VERTICAL.default]);
}

export const ATTRIBUTE_DEFS: Record<string, AttributeDef> = {
  brand: {
    id: "brand",
    label: "Brand",
    input: "select-single",
    target: { kind: "field", field: "brand" },
    options: BRAND_OPTIONS,
    popularIds: BRAND_POPULAR_IDS,
    searchable: true,
    searchPlaceholder: "Search brands",
    allowCustomFromSearch: true,
    placeholder: "Select brand",
  },
  size: {
    id: "size",
    label: "Size",
    input: "grid-single",
    target: { kind: "field", field: "size" },
    options: SIZE_OPTIONS,
    placeholder: "Select size",
  },
  colour: {
    id: "colour",
    label: "Colours",
    input: "select-single",
    target: { kind: "field", field: "color" },
    options: COLOUR_OPTIONS,
    showSwatch: true,
    placeholder: "",
  },
  material: {
    id: "material",
    label: "Material (recommended)",
    input: "select-single",
    target: { kind: "field", field: "material" },
    options: MATERIAL_OPTIONS,
    searchable: true,
    searchPlaceholder: "Search materials",
    placeholder: "",
  },
  style: {
    id: "style",
    label: "Style",
    input: "select-single",
    target: { kind: "map" },
    options: STYLE_OPTIONS,
    placeholder: "Select style",
  },
  pattern: {
    id: "pattern",
    label: "Pattern",
    input: "select-single",
    target: { kind: "map" },
    options: PATTERN_OPTIONS,
    placeholder: "Select pattern",
  },
  model: {
    id: "model",
    label: "Model",
    input: "text",
    target: { kind: "map" },
    placeholder: "e.g. iPhone 13 Pro",
  },
  generation: {
    id: "generation",
    label: "Generation",
    input: "text",
    target: { kind: "map" },
    placeholder: "e.g. Mk7",
  },
  bodyType: {
    id: "bodyType",
    label: "Body Type",
    input: "select-single",
    target: { kind: "map" },
    options: BODY_TYPE_OPTIONS,
    placeholder: "Select body type",
  },
  registration: {
    id: "registration",
    label: "Registration",
    input: "text",
    target: { kind: "map" },
    placeholder: "e.g. AB12 CDE",
  },
  gender: {
    id: "gender",
    label: "Gender",
    input: "select-single",
    target: { kind: "map" },
    options: GENDER_OPTIONS,
    placeholder: "Select gender",
  },
  season: {
    id: "season",
    label: "Season",
    input: "select-single",
    target: { kind: "map" },
    options: SEASON_OPTIONS,
    placeholder: "",
  },
  seasonRating: {
    id: "seasonRating",
    label: "Season Rating",
    input: "select-single",
    target: { kind: "map" },
    options: toOptions(["1 Season", "2 Season", "3 Season", "4 Season", "5 Season"]),
    placeholder: "",
    required: false,
  },
  length: {
    id: "length",
    label: "Length",
    input: "select-single",
    target: { kind: "map" },
    options: toOptions(["Short", "Regular", "Long", "Extra Long"]),
    placeholder: "",
    required: false,
  },
  weight: {
    id: "weight",
    label: "Weight",
    input: "text",
    target: { kind: "map" },
    placeholder: "e.g. 1.2 kg",
    required: false,
  },
  temperatureRating: {
    id: "temperatureRating",
    label: "Temperature Rating",
    input: "text",
    target: { kind: "map" },
    placeholder: "e.g. Comfort 0°C",
    required: false,
  },
  dimensions: {
    id: "dimensions",
    label: "Dimensions",
    input: "text",
    target: { kind: "map" },
    placeholder: "e.g. 120 × 60 × 40 cm",
    required: false,
  },
  age: {
    id: "age",
    label: "Age",
    input: "select-single",
    target: { kind: "map" },
    options: toOptions(["0–3m", "3–6m", "6–12m", "1–2y", "2–3y", "3–4y", "4–5y", "5+"]),
    placeholder: "",
  },
  operatingSystem: {
    id: "operatingSystem",
    label: "Operating System",
    input: "select-single",
    target: { kind: "map" },
    options: toOptions(["iOS", "Android", "Windows", "macOS", "Linux", "Other"]),
    placeholder: "",
  },
  cpu: {
    id: "cpu",
    label: "CPU",
    input: "text",
    target: { kind: "map" },
    placeholder: "e.g. Apple A17 Pro",
  },
  gpu: {
    id: "gpu",
    label: "GPU",
    input: "text",
    target: { kind: "map" },
    placeholder: "e.g. NVIDIA RTX 4070",
  },
  battery: {
    id: "battery",
    label: "Battery Health",
    input: "text",
    target: { kind: "map" },
    placeholder: "e.g. 92%",
  },
  warranty: {
    id: "warranty",
    label: "Warranty",
    input: "select-single",
    target: { kind: "map" },
    options: WARRANTY_OPTIONS,
    placeholder: "Select warranty",
  },
  display: {
    id: "display",
    label: "Display",
    input: "text",
    target: { kind: "map" },
    placeholder: 'e.g. 6.7" OLED',
  },
  compatibility: {
    id: "compatibility",
    label: "Compatibility",
    input: "text",
    target: { kind: "map" },
    placeholder: "e.g. Fits BMW 3 Series",
  },
  storage: {
    id: "storage",
    label: "Storage",
    input: "select-single",
    target: { kind: "map" },
    options: STORAGE_OPTIONS,
    placeholder: "Select storage",
  },
  capacity: {
    id: "capacity",
    label: "Capacity",
    input: "text",
    target: { kind: "map" },
    placeholder: "e.g. 5L",
  },
  screenSize: {
    id: "screenSize",
    label: "Screen Size",
    input: "text",
    target: { kind: "map" },
    placeholder: 'e.g. 6.1"',
  },
  ram: {
    id: "ram",
    label: "RAM",
    input: "select-single",
    target: { kind: "map" },
    options: RAM_OPTIONS,
    placeholder: "",
  },
  processor: {
    id: "processor",
    label: "Processor",
    input: "text",
    target: { kind: "map" },
    placeholder: "e.g. Apple M2",
  },
  edition: {
    id: "edition",
    label: "Edition",
    input: "text",
    target: { kind: "map" },
    placeholder: "e.g. Limited Edition",
  },
  platform: {
    id: "platform",
    label: "Platform",
    input: "select-single",
    target: { kind: "map" },
    options: [
      { id: "playstation", label: "PlayStation" },
      { id: "xbox", label: "Xbox" },
      { id: "nintendo", label: "Nintendo" },
      { id: "pc", label: "PC" },
      { id: "other", label: "Other" },
    ],
    placeholder: "Select platform",
    searchable: true,
    allowCustomFromSearch: true,
  },
  collection: {
    id: "collection",
    label: "Collection",
    input: "text",
    target: { kind: "map" },
    placeholder: "e.g. Spring 2024",
  },
  year: {
    id: "year",
    label: "Year",
    input: "text",
    target: { kind: "map" },
    placeholder: "e.g. 2021",
    inputMode: "numeric",
  },
  engine: {
    id: "engine",
    label: "Engine",
    input: "text",
    target: { kind: "map" },
    placeholder: "e.g. 2.0L Turbo",
  },
  fuel: {
    id: "fuel",
    label: "Fuel Type",
    input: "select-single",
    target: { kind: "map" },
    options: FUEL_OPTIONS,
    placeholder: "Select fuel type",
  },
  transmission: {
    id: "transmission",
    label: "Transmission",
    input: "select-single",
    target: { kind: "map" },
    options: TRANSMISSION_OPTIONS,
    placeholder: "Select transmission",
  },
  mileage: {
    id: "mileage",
    label: "Mileage",
    input: "text",
    target: { kind: "map" },
    placeholder: "e.g. 45000",
    inputMode: "numeric",
  },
  width: {
    id: "width",
    label: "Width",
    input: "text",
    target: { kind: "map" },
    placeholder: "e.g. 120 cm",
    inputMode: "numeric",
  },
  height: {
    id: "height",
    label: "Height",
    input: "text",
    target: { kind: "map" },
    placeholder: "e.g. 75 cm",
    inputMode: "numeric",
  },
  depth: {
    id: "depth",
    label: "Depth",
    input: "text",
    target: { kind: "map" },
    placeholder: "e.g. 45 cm",
    inputMode: "numeric",
  },
  shape: {
    id: "shape",
    label: "Shape",
    input: "select-single",
    target: { kind: "map" },
    options: toOptions(["Standard", "Contour", "Wedge", "Body", "Travel", "U-Shaped", "Round", "Other"]),
    placeholder: "Select shape",
  },
  firmness: {
    id: "firmness",
    label: "Firmness",
    input: "select-single",
    target: { kind: "map" },
    options: toOptions(["Soft", "Medium", "Firm", "Extra Firm"]),
    placeholder: "Select firmness",
  },
  coverMaterial: {
    id: "coverMaterial",
    label: "Cover Material",
    input: "select-single",
    target: { kind: "map" },
    options: MATERIAL_OPTIONS,
    searchable: true,
    searchPlaceholder: "Search cover materials",
    placeholder: "Select cover material",
  },
  features: {
    id: "features",
    label: "Features",
    input: "select-single",
    target: { kind: "map" },
    options: [],
    searchable: true,
    searchPlaceholder: "Search features",
    placeholder: "Select feature",
  },
  sim: {
    id: "sim",
    label: "SIM",
    input: "select-single",
    target: { kind: "map" },
    options: toOptions(["Unlocked", "EE", "O2", "Vodafone", "Three", "Giffgaff", "eSIM"]),
    placeholder: "Select SIM",
  },
  condition: {
    id: "condition",
    label: "Condition",
    input: "select-single",
    target: { kind: "map" },
    options: toOptions([...SELL_QUICK_CONDITIONS]),
    placeholder: "",
  },
  measurements: {
    id: "measurements",
    label: "Measurements",
    input: "text",
    target: { kind: "map" },
    placeholder: "e.g. Chest 52cm, Length 70cm",
  },
  fit: {
    id: "fit",
    label: "Fit",
    input: "select-single",
    target: { kind: "map" },
    options: toOptions(["Regular", "Slim", "Relaxed", "Oversized", "Tailored"]),
    placeholder: "Select fit",
  },
  network: {
    id: "network",
    label: "Network",
    input: "select-single",
    target: { kind: "map" },
    options: toOptions(["Unlocked", "EE", "O2", "Vodafone", "Three", "Giffgaff"]),
    placeholder: "Select network",
  },
  doors: {
    id: "doors",
    label: "Doors",
    input: "text",
    target: { kind: "map" },
    placeholder: "e.g. 5",
    inputMode: "numeric",
  },
  seats: {
    id: "seats",
    label: "Seats",
    input: "text",
    target: { kind: "map" },
    placeholder: "e.g. 5",
    inputMode: "numeric",
  },
};

const DEFAULT_ATTRIBUTE_IDS = ["brand", "size", "colour", "material"] as const;

/** Category (top-level slug) → ordered attribute ids. Unknown → default set. */
const CATEGORY_ATTRIBUTE_IDS: Record<string, string[]> = {
  "mens-fashion": ["brand", "size", "measurements", "condition", "colour", "material", "style", "pattern", "fit", "gender", "season"],
  "womens-fashion": ["brand", "size", "measurements", "condition", "colour", "material", "style", "pattern", "fit", "gender", "season"],
  "kids-fashion": ["brand", "size", "measurements", "condition", "colour", "material", "style", "pattern", "gender", "season"],
  shoes: ["brand", "size", "colour", "material", "style", "condition"],
  sports: ["brand", "size", "colour", "material", "condition"],
  jewellery: ["brand", "material", "colour", "collection", "condition"],
  beauty: ["brand", "colour", "collection"],
  health: ["brand"],
  electronics: ["brand", "model", "colour", "storage", "display", "ram", "cpu", "gpu", "battery", "warranty", "condition"],
  computers: ["brand", "model", "processor", "cpu", "gpu", "ram", "storage", "screenSize", "display", "warranty", "condition"],
  phones: ["brand", "model", "storage", "ram", "colour", "screenSize", "display", "network", "sim", "battery", "warranty", "condition"],
  gaming: ["brand", "model", "edition", "storage", "colour", "warranty", "condition"],
  vehicles: [
    "brand",
    "model",
    "generation",
    "year",
    "bodyType",
    "fuel",
    "transmission",
    "mileage",
    "engine",
    "doors",
    "seats",
    "colour",
    "registration",
    "condition",
  ],
  autoparts: ["brand", "model", "compatibility", "colour", "material"],
  "home-garden": ["brand", "material", "colour", "dimensions"],
  diy: ["brand", "material", "colour", "dimensions"],
  tools: ["brand", "material", "colour", "dimensions"],
  pets: ["brand", "material", "colour"],
  property: ["dimensions"],
  services: [],
};

const FURNITURE_ATTRIBUTE_IDS = ["material", "width", "height", "depth", "colour"] as const;
const FURNITURE_SUBCATEGORY_SLUGS = new Set(["furniture", "home-textiles"]);
const BEDDING_SUBCATEGORY_SLUGS = new Set(["bedding", "pillows", "duvets", "mattresses"]);
const BEDDING_ATTRIBUTE_IDS = [
  "brand",
  "model",
  "material",
  "size",
  "shape",
  "firmness",
  "coverMaterial",
  "colour",
  "condition",
  "warranty",
  "features",
] as const;

function applyCategoryScopedOptions(defs: AttributeDef[], categoryPath: FlatCategoryPath | null): AttributeDef[] {
  const scoped = loadCategoryScopedTaxonomy(categoryPath);
  if (!scoped) {
    return defs.map((def) => {
      if (def.id === "condition") {
        return { ...def, options: toOptions([...SELL_QUICK_CONDITIONS]) };
      }
      if (def.id === "material") {
        return { ...def, label: "Material (recommended)" };
      }
      if (def.id === "colour") {
        return { ...def, input: "select-single" as const, label: "Colours", options: COLOUR_OPTIONS, showSwatch: true };
      }
      return def;
    });
  }

  return defs.map((def) => {
    switch (def.id) {
      case "brand":
        return {
          ...def,
          options: toOptions(scoped.brands),
          popularIds: scoped.popularBrandIds,
        };
      case "material":
      case "coverMaterial":
        return {
          ...def,
          options: toOptions(scoped.materials.length > 0 ? scoped.materials : MATERIAL_OPTIONS.map((o) => o.label)),
          label: def.id === "material" ? "Material (recommended)" : def.label,
        };
      case "colour":
        return {
          ...def,
          options: COLOUR_OPTIONS,
          showSwatch: true,
          input: "select-single" as const,
          label: "Colours",
        };
      case "size":
        return {
          ...def,
          options: toOptions([...catalogSizeOptionsForPath(categoryPath)]),
        };
      case "pattern":
        return { ...def, options: toOptions(scoped.patterns) };
      case "style":
        return { ...def, options: toOptions(scoped.styles) };
      case "features":
        return scoped.features.length > 0
          ? { ...def, options: toOptions(scoped.features), searchable: true }
          : def;
      case "storage":
        return { ...def, options: toOptions(scoped.storage) };
      case "ram":
        return { ...def, options: toOptions(scoped.ram) };
      case "warranty":
        return { ...def, options: toOptions(scoped.warrantyTypes) };
      case "condition":
        return { ...def, options: toOptions([...SELL_QUICK_CONDITIONS]) };
      case "compatibility":
        return scoped.compatibility.length > 0
          ? { ...def, input: "select-single" as const, options: toOptions(scoped.compatibility) }
          : def;
      default:
        return def;
    }
  });
}

/** Sell v1.0 — taxonomy-driven dynamic attributes only (NO UNUSED FIELDS). */
export function getQuickSellAttributeDefs(categoryPath: FlatCategoryPath | null): AttributeDef[] {
  if (!categoryPath) return [];

  const requiresSize = catalogPathRequiresSize(categoryPath);
  const catalogIds = resolveSellAttributeIdsFromCatalog(categoryPath);
  const aaIds = resolveAaQuickSellAttributeIds(categoryPath);

  // Prefer Catalog Master product-type attributes; fall back to AA map.
  const baseIds = catalogIds.length > 0 ? catalogIds : aaIds;
  const ids = baseIds.filter((id) => {
    if (id === "size") return requiresSize;
    return true;
  });

  if (requiresSize && !ids.includes("size")) {
    const brandIdx = ids.indexOf("brand");
    const conditionIdx = ids.indexOf("condition");
    const insertAt =
      brandIdx >= 0 ? brandIdx + 1 : conditionIdx >= 0 ? conditionIdx + 1 : ids.length;
    ids.splice(insertAt, 0, "size");
  }

  const defs = ids
    .map((id) => ATTRIBUTE_DEFS[id])
    .filter((def): def is AttributeDef => Boolean(def))
    .map((def) =>
      OPTIONAL_SELL_ATTRIBUTE_IDS.has(def.id) ? { ...def, required: false } : def,
    );

  return applyCategoryScopedOptions(defs, categoryPath);
}

export function getAttributeDefsForCategory(categoryPath: FlatCategoryPath | null): AttributeDef[] {
  const slug = categoryPath?.categorySlug;
  const subSlug = categoryPath?.subcategorySlug;
  const childSlug = categoryPath?.childCategorySlug;

  let defs: AttributeDef[];

  if (slug === "home-garden" && (subSlug && BEDDING_SUBCATEGORY_SLUGS.has(subSlug) || childSlug && BEDDING_SUBCATEGORY_SLUGS.has(childSlug))) {
    defs = BEDDING_ATTRIBUTE_IDS.map((id) => ATTRIBUTE_DEFS[id]).filter(
      (def): def is AttributeDef => Boolean(def),
    );
  } else if (slug === "home-garden" && subSlug && FURNITURE_SUBCATEGORY_SLUGS.has(subSlug)) {
    defs = FURNITURE_ATTRIBUTE_IDS.map((id) => ATTRIBUTE_DEFS[id]).filter(
      (def): def is AttributeDef => Boolean(def),
    );
  } else {
    const ids = (slug && CATEGORY_ATTRIBUTE_IDS[slug]) || [...DEFAULT_ATTRIBUTE_IDS];
    defs = ids
      .map((id) => ATTRIBUTE_DEFS[id])
      .filter((def): def is AttributeDef => Boolean(def))
      .map((def) =>
        def.id === "condition"
          ? { ...def, options: conditionOptionsForCategorySlug(slug) }
          : def,
      );
  }

  return applyCategoryScopedOptions(defs, categoryPath);
}

/** Read an attribute's current value from the draft (field, condition, or generic map). */
export function readAttributeValue(draft: SellListingDraft, def: AttributeDef): string {
  if (def.id === "condition") return draft.condition ?? "";
  if (def.target.kind === "field") return draft[def.target.field] ?? "";
  return draft.attributes?.[def.id] ?? "";
}

/** True when an attribute has a non-empty value. */
export function isAttributeCompleted(draft: SellListingDraft, def: AttributeDef): boolean {
  return readAttributeValue(draft, def).trim().length > 0;
}

/** Optional attrs never block Publish / progressive completeness. */
export function isAttributeRequiredForPublish(def: AttributeDef): boolean {
  if (def.required === false) return false;
  return isSellAttributeRequired(def.id);
}

/** Count completed attributes for the draft's current category. */
export function countCompletedAttributes(draft: SellListingDraft): number {
  return getAttributeDefsForCategory(draft.categoryPath).reduce(
    (total, def) => (isAttributeCompleted(draft, def) ? total + 1 : total),
    0,
  );
}

/**
 * Build the description suffix for generic (map-target) attributes, e.g.
 * " Style: Casual. Model: iPhone 13." Only non-empty values are included.
 */
export function formatAttributeNote(attributes: Record<string, string> | undefined): string {
  if (!attributes) return "";
  return Object.entries(attributes)
    .map(([id, value]) => {
      const trimmed = value?.trim();
      if (!trimmed) return "";
      const label = ATTRIBUTE_DEFS[id]?.label ?? id;
      return ` ${label}: ${trimmed}.`;
    })
    .join("");
}
