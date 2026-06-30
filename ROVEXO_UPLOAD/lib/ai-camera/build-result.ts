import { resolveCategoryPathBySlugs } from "@/lib/categories/queries";
import {
  AI_CAMERA_CONFIDENCE_THRESHOLD,
  AI_CAMERA_MAX_PREDICTIONS,
} from "@/lib/ai-camera/config";
import type {
  AiCameraAnalysisResult,
  AiSuggestionSet,
  CategoryMatchResult,
  DetectedAttribute,
  VisionPrediction,
} from "@/lib/ai-camera/types";
import type { VisionResponsePayload } from "@/lib/ai-camera/vision-schema";

const MAX_TITLE_LENGTH = 80;
const MAX_SUGGESTIONS = AI_CAMERA_MAX_PREDICTIONS;

function truncateTitle(value: string): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= MAX_TITLE_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_TITLE_LENGTH - 1).trim()}…`;
}

function attribute(value: string | null | undefined, confidence: number): DetectedAttribute | null {
  if (!value?.trim()) return null;
  return { value: value.trim(), confidence };
}

function resolveCategoryMatch(
  slugs: string[],
  confidence: number,
): CategoryMatchResult | null {
  const path = resolveCategoryPathBySlugs(slugs);
  if (!path) return null;
  return { path, confidence };
}

function uniqueBy<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const results: T[] = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(item);
  }
  return results;
}

export function buildResultFromVisionPayload(
  payload: VisionResponsePayload,
  source: "vision" | "fallback" = "vision",
): AiCameraAnalysisResult {
  const predictions: VisionPrediction[] = payload.predictions
    .slice(0, AI_CAMERA_MAX_PREDICTIONS)
    .map((entry) => {
      const categoryMatch = resolveCategoryMatch(entry.categorySlugs, entry.confidence);
      return {
        confidence: entry.confidence,
        title: truncateTitle(entry.title),
        description: entry.description.trim(),
        brand: entry.brand,
        condition: entry.condition,
        color: entry.dominantColour,
        material: entry.material,
        size: entry.size,
        category: categoryMatch,
        attributes: entry.attributes ?? {},
        defects: entry.defects ?? [],
        accessories: entry.accessories ?? [],
      };
    });

  const top = predictions[0] ?? null;
  const overallConfidence = payload.overallConfidence;
  const topCategoryConfidence = top?.category?.confidence ?? 0;

  const matches: CategoryMatchResult[] = uniqueBy(
    predictions
      .map((prediction) => prediction.category)
      .filter((category): category is CategoryMatchResult => Boolean(category)),
    (match) => match.path.segments.map((segment) => segment.slug).join(":"),
  ).slice(0, MAX_SUGGESTIONS);

  const autoSelected =
    source === "vision" &&
    Boolean(top?.category) &&
    overallConfidence >= AI_CAMERA_CONFIDENCE_THRESHOLD &&
    (top?.confidence ?? 0) >= AI_CAMERA_CONFIDENCE_THRESHOLD &&
    topCategoryConfidence >= AI_CAMERA_CONFIDENCE_THRESHOLD;

  const suggestions: AiSuggestionSet = {
    titles: uniqueBy(predictions, (prediction) => prediction.title.toLowerCase())
      .map((prediction) => prediction.title)
      .slice(0, MAX_SUGGESTIONS),
    categories: matches,
    brands: uniqueBy(
      predictions.filter((prediction) => prediction.brand),
      (prediction) => prediction.brand!.toLowerCase(),
    )
      .map((prediction) => prediction.brand!)
      .slice(0, MAX_SUGGESTIONS),
    descriptions: uniqueBy(predictions, (prediction) => prediction.description.toLowerCase())
      .map((prediction) => prediction.description)
      .slice(0, MAX_SUGGESTIONS),
    conditions: uniqueBy(
      predictions.filter((prediction) => prediction.condition),
      (prediction) => prediction.condition!,
    )
      .map((prediction) => prediction.condition!)
      .slice(0, MAX_SUGGESTIONS),
    colours: uniqueBy(
      predictions.filter((prediction) => prediction.color),
      (prediction) => prediction.color!.toLowerCase(),
    )
      .map((prediction) => prediction.color!)
      .slice(0, MAX_SUGGESTIONS),
  };

  return {
    confidence: overallConfidence,
    source,
    predictions,
    matches,
    selected: autoSelected ? (top?.category ?? null) : null,
    autoSelected,
    lowConfidence: !autoSelected,
    brand: attribute(top?.brand, top?.confidence ?? 0),
    color: attribute(top?.color, top?.confidence ?? 0),
    material: attribute(top?.material, (top?.confidence ?? 0) * 0.95),
    size: attribute(top?.size, (top?.confidence ?? 0) * 0.95),
    condition: attribute(top?.condition, top?.confidence ?? 0),
    defects: uniqueBy(
      predictions.flatMap((prediction) => prediction.defects),
      (defect) => defect.toLowerCase(),
    ),
    accessories: uniqueBy(
      predictions.flatMap((prediction) => prediction.accessories),
      (item) => item.toLowerCase(),
    ),
    attributes: top?.attributes ?? {},
    suggestions,
    labels: payload.labels ?? [],
  };
}
