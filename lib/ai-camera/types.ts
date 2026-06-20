import type { FlatCategoryPath } from "@/lib/categories/types";

export const AI_CAMERA_CONFIDENCE_THRESHOLD = 0.85;

export type DetectedAttribute = {
  value: string;
  confidence: number;
};

export type CategoryMatchResult = {
  path: FlatCategoryPath;
  confidence: number;
};

export type AiCameraAnalysisResult = {
  matches: CategoryMatchResult[];
  selected: CategoryMatchResult | null;
  autoSelected: boolean;
  brand: DetectedAttribute | null;
  color: DetectedAttribute | null;
  size: DetectedAttribute | null;
  title: DetectedAttribute | null;
  description: DetectedAttribute | null;
  labels: string[];
};

export type AiCameraFormState = {
  categoryPathId: string;
  brand: string;
  color: string;
  size: string;
};
