/**
 * ROVEXO v1.5 — Premium hero campaign montages (Prompt 015)
 * Dense product compositions — no placeholder vectors
 */
import sharp from "sharp";
import {
  HERO_H,
  HERO_W,
  addGrain,
  buildCardboardBox,
  buildStudioBackground,
  compositeLayers,
  placeProduct,
} from "./v15-render-utils.mjs";

/** @typedef {Map<string, Buffer>} CategoryBufferMap */

/** @type {Record<string, { theme: string, products: Array<{ key: string, left: number, top: number, size: number, rotate?: number }>, boxes?: Array<{ left: number, top: number, w: number, h: number }> }>} */
const HERO_LAYOUTS = {
  "move-store": {
    theme: "blue",
    boxes: [
      { left: 980, top: 260, w: 340, h: 340 },
      { left: 1360, top: 520, w: 220, h: 180 },
    ],
    products: [
      { key: "phones", left: 1180, top: 180, size: 280, rotate: -8 },
      { key: "computers", left: 1380, top: 220, size: 320, rotate: 6 },
      { key: "electronics", left: 1120, top: 520, size: 240, rotate: 12 },
      { key: "gaming", left: 1480, top: 480, size: 220, rotate: -10 },
      { key: "fashion", left: 1280, top: 620, size: 200, rotate: 5 },
      { key: "autoparts", left: 1580, top: 640, size: 180, rotate: -6 },
    ],
  },
  "zero-fees": {
    theme: "gold",
    products: [
      { key: "services", left: 1080, top: 220, size: 260, rotate: -12 },
      { key: "luxury", left: 1320, top: 280, size: 240, rotate: 8 },
      { key: "fashion", left: 1180, top: 520, size: 280, rotate: -5 },
      { key: "electronics", left: 1480, top: 480, size: 260, rotate: 10 },
    ],
    boxes: [{ left: 1540, top: 240, w: 200, h: 200 }],
  },
  "verified-businesses": {
    theme: "blue",
    products: [
      { key: "business", left: 1040, top: 240, size: 340, rotate: -4 },
      { key: "property", left: 1360, top: 260, size: 320, rotate: 6 },
      { key: "services", left: 1180, top: 560, size: 240, rotate: -8 },
      { key: "luxury", left: 1480, top: 540, size: 220, rotate: 5 },
    ],
  },
  "buy-securely": {
    theme: "cyan",
    products: [
      { key: "luxury", left: 1080, top: 200, size: 300, rotate: -6 },
      { key: "phones", left: 1340, top: 260, size: 260, rotate: 10 },
      { key: "electronics", left: 1160, top: 520, size: 280, rotate: -8 },
      { key: "computers", left: 1460, top: 500, size: 300, rotate: 4 },
    ],
    boxes: [{ left: 1280, top: 620, w: 240, h: 160 }],
  },
  "fast-delivery": {
    theme: "emerald",
    products: [
      { key: "vehicles", left: 1020, top: 380, size: 420, rotate: -3 },
      { key: "autoparts", left: 1420, top: 260, size: 220, rotate: 12 },
      { key: "electronics", left: 1180, top: 620, size: 200, rotate: -10 },
      { key: "fashion", left: 1480, top: 620, size: 200, rotate: 8 },
    ],
    boxes: [
      { left: 1380, top: 520, w: 260, h: 180 },
      { left: 1620, top: 680, w: 180, h: 140 },
    ],
  },
  "electronics-deals": {
    theme: "indigo",
    products: [
      { key: "phones", left: 1000, top: 180, size: 300, rotate: -10 },
      { key: "computers", left: 1280, top: 220, size: 340, rotate: 6 },
      { key: "electronics", left: 1080, top: 520, size: 280, rotate: 8 },
      { key: "gaming", left: 1380, top: 480, size: 260, rotate: -12 },
      { key: "phones", left: 1560, top: 620, size: 200, rotate: 15 },
    ],
  },
  "home-garden": {
    theme: "emerald",
    products: [
      { key: "home-garden", left: 1080, top: 220, size: 320, rotate: -5 },
      { key: "furniture", left: 1360, top: 280, size: 340, rotate: 4 },
      { key: "diy", left: 1160, top: 560, size: 240, rotate: 10 },
      { key: "tools", left: 1440, top: 540, size: 260, rotate: -8 },
    ],
  },
  "premium-auctions": {
    theme: "violet",
    products: [
      { key: "luxury", left: 1040, top: 220, size: 300, rotate: -6 },
      { key: "collectibles", left: 1320, top: 260, size: 320, rotate: 8 },
      { key: "jewellery", left: 1180, top: 540, size: 260, rotate: -10 },
      { key: "collectibles", left: 1480, top: 520, size: 240, rotate: 5 },
    ],
  },
};

export const V15_HERO_CAMPAIGN_IDS = Object.keys(HERO_LAYOUTS);

/**
 * @param {string} id
 * @param {CategoryBufferMap} categoryBuffers
 */
export async function renderHeroCampaign(id, categoryBuffers) {
  const layout = HERO_LAYOUTS[id];
  if (!layout) throw new Error(`Missing v1.5 hero layout: ${id}`);

  const bg = await buildStudioBackground(layout.theme);
  /** @type {import("sharp").OverlayOptions[]} */
  const layers = [];

  if (layout.boxes) {
    for (const box of layout.boxes) {
      const boxLayers = await buildCardboardBox(box.left, box.top, box.w, box.h);
      layers.push(...boxLayers);
    }
  }

  for (const item of layout.products) {
    const source = categoryBuffers.get(item.key);
    if (!source) continue;
    const placed = await placeProduct(source, item.left, item.top, item.size, item.rotate ?? 0);
    layers.push(...placed.layers);
  }

  const composed = await compositeLayers(bg, layers);
  return addGrain(composed, 0.04);
}

/** @param {CategoryBufferMap} categoryBuffers */
export async function renderAllHeroCampaigns(categoryBuffers) {
  /** @type {Map<string, Buffer>} */
  const map = new Map();
  for (const id of V15_HERO_CAMPAIGN_IDS) {
    map.set(id, await renderHeroCampaign(id, categoryBuffers));
  }
  return map;
}

export async function renderHeroCampaignMaster(buffer) {
  return sharp(buffer).resize(HERO_W, HERO_H, { fit: "cover", position: "centre" }).png().toBuffer();
}
