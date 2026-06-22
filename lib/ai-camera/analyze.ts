import { buildResultFromVisionPayload } from "@/lib/ai-camera/build-result";
import {
  isVisionConfigured,
  isVisionMockEnabled,
} from "@/lib/ai-camera/config";
import {
  analyzeWithFilenameFallback,
  emptyLowConfidenceResult,
} from "@/lib/ai-camera/fallback";
import type { AiCameraAnalysisResult, VisionImageInput } from "@/lib/ai-camera/types";
import {
  VisionAnalysisError,
  analyzeImagesWithVision,
} from "@/lib/ai-camera/vision-client";
import type { VisionResponsePayload } from "@/lib/ai-camera/vision-schema";

export type AnalyzeImagesOptions = {
  fileName?: string;
  forceFallback?: boolean;
};

/** Test hook — override vision responses without calling OpenAI. */
let visionResponseOverride: VisionResponsePayload | null = null;

export function __setVisionResponseForTests(payload: VisionResponsePayload | null): void {
  visionResponseOverride = payload;
}

export async function analyzeImages(
  images: VisionImageInput[],
  options: AnalyzeImagesOptions = {},
): Promise<AiCameraAnalysisResult> {
  if (images.length === 0) {
    return emptyLowConfidenceResult();
  }

  if (options.forceFallback || (!isVisionConfigured() && !isVisionMockEnabled())) {
    const fileName = options.fileName ?? images[0]?.fileName ?? "";
    return fileName ? analyzeWithFilenameFallback(fileName) : emptyLowConfidenceResult();
  }

  try {
    const payload =
      visionResponseOverride ??
      (isVisionMockEnabled()
        ? buildMockVisionPayload(images[0]?.fileName)
        : await analyzeImagesWithVision(images));

    return buildResultFromVisionPayload(payload, "vision");
  } catch (error) {
    if (error instanceof VisionAnalysisError) {
      const fileName = options.fileName ?? images[0]?.fileName ?? "";
      if (fileName) {
        return analyzeWithFilenameFallback(fileName);
      }
      throw error;
    }
    throw error;
  }
}

/** @deprecated Use analyzeImages() — kept for legacy imports. */
export async function analyzeImageBuffer(
  imageBuffer: Buffer,
  fileName?: string,
  mimeType = "image/jpeg",
): Promise<AiCameraAnalysisResult> {
  return analyzeImages([{ buffer: imageBuffer, mimeType, fileName }], { fileName });
}

function buildMockVisionPayload(fileName?: string): VisionResponsePayload {
  const name = (fileName ?? "").toLowerCase();

  if (name.includes("car") && name.includes("seat")) {
    return {
      overallConfidence: 0.94,
      labels: ["car seat", "baby product"],
      predictions: [
        {
          confidence: 0.94,
          title: "Maxi-Cosi Car Seat – Black – Good Condition",
          description:
            "Baby car seat visible in photos. Black colour. Good overall condition based on visible wear.",
          brand: name.includes("maxi") ? "Maxi-Cosi" : null,
          condition: "Good",
          dominantColour: "Black",
          material: null,
          size: null,
          categorySlugs: ["baby", "pushchairs", "travel-systems"],
          attributes: { type: "car seat" },
          defects: [],
          accessories: [],
        },
      ],
    };
  }

  return {
    overallConfidence: 0.55,
    labels: ["product"],
    predictions: [
      {
        confidence: 0.55,
        title: "Item for sale",
        description: "Product shown in photo. Please confirm details before publishing.",
        brand: null,
        condition: null,
        dominantColour: "Black",
        material: null,
        size: null,
        categorySlugs: ["everything-else", "miscellaneous", "general"],
        attributes: {},
        defects: [],
        accessories: [],
      },
    ],
  };
}

export { matchCategoriesFromLabels } from "@/lib/ai-camera/rules";
