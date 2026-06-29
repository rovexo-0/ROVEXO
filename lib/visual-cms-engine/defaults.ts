import {
  VISUAL_CMS_BUILDER_IDS,
  VISUAL_CMS_CANVAS_ELEMENT_IDS,
} from "@/lib/visual-cms-engine/registry";
import type {
  VisualCmsEngineDocument,
  VisualCmsEngineHistoryEntry,
  VisualCmsBuilderId,
  VisualCmsCanvasElementId,
} from "@/lib/visual-cms-engine/types";

const now = () => new Date().toISOString();

export function createDefaultVisualCmsEngineDocument(
  label = "ROVEXO Visual CMS",
): VisualCmsEngineDocument {
  return {
    version: 1,
    updatedAt: now(),
    label,
    marketplaceVersion: "ROVEXO v1.0",
    primaryCountry: "United Kingdom",
    currency: "GBP",
    activeThemeLabel: "Live",
    publishStage: "draft",
    builders: VISUAL_CMS_BUILDER_IDS.map((b) => ({
      id: b.id as VisualCmsBuilderId,
      label: b.label,
      enabled: true,
    })),
    canvasElements: VISUAL_CMS_CANVAS_ELEMENT_IDS.map((e) => ({
      id: e.id as VisualCmsCanvasElementId,
      label: e.label,
      enabled: true,
    })),
    pixelEditor: {
      width: true,
      height: true,
      padding: true,
      margin: true,
      gap: true,
      borderRadius: true,
      opacity: true,
      rotation: true,
      typography: true,
      alignment: true,
      zIndex: true,
      visibility: true,
      responsiveVisibility: true,
      hoverState: true,
      darkModeOverride: true,
      animation: true,
      transition: true,
      shadow: true,
      blur: true,
      backdropBlur: true,
    },
    componentLibrary: {
      duplicate: true,
      rename: true,
      group: true,
      lock: true,
      hide: true,
      archive: true,
      favorite: true,
      clone: true,
      export: true,
      import: true,
      templateSave: true,
    },
    performance: {
      optimizeImages: true,
      optimizeSvg: true,
      optimizeFonts: true,
      responsiveImages: true,
      lazyLoading: true,
      clsSafeRendering: true,
      productionBundles: true,
    },
    security: {
      superAdminPublish: true,
      superAdminRollback: true,
      superAdminDeleteThemes: true,
      superAdminGlobalLayout: true,
      superAdminAssetLibrary: true,
      superAdminThemeVariables: true,
      auditProtected: true,
    },
    integrations: {
      missionControl: true,
      platformStudio: true,
      themeStudioPro: true,
      enterpriseCore: true,
      developerCenter: true,
      assetManager: true,
      visualRegistry: true,
      operationsCenter: true,
      recoveryCenter: true,
    },
    previewBreakpoints: ["desktop", "laptop", "tablet", "android", "iphone", "ultrawide"],
    futureReady: ["Split-screen preview", "Theme compare diff", "AI layout suggestions"],
    auditLog: [],
  };
}

export function createDefaultVisualCmsEngineHistory(): VisualCmsEngineHistoryEntry[] {
  return [];
}
