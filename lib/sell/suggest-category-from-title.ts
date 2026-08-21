import { TITLE_SYNONYMS } from "@/lib/sell/title-category-rules";
import { suggestCategory } from "@/lib/sell/category-suggestion-engine-v1";
import type { FlatCategoryPath } from "@/lib/categories/types";

export type TitleCategorySuggestion = {
  path: FlatCategoryPath;
  confidence: number;
};

export const MIN_TITLE_LENGTH = 5;

function expandSynonyms(text: string): string {
  let expanded = text;
  for (const [abbrev, full] of Object.entries(TITLE_SYNONYMS)) {
    const pattern = new RegExp(`\\b${abbrev.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    expanded = expanded.replace(pattern, full);
  }
  return expanded;
}

export function normalizeListingText(title: string): string {
  return expandSynonyms(title.trim().toLowerCase()).replace(/\s+/g, " ");
}

/**
 * Compatibility wrapper → Category Suggestion Engine v1.0 (Catalog Master).
 * Returns at most one highest-ranked path. Never auto-applies.
 */
export function suggestCategoryFromTitle(
  title: string,
  _description = "",
): TitleCategorySuggestion[] {
  void _description;
  const trimmed = title.trim();
  if (trimmed.length < MIN_TITLE_LENGTH) return [];

  const top = suggestCategory(trimmed);
  if (!top) return [];
  return [{ path: top.path, confidence: top.confidence }];
}

/** Anonymous hash for learning logs — never store raw titles. */
export function hashTitleForLearning(title: string): string {
  const normalized = normalizeListingText(title);
  let hash = 2166136261;
  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
