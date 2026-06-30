import { createAdminClient } from "@/lib/supabase/admin";
import {
  analyzeImageMetadata,
  analyzeListingContent,
  isDuplicateListingText,
} from "@/lib/moderation/analyzer";
import { computeRiskLevel, computeRiskScore } from "@/lib/moderation/risk";
import { applyListingModeration } from "@/lib/moderation/service";
import type { ModerationResult } from "@/lib/moderation/types";

function finalizeResult(hits: ModerationResult["hits"], base: ModerationResult): ModerationResult {
  const decision = base.decision;
  return {
    ...base,
    hits,
    riskScore: computeRiskScore(hits),
    riskLevel: computeRiskLevel(hits, decision),
  };
}

export async function scanListingBeforePublish(input: {
  sellerId: string;
  productId: string;
  title: string;
  description: string;
  brand?: string;
  imageNames?: string[];
}): Promise<{ allowed: boolean; result: ModerationResult }> {
  const admin = createAdminClient();
  const textResult = analyzeListingContent({
    title: input.title,
    description: input.description,
    brand: input.brand,
    imageNames: input.imageNames,
  });

  const imageResults = (input.imageNames ?? []).map((fileName) =>
    analyzeImageMetadata({ fileName, associatedText: input.title }),
  );

  const mergedHits = [...textResult.hits, ...imageResults.flatMap((result) => result.hits)];
  let result = finalizeResult(mergedHits, textResult);

  const { data: existingListings } = await admin
    .from("products")
    .select("title, description")
    .eq("seller_id", input.sellerId)
    .neq("id", input.productId)
    .neq("status", "deleted")
    .limit(20);

  const duplicate = isDuplicateListingText(
    { title: input.title, description: input.description },
    (existingListings ?? []).map((row) => ({
      title: row.title,
      description: row.description,
    })),
  );

  if (duplicate) {
    const mergedDuplicateHits = [...result.hits, ...duplicate.hits];
    const decision =
      result.decision === "blocked" || duplicate.decision === "blocked" ? "blocked" : duplicate.decision;
    result = finalizeResult(mergedDuplicateHits, {
      ...duplicate,
      decision,
      confidence: Math.max(result.confidence, duplicate.confidence),
      categories: [...new Set([...result.categories, ...duplicate.categories])],
      summary: duplicate.summary,
    });
  }

  return applyListingModeration({
    productId: input.productId,
    sellerId: input.sellerId,
    result,
    source: "listing_publish",
  });
}
