/**
 * ROVEXO Catalog Master — Essential attributes (3–6 max per product type).
 * Keep publishing fast — no deep technical dumps.
 */

export type CatalogAttributeKey =
  | "brand"
  | "model"
  | "material"
  | "colour"
  | "condition"
  | "size"
  | "storage"
  | "ram"
  | "type"
  | "vehicleMake"
  | "vehicleModel"
  | "gender"
  | "ageGroup"
  | "temperatureRating"
  | "seasonRating"
  | "length"
  | "weight"
  | "dimensions";

export type CatalogAttributeDef = {
  key: CatalogAttributeKey;
  label: string;
  /** Option source key when not free-text. */
  options?:
    | "colours"
    | "conditions"
    | "conditionsElectronics"
    | "conditionsParts"
    | "brands"
    | "materials"
    | "clothingSizes"
    | "shoeSizes"
    | "kidsSizes"
    | "ringSizes"
    | "storage"
    | "ram"
    | "gender"
    | "ageGroup"
    | "pillowType"
    | "vehicleMake";
};

/** Shared building blocks. */
export const ATTR = {
  brand: { key: "brand", label: "Brand", options: "brands" },
  model: { key: "model", label: "Model" },
  material: { key: "material", label: "Material", options: "materials" },
  colour: { key: "colour", label: "Colour", options: "colours" },
  condition: { key: "condition", label: "Condition", options: "conditions" },
  conditionElectronics: {
    key: "condition",
    label: "Condition",
    options: "conditionsElectronics",
  },
  conditionParts: {
    key: "condition",
    label: "Condition",
    options: "conditionsParts",
  },
  size: { key: "size", label: "Size", options: "clothingSizes" },
  shoeSize: { key: "size", label: "UK Size", options: "shoeSizes" },
  kidsSize: { key: "size", label: "Size", options: "kidsSizes" },
  ringSize: { key: "size", label: "Size", options: "ringSizes" },
  storage: { key: "storage", label: "Storage", options: "storage" },
  ram: { key: "ram", label: "RAM", options: "ram" },
  type: { key: "type", label: "Type" },
  pillowType: { key: "type", label: "Type", options: "pillowType" },
  vehicleMake: {
    key: "vehicleMake",
    label: "Vehicle Make",
    options: "vehicleMake",
  },
  vehicleModel: {
    key: "vehicleModel",
    label: "Vehicle Model",
  },
  gender: { key: "gender", label: "Gender", options: "gender" },
  ageGroup: { key: "ageGroup", label: "Age", options: "ageGroup" },
  temperatureRating: { key: "temperatureRating", label: "Temperature Rating" },
  seasonRating: { key: "seasonRating", label: "Season" },
  length: { key: "length", label: "Length" },
  weight: { key: "weight", label: "Weight" },
  dimensions: { key: "dimensions", label: "Dimensions" },
} as const satisfies Record<string, CatalogAttributeDef>;

/** Presets used by product types. */
export const ATTR_PRESETS = {
  fashion: [ATTR.brand, ATTR.size, ATTR.colour, ATTR.condition, ATTR.material],
  shoes: [ATTR.brand, ATTR.shoeSize, ATTR.colour, ATTR.condition],
  kidsFashion: [ATTR.brand, ATTR.kidsSize, ATTR.colour, ATTR.condition],
  phone: [
    ATTR.brand,
    ATTR.model,
    ATTR.storage,
    ATTR.colour,
    ATTR.conditionElectronics,
  ],
  laptop: [
    ATTR.brand,
    ATTR.model,
    ATTR.ram,
    ATTR.storage,
    ATTR.conditionElectronics,
  ],
  electronics: [
    ATTR.brand,
    ATTR.model,
    ATTR.colour,
    ATTR.conditionElectronics,
  ],
  pillow: [
    ATTR.brand,
    ATTR.pillowType,
    ATTR.material,
    ATTR.colour,
    ATTR.condition,
  ],
  homeSoft: [ATTR.brand, ATTR.material, ATTR.colour, ATTR.condition],
  homeHard: [ATTR.brand, ATTR.material, ATTR.colour, ATTR.condition],
  furniture: [ATTR.brand, ATTR.dimensions, ATTR.material, ATTR.colour, ATTR.condition],
  jewellery: [ATTR.brand, ATTR.material, ATTR.colour, ATTR.condition],
  jewellerySized: [
    ATTR.brand,
    ATTR.ringSize,
    ATTR.material,
    ATTR.colour,
    ATTR.condition,
  ],
  collectible: [ATTR.brand, ATTR.condition, ATTR.colour],
  book: [ATTR.brand, ATTR.condition, ATTR.colour],
  toy: [ATTR.brand, ATTR.ageGroup, ATTR.condition, ATTR.colour],
  sports: [ATTR.brand, ATTR.size, ATTR.colour, ATTR.condition],
  campingSleepingBag: [
    ATTR.brand,
    ATTR.temperatureRating,
    ATTR.seasonRating,
    ATTR.length,
    ATTR.weight,
    ATTR.condition,
  ],
  campingTent: [ATTR.brand, ATTR.condition, ATTR.colour, ATTR.material],
  campingGear: [ATTR.brand, ATTR.condition, ATTR.colour],
  /** Law XXX: Brand · Vehicle Make · Vehicle Model · Condition */
  vehicleParts: [
    ATTR.brand,
    ATTR.vehicleMake,
    ATTR.vehicleModel,
    ATTR.conditionParts,
  ],
  beauty: [ATTR.brand, ATTR.type, ATTR.condition],
  generic: [ATTR.brand, ATTR.colour, ATTR.condition],
} as const satisfies Record<string, readonly CatalogAttributeDef[]>;

export type AttrPresetKey = keyof typeof ATTR_PRESETS;

export const CATALOG_GENDER_OPTIONS = ["Women", "Men", "Unisex", "Kids"] as const;
export const CATALOG_AGE_GROUP_OPTIONS = [
  "0–12 months",
  "1–3 years",
  "3–5 years",
  "5–8 years",
  "8–12 years",
  "12+",
] as const;
export const CATALOG_PILLOW_TYPES = [
  "Standard",
  "Orthopaedic",
  "Memory foam",
  "Feather",
  "Travel",
  "Decorative",
] as const;
export const CATALOG_VEHICLE_MAKES = [
  "Audi",
  "BMW",
  "Ford",
  "Honda",
  "Hyundai",
  "Mercedes-Benz",
  "Nissan",
  "Peugeot",
  "Toyota",
  "Vauxhall",
  "Volkswagen",
  "Volvo",
  "Other",
] as const;
