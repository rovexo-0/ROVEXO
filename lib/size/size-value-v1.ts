/**
 * Size Engine v1.0 — value encode / decode / validate / View Item display.
 */

import {
  SIZE_ENGINE_CLOTHING_ROWS,
  SIZE_ENGINE_FOOTWEAR_ROWS,
  SIZE_ENGINE_KIDS_ROWS,
  SIZE_ENGINE_RING_ROWS,
  SIZE_ENGINE_V1,
  type SizeEngineKind,
  type SizeSelectionV1,
} from "@/lib/size/size-engine-v1";

const CUSTOM_PREFIX = "custom:";

export function trimCustomSizeInput(raw: string): string {
  return raw.trim();
}

export function validateCustomSizeInput(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const value = trimCustomSizeInput(raw);
  if (!value) {
    return { ok: false, error: "Enter a custom size." };
  }
  if (value.length > SIZE_ENGINE_V1.customMaxLength) {
    return { ok: false, error: `Maximum ${SIZE_ENGINE_V1.customMaxLength} characters.` };
  }
  return { ok: true, value };
}

/** Sell / View Item clothing: `XL (UK 12 • EU 40)`. */
export function clothingDisplayLabel(row: { id: string; secondary: string }): string {
  return `${row.id} (${row.secondary})`;
}

/** Sell / View Item footwear: `UK 5 (EU 38)`. */
export function footwearDisplayLabel(row: { id: string; eu: string }): string {
  return `${row.id} (EU ${row.eu})`;
}

export function selectionFromClothingId(id: string): SizeSelectionV1 | null {
  const row = SIZE_ENGINE_CLOTHING_ROWS.find((item) => item.id === id);
  if (!row) return null;
  return {
    size_type: "standard",
    size_value: row.id,
    eu_size: row.eu,
    display: clothingDisplayLabel(row),
  };
}

export function selectionFromFootwearId(id: string): SizeSelectionV1 | null {
  const row = SIZE_ENGINE_FOOTWEAR_ROWS.find((item) => item.id === id || item.uk === id.replace(/^UK\s+/i, ""));
  if (!row) return null;
  return {
    size_type: "standard",
    size_value: row.id,
    eu_size: row.eu,
    display: footwearDisplayLabel(row),
  };
}

export function selectionFromSimpleId(
  id: string,
  rows: readonly { id: string; label: string }[],
): SizeSelectionV1 | null {
  const row = rows.find((item) => item.id === id || item.label === id);
  if (!row) return null;
  return {
    size_type: "standard",
    size_value: row.id,
    eu_size: null,
    display: row.label,
  };
}

export function selectionFromCustom(raw: string): SizeSelectionV1 | { error: string } {
  const validated = validateCustomSizeInput(raw);
  if (!validated.ok) return { error: validated.error };
  return {
    size_type: "custom",
    size_value: validated.value,
    eu_size: null,
    display: validated.value,
  };
}

/** Persist into products.size / draft.size (single text column). */
export function encodeSizeForStorage(selection: SizeSelectionV1): string {
  if (selection.size_type === "custom") {
    return `${CUSTOM_PREFIX}${selection.size_value}`;
  }
  return selection.display;
}

/** Parse stored listing size back into structured selection. */
export function parseStoredSize(raw: string | null | undefined): SizeSelectionV1 | null {
  const value = raw?.trim();
  if (!value) return null;

  if (value.toLowerCase().startsWith(CUSTOM_PREFIX)) {
    const custom = value.slice(CUSTOM_PREFIX.length);
    if (!custom) return null;
    return {
      size_type: "custom",
      size_value: custom,
      eu_size: null,
      display: custom,
    };
  }

  const clothing = SIZE_ENGINE_CLOTHING_ROWS.find(
    (row) =>
      value === row.id ||
      value === row.secondary ||
      value === clothingDisplayLabel(row) ||
      value === `${row.id} • ${row.secondary}` ||
      value.startsWith(`${row.id} •`) ||
      value.startsWith(`${row.id} (`),
  );
  if (clothing) {
    return {
      size_type: "standard",
      size_value: clothing.id,
      eu_size: clothing.eu,
      display: clothingDisplayLabel(clothing),
    };
  }

  const footwear = SIZE_ENGINE_FOOTWEAR_ROWS.find(
    (row) =>
      value === row.id ||
      value === row.secondary ||
      value === footwearDisplayLabel(row) ||
      value === `UK ${row.uk}`,
  );
  if (footwear) {
    return {
      size_type: "standard",
      size_value: footwear.id,
      eu_size: footwear.eu,
      display: footwearDisplayLabel(footwear),
    };
  }

  const kids = SIZE_ENGINE_KIDS_ROWS.find((row) => value === row.id || value === row.label);
  if (kids) {
    return { size_type: "standard", size_value: kids.id, eu_size: null, display: kids.label };
  }

  const ring = SIZE_ENGINE_RING_ROWS.find((row) => value === row.id || value === row.label);
  if (ring) {
    return { size_type: "standard", size_value: ring.id, eu_size: null, display: ring.label };
  }

  // Legacy catalog shoe bare number "5"
  if (/^\d{1,2}$/.test(value)) {
    const fromBare = selectionFromFootwearId(`UK ${value}`);
    if (fromBare) return fromBare;
  }

  // Legacy catalog 3XL / 4XL / One size — treat as display-as-is standard
  return {
    size_type: "standard",
    size_value: value,
    eu_size: null,
    display: value,
  };
}

/** View Item / Search keyword display — never discard. */
export function formatSizeForViewItem(raw: string | null | undefined): string | null {
  const parsed = parseStoredSize(raw);
  if (!parsed) return null;
  return parsed.display;
}

export function isCustomStoredSize(raw: string | null | undefined): boolean {
  return parseStoredSize(raw)?.size_type === "custom";
}

export function standardRowsForKind(kind: SizeEngineKind): readonly { id: string; label: string; secondary?: string }[] {
  switch (kind) {
    case "clothing":
      return SIZE_ENGINE_CLOTHING_ROWS.map((row) => ({
        id: row.id,
        label: row.label,
        secondary: row.secondary,
      }));
    case "footwear":
      return SIZE_ENGINE_FOOTWEAR_ROWS.map((row) => ({
        id: row.id,
        label: row.label,
        secondary: row.secondary,
      }));
    case "kids":
      return SIZE_ENGINE_KIDS_ROWS;
    case "rings":
      return SIZE_ENGINE_RING_ROWS;
    default:
      return [];
  }
}

export function buildStandardSelection(kind: SizeEngineKind, id: string): SizeSelectionV1 | null {
  switch (kind) {
    case "clothing":
      return selectionFromClothingId(id);
    case "footwear":
      return selectionFromFootwearId(id);
    case "kids":
      return selectionFromSimpleId(id, SIZE_ENGINE_KIDS_ROWS);
    case "rings":
      return selectionFromSimpleId(id, SIZE_ENGINE_RING_ROWS);
    default:
      return null;
  }
}
