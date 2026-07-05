/** @deprecated Use XosModuleId */
export type VosModuleId = XosModuleId;

export type XosModuleId =
  | "experience-center"
  | "navigation-manager"
  | "screen-registry"
  | "visual-cms"
  | "dynamic-layout-engine"
  | "homepage-builder"
  | "dashboard-builder"
  | "landing-builder"
  | "widget-builder"
  | "form-builder"
  | "component-builder"
  | "content-builder"
  | "localization-studio"
  | "responsive-studio"
  | "accessibility-center"
  | "motion-studio"
  | "theme-studio"
  | "brand-studio"
  | "icon-studio"
  | "banner-studio"
  | "illustration-studio"
  | "animation-studio"
  | "asset-library"
  | "asset-scanner"
  | "asset-optimizer"
  | "ai-design-guardian"
  | "brand-dna"
  | "dependency-graph"
  | "global-search"
  | "global-replace-engine"
  | "publish-center"
  | "rollback-center"
  | "audit-center"
  | "analytics-center"
  | "experience-analytics"
  | "feature-toggle-center"
  | "permission-center";

export type XosModule = {
  id: XosModuleId;
  order: number;
  label: string;
  description: string;
  href: string;
  icon: string;
  capabilities: readonly string[];
  internal?: boolean;
};

/** @deprecated Use XosModule */
export type VosModule = XosModule;

/** @deprecated Use XosModuleId */
export type DesignStudioModuleId = XosModuleId;

/** @deprecated Use XosModule */
export type DesignStudioModule = XosModule;

export type IconScanSeverity = "critical" | "warning" | "info";

export type IconScanFinding = {
  id: string;
  severity: IconScanSeverity;
  category:
    | "missing-asset"
    | "legacy-import"
    | "decorative-container"
    | "broken-reference"
    | "style-violation"
    | "duplicate-asset";
  message: string;
  file?: string;
  line?: number;
  replacement?: string;
};

export type IconScanSummary = {
  scannedAt: string;
  totalAssets: number;
  registeredIcons: number;
  findings: IconScanFinding[];
  pass: boolean;
  score: number;
};

export type AssetScanFinding = {
  id: string;
  severity: IconScanSeverity;
  category: "broken-reference" | "missing-file" | "invalid-path" | "unused-asset" | "legacy-asset";
  message: string;
  file?: string;
  line?: number;
};

export type AssetScanSummary = {
  scannedAt: string;
  totalFiles: number;
  brokenReferences: number;
  unusedAssets: number;
  findings: AssetScanFinding[];
  pass: boolean;
};

export type DuplicateGroup = {
  id: string;
  hash: string;
  files: string[];
  suggestion: string;
};

export type DuplicateScanSummary = {
  scannedAt: string;
  groups: DuplicateGroup[];
  totalDuplicates: number;
};

export type AssetInspectorRecord = {
  assetId: string;
  path: string;
  version: string;
  format: string;
  bytes: number;
  resolution?: string;
  svgValid: boolean;
  transparent: boolean;
  optimizationScore: number;
  accessibilityScore: number;
  performanceScore: number;
  responsiveScore: number;
  darkModeCompatible: boolean;
  lightModeCompatible: boolean;
  pwaCompatible: boolean;
  mobileCompatible: boolean;
  desktopCompatible: boolean;
  usageCount: number;
  dependencyCount: number;
  dependencies: string[];
  status: "official" | "legacy" | "pending" | "deprecated";
  author: string;
  createdDate: string;
  lastModified: string;
};

export type AssetOptimizerRecord = {
  path: string;
  format: string;
  bytes: number;
  optimizationScore: number;
  recommendations: string[];
};

export type AssetOptimizerSummary = {
  scannedAt: string;
  averageScore: number;
  records: AssetOptimizerRecord[];
};

export type IconReplaceAction = {
  file: string;
  line: number;
  from: string;
  to: string;
  officialAsset: string;
};

export type IconReplaceSummary = {
  scannedAt: string;
  totalActions: number;
  actions: IconReplaceAction[];
  applied: number;
};

export type DesignAuditSection = {
  id: string;
  label: string;
  score: number;
  pass: boolean;
  findings: number;
};

export type DesignAuditReport = {
  scannedAt: string;
  sections: DesignAuditSection[];
  pass: boolean;
  totalFindings: number;
};

export type DesignScoreBreakdown = {
  overall: number;
  brandConsistency: number;
  componentConsistency: number;
  assetQuality: number;
  animationQuality: number;
  accessibility: number;
  performance: number;
  maintainability: number;
  responsive: number;
  optimization: number;
  security: number;
  /** @deprecated Use componentConsistency */
  iconConsistency?: number;
  /** @deprecated Use animationQuality */
  animationScore?: number;
};

export type BrandDnaRule = {
  id: string;
  category: string;
  title: string;
  rule: string;
  enforced: boolean;
};

export type GuardianFinding = {
  id: string;
  severity: IconScanSeverity;
  category:
    | "wrong-colors"
    | "wrong-spacing"
    | "wrong-radius"
    | "wrong-shadows"
    | "wrong-typography"
    | "mixed-icon-styles"
    | "low-quality-assets"
    | "broken-hierarchy"
    | "accessibility";
  message: string;
  file?: string;
  line?: number;
  recommendedFix: string;
  autoFixAvailable: boolean;
};

