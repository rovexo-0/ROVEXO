import { describe, expect, it } from "vitest";
import { createDefaultAssetManagerEngineDocument } from "@/lib/asset-manager-engine/defaults";
import {
  ASSET_MANAGER_LIBRARIES,
  getAssetManagerLibrary,
  registerAssetManagerLibrary,
} from "@/lib/asset-manager-engine/registry";
import {
  buildAssetManagerDashboard,
  buildAssetUsageMap,
  buildEnterpriseAssetCatalog,
  canPerformAssetAction,
  computeAssetManagerAnalytics,
  computeAssetStorageStats,
  detectDuplicateAssets,
  estimateOptimizationVariants,
  mapStudioAssetToEnterprise,
  searchEnterpriseAssets,
  validateEnterpriseAssets,
} from "@/lib/asset-manager-engine/timeline";
import { STUDIO_ASSET_LIBRARY } from "@/lib/platform-visual/studio-pro/assets";

const samplePremiumInventory = {
  scannedAt: new Date().toISOString(),
  designSystemVersion: "premium-design-system-v1",
  totals: { categories: 1, heroes: 1, emptyStates: 1, published: 2, missing: 1 },
  assets: [
    {
      id: "vehicles",
      category: "category" as const,
      label: "vehicles",
      sourcePath: "public/categories/source/vehicles.png",
      sourceBytes: 120000,
      published: true,
      formats: ["webp", "avif"],
      lastModified: "2026-01-01T00:00:00.000Z",
      version: "1",
    },
    {
      id: "move-store",
      category: "hero" as const,
      label: "move store",
      sourcePath: "public/hero/source/move-store.png",
      sourceBytes: 600000,
      published: false,
      formats: ["webp"],
      lastModified: null,
      version: "1",
    },
  ],
};

describe("asset manager engine", () => {
  it("creates default document with UK v1 configuration", () => {
    const doc = createDefaultAssetManagerEngineDocument();
    expect(doc.marketplaceVersion).toBe("ROVEXO v1.0");
    expect(doc.primaryCountry).toBe("United Kingdom");
    expect(doc.libraries.length).toBe(29);
    expect(doc.mediaManager.upload).toBe(true);
    expect(doc.security.superAdminPublish).toBe(true);
    expect(doc.integrations.visualCms).toBe(true);
  });

  it("registers all asset libraries", () => {
    const ids = ASSET_MANAGER_LIBRARIES.map((library) => library.id);
    expect(ids).toContain("logos");
    expect(ids).toContain("premium-photography");
    expect(ids).toContain("lottie-animations");
    expect(getAssetManagerLibrary("hero-banners")?.formats).toContain("avif");
  });

  it("builds enterprise asset catalog from premium and studio sources", () => {
    const assets = buildEnterpriseAssetCatalog({
      premiumInventory: samplePremiumInventory,
      studioAssets: STUDIO_ASSET_LIBRARY,
    });
    expect(assets.length).toBeGreaterThan(STUDIO_ASSET_LIBRARY.length);
    expect(assets.some((asset) => asset.libraryId === "hero-banners")).toBe(true);
  });

  it("maps studio assets to enterprise records", () => {
    const mapped = mapStudioAssetToEnterprise(STUDIO_ASSET_LIBRARY[0]);
    expect(mapped.name).toBeTruthy();
    expect(mapped.status).toBe("published");
    expect(mapped.approvalStatus).toBe("approved");
  });

  it("builds asset usage map", () => {
    const assets = buildEnterpriseAssetCatalog({
      premiumInventory: samplePremiumInventory,
      studioAssets: STUDIO_ASSET_LIBRARY,
    });
    const usage = buildAssetUsageMap(assets);
    expect(usage.some((entry) => entry.module === "homepage-hero")).toBe(true);
    expect(usage.some((entry) => entry.module === "category-rail")).toBe(true);
  });

  it("computes storage statistics", () => {
    const assets = buildEnterpriseAssetCatalog({
      premiumInventory: samplePremiumInventory,
      studioAssets: STUDIO_ASSET_LIBRARY,
    });
    const storage = computeAssetStorageStats(assets);
    expect(storage.totalAssets).toBeGreaterThan(0);
    expect(storage.compressionRatio).toBeGreaterThanOrEqual(0);
    expect(storage.largestAssets.length).toBeGreaterThan(0);
  });

  it("detects duplicate assets", () => {
    const assets = buildEnterpriseAssetCatalog({
      premiumInventory: samplePremiumInventory,
      studioAssets: STUDIO_ASSET_LIBRARY,
    });
    const duplicates = detectDuplicateAssets(assets);
    expect(Array.isArray(duplicates)).toBe(true);
  });

  it("validates assets and reports issues", () => {
    const assets = buildEnterpriseAssetCatalog({
      premiumInventory: samplePremiumInventory,
      studioAssets: STUDIO_ASSET_LIBRARY,
    });
    const issues = validateEnterpriseAssets(assets);
    expect(issues.some((issue) => issue.type === "missing" || issue.type === "oversized")).toBe(true);
  });

  it("searches assets by query and file type", () => {
    const assets = buildEnterpriseAssetCatalog({
      premiumInventory: samplePremiumInventory,
      studioAssets: STUDIO_ASSET_LIBRARY,
    });
    const results = searchEnterpriseAssets(assets, { query: "hero", fileType: "avif" });
    expect(results.every((asset) => asset.format === "avif")).toBe(true);
  });

  it("builds dashboard and analytics", () => {
    const doc = createDefaultAssetManagerEngineDocument();
    const assets = buildEnterpriseAssetCatalog({
      premiumInventory: samplePremiumInventory,
      studioAssets: STUDIO_ASSET_LIBRARY,
    });
    const validation = validateEnterpriseAssets(assets);
    const storage = computeAssetStorageStats(assets);
    const dashboard = buildAssetManagerDashboard({ config: doc, assets, validation, storage });
    expect(dashboard.assetScore).toBeGreaterThan(40);
    expect(computeAssetManagerAnalytics({ config: doc }).optimizationEnabled).toBeGreaterThan(0);
  });

  it("enforces permissions and optimization variants", () => {
    const doc = createDefaultAssetManagerEngineDocument();
    expect(canPerformAssetAction(doc, "superAdminUpload")).toBe(true);
    expect(canPerformAssetAction(doc, "superAdminBulkOps")).toBe(true);
    expect(estimateOptimizationVariants(doc)).toContain("webp");
    expect(estimateOptimizationVariants(doc)).toContain("avif");
  });

  it("registers library updates", () => {
    const next = registerAssetManagerLibrary({
      id: "logos",
      label: "Logos Pro",
      icon: "🏷️",
      description: "Updated logos library",
      formats: ["svg", "png"],
    });
    expect(next.find((library) => library.id === "logos")?.label).toBe("Logos Pro");
  });
});
