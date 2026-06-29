import { ASSET_MANAGER_LIBRARY_IDS } from "@/lib/asset-manager-engine/registry";
import type {
  AssetBrandKit,
  AssetLibraryId,
  AssetManagerEngineDocument,
  AssetManagerEngineHistoryEntry,
} from "@/lib/asset-manager-engine/types";

const now = () => new Date().toISOString();

export function createDefaultAssetBrandKit(): AssetBrandKit {
  return {
    primaryLogo: "/icon.png",
    secondaryLogo: "/icon.png",
    darkLogo: "/icon.png",
    lightLogo: "/icon.png",
    favicon: "/favicon.ico",
    appIcon: "/icon.png",
    socialLogo: "/icon.png",
    brandColors: ["#2563eb", "#0f172a", "#ffffff"],
    typography: { heading: "var(--ds-font-sans)", body: "var(--ds-font-sans)" },
    guidelines: "ROVEXO premium design system v1 — production assets only.",
  };
}

export function createDefaultAssetManagerEngineDocument(
  label = "ROVEXO Asset Manager",
): AssetManagerEngineDocument {
  return {
    version: 1,
    updatedAt: now(),
    label,
    marketplaceVersion: "ROVEXO v1.0",
    primaryCountry: "United Kingdom",
    currency: "GBP",
    libraries: ASSET_MANAGER_LIBRARY_IDS.map((library) => ({
      id: library.id as AssetLibraryId,
      label: library.label,
      enabled: true,
    })),
    mediaManager: {
      upload: true,
      dragDrop: true,
      rename: true,
      replace: true,
      duplicate: true,
      move: true,
      copy: true,
      archive: true,
      restore: true,
      delete: true,
      restorePreviousVersion: true,
      clone: true,
      export: true,
      import: true,
      bulkUpload: true,
      bulkDelete: true,
      bulkReplace: true,
      bulkOptimize: true,
    },
    optimization: {
      webp: true,
      avif: true,
      responsiveSizes: true,
      thumbnail: true,
      tabletSize: true,
      desktopSize: true,
      retinaSize: true,
      compressedVersion: true,
      cdnReady: true,
    },
    validation: {
      brokenReferences: true,
      missingAssets: true,
      duplicateAssets: true,
      unusedAssets: true,
      oversizedFiles: true,
      wrongDimensions: true,
      corruptedFiles: true,
      missingResponsiveVariants: true,
    },
    security: {
      superAdminUpload: true,
      superAdminDelete: true,
      superAdminPublish: true,
      superAdminRollback: true,
      superAdminReplaceGlobal: true,
      superAdminBulkOps: true,
      auditProtected: true,
    },
    brandKit: createDefaultAssetBrandKit(),
    integrations: {
      missionControl: true,
      enterpriseCore: true,
      platformStudio: true,
      themeStudioPro: true,
      developerCenter: true,
      visualCms: true,
      operationsCenter: true,
      recoveryCenter: true,
      globalSearch: true,
    },
    futureReady: ["AI asset tagging", "Automatic alt-text", "Cross-region CDN sync"],
    auditLog: [],
  };
}

export function createDefaultAssetManagerEngineHistory(): AssetManagerEngineHistoryEntry[] {
  return [];
}
