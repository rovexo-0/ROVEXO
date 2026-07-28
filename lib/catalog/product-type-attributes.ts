/**
 * ROVEXO Catalog Master — resolve essential attributes for a product type.
 */

import {
  ATTR_PRESETS,
  type AttrPresetKey,
  type CatalogAttributeDef,
} from "@/lib/catalog/attributes";
import { getAttrPresetForProductTypeSlug } from "@/lib/catalog/tree";

const MAX_ATTRIBUTES = 6;
const MIN_ATTRIBUTES = 3;

export function resolveProductTypeAttributes(
  productTypeSlug: string,
): readonly CatalogAttributeDef[] {
  const presetKey = getAttrPresetForProductTypeSlug(productTypeSlug) as AttrPresetKey;
  const preset = ATTR_PRESETS[presetKey] ?? ATTR_PRESETS.generic;
  const attrs = preset.slice(0, MAX_ATTRIBUTES);
  if (attrs.length < MIN_ATTRIBUTES) {
    return ATTR_PRESETS.generic;
  }
  return attrs;
}

export function assertAttributeBudget(attrs: readonly CatalogAttributeDef[]): boolean {
  return attrs.length >= MIN_ATTRIBUTES && attrs.length <= MAX_ATTRIBUTES;
}
