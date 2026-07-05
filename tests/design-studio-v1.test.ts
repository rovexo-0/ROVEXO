import { describe, expect, it } from "vitest";
import {
  XOS_MODULES,
  ICON_STANDARD_RULES,
  buildDesignSystemSummary,
  computeDesignScore,
  getBrandDnaRules,
  getIconScanFindingCounts,
  runDesignStudioAudit,
  runAiExperienceGuardian,
  buildDependencyGraph,
  buildExperienceHealthReport,
  buildExperienceAnalyticsReport,
  buildScreenRegistry,
  getScreenRegistryStats,
  searchVisualAssets,
  scanBrokenAssets,
  scanDesignStudioIcons,
  scanAssetOptimization,
  buildIconReplacePlan,
  buildVisualHealthReport,
} from "@/lib/design-studio-v1";

describe("ROVEXO Experience Operating System Enterprise v3.0", () => {
  it("registers thirty-seven XOS enterprise modules", () => {
    expect(XOS_MODULES).toHaveLength(37);
    expect(XOS_MODULES[0]?.id).toBe("experience-center");
    expect(XOS_MODULES[36]?.id).toBe("permission-center");
  });

  it("builds screen registry with canonical platform screens", () => {
    const screens = buildScreenRegistry();
    const stats = getScreenRegistryStats(screens);
    expect(screens.length).toBeGreaterThanOrEqual(20);
    expect(screens.some((s) => s.id === "homepage")).toBe(true);
    expect(screens.some((s) => s.id === "super-admin")).toBe(true);
    expect(stats.averageDesignScore).toBeGreaterThan(0);
  });

  it("runs XOS scanners, experience guardian, and health report", () => {
    const iconScan = scanDesignStudioIcons();
    const assetScan = scanBrokenAssets();
    const optimizer = scanAssetOptimization();
    const designAudit = runDesignStudioAudit();
    const experienceGuardian = runAiExperienceGuardian();
    const designScore = computeDesignScore({ iconScan, designAudit, assetOptimizer: optimizer });
    const visualHealth = buildVisualHealthReport({ iconScan, assetScan, assetOptimizer: optimizer, designAudit, designScore, guardian: { scannedAt: "", findings: [], autoFixCount: 0, pass: true } });
    const screens = buildScreenRegistry();
    const experienceHealth = buildExperienceHealthReport({
      visualHealth,
      designScore,
      screens,
      guardianFindings: experienceGuardian.findings.length,
      featureToggleEnabled: 4,
      featureToggleTotal: 6,
    });
    const analytics = buildExperienceAnalyticsReport();
    const graph = buildDependencyGraph();
    const search = searchVisualAssets({ query: "icon", limit: 5 });

    expect(getIconScanFindingCounts(iconScan).critical).toBe(0);
    expect(experienceGuardian.recommendations.length).toBeGreaterThan(0);
    expect(experienceHealth.dimensions.length).toBeGreaterThanOrEqual(8);
    expect(experienceHealth.overallExperienceScore).toBeGreaterThan(0);
    expect(analytics.navigationPaths.length).toBeGreaterThan(0);
    expect(graph.length).toBeGreaterThan(5);
    expect(search.length).toBeGreaterThan(0);
    expect(buildIconReplacePlan().totalActions).toBeGreaterThan(0);
    expect(getBrandDnaRules().length).toBeGreaterThanOrEqual(10);
    expect(ICON_STANDARD_RULES.every((r) => r.enforced)).toBe(true);
    expect(buildDesignSystemSummary().every((g) => g.tokens.length > 0)).toBe(true);
  });
});
