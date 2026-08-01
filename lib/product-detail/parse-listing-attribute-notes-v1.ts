/**
 * Parse Sell publish attribute notes from a listing description.
 * Format: ` Label: value.` (see formatAttributeNote / buildPublishDescription).
 *
 * Only Owner Product Information fields are extracted.
 * Structured DB columns always win over parsed notes when both exist.
 */

import {
  PRODUCT_INFORMATION_NOTE_LABEL_ALIASES_V1,
  type ProductInformationFieldId,
} from "@/lib/product-detail/product-information-field-map-v1";

export type ParsedListingAttributesV1 = Partial<
  Record<Exclude<ProductInformationFieldId, "category" | "brand" | "condition" | "uploaded">, string>
>;

const NOTE_LABELS = Object.keys(PRODUCT_INFORMATION_NOTE_LABEL_ALIASES_V1).sort(
  (a, b) => b.length - a.length,
);

const NOTE_PATTERN = new RegExp(
  `(?:^|[\\s.])(${NOTE_LABELS.map(escapeRegExp).join("|")}):\\s*([^.\\n]+)\\.`,
  "gi",
);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeValue(raw: string): string | null {
  const trimmed = raw.replace(/\s+/g, " ").trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Extract populated specification values from description attribute notes.
 */
export function parseListingAttributeNotesV1(description: string | null | undefined): ParsedListingAttributesV1 {
  const text = description?.trim();
  if (!text) return {};

  const out: ParsedListingAttributesV1 = {};
  NOTE_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = NOTE_PATTERN.exec(text)) !== null) {
    const label = match[1]?.trim();
    const value = normalizeValue(match[2] ?? "");
    if (!label || !value) continue;
    const fieldId = PRODUCT_INFORMATION_NOTE_LABEL_ALIASES_V1[label];
    if (!fieldId || fieldId === "category" || fieldId === "brand" || fieldId === "condition" || fieldId === "uploaded") {
      continue;
    }
    // First match wins; do not overwrite with later weaker duplicates.
    if (!out[fieldId]) {
      out[fieldId] = value;
    }
  }
  return out;
}

/**
 * Prefer structured product fields; fill gaps from parsed description notes.
 */
export function resolveProductInformationValuesV1(input: {
  colour?: string | null;
  material?: string | null;
  size?: string | null;
  storage?: string | null;
  network?: string | null;
  season?: string | null;
  compatibility?: string | null;
  description?: string | null;
}): ParsedListingAttributesV1 {
  const notes = parseListingAttributeNotesV1(input.description);
  const pick = (structured: string | null | undefined, fromNotes: string | undefined) => {
    const direct = structured?.trim();
    if (direct) return direct;
    return fromNotes?.trim() || undefined;
  };

  const resolved: ParsedListingAttributesV1 = {};
  const material = pick(input.material, notes.material);
  const colour = pick(input.colour, notes.colour);
  const size = pick(input.size, notes.size);
  const storage = pick(input.storage, notes.storage);
  const network = pick(input.network, notes.network);
  const season = pick(input.season, notes.season);
  const compatibility = pick(input.compatibility, notes.compatibility);

  if (material) resolved.material = material;
  if (colour) resolved.colour = colour;
  if (size) resolved.size = size;
  if (storage) resolved.storage = storage;
  if (network) resolved.network = network;
  if (season) resolved.season = season;
  if (compatibility) resolved.compatibility = compatibility;
  return resolved;
}
