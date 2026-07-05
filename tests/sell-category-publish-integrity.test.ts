import { describe, expect, it } from "vitest";
import { detectCategoryFromTitle } from "@/lib/sell/category-detection-pro";
import { suggestCategoryFromTitle } from "@/lib/sell/suggest-category-from-title";
import { resolveCategoryPathBySlugs } from "@/lib/categories/queries";
import {
  materializeCategoryChain,
  resolveCanonicalCategoryNodes,
  type CategoryChainStore,
} from "@/lib/categories/server";

function createMemoryStore() {
  const rows: Array<{ id: string; slug: string; parentId: string | null }> = [];
  let sequence = 0;
  const store: CategoryChainStore = {
    async findId(slug, parentId) {
      return rows.find((row) => row.slug === slug && row.parentId === parentId)?.id ?? null;
    },
    async create({ slug, parentId }) {
      const id = `cat-${(sequence += 1)}`;
      rows.push({ id, slug, parentId });
      return id;
    },
  };
  return { store, rows };
}

/**
 * The exact publish gate the server runs: a selected slug path must validate
 * against the canonical tree AND materialise to a real category id. If this
 * returns an id, POST /api/listings will NOT answer "Invalid category selected".
 */
async function wouldPublish(slugs: string[]): Promise<string | null> {
  const nodes = resolveCanonicalCategoryNodes(slugs);
  if (!nodes) return null;
  return materializeCategoryChain(nodes, createMemoryStore().store);
}

/**
 * 25 real category selections spanning every major vertical — the kind a seller
 * makes via the picker or by accepting an AI suggestion. Every one must publish.
 */
const CANONICAL_SELECTIONS: string[][] = [
  ["phones", "smartphones", "unlocked-phones"],
  ["phones", "wearables", "smartwatches"],
  ["computers", "laptops", "macbooks"],
  ["computers", "computer-accessories", "mice"],
  ["gaming", "consoles", "playstation"],
  ["gaming", "consoles", "xbox"],
  ["gaming", "consoles", "nintendo"],
  ["shoes", "trainers", "nike"],
  ["shoes", "trainers", "adidas"],
  ["tools", "power-tools", "drills"],
  ["car-parts", "wheels-tyres", "alloy-wheels"],
  ["car-parts", "wheels-tyres", "tyres"],
  ["car-parts", "body-parts", "bumpers"],
  ["home-garden", "furniture", "sofas"],
  ["home-garden", "furniture", "tables"],
  ["home-garden", "furniture", "beds"],
  ["electronics", "tv-video", "televisions"],
  ["electronics", "audio", "earbuds"],
  ["appliances", "cleaning-appliances", "vacuum-cleaners"],
  ["toys", "building-toys", "lego"],
  ["toys", "building-toys"], // the exact reported failure (branch selection)
  ["baby", "baby-toys", "soft-toys"],
  ["baby", "pushchairs", "prams"],
  ["books", "fiction", "crime"],
  ["cycling", "bikes", "mountain-bikes"],
  ["office", "office-furniture", "office-chairs"],
];

describe("Sell publish integrity — every valid category publishes", () => {
  it("covers at least 20 distinct product categories", () => {
    expect(CANONICAL_SELECTIONS.length).toBeGreaterThanOrEqual(20);
  });

  it.each(CANONICAL_SELECTIONS)("publishes selection %j without 'Invalid category'", async (...slugs) => {
    const id = await wouldPublish(slugs as string[]);
    expect(id, slugs.join(" → ")).toBeTruthy();
  });

  it("still rejects genuinely invalid selections", async () => {
    expect(await wouldPublish(["toys", "totally-made-up"])).toBeNull();
    expect(await wouldPublish(["nonsense"])).toBeNull();
  });
});

/**
 * 22 realistic listings (title + optional description). The AI suggestion must
 * (a) always be a canonical path that publishes, and (b) land in the expected
 * top-level vertical.
 */
const PRODUCTS: Array<{ title: string; description?: string; root: string }> = [
  { title: "iPhone 15 Pro Max 256GB", root: "phones" },
  { title: "Samsung Galaxy S24 Ultra", root: "phones" },
  { title: "Apple MacBook Air M2", root: "computers" },
  { title: "Dell XPS 15 Laptop", root: "computers" },
  { title: "PlayStation 5 Console", root: "gaming" },
  { title: "Xbox Series X 1TB", root: "gaming" },
  { title: "Nintendo Switch OLED", root: "gaming" },
  { title: "Nike Air Max 270 Trainers", root: "shoes" },
  { title: "Adidas Ultraboost Running Shoes", root: "shoes" },
  { title: "DeWalt XR Combi Drill", root: "tools" },
  { title: "Bosch Cordless Hammer Drill", root: "tools" },
  { title: "Dyson V11 Cordless Vacuum", root: "appliances" },
  { title: "OLED Smart TV 55 inch", root: "electronics" },
  { title: "Apple AirPods Pro 2", root: "electronics" },
  { title: "Chesterfield Leather Sofa", root: "home-garden" },
  { title: "Oak Dining Table", root: "home-garden" },
  { title: "BMW Alloy Wheels 18 inch", root: "car-parts" },
  { title: "Continental Winter Tyres 225/45", root: "car-parts" },
  { title: "LEGO Technic Supercar", root: "toys" },
  {
    title: "Plush Teddy Bear Soft Toy",
    description: "very soft cuddly plush toy for kids",
    root: "baby",
  },
  { title: "Used Paperback Crime Fiction Novel", root: "books" },
  { title: "Baby Pram Travel System", root: "baby" },
];

describe("AI category detection — always canonical & publishable", () => {
  it("classifies 22 products into the correct vertical and each publishes", async () => {
    for (const product of PRODUCTS) {
      const detection = detectCategoryFromTitle(product.title, product.description ?? "");
      expect(detection.top, product.title).not.toBeNull();
      expect(detection.top!.path.categorySlug, product.title).toBe(product.root);

      const slugs = detection.top!.path.segments.map((segment) => segment.slug);
      expect(await wouldPublish(slugs), product.title).toBeTruthy();
    }
  });

  it("never emits a non-canonical suggestion for any product", () => {
    for (const product of PRODUCTS) {
      const suggestions = suggestCategoryFromTitle(product.title, product.description ?? "");
      for (const suggestion of suggestions) {
        const slugs = suggestion.path.segments.map((segment) => segment.slug);
        expect(resolveCategoryPathBySlugs(slugs), `${product.title} → ${slugs.join("/")}`).not.toBeNull();
      }
    }
  });
});
