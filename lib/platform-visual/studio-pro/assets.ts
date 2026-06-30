import type { StudioAssetItem } from "@/lib/platform-visual/studio-pro/types";

/** Curated asset inventory from existing ROVEXO premium pipelines. */
export const STUDIO_ASSET_LIBRARY: StudioAssetItem[] = [
  { id: "hero-move-store", name: "Move Store Campaign", format: "avif", src: "/hero/move-store/move-store-1440.avif", folder: "Hero", tags: ["hero", "campaign"], favorite: true },
  { id: "hero-zero-fees", name: "Zero Fees Campaign", format: "avif", src: "/hero/zero-fees/zero-fees-1440.avif", folder: "Hero", tags: ["hero", "campaign"], favorite: false },
  { id: "cat-vehicles", name: "Vehicles Icon", format: "png", src: "/categories/vehicles.png", folder: "Categories", tags: ["category", "3d"], favorite: true },
  { id: "cat-electronics", name: "Electronics Icon", format: "png", src: "/categories/electronics.png", folder: "Categories", tags: ["category", "3d"], favorite: false },
  { id: "empty-auctions", name: "Auctions Empty State", format: "webp", src: "/assets/empty-states/auctions.webp", folder: "Empty States", tags: ["empty-state", "illustration"], favorite: false },
  { id: "empty-messages", name: "Messages Empty State", format: "webp", src: "/assets/empty-states/messages.webp", folder: "Empty States", tags: ["empty-state", "illustration"], favorite: false },
  { id: "logo-mark", name: "ROVEXO Mark", format: "png", src: "/icon.png", folder: "Logos", tags: ["logo", "brand"], favorite: true },
];

export function searchStudioAssets(query: string, assets: StudioAssetItem[] = STUDIO_ASSET_LIBRARY): StudioAssetItem[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return assets;
  return assets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(normalized) ||
      asset.folder.toLowerCase().includes(normalized) ||
      asset.tags.some((tag) => tag.includes(normalized)),
  );
}

export function favoriteStudioAssets(assets: StudioAssetItem[] = STUDIO_ASSET_LIBRARY): StudioAssetItem[] {
  return assets.filter((asset) => asset.favorite);
}
