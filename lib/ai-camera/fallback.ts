import { buildResultFromVisionPayload } from "@/lib/ai-camera/build-result";
import { AI_CAMERA_MAX_PREDICTIONS } from "@/lib/ai-camera/config";
import { deriveLabelsFromFileName } from "@/lib/ai-camera/preprocess";
import { matchCategoriesFromLabels } from "@/lib/ai-camera/rules";
import type { AiCameraAnalysisResult } from "@/lib/ai-camera/types";
import type { VisionResponsePayload } from "@/lib/ai-camera/vision-schema";

/**
 * Filename-only fallback when vision is unavailable.
 * Never autofill — always returns low confidence suggestions.
 */
export function analyzeWithFilenameFallback(fileName: string): AiCameraAnalysisResult {
  const hints = deriveLabelsFromFileName(fileName);
  const categoryMatches = matchCategoriesFromLabels(hints.labels);
  const topMatch = categoryMatches[0] ?? null;
  const confidence = topMatch ? Math.min(topMatch.confidence, 0.75) : 0.35;

  const productType = topMatch?.productType ?? hints.productType ?? "Item";
  const title = hints.productType ?? productType;
  const description =
    title.length >= 10
      ? `Listing for ${title.toLowerCase()}. Please verify details before publishing.`
      : "Please describe this item based on what you are selling.";

  const payload: VisionResponsePayload = {
    overallConfidence: confidence,
    labels: hints.labels,
    predictions: [
      {
        confidence,
        title: title.slice(0, 80),
        description,
        brand: null,
        condition: null,
        dominantColour: null,
        material: hints.material,
        size: hints.size,
        categorySlugs: topMatch
          ? [
              topMatch.path.categorySlug,
              topMatch.path.subcategorySlug,
              ...(topMatch.path.childCategorySlug ? [topMatch.path.childCategorySlug] : []),
            ]
          : ["everything-else", "miscellaneous", "general"],
        attributes: {},
        defects: hints.defects,
        accessories: hints.accessories,
      },
    ].slice(0, AI_CAMERA_MAX_PREDICTIONS),
  };

  return buildResultFromVisionPayload(payload, "fallback");
}

export function emptyLowConfidenceResult(): AiCameraAnalysisResult {
  const payload: VisionResponsePayload = {
    overallConfidence: 0.2,
    labels: [],
    predictions: [
      {
        confidence: 0.2,
        title: "Item for sale",
        description: "Please describe this item based on the photos.",
        brand: null,
        condition: null,
        dominantColour: null,
        material: null,
        size: null,
        categorySlugs: ["everything-else", "miscellaneous", "general"],
        attributes: {},
        defects: [],
        accessories: [],
      },
    ],
  };

  return buildResultFromVisionPayload(payload, "fallback");
}
