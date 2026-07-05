import type { AiCameraAnalysisResult } from "@/lib/ai-camera/types";
import type { FlatCategoryPath } from "@/lib/categories/types";
import {
  detectCategoryFromTitle,
  getCategoryDetectionTier,
  type CategoryDetectionResult,
} from "@/lib/sell/category-detection-pro";
import type { TitleCategorySuggestion } from "@/lib/sell/suggest-category-from-title";

export const LISTING_AI_CONFIRM_THRESHOLD = 0.7;

function suggestionFromPath(path: FlatCategoryPath, confidence: number): TitleCategorySuggestion {
  return { path, confidence };
}

export function categoryDetectionFromAiAnalysis(
  analysis: AiCameraAnalysisResult,
  title: string,
  description: string,
): CategoryDetectionResult {
  const matches = analysis.matches
    .filter((match) => match.confidence >= LISTING_AI_CONFIRM_THRESHOLD)
    .map((match) => suggestionFromPath(match.path, match.confidence));

  if (matches.length > 0) {
    const top = matches[0] ?? null;
    return {
      suggestions: matches.slice(0, 3),
      top,
      tier: top ? getCategoryDetectionTier(top.confidence) : "none",
    };
  }

  return detectCategoryFromTitle(title, description);
}

export function applyAiAnalysisFields(
  analysis: AiCameraAnalysisResult,
  draft: {
    title: string;
    brand: string;
    color: string;
    size: string;
    condition: string;
    description: string;
  },
): {
  title?: string;
  brand?: string;
  color?: string;
  size?: string;
  condition?: string;
  description?: string;
  categoryPath?: FlatCategoryPath | null;
} {
  const top = analysis.predictions[0];
  const patch: ReturnType<typeof applyAiAnalysisFields> = {};

  if (!draft.title.trim() && top?.title) {
    patch.title = top.title;
  }
  if (!draft.brand.trim() && analysis.brand?.value) {
    patch.brand = analysis.brand.value;
  }
  if (!draft.color.trim() && analysis.color?.value) {
    patch.color = analysis.color.value;
  }
  if (!draft.size.trim() && analysis.size?.value) {
    patch.size = analysis.size.value;
  }
  if (!draft.condition && analysis.condition?.value) {
    patch.condition = analysis.condition.value;
  }
  if (!draft.description.trim() && top?.description) {
    patch.description = top.description;
  }

  const selected = analysis.selected ?? analysis.matches[0] ?? null;
  if (selected && selected.confidence >= LISTING_AI_CONFIRM_THRESHOLD && analysis.autoSelected) {
    patch.categoryPath = selected.path;
  }

  return patch;
}
