import { STUDIO_ASSET_LIBRARY } from "@/lib/platform-visual/studio-pro/assets";
import { getPremiumAssetInventory } from "@/lib/super-admin/premium-design/inventory";
import {
  getAssetManagerEngineSnapshotForAdmin,
  readLiveAssetManagerEngineDocument,
} from "@/lib/asset-manager-engine/engine";
import { ASSET_MANAGER_LIBRARIES } from "@/lib/asset-manager-engine/registry";
import {
  buildAssetManagerDashboard,
  buildAssetUsageMap,
  buildEnterpriseAssetCatalog,
  computeAssetManagerAnalytics,
  computeAssetStorageStats,
  searchEnterpriseAssets,
  validateEnterpriseAssets,
} from "@/lib/asset-manager-engine/timeline";
import type {
  AssetManagerEngineSnapshot,
  AssetSearchFilters,
} from "@/lib/asset-manager-engine/types";

export async function getAssetManagerEngineSnapshot(): Promise<AssetManagerEngineSnapshot> {
  const [{ draft, live, history }, premiumInventory] = await Promise.all([
    getAssetManagerEngineSnapshotForAdmin(),
    getPremiumAssetInventory(),
  ]);

  const assets = buildEnterpriseAssetCatalog({
    premiumInventory,
    studioAssets: STUDIO_ASSET_LIBRARY,
  });
  const usage = buildAssetUsageMap(assets);
  const validation = validateEnterpriseAssets(assets);
  const storage = computeAssetStorageStats(assets);

  return {
    scannedAt: new Date().toISOString(),
    libraries: ASSET_MANAGER_LIBRARIES,
    assets,
    usage,
    validation,
    storage,
    draft,
    live,
    history,
  };
}

export async function getPublicAssetManagerEngineConfig() {
  return readLiveAssetManagerEngineDocument();
}

export async function getAssetManagerPageData() {
  const snapshot = await getAssetManagerEngineSnapshot();
  const dashboard = buildAssetManagerDashboard({
    config: snapshot.live,
    assets: snapshot.assets,
    validation: snapshot.validation,
    storage: snapshot.storage,
  });
  const analytics = computeAssetManagerAnalytics({ config: snapshot.live });

  return { snapshot, dashboard, analytics };
}

export async function searchAssetManagerAssets(filters: AssetSearchFilters) {
  const snapshot = await getAssetManagerEngineSnapshot();
  return {
    scannedAt: new Date().toISOString(),
    results: searchEnterpriseAssets(snapshot.assets, filters),
    total: snapshot.assets.length,
  };
}

export async function getAssetManagerUsageMap() {
  const snapshot = await getAssetManagerEngineSnapshot();
  return {
    scannedAt: snapshot.scannedAt,
    usage: snapshot.usage,
    assets: snapshot.assets,
  };
}

export async function getAssetManagerHistoryData() {
  const snapshot = await getAssetManagerEngineSnapshot();
  return {
    scannedAt: snapshot.scannedAt,
    cmsHistory: snapshot.history,
    assets: snapshot.assets.filter((asset) => asset.version > 0),
  };
}

export async function getAssetManagerStorageData() {
  const snapshot = await getAssetManagerEngineSnapshot();
  return {
    scannedAt: snapshot.scannedAt,
    storage: snapshot.storage,
    validation: snapshot.validation,
  };
}
