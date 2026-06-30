import { createHash } from "node:crypto";
import type { MigrationRawListing } from "@/lib/seller/migration/engine/types";

const FINGERPRINT_FIELDS: (keyof MigrationRawListing)[] = [
  "brand",
  "model",
  "variant",
  "title",
  "condition",
  "price",
  "currency",
  "colour",
  "size",
  "storage",
  "capacity",
  "sku",
  "ean",
  "upc",
  "quantity",
  "sourceCategory",
];

function normalizeValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number") return String(value);
  return String(value).trim().toLowerCase();
}

export function buildListingFingerprint(listing: MigrationRawListing): string {
  const parts = FINGERPRINT_FIELDS.map((field) => normalizeValue(listing[field]));
  const imageSig = (listing.imageUrls ?? [])
    .map((url) => url.trim().toLowerCase())
    .sort()
    .join("|");
  const attrSig = Object.entries(listing.attributes ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${normalizeValue(value)}`)
    .join("|");

  const payload = [...parts, imageSig, attrSig].join("::");
  return createHash("sha256").update(payload).digest("hex");
}

export function compareListingSimilarity(
  a: MigrationRawListing,
  b: MigrationRawListing,
): number {
  const fields: (keyof MigrationRawListing)[] = [
    "brand",
    "model",
    "variant",
    "title",
    "condition",
    "price",
    "currency",
    "colour",
    "size",
    "storage",
    "capacity",
    "sku",
    "ean",
    "upc",
    "quantity",
    "sourceCategory",
  ];

  let matches = 0;
  let compared = 0;
  for (const field of fields) {
    const av = normalizeValue(a[field]);
    const bv = normalizeValue(b[field]);
    if (!av && !bv) continue;
    compared += 1;
    if (av === bv) matches += 1;
  }

  const aImages = new Set((a.imageUrls ?? []).map((u) => u.toLowerCase()));
  const bImages = new Set((b.imageUrls ?? []).map((u) => u.toLowerCase()));
  if (aImages.size > 0 || bImages.size > 0) {
    compared += 1;
    const overlap = [...aImages].filter((u) => bImages.has(u)).length;
    const union = new Set([...aImages, ...bImages]).size;
    if (union > 0 && overlap / union >= 0.8) matches += 1;
  }

  if (compared === 0) return 0;
  return matches / compared;
}

export function isDuplicateListing(similarity: number): boolean {
  return similarity >= 0.92;
}
