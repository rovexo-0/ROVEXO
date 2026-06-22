import {
  AI_CAMERA_MAX_PREDICTIONS,
  AI_CAMERA_VALID_CONDITIONS,
  getOpenAiApiKey,
  getVisionModel,
} from "@/lib/ai-camera/config";
import { getTaxonomyPromptBlock } from "@/lib/ai-camera/taxonomy-prompt";
import {
  visionResponseSchema,
  type VisionResponsePayload,
} from "@/lib/ai-camera/vision-schema";
import type { VisionImageInput } from "@/lib/ai-camera/types";

const SYSTEM_PROMPT = `You are ROVEXO's production listing vision assistant for a UK marketplace.

Analyse the product shown in the uploaded photo(s). Use ONLY what is visible or clearly readable in the images.

Rules:
- Never invent brands, models, specs, or condition details you cannot see.
- If brand is not visible (logo, packaging, label), set brand to null.
- UK English spelling (Colour not Color in descriptions, but use dominantColour field name in JSON).
- Titles must be concise UK marketplace style, max 80 characters.
- Descriptions must be factual, human, and at least 10 characters. No fake specifications.
- condition must be one of: ${AI_CAMERA_VALID_CONDITIONS.join(", ")} — or null if not assessable.
- categorySlugs MUST be chosen from the VALID_CATEGORY_PATHS list only (2–3 slugs).
- Return up to ${AI_CAMERA_MAX_PREDICTIONS} ranked predictions sorted by confidence descending.
- overallConfidence is your confidence in the best prediction (0–1).
- Each prediction needs its own confidence score (0–1).
- attributes: visible traits only (e.g. "pattern": "striped", "storage": "256GB" if legible).
- defects/accessories: only if visible.

Respond with JSON only matching this schema:
{
  "overallConfidence": number,
  "labels": string[],
  "predictions": [{
    "confidence": number,
    "title": string,
    "description": string,
    "brand": string | null,
    "condition": string | null,
    "dominantColour": string | null,
    "material": string | null,
    "size": string | null,
    "categorySlugs": string[],
    "attributes": Record<string, string>,
    "defects": string[],
    "accessories": string[]
  }]
}`;

function toDataUrl(input: VisionImageInput): string {
  return `data:${input.mimeType};base64,${input.buffer.toString("base64")}`;
}

function buildUserPrompt(imageCount: number): string {
  return `VALID_CATEGORY_PATHS (slug path|label):
${getTaxonomyPromptBlock()}

Analyse ${imageCount === 1 ? "this product photo" : `these ${imageCount} product photos together`} and return the JSON response.`;
}

export class VisionAnalysisError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = "VisionAnalysisError";
  }
}

export async function analyzeImagesWithVision(
  images: VisionImageInput[],
): Promise<VisionResponsePayload> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    throw new VisionAnalysisError("OPENAI_API_KEY is not configured.");
  }

  if (images.length === 0) {
    throw new VisionAnalysisError("At least one image is required.");
  }

  const content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string; detail: "high" | "low" } }
  > = [{ type: "text", text: buildUserPrompt(images.length) }];

  for (const image of images) {
    content.push({
      type: "image_url",
      image_url: {
        url: toDataUrl(image),
        detail: "high",
      },
    });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getVisionModel(),
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new VisionAnalysisError(
      `Vision model request failed (${response.status}). ${errorBody.slice(0, 200)}`.trim(),
      response.status,
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };

  const rawContent = payload.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new VisionAnalysisError("Vision model returned an empty response.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    throw new VisionAnalysisError("Vision model returned invalid JSON.");
  }

  const validated = visionResponseSchema.safeParse(parsed);
  if (!validated.success) {
    throw new VisionAnalysisError(
      `Vision model response failed validation: ${validated.error.issues[0]?.message ?? "invalid shape"}`,
    );
  }

  return validated.data;
}
