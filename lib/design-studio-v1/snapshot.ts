import { buildDesignSystemSummary } from "@/lib/design-studio-v1/design-system";
import { runDesignStudioAudit } from "@/lib/design-studio-v1/design-audit";
import { computeDesignScore } from "@/lib/design-studio-v1/design-score";
import { getBrandDnaRules } from "@/lib/design-studio-v1/brand-dna";
import { runAiDesignGuardian } from "@/lib/design-studio-v1/ai-design-guardian";
import { runAiExperienceGuardian } from "@/lib/design-studio-v1/ai-experience-guardian";
import { searchVisualAssets } from "@/lib/design-studio-v1/global-search";
import { buildDependencyGraph } from "@/lib/design-studio-v1/dependency-graph";
import { buildVisualHealthReport } from "@/lib/design-studio-v1/visual-health";
import { buildExperienceHealthReport } from "@/lib/design-studio-v1/experience-health";
import { buildExperienceAnalyticsReport } from "@/lib/design-studio-v1/experience-analytics";
import { buildScreenRegistry } from "@/lib/design-studio-v1/screen-registry";
import { buildNavigationSurfaces } from "@/lib/design-studio-v1/navigation-manager";
import { getFeatureToggleCenter } from "@/lib/design-studio-v1/feature-toggle-center";
import { inspectDesignStudioAssets } from "@/lib/design-studio-v1/asset-inspector";
import { scanAssetOptimization } from "@/lib/design-studio-v1/asset-optimizer";
import { scanBrokenAssets } from "@/lib/design-studio-v1/asset-scanner";
import { scanDuplicateAssets } from "@/lib/design-studio-v1/duplicate-detector";
import { buildIconReplacePlan } from "@/lib/design-studio-v1/icon-replace-engine";
import { scanDesignStudioIcons } from "@/lib/design-studio-v1/icon-scanner";
import { getPublishCenterState } from "@/lib/design-studio-v1/publish-center";
import { XOS_MODULES } from "@/lib/design-studio-v1/xos-registry";
import type { ResponsivePreviewMode, XosSnapshot, PublishManifest } from "@/lib/design-studio-v1/types";
import { getDesignStudioVersionHistory } from "@/lib/design-studio-v1/version-control";
import { getPlatformVisualDraft } from "@/lib/platform-visual/reader";

const RESPONSIVE_MODES: ResponsivePreviewMode[] = [
  { id: "desktop", label: "Desktop", width: 1440, height: 900 },
  { id: "laptop", label: "Laptop", width: 1280, height: 800 },
  { id: "tablet", label: "Tablet", width: 1024, height: 768 },
  { id: "ipad", label: "iPad", width: 820, height: 1180 },
  { id: "iphone", label: "iPhone", width: 390, height: 844 },
  { id: "android", label: "Android", width: 412, height: 915 },
  { id: "pwa", label: "PWA", width: 390, height: 844 },
];

function buildPublishManifest(visualBundle: { version: number; updatedAt: string; label: string }): PublishManifest {
  return {
    assetManifest: `xos-assets-v${visualBundle.version}.json`,
    versionManifest: `xos-version-v${visualBundle.version}.json`,
    buildManifest: `xos-build-${visualBundle.updatedAt.slice(0, 10)}.json`,
    dependencyReport: `xos-dependencies-v${visualBundle.version}.json`,
    visualChangelog: [
      `Experience: ${visualBundle.label}`,
      `Version: ${visualBundle.version}`,
      `Updated: ${visualBundle.updatedAt}`,
      "Manifest: asset, version, build, dependency reports generated",
    ],
  };
}

async function buildXosCoreSnapshot() {
  const iconScan = scanDesignStudioIcons();
  const assetScan = scanBrokenAssets();
  const duplicateScan = scanDuplicateAssets();
  const assetInspector = inspectDesignStudioAssets();
  const assetOptimizer = scanAssetOptimization();
  const iconReplace = buildIconReplacePlan();
  const designAudit = runDesignStudioAudit();
  const guardian = runAiDesignGuardian();
  const experienceGuardian = runAiExperienceGuardian();
  const designScore = computeDesignScore({ iconScan, designAudit, assetOptimizer, guardian });
  const visualHealth = buildVisualHealthReport({
    iconScan,
    assetScan,
    assetOptimizer,
    designAudit,
    designScore,
    guardian,
  });
  const screens = buildScreenRegistry();
  const featureToggles = await getFeatureToggleCenter();

  return {
    iconScan,
    assetScan,
    duplicateScan,
    assetInspector,
    assetOptimizer,
    iconReplace,
    designAudit,
    guardian,
    experienceGuardian,
    designScore,
    visualHealth,
    screens,
    featureToggles,
    experienceAnalytics: buildExperienceAnalyticsReport(),
  };
}

export async function getXosSnapshot(): Promise<XosSnapshot> {
  const core = await buildXosCoreSnapshot();
  const experienceHealth = buildExperienceHealthReport({
    visualHealth: core.visualHealth,
    designScore: core.designScore,
    screens: core.screens,
    guardianFindings: core.experienceGuardian.findings.length,
    featureToggleEnabled: core.featureToggles.filter((f) => f.enabled).length,
    featureToggleTotal: core.featureToggles.length,
  });

  const [visualBundle, versionControl, publishCenter] = await Promise.all([
    getPlatformVisualDraft(),
    getDesignStudioVersionHistory(),
    getPublishCenterState(),
  ]);

  return {
    version: "enterprise-3.0.0",
    scannedAt: new Date().toISOString(),
    modules: XOS_MODULES,
    screens: core.screens,
    navigation: buildNavigationSurfaces(visualBundle.menus),
    featureToggles: core.featureToggles,
    experienceAnalytics: core.experienceAnalytics,
    experienceGuardian: core.experienceGuardian,
    experienceHealth,
    responsiveModes: RESPONSIVE_MODES,
    brandDna: getBrandDnaRules(),
    guardian: core.guardian,
    globalSearchIndex: searchVisualAssets({ query: "logo", limit: 20 }),
    dependencyGraph: buildDependencyGraph({ assetPath: "/icons/navigation/home.svg" }),
    visualHealth: core.visualHealth,
    iconScan: core.iconScan,
    assetScan: core.assetScan,
    duplicateScan: core.duplicateScan,
    assetInspector: core.assetInspector,
    assetOptimizer: core.assetOptimizer,
    iconReplace: core.iconReplace,
    designAudit: core.designAudit,
    designScore: core.designScore,
    designSystem: buildDesignSystemSummary(),
    versionControl,
    publishCenter,
    publishManifest: buildPublishManifest(visualBundle),
    visualBundle: {
      version: visualBundle.version,
      updatedAt: visualBundle.updatedAt,
      label: visualBundle.label,
    },
  };
}

/** @deprecated Use getXosSnapshot */
export const getDesignStudioSnapshot = getXosSnapshot;

export async function runFullXosRescan() {
  const core = await buildXosCoreSnapshot();
  const experienceHealth = buildExperienceHealthReport({
    visualHealth: core.visualHealth,
    designScore: core.designScore,
    screens: core.screens,
    guardianFindings: core.experienceGuardian.findings.length,
    featureToggleEnabled: core.featureToggles.filter((f) => f.enabled).length,
    featureToggleTotal: core.featureToggles.length,
  });

  return {
    ...core,
    experienceHealth,
    scannedAt: new Date().toISOString(),
  };
}

/** @deprecated Use runFullXosRescan */
export const runFullDesignStudioRescan = runFullXosRescan;
