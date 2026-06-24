import { hashTitleForLearning } from "@/lib/sell/suggest-category-from-title";
import { toPathId } from "@/lib/categories/queries";
import type { FlatCategoryPath } from "@/lib/categories/types";
import type { CategoryDetectionTier } from "@/lib/sell/category-detection-pro";

export type CategoryCorrectionPayload = {
  title: string;
  suggestedPath: FlatCategoryPath;
  chosenPath: FlatCategoryPath;
  confidence: number;
  tier: CategoryDetectionTier;
};

function getAnonymousLocale(): { language: string; country: string } {
  if (typeof navigator === "undefined") {
    return { language: "en", country: "GB" };
  }

  const locale = navigator.language || "en-GB";
  const [language, country = "GB"] = locale.split("-");
  return { language: language.toLowerCase(), country: country.toUpperCase() };
}

export async function logCategoryManualOverride(input: CategoryCorrectionPayload): Promise<void> {
  try {
    const { language, country } = getAnonymousLocale();

    await fetch("/api/sell/category-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        titleHash: hashTitleForLearning(input.title),
        predictedPathId: toPathId(input.suggestedPath),
        finalPathId: toPathId(input.chosenPath),
        confidence: input.confidence,
        tier: input.tier,
        language,
        country,
      }),
    });
  } catch {
    // Learning must never block listing creation.
  }
}
