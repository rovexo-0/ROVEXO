import { AI_CAMERA_CONFIDENCE_THRESHOLD, type AiCameraAnalysisResult } from "@/lib/ai-camera/types";
import type { FlatCategoryPath } from "@/lib/categories/types";
import type { SellListingDraft } from "@/features/sell/types";

function applyDetectedField(
  current: string,
  detected: { value: string; confidence: number } | null,
  threshold: number,
): string {
  if (!detected || detected.confidence < threshold || !detected.value.trim()) {
    return current;
  }
  return detected.value;
}

export function resolveCategoryFromAnalysis(
  result: AiCameraAnalysisResult,
): FlatCategoryPath | null {
  if (result.autoSelected && result.selected) {
    return result.selected.path;
  }
  return null;
}

export function applyAnalysisToDraft(
  draft: SellListingDraft,
  result: AiCameraAnalysisResult,
  options?: { fillTitle?: boolean; fillDescription?: boolean },
): SellListingDraft {
  if (result.lowConfidence) {
    return {
      ...draft,
      analysis: result,
    };
  }

  const { fillTitle = true, fillDescription = true } = options ?? {};
  const categoryPath = resolveCategoryFromAnalysis(result) ?? draft.categoryPath;
  const topPrediction = result.predictions[0];
  const suggestedTitle = topPrediction?.title ?? result.suggestions.titles[0] ?? "";
  const suggestedDescription =
    topPrediction?.description ?? result.suggestions.descriptions[0] ?? "";
  const suggestedCondition = topPrediction?.condition ?? result.condition?.value ?? "";

  return {
    ...draft,
    analysis: result,
    categoryPath,
    brand: applyDetectedField(draft.brand, result.brand, AI_CAMERA_CONFIDENCE_THRESHOLD),
    color: applyDetectedField(draft.color, result.color, AI_CAMERA_CONFIDENCE_THRESHOLD),
    size: applyDetectedField(draft.size, result.size, AI_CAMERA_CONFIDENCE_THRESHOLD),
    material: applyDetectedField(draft.material, result.material, AI_CAMERA_CONFIDENCE_THRESHOLD),
    condition: draft.condition || suggestedCondition,
    title: fillTitle
      ? draft.title.trim() || suggestedTitle
      : draft.title || suggestedTitle,
    description: fillDescription
      ? draft.description.trim() || suggestedDescription
      : draft.description,
  };
}

export function applyPredictionToDraft(
  draft: SellListingDraft,
  predictionIndex: number,
): SellListingDraft {
  const analysis = draft.analysis;
  const prediction = analysis?.predictions[predictionIndex];
  if (!prediction) return draft;

  return {
    ...draft,
    title: prediction.title,
    description: prediction.description,
    brand: prediction.brand ?? draft.brand,
    color: prediction.color ?? draft.color,
    material: prediction.material ?? draft.material,
    size: prediction.size ?? draft.size,
    condition: prediction.condition ?? draft.condition,
    categoryPath: prediction.category?.path ?? draft.categoryPath,
  };
}
