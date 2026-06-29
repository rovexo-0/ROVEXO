/**
 * Curated royalty-free product / lifestyle photography (verified Pexels CDN URLs).
 * Populates public category and hero source masters only — never referenced at runtime.
 */

/** @type {Record<string, { urls: string[] }>} */
export const CATEGORY_PHOTO_SOURCES = {
  vehicles: { urls: ["https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=1600"] },
  property: { urls: ["https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1600"] },
  phones: { urls: ["https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=1600"] },
  computers: { urls: ["https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=1600"] },
  electronics: { urls: ["https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=1600"] },
  gaming: { urls: ["https://images.pexels.com/photos/777001/pexels-photo-777001.jpeg?auto=compress&cs=tinysrgb&w=1600"] },
  "home-garden": { urls: ["https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1600"] },
  diy: { urls: ["https://images.pexels.com/photos/5699703/pexels-photo-5699703.jpeg?auto=compress&cs=tinysrgb&w=1600"] },
  tools: { urls: ["https://images.pexels.com/photos/162055/pexels-photo-162055.jpeg?auto=compress&cs=tinysrgb&w=1600"] },
  "womens-fashion": { urls: ["https://images.pexels.com/photos/985167/pexels-photo-985167.jpeg?auto=compress&cs=tinysrgb&w=1600"] },
  "mens-fashion": { urls: ["https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg?auto=compress&cs=tinysrgb&w=1600"] },
  "kids-fashion": { urls: ["https://images.pexels.com/photos/8613085/pexels-photo-8613085.jpeg?auto=compress&cs=tinysrgb&w=1600"] },
  shoes: { urls: ["https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=1600"] },
  jewellery: { urls: ["https://images.pexels.com/photos/2735970/pexels-photo-2735970.jpeg?auto=compress&cs=tinysrgb&w=1600"] },
  beauty: { urls: ["https://images.pexels.com/photos/3373736/pexels-photo-3373736.jpeg?auto=compress&cs=tinysrgb&w=1600"] },
  health: { urls: ["https://images.pexels.com/photos/402177/pexels-photo-402177.jpeg?auto=compress&cs=tinysrgb&w=1600"] },
  pets: { urls: ["https://images.pexels.com/photos/2253275/pexels-photo-2253275.jpeg?auto=compress&cs=tinysrgb&w=1600"] },
  sports: { urls: ["https://images.pexels.com/photos/1148820/pexels-photo-1148820.jpeg?auto=compress&cs=tinysrgb&w=1600"] },
  services: { urls: ["https://images.pexels.com/photos/7681097/pexels-photo-7681097.jpeg?auto=compress&cs=tinysrgb&w=1600"] },
  autoparts: { urls: ["https://images.pexels.com/photos/225217/pexels-photo-225217.jpeg?auto=compress&cs=tinysrgb&w=1600"] },
};

/** @type {Record<string, { urls: string[] }>} */
export const HERO_PHOTO_SOURCES = {
  "move-store": { urls: ["https://images.pexels.com/photos/4483617/pexels-photo-4483617.jpeg?auto=compress&cs=tinysrgb&w=3840"] },
  "zero-fees": { urls: ["https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg?auto=compress&cs=tinysrgb&w=3840"] },
  "verified-businesses": { urls: ["https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=3840"] },
  "buy-securely": { urls: ["https://images.pexels.com/photos/7897656/pexels-photo-7897656.jpeg?auto=compress&cs=tinysrgb&w=3840"] },
  "fast-delivery": { urls: ["https://images.pexels.com/photos/4480501/pexels-photo-4480501.jpeg?auto=compress&cs=tinysrgb&w=3840"] },
  "electronics-deals": { urls: ["https://images.pexels.com/photos/1267696/pexels-photo-1267696.jpeg?auto=compress&cs=tinysrgb&w=3840"] },
  "home-garden": { urls: ["https://images.pexels.com/photos/4391470/pexels-photo-4391470.jpeg?auto=compress&cs=tinysrgb&w=3840"] },
  "premium-auctions": { urls: ["https://images.pexels.com/photos/3184296/pexels-photo-3184296.jpeg?auto=compress&cs=tinysrgb&w=3840"] },
};

/** Legacy keys kept for disk cleanup only — not exported to rail */
export const LEGACY_CATEGORY_KEYS = [
  "fashion",
  "kids",
  "business",
  "luxury",
  "collectibles",
  "handmade",
  "furniture",
  "books",
  "more",
  "export",
];

export const EXTENDED_CATEGORY_KEYS = [];

/** @deprecated */
export const CATEGORY_PHOTO_IDS = Object.fromEntries(
  Object.keys(CATEGORY_PHOTO_SOURCES).map((key) => [key, { photoId: 0 }]),
);

/** @deprecated */
export const HERO_PHOTO_IDS = Object.fromEntries(
  Object.keys(HERO_PHOTO_SOURCES).map((key) => [key, { photoId: 0 }]),
);
