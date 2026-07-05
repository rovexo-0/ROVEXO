/**
 * ROVEXO Sell — Smart Attribute Engine.
 *
 * Category-aware definition of the optional listing attributes. Each attribute
 * either targets an existing listing column (Brand/Colour/Size/Material) or a
 * generic client-side `draft.attributes` map that is folded into the listing
 * description on publish. Nothing here changes the DB schema, API contract or
 * validation flow — it is purely a UI + serialisation layer.
 */

import type { SelectionOption } from "@/features/sell/components/SelectionScreen";
import type { FlatCategoryPath } from "@/lib/categories/types";
import type { SellListingDraft } from "@/features/sell/types";
import {
  BRAND_OPTIONS,
  BRAND_POPULAR_IDS,
  COLOUR_OPTIONS,
  MATERIAL_OPTIONS,
  SIZE_OPTIONS,
} from "@/lib/sell/attribute-options";
import { MARKETPLACE_CONDITIONS_BY_VERTICAL } from "@/lib/categories/enterprise/conditions";

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
};

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
  "Expired",
]);

const ELECTRONICS_SLUGS = new Set(["electronics", "phones", "computers", "gaming", "tv-audio"]);

function conditionOptionsForCategorySlug(slug: string | undefined): SelectionOption[] {
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
    label: "Colour",
    input: "select-multi",
    target: { kind: "field", field: "color" },
    options: COLOUR_OPTIONS,
    showSwatch: true,
    placeholder: "Select colours",
  },
  material: {
    id: "material",
    label: "Material",
    input: "select-multi",
    target: { kind: "field", field: "material" },
    options: MATERIAL_OPTIONS,
    searchable: true,
    searchPlaceholder: "Search materials",
    placeholder: "Select materials",
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
    placeholder: "Select season",
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
    label: "Battery",
    input: "text",
    target: { kind: "map" },
    placeholder: "e.g. 5000 mAh",
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
    placeholder: "Select RAM",
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
  dimensions: {
    id: "dimensions",
    label: "Dimensions",
    input: "text",
    target: { kind: "map" },
    placeholder: "e.g. 120 x 60 x 45 cm",
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
  condition: {
    id: "condition",
    label: "Condition",
    input: "select-single",
    target: { kind: "map" },
    options: toOptions([...MARKETPLACE_CONDITIONS_BY_VERTICAL.default]),
    placeholder: "Select condition",
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
  "mens-fashion": ["brand", "size", "colour", "material", "condition", "style", "pattern", "fit", "gender", "season"],
  "womens-fashion": ["brand", "size", "colour", "material", "condition", "style", "pattern", "fit", "gender", "season"],
  "kids-fashion": ["brand", "size", "colour", "material", "condition", "style", "pattern", "gender", "season"],
  shoes: ["brand", "size", "colour", "material", "style", "condition"],
  sports: ["brand", "size", "colour", "material", "condition"],
  jewellery: ["brand", "material", "colour", "collection", "condition"],
  beauty: ["brand", "colour", "collection"],
  health: ["brand"],
  electronics: ["brand", "model", "colour", "storage", "display", "ram", "cpu", "gpu", "battery", "warranty", "condition"],
  computers: ["brand", "model", "processor", "cpu", "gpu", "ram", "storage", "screenSize", "display", "warranty", "condition"],
  phones: ["brand", "model", "storage", "ram", "colour", "screenSize", "display", "network", "battery", "warranty", "condition"],
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

export function getAttributeDefsForCategory(categoryPath: FlatCategoryPath | null): AttributeDef[] {
  const slug = categoryPath?.categorySlug;
  const subSlug = categoryPath?.subcategorySlug;

  if (slug === "home-garden" && subSlug && FURNITURE_SUBCATEGORY_SLUGS.has(subSlug)) {
    return FURNITURE_ATTRIBUTE_IDS.map((id) => ATTRIBUTE_DEFS[id]).filter(
      (def): def is AttributeDef => Boolean(def),
    );
  }

  const ids = (slug && CATEGORY_ATTRIBUTE_IDS[slug]) || [...DEFAULT_ATTRIBUTE_IDS];
  return ids
    .map((id) => ATTRIBUTE_DEFS[id])
    .filter((def): def is AttributeDef => Boolean(def))
    .map((def) =>
      def.id === "condition"
        ? { ...def, options: conditionOptionsForCategorySlug(slug) }
        : def,
    );
}

/** Read an attribute's current value from the draft (field or generic map). */
export function readAttributeValue(draft: SellListingDraft, def: AttributeDef): string {
  if (def.target.kind === "field") return draft[def.target.field] ?? "";
  return draft.attributes?.[def.id] ?? "";
}

/** True when an attribute has a non-empty value. */
export function isAttributeCompleted(draft: SellListingDraft, def: AttributeDef): boolean {
  return readAttributeValue(draft, def).trim().length > 0;
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
