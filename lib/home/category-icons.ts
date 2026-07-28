import type { HomeCategoryIconType } from "@/lib/home/constants";

/** Maps marketplace category slugs to premium 3D icon types (no photo backgrounds). */
const SLUG_ICON_MAP: Record<string, HomeCategoryIconType> = {
  vehicles: "vehicles",
  property: "property",
  electronics: "electronics",
  fashion: "fashion",
  "home-garden": "home-garden",
  diy: "diy",
  tools: "tools",
  sports: "sports",
  health: "health",
  beauty: "beauty",
  pets: "pets",
  "baby-kids": "baby",
  toys: "baby",
  music: "more",
  movies: "more",
  gaming: "gaming",
  "womens-fashion": "womens-fashion",
  "mens-fashion": "mens-fashion",
  "kids-fashion": "kids-fashion",
  shoes: "shoes",
  jewellery: "jewellery",
  "car-parts": "autoparts",
  autoparts: "autoparts",
  phones: "phones",
  computers: "computers",
  collectibles: "collectibles",
  books: "books",
  business: "wholesale",
  jobs: "jobs",
  services: "services",
  tickets: "more",
  food: "more",
  office: "more",
  industrial: "tools",
  agriculture: "home-garden",
  travel: "more",
  events: "more",
  "free-stuff": "more",
  "everything-else": "more",
  kids: "kids-fashion",
};

export function resolveCategoryIconType(slug: string): HomeCategoryIconType {
  return SLUG_ICON_MAP[slug] ?? "more";
}

/** @deprecated Use HomeCategoryIcon3D — kept for legacy imports */
export function getHomeCategoryIconSrc(): string {
  return "";
}
