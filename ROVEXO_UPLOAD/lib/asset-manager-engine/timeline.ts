import type { PremiumAssetInventory, PremiumAssetRecord } from "@/lib/super-admin/premium-design/inventory";
import type { StudioAssetItem } from "@/lib/platform-visual/studio-pro/types";
import type {
  AssetManagerEngineAnalytics,
  AssetManagerEngineDashboard,
  AssetManagerEngineDocument,
  AssetSearchFilters,
  AssetStorageStats,
  AssetUsageEntry,
  AssetValidationIssue,
  EnterpriseAssetRecord,
} from "@/lib/asset-manager-engine/types";

const OVERSIZED_BYTES = 500_000;

function mapPremiumCategory(
  category: PremiumAssetRecord["category"],
): EnterpriseAssetRecord["libraryId"] {
  if (category === "hero") return "hero-banners";
  if (category === "category") return "category-images";
  return "empty-state-graphics";
}

export function mapStudioAssetToEnterprise(asset: StudioAssetItem): EnterpriseAssetRecord {
  const libraryMap: Record<string, EnterpriseAssetRecord["libraryId"]> = {
    Hero: "hero-banners",
    Categories: "category-images",
    "Empty States": "empty-state-graphics",
    Logos: "logos",
  };

  return {
    id: asset.id,
    name: asset.name,
    libraryId: libraryMap[asset.folder] ?? "homepage-assets",
    format: asset.format,
    src: asset.src,
    folder: asset.folder,
    tags: asset.tags,
    description: `${asset.name} — ${asset.folder}`,
    language: "en-GB",
    country: "United Kingdom",
    brand: "ROVEXO",
    version: 1,
    status: "published",
    approvalStatus: "approved",
    usageCount: asset.favorite ? 3 : 1,
    bytes: 0,
    favorite: asset.favorite,
  };
}

export function mapPremiumAssetToEnterprise(asset: PremiumAssetRecord): EnterpriseAssetRecord {
  return {
    id: asset.id,
    name: asset.label,
    libraryId: mapPremiumCategory(asset.category),
    format: asset.formats[0] ?? "webp",
    src: `/${asset.sourcePath.replace(/^public\//, "")}`,
    folder: asset.category,
    tags: [asset.category, asset.published ? "published" : "missing"],
    description: asset.label,
    language: "en-GB",
    country: "United Kingdom",
    brand: "ROVEXO",
    version: 1,
    status: asset.published ? "published" : "draft",
    approvalStatus: asset.published ? "approved" : "pending",
    usageCount: asset.published ? 2 : 0,
    bytes: asset.sourceBytes,
    lastModified: asset.lastModified ?? undefined,
  };
}

export function buildEnterpriseAssetCatalog(input: {
  premiumInventory: PremiumAssetInventory;
  studioAssets: StudioAssetItem[];
}): EnterpriseAssetRecord[] {
  const premium = input.premiumInventory.assets.map(mapPremiumAssetToEnterprise);
  const studio = input.studioAssets.map(mapStudioAssetToEnterprise);
  const merged = new Map<string, EnterpriseAssetRecord>();
  for (const asset of [...premium, ...studio]) {
    merged.set(asset.id, asset);
  }
  return [...merged.values()];
}

export function buildAssetUsageMap(assets: EnterpriseAssetRecord[]): AssetUsageEntry[] {
  const usage: AssetUsageEntry[] = [];

  for (const asset of assets) {
    if (asset.libraryId === "hero-banners") {
      usage.push({ assetId: asset.id, module: "homepage-hero", location: "Homepage Hero", href: "/" });
    }
    if (asset.libraryId === "category-images") {
      usage.push({ assetId: asset.id, module: "category-rail", location: "Category Rail", href: "/categories" });
    }
    if (asset.libraryId === "empty-state-graphics") {
      usage.push({ assetId: asset.id, module: "listings", location: "Empty States", href: "/search" });
    }
    if (asset.folder === "Logos") {
      usage.push({ assetId: asset.id, module: "header", location: "Header Logo", href: "/" });
      usage.push({ assetId: asset.id, module: "footer", location: "Footer Logo", href: "/" });
    }
    if (asset.tags.includes("hero")) {
      usage.push({ assetId: asset.id, module: "marketing", location: "Marketing", href: "/super-admin/banners" });
    }
  }

  return usage;
}

export function detectDuplicateAssets(assets: EnterpriseAssetRecord[]): EnterpriseAssetRecord[] {
  const seen = new Map<string, EnterpriseAssetRecord>();
  const duplicates: EnterpriseAssetRecord[] = [];

  for (const asset of assets) {
    const key = `${asset.name.toLowerCase()}-${asset.format}`;
    const existing = seen.get(key);
    if (existing) {
      duplicates.push(asset, existing);
    } else {
      seen.set(key, asset);
    }
  }

  return [...new Map(duplicates.map((asset) => [asset.id, asset])).values()];
}

export function validateEnterpriseAssets(assets: EnterpriseAssetRecord[]): AssetValidationIssue[] {
  const issues: AssetValidationIssue[] = [];
  const duplicates = new Set(detectDuplicateAssets(assets).map((asset) => asset.id));

  for (const asset of assets) {
    if (asset.status === "draft" && asset.approvalStatus === "pending") {
      issues.push({
        id: `missing-${asset.id}`,
        assetId: asset.id,
        type: "missing",
        severity: "warning",
        message: `${asset.name} is not published.`,
      });
    }
    if (asset.bytes > OVERSIZED_BYTES) {
      issues.push({
        id: `oversized-${asset.id}`,
        assetId: asset.id,
        type: "oversized",
        severity: "warning",
        message: `${asset.name} exceeds recommended size.`,
      });
    }
    if (duplicates.has(asset.id)) {
      issues.push({
        id: `duplicate-${asset.id}`,
        assetId: asset.id,
        type: "duplicate",
        severity: "info",
        message: `${asset.name} appears duplicated.`,
      });
    }
    if (asset.usageCount === 0) {
      issues.push({
        id: `unused-${asset.id}`,
        assetId: asset.id,
        type: "unused",
        severity: "info",
        message: `${asset.name} is unused.`,
      });
    }
    if (asset.libraryId === "hero-banners" && !asset.src.includes(".avif") && !asset.src.includes(".webp")) {
      issues.push({
        id: `responsive-${asset.id}`,
        assetId: asset.id,
        type: "missing-responsive",
        severity: "warning",
        message: `${asset.name} missing responsive variants.`,
      });
    }
  }

  return issues;
}

