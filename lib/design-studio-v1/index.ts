export type {
  AssetInspectorRecord,
  AssetOptimizerRecord,
  AssetOptimizerSummary,
  AssetScanFinding,
  AssetScanSummary,
  BrandDnaRule,
  DependencyGraphNode,
  DesignAuditReport,
  DesignAuditSection,
  DesignScoreBreakdown,
  DesignStudioModule,
  DesignStudioModuleId,
  DesignStudioSnapshot,
  DesignSystemTokenGroup,
  DuplicateGroup,
  DuplicateScanSummary,
  ExperienceAnalyticsReport,
  ExperienceGuardianFinding,
  ExperienceGuardianReport,
  ExperienceHealthDimension,
  ExperienceHealthReport,
  FeatureToggleEntry,
  GlobalSearchResult,
  GuardianFinding,
  GuardianReport,
  IconReplaceAction,
  IconReplaceSummary,
  IconScanFinding,
  IconScanSummary,
  IconScanSeverity,
  IconStandardRule,
  NavigationMenuItem,
  NavigationSurface,
  PublishCenterState,
  PublishManifest,
  ResponsivePreviewMode,
  ScreenRegistryEntry,
  VersionControlEntry,
  VisualHealthDimension,
  VisualHealthReport,
  VosModule,
  VosModuleId,
  XosModule,
  XosModuleId,
  XosSnapshot,
} from "@/lib/design-studio-v1/types";

export {
  XOS_MODULES,
  getXosModule,
  VOS_MODULES,
  DESIGN_STUDIO_MODULES,
  getVosModule,
  getDesignStudioModule,
} from "@/lib/design-studio-v1/xos-registry";
export { getBrandDnaRules, validateAgainstBrandDna } from "@/lib/design-studio-v1/brand-dna";
export { runAiDesignGuardian, getGuardianRecommendations } from "@/lib/design-studio-v1/ai-design-guardian";
export { runAiExperienceGuardian } from "@/lib/design-studio-v1/ai-experience-guardian";
export { searchVisualAssets } from "@/lib/design-studio-v1/global-search";
export { buildDependencyGraph, analyzeReplacementImpact } from "@/lib/design-studio-v1/dependency-graph";
export { buildVisualHealthReport } from "@/lib/design-studio-v1/visual-health";
export { buildExperienceHealthReport } from "@/lib/design-studio-v1/experience-health";
export { buildExperienceAnalyticsReport } from "@/lib/design-studio-v1/experience-analytics";
export { buildScreenRegistry, getScreenRegistryStats } from "@/lib/design-studio-v1/screen-registry";
export { buildNavigationSurfaces } from "@/lib/design-studio-v1/navigation-manager";
export { getFeatureToggleCenter, getFeatureToggleStats } from "@/lib/design-studio-v1/feature-toggle-center";
export { ICON_STANDARD_RULES, LEGACY_ICON_IMPORTS } from "@/lib/design-studio-v1/icon-standard";
export { scanDesignStudioIcons, getIconScanFindingCounts } from "@/lib/design-studio-v1/icon-scanner";
export { scanBrokenAssets } from "@/lib/design-studio-v1/asset-scanner";
export { scanDuplicateAssets } from "@/lib/design-studio-v1/duplicate-detector";
export { inspectDesignStudioAssets } from "@/lib/design-studio-v1/asset-inspector";
export { scanAssetOptimization } from "@/lib/design-studio-v1/asset-optimizer";
export { runDesignStudioAudit } from "@/lib/design-studio-v1/design-audit";
export { computeDesignScore } from "@/lib/design-studio-v1/design-score";
export { buildIconReplacePlan, applyGlobalIconReplace } from "@/lib/design-studio-v1/icon-replace-engine";
export { getPublishCenterState } from "@/lib/design-studio-v1/publish-center";
export { getDesignStudioVersionHistory } from "@/lib/design-studio-v1/version-control";
export { buildDesignSystemSummary } from "@/lib/design-studio-v1/design-system";
export {
  getXosSnapshot,
  getDesignStudioSnapshot,
  runFullXosRescan,
  runFullDesignStudioRescan,
} from "@/lib/design-studio-v1/snapshot";
