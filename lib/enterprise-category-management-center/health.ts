import type { CategoryManagementSnapshot } from "@/lib/enterprise-category-management-center/types";

export function computeCategoryManagementHealth(snapshot: Pick<CategoryManagementSnapshot, "health" | "featureFlagsConfig" | "dashboard" | "settings">) {
  if (snapshot.featureFlagsConfig.enterprise_category_management_center_v1 === false) {
    return { status: "failed" as const, score: 0, checks: ["Category Management Center disabled"] };
  }
  const checks = [
    snapshot.dashboard.overallPassPercent >= 100 ? `Overall PASS ${snapshot.dashboard.overallPassPercent}%` : "Overall PASS below 100%",
    snapshot.settings.validationOnlyMode ? "Validation-only mode active" : "WARNING: Validation-only mode disabled",
    snapshot.dashboard.certificationGranted ? "Taxonomy certification granted" : "Certification pending",
    snapshot.health.score >= 95 ? "Category management healthy" : "Category management degraded",
  ];
  return { status: snapshot.health.status, score: snapshot.health.score, checks };
}