export function computeAssetStorageStats(assets: EnterpriseAssetRecord[]): AssetStorageStats {
  const totalBytes = assets.reduce((sum, asset) => sum + asset.bytes, 0);
  const sortedBySize = [...assets].sort((a, b) => b.bytes - a.bytes);
  const sortedByUsage = [...assets].sort((a, b) => b.usageCount - a.usageCount);
  const unusedAssets = assets.filter((asset) => asset.usageCount === 0);
  const duplicateAssets = detectDuplicateAssets(assets);
  const optimizationSavingsBytes = Math.round(totalBytes * 0.35);

  return {
    totalAssets: assets.length,
    storageUsedBytes: totalBytes,
    freeSpaceBytes: Math.max(0, 1_000_000_000 - totalBytes),
    largestAssets: sortedBySize.slice(0, 5),
    mostUsedAssets: sortedByUsage.slice(0, 5),
    unusedAssets: unusedAssets.slice(0, 10),
    duplicateAssets: duplicateAssets.slice(0, 10),
    optimizationSavingsBytes,
    compressionRatio: totalBytes > 0 ? Number((optimizationSavingsBytes / totalBytes).toFixed(2)) : 0,
  };
}

export function searchEnterpriseAssets(
  assets: EnterpriseAssetRecord[],
  filters: AssetSearchFilters,
): EnterpriseAssetRecord[] {
  const query = filters.query?.trim().toLowerCase() ?? "";

  return assets.filter((asset) => {
    if (query) {
      const haystack = `${asset.name} ${asset.tags.join(" ")} ${asset.folder} ${asset.description ?? ""}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (filters.tag && !asset.tags.includes(filters.tag)) return false;
    if (filters.fileType && asset.format !== filters.fileType) return false;
    if (filters.libraryId && asset.libraryId !== filters.libraryId) return false;
    if (filters.status && asset.status !== filters.status) return false;
    if (filters.author && asset.author !== filters.author) return false;
    if (filters.color && asset.color !== filters.color) return false;
    if (filters.orientation && asset.orientation !== filters.orientation) return false;
    if (typeof filters.minBytes === "number" && asset.bytes < filters.minBytes) return false;
    if (typeof filters.maxBytes === "number" && asset.bytes > filters.maxBytes) return false;
    return true;
  });
}

export function countEnabledFlags(flags: Record<string, boolean>): number {
  return Object.values(flags).filter(Boolean).length;
}

export function countEnabledItems<T extends { enabled: boolean }>(items: T[]): number {
  return items.filter((item) => item.enabled).length;
}

export function buildAssetManagerDashboard(input: {
  config: AssetManagerEngineDocument;
  assets: EnterpriseAssetRecord[];
  validation: AssetValidationIssue[];
  storage: AssetStorageStats;
}): AssetManagerEngineDashboard {
  const publishedAssets = input.assets.filter((asset) => asset.status === "published").length;
  const librariesEnabled = countEnabledItems(input.config.libraries);

  let assetScore = 40;
  if (publishedAssets >= 10) assetScore += 20;
  if (librariesEnabled >= 20) assetScore += 15;
  if (input.validation.length < 5) assetScore += 10;
  if (countEnabledFlags(input.config.optimization) >= 6) assetScore += 10;
  if (input.config.security.auditProtected) assetScore += 5;

  return {
    assetScore: Math.min(100, assetScore),
    totalAssets: input.assets.length,
    publishedAssets,
    librariesEnabled,
    validationIssues: input.validation.length,
    storageUsedMb: Math.round(input.storage.storageUsedBytes / (1024 * 1024)),
  };
}

export function computeAssetManagerAnalytics(input: {
  config: AssetManagerEngineDocument;
}): AssetManagerEngineAnalytics {
  const imageIds = new Set([
    "png",
    "jpg",
    "webp",
    "avif",
    "svg",
    "icons",
    "hero-banners",
    "category-images",
    "premium-photography",
  ]);
  const mediaIds = new Set(["videos", "audio", "lottie-animations", "fonts"]);
  const brandIds = new Set(["logos", "brand-assets", "marketing-assets", "seasonal-assets"]);
  const enabled = input.config.libraries.filter((library) => library.enabled).map((library) => library.id);

  return {
    imageLibraries: enabled.filter((id) => imageIds.has(id)).length,
    mediaLibraries: enabled.filter((id) => mediaIds.has(id)).length,
    brandLibraries: enabled.filter((id) => brandIds.has(id)).length,
    optimizationEnabled: countEnabledFlags(input.config.optimization),
    validationEnabled: countEnabledFlags(input.config.validation),
    securityFeatures: countEnabledFlags(input.config.security),
  };
}

export function canPerformAssetAction(
  config: AssetManagerEngineDocument,
  action: keyof AssetManagerEngineDocument["security"],
): boolean {
  return config.security[action];
}

export function estimateOptimizationVariants(config: AssetManagerEngineDocument): string[] {
  return Object.entries(config.optimization)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key);
}
