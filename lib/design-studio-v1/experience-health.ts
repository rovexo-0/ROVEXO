import type {
  DesignScoreBreakdown,
  ExperienceHealthReport,
  ScreenRegistryEntry,
  VisualHealthReport,
} from "@/lib/design-studio-v1/types";

export function buildExperienceHealthReport(input: {
  visualHealth: VisualHealthReport;
  designScore: DesignScoreBreakdown;
  screens: ScreenRegistryEntry[];
  guardianFindings: number;
  featureToggleEnabled: number;
  featureToggleTotal: number;
}): ExperienceHealthReport {
  const avgScreenScore = Math.round(
    input.screens.reduce((sum, s) => sum + s.designScore, 0) / Math.max(input.screens.length, 1),
  );

  const dimensions = [
    { id: "platform", label: "Platform Health", score: input.visualHealth.overall },
    { id: "design", label: "Design Health", score: input.designScore.overall },
    { id: "ux", label: "UX Health", score: Math.max(0, 92 - input.guardianFindings * 0.15) },
    { id: "accessibility", label: "Accessibility", score: input.designScore.accessibility },
    { id: "performance", label: "Performance", score: input.designScore.performance },
    { id: "brand", label: "Brand Consistency", score: input.designScore.brandConsistency },
    { id: "responsive", label: "Responsive", score: input.designScore.responsive },
    { id: "security", label: "Security", score: input.designScore.security },
    { id: "screens", label: "Screen Registry", score: avgScreenScore },
    {
      id: "features",
      label: "Feature Health",
      score: Math.round((input.featureToggleEnabled / Math.max(input.featureToggleTotal, 1)) * 100),
    },
  ];

  const overall = Math.round(dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length);

  return {
    scannedAt: new Date().toISOString(),
    overallExperienceScore: overall,
    pass: overall >= 85 && input.visualHealth.brokenAssets === 0,
    dimensions,
  };
}
