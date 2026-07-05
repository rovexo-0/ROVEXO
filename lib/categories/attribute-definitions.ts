/**
 * Marketplace attribute definitions — SSOT mapping from category paths to listing fields.
 * Sell UI reads defs via this module; sell-specific read/write helpers stay in attribute-engine.
 */

import type { FlatCategoryPath } from "@/lib/categories/types";
import {
  getAttributeDefsForCategory as getSellAttributeDefs,
  type AttributeDef,
} from "@/lib/sell/attribute-engine";

export type { AttributeDef } from "@/lib/sell/attribute-engine";

export function getAttributeDefsForCategory(categoryPath: FlatCategoryPath | null): AttributeDef[] {
  return getSellAttributeDefs(categoryPath);
}

export function getAttributeIdsForCategoryPath(categoryPath: FlatCategoryPath | null): string[] {
  return getAttributeDefsForCategory(categoryPath).map((def) => def.id);
}
