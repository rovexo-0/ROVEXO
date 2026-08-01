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

/** ≥95% — Owner Suggest SSOT confidence floor (never guess below). */
export const AUTO_SELECT_CONFIDENCE = 0.95;
/** Owner Suggest SSOT threshold — aligned with SUGGEST_SSOT_HARDENING_V1. */
export const SUGGEST_CONFIDENCE_MIN = 0.95;
/** 50–94% — possible match band (never returned by Suggest Engine under SSOT). */
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

/**
 * Category Suggestion Engine v1.0 — NEVER auto-select.
 * Seller must press Apply Suggestion.
 */
export function shouldAutoSelectCategory(
  suggestions: TitleCategorySuggestion[],
): TitleCategorySuggestion | null {
  void suggestions;
  return null;
}

/** @deprecated Alias for title-only detection. */
export const detectCategoryPro = detectCategoryFromTitle;
