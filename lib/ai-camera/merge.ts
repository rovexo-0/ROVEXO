import {
  AI_CAMERA_CONFIDENCE_THRESHOLD,
  AI_CAMERA_MAX_PREDICTIONS,
} from "@/lib/ai-camera/config";
import type {
  AiCameraAnalysisResult,
  CategoryMatchResult,
  DetectedAttribute,
} from "@/lib/ai-camera/types";

function pickHigherAttribute(
  current: DetectedAttribute | null,
  incoming: DetectedAttribute | null,
): DetectedAttribute | null {
  if (!incoming) return current;
  if (!current) return incoming;
  return incoming.confidence >= current.confidence ? incoming : current;
}

function mergeCategoryMatches(matches: CategoryMatchResult[]): CategoryMatchResult[] {
  const map = new Map<string, CategoryMatchResult>();

  for (const match of matches) {
    const key = match.path.segments.map((segment) => segment.slug).join(":");
    const existing = map.get(key);
    if (!existing || match.confidence > existing.confidence) {
      map.set(key, match);
    }
  }

  return [...map.values()].sort((a, b) => b.confidence - a.confidence).slice(0, AI_CAMERA_MAX_PREDICTIONS);
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function uniqueSuggestions(values: string[], limit = AI_CAMERA_MAX_PREDICTIONS): string[] {
  return uniqueStrings(values).slice(0, limit);
}

export function mergeAnalysisResults(results: AiCameraAnalysisResult[]): AiCameraAnalysisResult | null {
  if (results.length === 0) return null;
  if (results.length === 1) return results[0]!;

  const labels = uniqueStrings(results.flatMap((result) => result.labels));
  const predictions = results
    .flatMap((result) => result.predictions)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, AI_CAMERA_MAX_PREDICTIONS);

  const matches = mergeCategoryMatches([
    ...results.flatMap((result) => result.matches),
    ...predictions
      .map((prediction) => prediction.category)
      .filter((category): category is CategoryMatchResult => Boolean(category)),
  ]);

  const confidence = Math.max(...results.map((result) => result.confidence));
  const topMatch = matches[0] ?? null;
  const topPrediction = predictions[0] ?? null;
  const autoSelected =
    results.every((result) => result.source === "vision") &&
    Boolean(topMatch) &&
    confidence >= AI_CAMERA_CONFIDENCE_THRESHOLD &&
    (topPrediction?.confidence ?? 0) >= AI_CAMERA_CONFIDENCE_THRESHOLD &&
    (topMatch?.confidence ?? 0) >= AI_CAMERA_CONFIDENCE_THRESHOLD;

  const brand = results.reduce<DetectedAttribute | null>(
    (acc, result) => pickHigherAttribute(acc, result.brand),
    null,
  );
  const color = results.reduce<DetectedAttribute | null>(
    (acc, result) => pickHigherAttribute(acc, result.color),
    null,
  );
  const material = results.reduce<DetectedAttribute | null>(
    (acc, result) => pickHigherAttribute(acc, result.material),
    null,
  );
  const size = results.reduce<DetectedAttribute | null>(
    (acc, result) => pickHigherAttribute(acc, result.size),
    null,
  );
  const condition = results.reduce<DetectedAttribute | null>(
    (acc, result) => pickHigherAttribute(acc, result.condition),
    null,
  );

  return {
    confidence,
    source: results.some((result) => result.source === "vision") ? "vision" : "fallback",
    predictions,
    matches,
    selected: autoSelected ? topMatch : null,
    autoSelected,
    lowConfidence: !autoSelected,
    brand,
    color,
    material,
    size,
    condition,
    defects: uniqueStrings(results.flatMap((result) => result.defects)),
    accessories: uniqueStrings(results.flatMap((result) => result.accessories)),
    attributes: topPrediction?.attributes ?? {},
    suggestions: {
      titles: uniqueSuggestions(predictions.map((prediction) => prediction.title)),
      categories: matches,
      brands: uniqueSuggestions(
        predictions.map((prediction) => prediction.brand).filter(Boolean) as string[],
      ),
      descriptions: uniqueSuggestions(predictions.map((prediction) => prediction.description)),
      conditions: uniqueSuggestions(
        predictions.map((prediction) => prediction.condition).filter(Boolean) as string[],
      ),
      colours: uniqueSuggestions(
        predictions.map((prediction) => prediction.color).filter(Boolean) as string[],
      ),
    },
    labels,
  };
}
