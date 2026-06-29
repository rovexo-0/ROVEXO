import { STUDIO_ASSET_LIBRARY } from "@/lib/platform-visual/studio-pro/assets";
import { STUDIO_COMPONENT_LIBRARY } from "@/lib/platform-visual/studio-pro/defaults";
import type { PlatformVisualHistoryEntry } from "@/lib/platform-visual/types";
import type {
  VisualCmsBuilder,
  VisualCmsEngineAnalytics,
  VisualCmsEngineDashboard,
  VisualCmsEngineDocument,
} from "@/lib/visual-cms-engine/types";

export function countEnabledFlags(flags: Record<string, boolean>): number {
  return Object.values(flags).filter(Boolean).length;
}

export function countEnabledItems<T extends { enabled: boolean }>(items: T[]): number {
  return items.filter((item) => item.enabled).length;
}

export function buildVisualCmsDashboard(input: {
  config: VisualCmsEngineDocument;
  themeHistory: PlatformVisualHistoryEntry[];
  assetCount?: number;
}): VisualCmsEngineDashboard {
  const buildersEnabled = countEnabledItems(input.config.builders);
  const canvasElementsEnabled = countEnabledItems(input.config.canvasElements);
  const themesPublished = input.themeHistory.length;
  const rollbackAvailable = input.themeHistory.some((entry) => entry.rollbackAvailable);

  let designScore = 45;
  if (buildersEnabled >= 20) designScore += 20;
  if (canvasElementsEnabled >= 25) designScore += 15;
  if (countEnabledFlags(input.config.performance) >= 5) designScore += 10;
  if (input.config.security.auditProtected) designScore += 5;
  if (themesPublished > 0) designScore += 5;

  return {
    designScore: Math.min(100, designScore),
    buildersEnabled,
    canvasElementsEnabled,
    assetsIndexed: input.assetCount ?? STUDIO_ASSET_LIBRARY.length,
    themesPublished,
    rollbackAvailable,
  };
}

export function computeVisualCmsAnalytics(input: {
  builders: VisualCmsBuilder[];
  config: VisualCmsEngineDocument;
}): VisualCmsEngineAnalytics {
  const enabledIds = new Set(input.config.builders.filter((b) => b.enabled).map((b) => b.id));
  const enabledBuilders = input.builders.filter((b) => enabledIds.has(b.id));

  return {
    layoutBuilders: enabledBuilders.filter((b) => b.category === "layout").length,
    commerceBuilders: enabledBuilders.filter((b) => b.category === "commerce").length,
    accountBuilders: enabledBuilders.filter((b) => b.category === "account").length,
    systemBuilders: enabledBuilders.filter((b) => b.category === "system").length,
    themeBuilders: enabledBuilders.filter((b) => b.category === "theme").length,
    performanceFeatures: countEnabledFlags(input.config.performance),
    securityFeatures: countEnabledFlags(input.config.security),
  };
}

export function filterEnabledBuilders(
  builders: VisualCmsBuilder[],
  config: VisualCmsEngineDocument,
): VisualCmsBuilder[] {
  const enabledIds = new Set(config.builders.filter((b) => b.enabled).map((b) => b.id));
  return builders.filter((b) => enabledIds.has(b.id));
}

export function filterEnabledCanvasElements(
  elements: VisualCmsEngineDocument["canvasElements"],
  config: VisualCmsEngineDocument,
) {
  return elements.filter((e) => e.enabled);
}

export function canPublishVisualCms(config: VisualCmsEngineDocument): boolean {
  return config.security.superAdminPublish && config.publishStage !== "published";
}

export function canRollbackVisualCms(config: VisualCmsEngineDocument): boolean {
  return config.security.superAdminRollback;
}

export function getPublishWorkflowStages(): VisualCmsEngineDocument["publishStage"][] {
  return ["draft", "preview", "compare-live", "approve", "published"];
}

export function getComponentLibraryActions(config: VisualCmsEngineDocument): string[] {
  return Object.entries(config.componentLibrary)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key);
}

export function getPixelEditorCapabilities(config: VisualCmsEngineDocument): string[] {
  return Object.entries(config.pixelEditor)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key);
}

export function estimateCanvasNodeCapacity(config: VisualCmsEngineDocument): number {
  const enabledElements = countEnabledItems(config.canvasElements);
  const enabledComponents = STUDIO_COMPONENT_LIBRARY.length;
  return enabledElements + enabledComponents;
}