export type GuardianReport = {
  scannedAt: string;
  findings: GuardianFinding[];
  autoFixCount: number;
  pass: boolean;
};

export type GlobalSearchResult = {
  assetPath: string;
  assetType: "icon" | "logo" | "banner" | "asset" | "reference";
  surfaces: string[];
  usageCount: number;
  dependencyCount: number;
  file?: string;
};

export type DependencyGraphNode = {
  id: string;
  label: string;
  type: "asset" | "component" | "page" | "surface" | "platform";
  depth: number;
  dependents: string[];
  impactScore: number;
};

export type VisualHealthDimension = {
  id: string;
  label: string;
  score: number;
};

export type VisualHealthReport = {
  scannedAt: string;
  overall: number;
  pass: boolean;
  dimensions: VisualHealthDimension[];
  guardianFindings: number;
  brokenAssets: number;
  legacyIcons: number;
};

export type PublishManifest = {
  assetManifest: string;
  versionManifest: string;
  buildManifest: string;
  dependencyReport: string;
  visualChangelog: string[];
};

export type ScreenRegistryEntry = {
  id: string;
  label: string;
  route: string;
  version: string;
  owner: string;
  status: "live" | "draft" | "configured" | "deprecated";
  routeCount: number;
  performanceScore: number;
  accessibilityScore: number;
  designScore: number;
  lastUpdated: string;
  dependencies: string[];
};

export type NavigationMenuItem = {
  id: string;
  label: string;
  href: string;
  enabled: boolean;
};

export type NavigationSurface = {
  id: string;
  label: string;
  type: "desktop" | "mobile" | "tablet" | "footer" | "sidebar";
  itemCount: number;
  items: NavigationMenuItem[];
  previewHref: string;
};

export type FeatureToggleEntry = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  state: string;
  version: string;
  scope: "global" | "beta" | "seasonal" | "country" | "user" | "business";
};

export type ExperienceAnalyticsReport = {
  scannedAt: string;
  clicks: number;
  scrollDepth: number;
  searches: number;
  navigationPaths: Array<{ path: string; count: number; conversionRate: number }>;
  heatmaps: Array<{ surface: string; hotspot: string; intensity: number }>;
  deadClicks: number;
  rageClicks: number;
  topComponents: Array<{ id: string; label: string; usage: number }>;
  leastUsedComponents: Array<{ id: string; label: string; usage: number }>;
  conversionFunnel: Array<{ stage: string; count: number; rate: number }>;
};

export type ExperienceGuardianFinding = {
  id: string;
  severity: IconScanSeverity;
  category: "poor-ux" | "broken-flow" | "long-navigation" | "low-contrast" | "broken-responsive" | "accessibility" | "duplicate-components";
  message: string;
  file?: string;
  line?: number;
  recommendedFix: string;
  autoFixAvailable: boolean;
};

export type ExperienceGuardianReport = {
  scannedAt: string;
  findings: ExperienceGuardianFinding[];
  autoFixCount: number;
  recommendations: string[];
  pass: boolean;
};

export type ExperienceHealthDimension = {
  id: string;
  label: string;
  score: number;
};

export type ExperienceHealthReport = {
  scannedAt: string;
  overallExperienceScore: number;
  pass: boolean;
  dimensions: ExperienceHealthDimension[];
};

export type ResponsivePreviewMode = {
  id: string;
  label: string;
  width: number;
  height: number;
};

export type XosSnapshot = {
  version: "enterprise-3.0.0";
  scannedAt: string;
  modules: XosModule[];
  screens: ScreenRegistryEntry[];
  navigation: NavigationSurface[];
  featureToggles: FeatureToggleEntry[];
  experienceAnalytics: ExperienceAnalyticsReport;
  experienceGuardian: ExperienceGuardianReport;
  experienceHealth: ExperienceHealthReport;
  responsiveModes: ResponsivePreviewMode[];
  brandDna: BrandDnaRule[];
  guardian: GuardianReport;
  globalSearchIndex: GlobalSearchResult[];
  dependencyGraph: DependencyGraphNode[];
  visualHealth: VisualHealthReport;
  iconScan: IconScanSummary;
  assetScan: AssetScanSummary;
  duplicateScan: DuplicateScanSummary;
  assetInspector: AssetInspectorRecord[];
  assetOptimizer: AssetOptimizerSummary;
  iconReplace: IconReplaceSummary;
  designAudit: DesignAuditReport;
  designScore: DesignScoreBreakdown;
  designSystem: DesignSystemTokenGroup[];
  versionControl: VersionControlEntry[];
  publishCenter: PublishCenterState;
  publishManifest: PublishManifest;
  visualBundle: {
    version: number;
    updatedAt: string;
    label: string;
  };
};

/** @deprecated Use XosSnapshot */
export type DesignStudioSnapshot = XosSnapshot;

export type VersionControlEntry = {
  id: string;
  label: string;
  publishedAt: string;
  publishedBy?: string;
  rollbackAvailable: boolean;
  version: number;
};

export type PublishCenterState = {
  draftLabel: string;
  liveLabel: string;
  draftUpdatedAt: string;
  liveUpdatedAt: string;
  pendingChanges: number;
  canPublish: boolean;
  canRollback: boolean;
  historyCount: number;
};

export type DesignSystemTokenGroup = {
  id: string;
  label: string;
  tokens: Array<{ name: string; value: string }>;
};


export type IconStandardRule = {
  id: string;
  title: string;
  description: string;
  enforced: boolean;
};
