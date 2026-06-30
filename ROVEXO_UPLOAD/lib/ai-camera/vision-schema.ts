import { z } from "zod";
import { AI_CAMERA_MAX_PREDICTIONS, AI_CAMERA_VALID_CONDITIONS } from "@/lib/ai-camera/config";

const nullableString = z
  .union([z.string(), z.null()])
  .transform((value) => (typeof value === "string" && value.trim() ? value.trim() : null));

export const visionPredictionSchema = z.object({
  confidence: z.number().min(0).max(1),
  title: z.string().min(3).max(80),
  description: z.string().min(10).max(2000),
  brand: nullableString,
  condition: z
    .union([z.enum(AI_CAMERA_VALID_CONDITIONS), z.null(), z.string()])
    .transform((value) => {
      if (!value || typeof value !== "string") return null;
      const match = AI_CAMERA_VALID_CONDITIONS.find(
        (condition) => condition.toLowerCase() === value.trim().toLowerCase(),
      );
      return match ?? null;
    }),
  dominantColour: nullableString,
  material: nullableString,
  size: nullableString,
  categorySlugs: z.array(z.string().min(1)).min(2).max(4),
  attributes: z.record(z.string(), z.string()).optional().default({}),
  defects: z.array(z.string()).optional().default([]),
  accessories: z.array(z.string()).optional().default([]),
});

export const visionResponseSchema = z.object({
  overallConfidence: z.number().min(0).max(1),
  predictions: z.array(visionPredictionSchema).min(1).max(AI_CAMERA_MAX_PREDICTIONS),
  labels: z.array(z.string()).optional().default([]),
});

export type VisionPredictionPayload = z.infer<typeof visionPredictionSchema>;
export type VisionResponsePayload = z.infer<typeof visionResponseSchema>;
