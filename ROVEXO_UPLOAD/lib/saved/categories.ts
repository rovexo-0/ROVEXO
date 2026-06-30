export type SavedCategorySlug =
  | "fashion"
  | "electronics"
  | "home-garden"
  | "vehicles"
  | "sports"
  | "books"
  | "beauty"
  | "toys";

const PRODUCT_CATEGORY_BY_SLUG: Record<string, SavedCategorySlug> = {
  "nike-air-max-90": "fashion",
  "levis-501-jeans": "fashion",
  "north-face-puffer": "fashion",
  "adidas-ultraboost": "fashion",
  "zara-wool-coat": "fashion",
  "patagonia-fleece": "fashion",
  "supreme-hoodie": "fashion",
  "designer-leather-tote": "fashion",
  "ray-ban-aviator": "fashion",
  "rolex-submariner": "fashion",
  "sony-wh1000xm5": "electronics",
  "apple-watch-series-9": "electronics",
  "macbook-air-m2": "electronics",
  "playstation-5-slim": "electronics",
  "bose-quietcomfort": "electronics",
  "kindle-paperwhite": "electronics",
  "canon-eos-r6": "electronics",
  "vintage-polaroid": "electronics",
  "dyson-v15": "home-garden",
  "kitchenaid-mixer": "home-garden",
  "herman-miller-chair": "home-garden",
  "mid-century-lamp": "home-garden",
  "specialized-road-bike": "vehicles",
  "lego-millennium-falcon": "toys",
};

export function getProductCategorySlug(productSlug: string): SavedCategorySlug {
  return PRODUCT_CATEGORY_BY_SLUG[productSlug] ?? "fashion";
}

export const SAVED_PRIMARY_FILTERS = [
  { id: "all", label: "All" },
  { id: "fashion", label: "Fashion" },
  { id: "electronics", label: "Electronics" },
  { id: "home-garden", label: "Home" },
  { id: "vehicles", label: "Vehicles" },
  { id: "more", label: "More..." },
] as const;

export const SAVED_MORE_FILTERS = [
  { id: "sports", label: "Sports" },
  { id: "books", label: "Books" },
  { id: "beauty", label: "Beauty" },
  { id: "toys", label: "Toys" },
] as const;

export type SavedPrimaryFilterId = (typeof SAVED_PRIMARY_FILTERS)[number]["id"];
export type SavedMoreFilterId = (typeof SAVED_MORE_FILTERS)[number]["id"];
export type SavedFilterId = SavedPrimaryFilterId | SavedMoreFilterId;
