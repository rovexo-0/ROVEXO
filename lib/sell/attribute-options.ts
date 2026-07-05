/**
 * ROVEXO Sell — listing attribute option sets.
 *
 * Static, UI-only option catalogues consumed by the Universal Selection Engine.
 * Values are stored on the existing draft string fields (single = the value;
 * multiple = comma-joined), so nothing here changes the draft, publish,
 * validation or backend contract.
 *
 * Brand, colour, size and material lists are sourced from the enterprise
 * taxonomy databases — single source of truth with filters and Super Admin.
 */

import type { SelectionOption } from "@/features/sell/components/SelectionScreen";
import {
  MARKETPLACE_BRANDS,
  POPULAR_BRAND_IDS,
} from "@/lib/categories/enterprise/brands";
import { MARKETPLACE_COLOURS } from "@/lib/categories/enterprise/colours";
import { MARKETPLACE_DEFAULT_SIZES } from "@/lib/categories/enterprise/sizes";
import { MARKETPLACE_MATERIALS } from "@/lib/categories/enterprise/materials";

/** Serialise a multi-select back onto an existing comma-joined string field. */
export function attributeArrayToString(values: readonly string[]): string {
  return values.join(", ");
}

/** Parse an existing comma-joined string field into selected ids. */
export function attributeStringToArray(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function toOptions(labels: readonly string[]): SelectionOption[] {
  return labels.map((label) => ({ id: label, label }));
}

export const BRAND_POPULAR_IDS = [...POPULAR_BRAND_IDS];

export const BRAND_OPTIONS: SelectionOption[] = toOptions(MARKETPLACE_BRANDS);

export const SIZE_OPTIONS: SelectionOption[] = toOptions(MARKETPLACE_DEFAULT_SIZES);

export const COLOUR_OPTIONS: SelectionOption[] = MARKETPLACE_COLOURS.map((colour) => ({
  id: colour.id,
  label: colour.label,
  swatch: colour.swatch,
}));

export const MATERIAL_OPTIONS: SelectionOption[] = toOptions(MARKETPLACE_MATERIALS);
