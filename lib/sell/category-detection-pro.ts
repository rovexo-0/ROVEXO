import {
  suggestCategoryFromTitle,
  type TitleCategorySuggestion,
} from "@/lib/sell/suggest-category-from-title";

export type CategoryDetectionTier = "auto" | "suggest" | "none";

export type CategoryDetectionResult = {
  suggestions: TitleCategorySuggestion[];
  top: TitleCategorySuggestion | null;
  tier: CategoryDetectionTier;
};

/** ≥90% — auto-select category from title. */
export const AUTO_SELECT_CONFIDENCE = 0.9;
/** 70–89% — suggest best match only. */
export const SUGGEST_CONFIDENCE_MIN = 0.7;

export function getCategoryDetectionTier(confidence: number): CategoryDetectionTier {
  if (confidence >= AUTO_SELECT_CONFIDENCE) return "auto";
  if (confidence >= SUGGEST_CONFIDENCE_MIN) return "suggest";
  return "none";
}

export function detectCategoryFromTitle(title: string): CategoryDetectionResult {
  const suggestions = suggestCategoryFromTitle(title);
  const top = suggestions[0] ?? null;
  const tier = top ? getCategoryDetectionTier(top.confidence) : "none";

  return {
    suggestions:
      tier === "none"
        ? suggestions.filter((item) => item.confidence >= SUGGEST_CONFIDENCE_MIN)
        : suggestions.slice(0, 3),
    top: top && top.confidence >= SUGGEST_CONFIDENCE_MIN ? top : null,
    tier,
  };
}

export function shouldAutoSelectCategory(
  suggestions: TitleCategorySuggestion[],
): TitleCategorySuggestion | null {
  const top = suggestions[0];
  if (!top || top.confidence < AUTO_SELECT_CONFIDENCE) return null;
  return top;
}

/** @deprecated Alias for title-only detection. */
export const detectCategoryPro = detectCategoryFromTitle;
