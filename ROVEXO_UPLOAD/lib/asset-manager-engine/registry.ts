import type { AssetLibraryDefinition, AssetLibraryId } from "@/lib/asset-manager-engine/types";

export const ASSET_MANAGER_LIBRARIES: AssetLibraryDefinition[] = [
  { id: "logos", label: "Logos", icon: "🏷️", description: "Brand and product logos", formats: ["svg", "png", "webp"] },
  { id: "icons", label: "Icons", icon: "✨", description: "UI and navigation icons", formats: ["svg", "png", "webp"] },
  { id: "svg", label: "SVG", icon: "◇", description: "Scalable vector graphics", formats: ["svg"] },
  { id: "png", label: "PNG", icon: "🖼️", description: "Lossless raster images", formats: ["png"] },
  { id: "webp", label: "WEBP", icon: "🖼️", description: "Optimized web images", formats: ["webp"] },
  { id: "jpg", label: "JPG", icon: "🖼️", description: "Photography and banners", formats: ["jpg", "jpeg"] },
  { id: "avif", label: "AVIF", icon: "🖼️", description: "Next-gen compressed images", formats: ["avif"] },
  { id: "hero-banners", label: "Hero Banners", icon: "🎞️", description: "Homepage hero campaigns", formats: ["avif", "webp", "png"] },
  { id: "homepage-assets", label: "Homepage Assets", icon: "🏠", description: "Homepage section imagery", formats: ["avif", "webp", "png"] },
  { id: "category-images", label: "Category Images", icon: "📁", description: "Category rail icons and tiles", formats: ["webp", "avif", "png"] },
  { id: "listing-placeholders", label: "Listing Placeholders", icon: "📋", description: "Listing fallback imagery", formats: ["webp", "png"] },
  { id: "product-placeholders", label: "Product Placeholders", icon: "🏷️", description: "Product card fallbacks", formats: ["webp", "png"] },
  { id: "profile-images", label: "Profile Images", icon: "👤", description: "User profile avatars", formats: ["webp", "png", "jpg"] },
  { id: "business-images", label: "Business Images", icon: "🏢", description: "Business storefront imagery", formats: ["webp", "png", "jpg"] },
  { id: "premium-photography", label: "Premium Photography", icon: "📸", description: "Production photography pipeline", formats: ["avif", "webp", "png"] },
  { id: "background-images", label: "Background Images", icon: "🌄", description: "Section backgrounds", formats: ["webp", "avif", "jpg"] },
  { id: "wallpapers", label: "Wallpapers", icon: "🖥️", description: "Large format backgrounds", formats: ["webp", "jpg"] },
  { id: "illustrations", label: "Illustrations", icon: "🎨", description: "Marketing illustrations", formats: ["svg", "webp", "png"] },
  { id: "empty-state-graphics", label: "Empty State Graphics", icon: "🖼️", description: "Empty state illustrations", formats: ["webp", "png"] },
  { id: "stickers", label: "Stickers", icon: "🏷️", description: "Sticker packs and badges", formats: ["png", "webp"] },
  { id: "emoji", label: "Emoji", icon: "😀", description: "Emoji assets", formats: ["png", "webp"] },
  { id: "flags", label: "Flags", icon: "🏳️", description: "Country and locale flags", formats: ["svg", "png"] },
  { id: "fonts", label: "Fonts", icon: "🔤", description: "Typography assets", formats: ["woff2", "woff", "ttf"] },
  { id: "videos", label: "Videos", icon: "🎥", description: "Video assets", formats: ["mp4", "webm"] },
  { id: "audio", label: "Audio", icon: "🔊", description: "Sound effects and audio", formats: ["mp3", "wav", "ogg"] },
  { id: "lottie-animations", label: "Lottie Animations", icon: "🎬", description: "Motion graphics", formats: ["json", "lottie"] },
  { id: "brand-assets", label: "Brand Assets", icon: "🏷️", description: "Brand kit resources", formats: ["svg", "png", "webp"] },
  { id: "marketing-assets", label: "Marketing Assets", icon: "📣", description: "Campaign and promo assets", formats: ["webp", "png", "jpg"] },
  { id: "seasonal-assets", label: "Seasonal Assets", icon: "🎄", description: "Seasonal and event assets", formats: ["webp", "png", "avif"] },
];

export const ASSET_MANAGER_LIBRARY_IDS = ASSET_MANAGER_LIBRARIES.map((library) => ({
  id: library.id,
  label: library.label,
}));

export function registerAssetManagerLibrary(library: AssetLibraryDefinition): AssetLibraryDefinition[] {
  const index = ASSET_MANAGER_LIBRARIES.findIndex((item) => item.id === library.id);
  if (index >= 0) {
    const next = [...ASSET_MANAGER_LIBRARIES];
    next[index] = library;
    return next;
  }
  return [...ASSET_MANAGER_LIBRARIES, library];
}

export function getAssetManagerLibrary(id: AssetLibraryId | string): AssetLibraryDefinition | undefined {
  return ASSET_MANAGER_LIBRARIES.find((item) => item.id === id);
}
