import { matchCategoriesFromLabels } from "@/lib/ai-camera/rules";
import type { FlatCategoryPath } from "@/lib/categories/types";

export type TitleCategorySuggestion = {
  path: FlatCategoryPath;
  confidence: number;
};

const AUTO_SELECT_CONFIDENCE = 0.65;
const MIN_TITLE_LENGTH = 3;

function titleToLabels(title: string): string[] {
  const normalized = title.trim().toLowerCase();
  if (!normalized) return [];

  const tokens = normalized.split(/[\s,./\-–—|]+/).filter((token) => token.length >= 2);
  return [normalized, ...tokens];
}

export function suggestCategoryFromTitle(title: string): TitleCategorySuggestion[] {
  const trimmed = title.trim();
  if (trimmed.length < MIN_TITLE_LENGTH) return [];

  return matchCategoriesFromLabels(titleToLabels(trimmed)).map(({ path, confidence }) => ({
    path,
    confidence,
  }));
}

export function shouldAutoSelectCategory(
  suggestions: TitleCategorySuggestion[],
): TitleCategorySuggestion | null {
  const top = suggestions[0];
  if (!top || top.confidence < AUTO_SELECT_CONFIDENCE) return null;
  return top;
}
