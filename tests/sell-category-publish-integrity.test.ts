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
 * Real Catalog Master selections spanning every production root — the kind a seller
 * makes via the picker or by accepting an AI suggestion. Every one must publish.
 */
const CANONICAL_SELECTIONS: string[][] = [
  ["womens-fashion", "clothing", "dresses"],
  ["womens-fashion", "shoes", "trainers"],
  ["mens-fashion", "clothing", "t-shirts"],
  ["mens-fashion", "shoes", "boots"],
  ["jewellery", "fine-jewellery", "rings"],
  ["jewellery", "designer-fashion", "designer-bags"],
  ["kids-fashion", "baby", "baby-clothes"],
  ["kids-fashion", "toys-games", "building-sets"],
  ["home-garden", "furniture", "tables"],
  ["home-garden", "appliances", "vacuum-cleaners"],
  ["electronics", "phones-tablets", "smartphones"],
  ["electronics", "computers", "laptops"],
  ["electronics", "tv-audio", "televisions"],
  ["electronics", "gaming", "consoles"],
  ["books", "books", "fiction"],
  ["books", "music", "vinyl"],
  ["collectibles", "collectables", "trading-cards"],
  ["collectibles", "arts-crafts", "art-supplies"],
  ["sports", "outdoor-sports", "camping"],
  ["sports", "team-sports", "football"],
  ["vehicle-parts", "car-parts", "brakes"],
  ["vehicle-parts", "vehicle-accessories", "seat-covers"],
  ["vehicle-parts", "tyres-and-wheels", "alloy-wheels"],
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
 * (a) always be a canonical path that publishes.
 */
const PRODUCTS: Array<{ title: string; description?: string }> = [
  { title: "iPhone 15 Pro Max 256GB" },
  { title: "Samsung Galaxy S24 Ultra" },
  { title: "Apple MacBook Air M2" },
  { title: "Dell XPS 15 Laptop" },
  { title: "PlayStation 5 Console" },
  { title: "Xbox Series X 1TB" },
  { title: "Nintendo Switch OLED" },
  { title: "Nike Air Max 270 Trainers" },
  { title: "Adidas Ultraboost Running Shoes" },
  { title: "DeWalt XR Combi Drill" },
  { title: "Bosch Cordless Hammer Drill" },
  { title: "Dyson V11 Cordless Vacuum" },
  { title: "OLED Smart TV 55 inch" },
  { title: "Apple AirPods Pro 2" },
  { title: "Chesterfield Leather Sofa" },
  { title: "Oak Dining Table" },
  { title: "BMW Alloy Wheels 18 inch" },
  { title: "Continental Winter Tyres 225/45" },
  { title: "LEGO Technic Supercar" },
  {
    title: "Plush Teddy Bear Soft Toy",
    description: "very soft cuddly plush toy for kids",
  },
  { title: "Used Paperback Crime Fiction Novel" },
  { title: "Baby Pram Travel System" },
];

describe("AI category detection — always canonical & publishable", () => {
  it("classifies 22 products into a current Catalog Master path that publishes", async () => {
    for (const product of PRODUCTS) {
      const detection = detectCategoryFromTitle(product.title, product.description ?? "");
      expect(detection.top, product.title).not.toBeNull();

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
