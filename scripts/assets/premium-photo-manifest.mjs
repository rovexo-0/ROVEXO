/**
 * Curated royalty-free product photography (Pexels CDN).
 * Photorealistic studio objects — one visual language for category rail.
 */

const px = (id, w = 1600) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

/** Verified object-specific sources per ROVEXO category brief */
export const CATEGORY_PHOTO_SOURCES = {
  vehicles: { urls: [px(2447869)], object: "Modern blue SUV" },
  property: { urls: [px(106399)], object: "Luxury house" },
  phones: { urls: [px(788946), px(47261)], object: "Flagship smartphone" },
  computers: { urls: [px(1092644), px(265087)], object: "Premium laptop" },
  electronics: { urls: [px(1542498), px(3394650)], object: "Premium headphones" },
  gaming: { urls: [px(777001)], object: "Game controller" },
  "home-garden": { urls: [px(276583), px(1571460)], object: "Designer sofa" },
  diy: { urls: [px(5699703)], object: "Toolbox" },
  tools: { urls: [px(162055)], object: "Cordless drill" },
  "womens-fashion": { urls: [px(1152077)], object: "Luxury handbag" },
  "mens-fashion": { urls: [px(1124468)], object: "Leather jacket" },
  "kids-fashion": { urls: [px(6311393)], object: "Blue t-shirt" },
  shoes: { urls: [px(2529148)], object: "White sneakers" },
  jewellery: { urls: [px(2735970)], object: "Diamond ring" },
  beauty: { urls: [px(6634643), px(3373736)], object: "Lipstick" },
  health: { urls: [px(4386467), px(402177)], object: "Medical kit" },
  pets: { urls: [px(2253275)], object: "Dog" },
  sports: { urls: [px(1148820)], object: "Football" },
  services: { urls: [px(7681097)], object: "Briefcase" },
  autoparts: { urls: [px(3802508), px(225217)], object: "Alloy wheel" },
};

/** @type {Record<string, { urls: string[] }>} */
export const HERO_PHOTO_SOURCES = {
  "move-store": { urls: [px(4483617, 3840)] },
  "zero-fees": { urls: [px(5632402, 3840)] },
  "verified-businesses": { urls: [px(3184418, 3840)] },
  "buy-securely": { urls: [px(7897656, 3840)] },
  "fast-delivery": { urls: [px(4480501, 3840)] },
  "electronics-deals": { urls: [px(14979011, 3840)] },
  "home-garden": { urls: [px(4391470, 3840)] },
  "premium-auctions": { urls: [px(3184296, 3840)] },
};

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
