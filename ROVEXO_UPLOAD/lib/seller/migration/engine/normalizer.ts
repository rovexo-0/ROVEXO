import { buildListingFingerprint } from "@/lib/seller/migration/duplicate/fingerprint";
import type { MigrationNormalizedListing, MigrationRawListing } from "@/lib/seller/migration/engine/types";

const MAX_TITLE = 200;
const MAX_DESCRIPTION = 5000;

function sanitizeText(value: string | undefined, max: number): string {
  if (!value) return "";
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .trim()
    .slice(0, max);
}

function sanitizePrice(price: number): number {
  if (!Number.isFinite(price) || price < 0) return 0;
  return Math.round(price * 100) / 100;
}

export function normalizeListing(raw: MigrationRawListing): MigrationNormalizedListing {
  const title = sanitizeText(raw.title, MAX_TITLE);
  const description = sanitizeText(raw.description, MAX_DESCRIPTION);
  const normalized: MigrationRawListing = {
    ...raw,
    title: title || "Imported listing",
    description,
    brand: sanitizeText(raw.brand, 120) || undefined,
    model: sanitizeText(raw.model, 120) || undefined,
    variant: sanitizeText(raw.variant, 120) || undefined,
    condition: sanitizeText(raw.condition, 60) || "used",
    price: sanitizePrice(raw.price),
    currency: (raw.currency ?? "GBP").toUpperCase().slice(0, 3),
    colour: sanitizeText(raw.colour, 60) || undefined,
    size: sanitizeText(raw.size, 60) || undefined,
    storage: sanitizeText(raw.storage, 60) || undefined,
    capacity: sanitizeText(raw.capacity, 60) || undefined,
    sku: sanitizeText(raw.sku, 80) || undefined,
    ean: sanitizeText(raw.ean, 32) || undefined,
    upc: sanitizeText(raw.upc, 32) || undefined,
    quantity: raw.quantity != null ? Math.max(0, Math.floor(raw.quantity)) : 1,
    sourceCategory: sanitizeText(raw.sourceCategory, 200) || undefined,
    imageUrls: (raw.imageUrls ?? [])
      .map((url) => url.trim())
      .filter((url) => url.startsWith("http"))
      .slice(0, 8),
    attributes: raw.attributes,
  };

  const warnings: string[] = [];
  if (!normalized.imageUrls?.length) warnings.push("No images found");
  if (normalized.price <= 0) warnings.push("Price missing or zero");

  return {
    ...normalized,
    fingerprint: buildListingFingerprint(normalized),
    processedImages: [],
    warnings,
  };
}
