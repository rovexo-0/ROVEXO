import type { HomepageBuilderSnapshot } from "@/lib/homepage-builder-engine/types";

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
