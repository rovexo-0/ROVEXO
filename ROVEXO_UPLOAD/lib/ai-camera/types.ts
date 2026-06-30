import type { FlatCategoryPath } from "@/lib/categories/types";

/** Minimum confidence before auto-filling listing fields. */
export const AI_CAMERA_CONFIDENCE_THRESHOLD = 0.9;

export type DetectedAttribute = {
  value: string;
  confidence: number;
};

export type CategoryMatchResult = {
  path: FlatCategoryPath;
  confidence: number;
};

export type VisionPrediction = {
  confidence: number;
  title: string;
  description: string;
  brand: string | null;
  condition: string | null;
  color: string | null;
  material: string | null;
  size: string | null;
  category: CategoryMatchResult | null;
  attributes: Record<string, string>;
  defects: string[];
  accessories: string[];
};

export type AiSuggestionSet = {
  titles: string[];
  categories: CategoryMatchResult[];
  brands: string[];
  descriptions: string[];
  conditions: string[];
  colours: string[];
};

export type AiCameraAnalysisResult = {
  /** Overall detection confidence (0–1). */
  confidence: number;
  /** `vision` when analysed by multimodal model; `fallback` when filename heuristics only. */
  source: "vision" | "fallback";
  /** Top predictions ranked by confidence (max 5). */
  predictions: VisionPrediction[];
  matches: CategoryMatchResult[];
  selected: CategoryMatchResult | null;
  autoSelected: boolean;
  /** True when confidence is below threshold — show suggestions instead of autofill. */
  lowConfidence: boolean;
  brand: DetectedAttribute | null;
  color: DetectedAttribute | null;
  material: DetectedAttribute | null;
  size: DetectedAttribute | null;
  condition: DetectedAttribute | null;
  defects: string[];
  accessories: string[];
  attributes: Record<string, string>;
  suggestions: AiSuggestionSet;
  labels: string[];
};

export type AiCameraFormState = {
  categoryPathId: string;
  brand: string;
  color: string;
  size: string;
};

export type VisionImageInput = {
  buffer: Buffer;
  mimeType: string;
  fileName?: string;
};
