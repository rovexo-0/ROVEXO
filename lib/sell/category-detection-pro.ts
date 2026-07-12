import {
  suggestCategoryFromTitle,
  type TitleCategorySuggestion,
} from "@/lib/sell/suggest-category-from-title";

export type CategoryDetectionTier = "auto" | "suggest" | "possible" | "none";

export type CategoryDetectionResult = {
  suggestions: TitleCategorySuggestion[];
  top: TitleCategorySuggestion | null;
  tier: CategoryDetectionTier;
};

/** ≥95% — auto suggested band (§29). */
export const AUTO_SELECT_CONFIDENCE = 0.95;
/** 80–94% — suggested band. */
export const SUGGEST_CONFIDENCE_MIN = 0.8;
/** 50–79% — possible match band. */
export const POSSIBLE_MATCH_MIN = 0.5;

export function getCategoryDetectionTier(confidence: number): CategoryDetectionTier {
  if (confidence >= AUTO_SELECT_CONFIDENCE) return "auto";
  if (confidence >= SUGGEST_CONFIDENCE_MIN) return "suggest";
  if (confidence >= POSSIBLE_MATCH_MIN) return "possible";
  return "none";
}

export function tierSectionLabel(tier: CategoryDetectionTier): string {
  switch (tier) {
    case "auto":
      return "Suggested Category";
    case "suggest":
      return "Suggested Category";
    case "possible":
      return "Possible Match";
    default:
      return "Suggested Category";
  }
}

export function detectCategoryFromTitle(
  title: string,
  description = "",
): CategoryDetectionResult {
  const suggestions = suggestCategoryFromTitle(title, description);
  const top = suggestions.find((item) => item.confidence >= POSSIBLE_MATCH_MIN) ?? null;
  const tier = top ? getCategoryDetectionTier(top.confidence) : "none";

  return {
    suggestions: top ? [top] : [],
    top,
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
