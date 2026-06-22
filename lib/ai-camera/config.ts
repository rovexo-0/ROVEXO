/** Minimum confidence before auto-filling listing fields. */
export const AI_CAMERA_CONFIDENCE_THRESHOLD = 0.9;

export const AI_CAMERA_MAX_PREDICTIONS = 5;

export const AI_CAMERA_MAX_IMAGES = 8;

/** UK marketplace condition labels — must match `SELL_CONDITIONS` in sell types. */
export const AI_CAMERA_VALID_CONDITIONS = [
  "New with Tags",
  "New",
  "Like New",
  "Very Good",
  "Good",
  "Fair",
] as const;

export type AiCameraValidCondition = (typeof AI_CAMERA_VALID_CONDITIONS)[number];

export function getVisionModel(): string {
  return process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4o-mini";
}

export function getOpenAiApiKey(): string | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key || null;
}

export function isVisionConfigured(): boolean {
  return Boolean(getOpenAiApiKey());
}

export function isVisionMockEnabled(): boolean {
  return process.env.AI_CAMERA_VISION_MOCK === "true";
}
