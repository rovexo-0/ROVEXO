import type { HomepageBuilderSnapshot } from "@/lib/homepage-builder-engine/types";
import { generateHomepageAiSuggestions, optimizeLayoutScore } from "@/lib/homepage-builder-engine/ai";
import { buildAssetReferences } from "@/lib/homepage-builder-engine/assets";
import {
  detectHomepagePendingPublish,
  getHomepageBuilderDraftDocument,
  getHomepageBuilderLiveDocument,
  homepageBuilderConfigLifecycle,
} from "@/lib/homepage-builder-engine/config";
import { HOMEPAGE_BUILDER_MODULE_DESCRIPTOR } from "@/lib/homepage-builder-engine/descriptor";
import { buildHomepageDashboard } from "@/lib/homepage-builder-engine/engine";
import { validateHomepageDocument } from "@/lib/homepage-builder-engine/publish";
import { createVersionEntry } from "@/lib/homepage-builder-engine/versioning";

export function computeHomepageBuilderHealth(snapshot: Pick<HomepageBuilderSnapshot, "health" | "featureFlags" | "dashboard">) {
  if (snapshot.featureFlags.homepage_builder_enabled === false) {
    return { status: "failed" as const, score: 0, checks: ["Builder disabled"] };
  }
  return {
    status: snapshot.health.status,
    score: snapshot.health.score,
    checks: [
      snapshot.dashboard.productionSections > 0 ? "Production homepage active" : "No production sections",
      snapshot.dashboard.healthScore >= 50 ? "Health acceptable" : "Low health score",
    ],
  };
}
