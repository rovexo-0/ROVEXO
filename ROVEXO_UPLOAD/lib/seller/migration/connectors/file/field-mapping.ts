import type { MigrationImportMethodId, MigrationPlatformId } from "@/lib/seller/migration/types";
import type { MigrationRawListing } from "@/lib/seller/migration/engine/types";

export type FileFieldKey =
  | "title"
  | "description"
  | "brand"
  | "category"
  | "price"
  | "salePrice"
  | "stock"
  | "quantity"
  | "sku"
  | "internalSku"
  | "mpn"
  | "oem"
  | "oe"
  | "ean"
  | "gtin"
  | "barcode"
  | "condition"
  | "images"
  | "gallery"
  | "attributes"
  | "weight"
  | "dimensions"
  | "variants"
  | "currency"
  | "model";

export type FileColumnMapping = Partial<Record<FileFieldKey, string>>;

const FIELD_ALIASES: Record<FileFieldKey, string[]> = {
  title: ["title", "name", "product_name", "listing_title", "item_name"],
  description: ["description", "body", "details", "product_description", "long_description"],
  brand: ["brand", "manufacturer", "make", "vendor"],
  category: ["category", "product_type", "type", "product_category", "categories"],
  price: ["price", "amount", "listing_price", "regular_price"],
  salePrice: ["sale_price", "special_price", "discount_price"],
  stock: ["stock", "inventory", "stock_quantity"],
  quantity: ["quantity", "qty", "stock", "inventory", "stock_quantity"],
  sku: ["sku", "product_sku", "item_sku", "stock_code"],
  internalSku: ["internal_sku", "internal_code", "seller_sku"],
  mpn: ["mpn", "manufacturer_part_number", "part_number"],
  oem: ["oem", "oem_number", "oem_part_number"],
  oe: ["oe", "oe_number"],
  ean: ["ean", "ean13"],
  gtin: ["gtin", "upc", "isbn"],
  barcode: ["barcode", "bar_code", "upc", "ean"],
  condition: ["condition", "item_condition", "product_condition"],
  images: ["image", "image_url", "images", "photo", "picture", "image_link"],
  gallery: ["gallery", "image_urls", "images", "photos", "media"],
  attributes: ["attributes", "specs", "specifications", "custom_attributes"],
  weight: ["weight", "item_weight", "product_weight"],
  dimensions: ["dimensions", "size_dimensions", "product_dimensions"],
  variants: ["variants", "variant", "variation", "options"],
  currency: ["currency", "currency_code"],
  model: ["model", "model_number", "model_name"],
};

export function normalizeFieldHeader(header: string): string {
  return header.replace(/^"|"$/g, "").trim().toLowerCase().replace(/\s+/g, "_");
}

export function detectFileColumnMapping(headers: string[]): FileColumnMapping {
  const normalized = headers.map(normalizeFieldHeader);
  const mapping: FileColumnMapping = {};

  for (const [field, aliases] of Object.entries(FIELD_ALIASES) as [FileFieldKey, string[]][]) {
    const match = normalized.find((header) => aliases.includes(header));
    if (match) mapping[field] = match;
  }

  return mapping;
}

export function mergeFileColumnMapping(
  detected: FileColumnMapping,
  saved?: FileColumnMapping | null,
): FileColumnMapping {
  return { ...detected, ...(saved ?? {}) };
}

export function pickMappedField(
  row: Record<string, string>,
  mapping: FileColumnMapping,
  field: FileFieldKey,
): string | undefined {
  const column = mapping[field];
  if (column) {
    const value = row[column];
    if (value?.trim()) return value.trim();
  }

  for (const alias of FIELD_ALIASES[field]) {
    const value = row[alias];
    if (value?.trim()) return value.trim();
  }

  return undefined;
}

export function listFileMappingFields(): FileFieldKey[] {
  return Object.keys(FIELD_ALIASES) as FileFieldKey[];
}

function normalizeCondition(value: string | undefined): string {
  if (!value) return "used";
  const normalized = value.toLowerCase().replace(/\s+/g, "_");
  if (normalized.includes("new")) return "new";
  if (normalized.includes("like")) return "like_new";
  if (normalized.includes("refurb")) return "refurbished";
  if (normalized.includes("fair")) return "fair";
  if (normalized.includes("part")) return "for_parts";
  if (normalized.includes("good")) return "good";
  return "used";
}

function parseImageUrls(row: Record<string, string>, mapping: FileColumnMapping): string[] {
  const gallery = pickMappedField(row, mapping, "gallery");
  const images = pickMappedField(row, mapping, "images");
  const source = gallery ?? images;
  if (!source) return [];
  return source
    .split(/[|;,\n]/)
    .map((url) => url.trim())
    .filter((url) => url.startsWith("http"));
}

export function rowToListing(
  row: Record<string, string>,
  platform: MigrationPlatformId,
  importMethod: MigrationImportMethodId,
  index: number,
  mapping?: FileColumnMapping,
): MigrationRawListing {
  const resolvedMapping = mapping ?? detectFileColumnMapping(Object.keys(row));
  const title = pickMappedField(row, resolvedMapping, "title") ?? `Imported item ${index + 1}`;
  const priceRaw =
    pickMappedField(row, resolvedMapping, "salePrice") ??
    pickMappedField(row, resolvedMapping, "price") ??
    "0";
  const price = Number.parseFloat(priceRaw.replace(/[^0-9.]/g, "")) || 0;
  const gtin = pickMappedField(row, resolvedMapping, "gtin");
  const barcode = pickMappedField(row, resolvedMapping, "barcode");
  const ean = pickMappedField(row, resolvedMapping, "ean") ?? gtin ?? barcode;

  const attributes: Record<string, string | number | boolean> = {
    source: platform,
    method: importMethod,
    row: row._row ?? String(index),
  };

  const optionalFields: [FileFieldKey, string][] = [
    ["oem", "oem"],
    ["mpn", "mpn"],
    ["oe", "oe"],
    ["internalSku", "internalSku"],
    ["weight", "weight"],
    ["dimensions", "dimensions"],
    ["variants", "variants"],
    ["attributes", "attributes"],
  ];

  for (const [field, key] of optionalFields) {
    const value = pickMappedField(row, resolvedMapping, field);
    if (value) attributes[key] = value;
  }
  if (gtin) attributes.gtin = gtin;
  if (barcode) attributes.barcode = barcode;

  return {
    externalId:
      pickMappedField(row, resolvedMapping, "sku") ??
      pickMappedField(row, resolvedMapping, "internalSku") ??
      `import-${index}`,
    title,
    description:
      pickMappedField(row, resolvedMapping, "description") ??
      `Imported via ${platform}.`,
    brand: pickMappedField(row, resolvedMapping, "brand"),
    model: pickMappedField(row, resolvedMapping, "model"),
    condition: normalizeCondition(pickMappedField(row, resolvedMapping, "condition")),
    price,
    currency: pickMappedField(row, resolvedMapping, "currency") ?? "GBP",
    sku: pickMappedField(row, resolvedMapping, "sku"),
    ean,
    upc: barcode ?? gtin,
    quantity:
      Number.parseInt(
        pickMappedField(row, resolvedMapping, "quantity") ??
          pickMappedField(row, resolvedMapping, "stock") ??
          "1",
        10,
      ) || 1,
    sourceCategory: pickMappedField(row, resolvedMapping, "category"),
    imageUrls: parseImageUrls(row, resolvedMapping),
    attributes,
  };
}
