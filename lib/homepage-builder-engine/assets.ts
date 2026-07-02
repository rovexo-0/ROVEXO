import type { HomepageAssetReference } from "@/lib/homepage-builder-engine/types";

export const ASSET_MANAGER_BASE = "/super-admin/assets";
export const VISUAL_CMS_BASE = "/super-admin/visual-cms";

export function buildAssetReferences(enabled: boolean): HomepageAssetReference[] {
  if (!enabled) return [];
  return [
    { id: "asset-hero-1", url: "/assets/hero-banner.webp", type: "image", source: "asset-manager" },
    { id: "asset-gallery-1", url: "/assets/gallery-01.webp", type: "image", source: "asset-manager" },
    { id: "asset-video-1", url: "/assets/promo-loop.mp4", type: "video", source: "visual-cms" },
  ];
}

export function resolveAssetUrl(ref: HomepageAssetReference): string {
  return ref.url;
}

export function linkAssetToSection(sectionId: string, assetId: string): { sectionId: string; assetId: string; linkedAt: string } {
  return { sectionId, assetId, linkedAt: new Date().toISOString() };
}

export function getIntegrationEndpoints() {
  return {
    assetManager: `${ASSET_MANAGER_BASE}/library`,
    visualCms: `${VISUAL_CMS_BASE}`,
    storageEngine: "/api/super-admin/assets",
  };
}
