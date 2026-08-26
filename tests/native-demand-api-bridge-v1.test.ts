/**
 * Native Demand live-data attach — existing production JSON contracts only.
 * Demand eligibility comes from resolveListingDemand (engine unchanged).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getProductBySlug,
  getHomepageFeed,
  resolveListingDemand,
  listActivePreferredMarketplaceStores,
  resolveHomepageFeedItems,
} = vi.hoisted(() => ({
  getProductBySlug: vi.fn(),
  getHomepageFeed: vi.fn(),
  resolveListingDemand: vi.fn(),
  listActivePreferredMarketplaceStores: vi.fn(),
  resolveHomepageFeedItems: vi.fn(),
}));

vi.mock("@/lib/products/catalog", () => ({
  getProductBySlug,
  getHomepageFeed,
}));

vi.mock("@/lib/demand/demand-engine-resolve-v1", () => ({
  resolveListingDemand,
}));

vi.mock("@/lib/preferred-marketplace-stores/store", () => ({
  listActivePreferredMarketplaceStores,
}));

vi.mock("@/lib/homepage/feed-resolve", () => ({
  resolveHomepageFeedItems,
}));

import { GET as getListing } from "@/app/api/listing/[slug]/route";
import { GET as getFeed } from "@/app/api/homepage/feed/route";
import type { ProductDetail } from "@/lib/products/types";

const ROOT = process.cwd();
const read = (relative: string) => readFileSync(join(ROOT, relative), "utf8");

const FORBIDDEN_DEMAND_KEYS = [
  "score",
  "ranking",
  "messages",
  "offerCount",
  "favouriteCount",
  "viewCount",
  "offers",
  "favourites",
  "qualifiedViews",
  "sellerEmail",
  "buyerId",
  "viewerKey",
] as const;

function publicProduct(overrides: Partial<ProductDetail> = {}): ProductDetail {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    slug: "nike-air-max-90",
    title: "Nike Air Max 90",
    description: "White / Blue trainers in very good condition.",
    price: 65,
    originalPrice: 90,
    condition: "Very Good",
    brand: "Nike",
    colour: "White",
    material: "Leather",
    size: "UK 9",
    storage: null,
    network: null,
    season: null,
    compatibility: null,
    sellerName: "trainer_shop",
    sellerId: "22222222-2222-4222-8222-222222222222",
    sellerUsername: "trainer_shop",
    sellerAvatar: "https://cdn.example/avatar.png",
    sellerVerified: true,
    sellerRating: 4.9,
    sellerReviewCount: 12,
    sellerOnHoliday: false,
    location: "London",
    listingType: "fixed",
    acceptOffers: true,
    auctionEndsAt: null,
    auctionCurrentBid: null,
    rating: 4.8,
    reviewCount: 12,
    views: 40,
    likes: 3,
    imageUrl: "https://cdn.example/nike.jpg",
    imageFullUrl: "https://cdn.example/nike-full.jpg",
    imageCount: 2,
    sections: ["new"],
    isFeatured: false,
    isBumped: false,
    promotionScore: 99,
    homepagePriorityScore: 88,
    createdAt: "2026-08-01T00:00:00.000Z",
    categoryId: "cat-fashion",
    moderationStatus: "approved",
    transactionMode: "MARKETPLACE",
    freeDelivery: false,
    shippingPrice: 3.49,
    stock: 1,
    images: ["https://cdn.example/nike.jpg"],
    salesCount: 12,
    deliveryCarriers: ["Royal Mail"],
    availability: "in_stock",
    status: "published",
    sellerEmail: "private-seller@example.com",
    ...overrides,
  };
}

function feedItem() {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    slug: "nike-air-max-90",
    title: "Nike Air Max 90",
    price: 65,
    sellerName: "trainer_shop",
    sellerUsername: "trainer_shop",
  };
}

function demandPayload(body: unknown): Record<string, unknown> | undefined {
  if (!body || typeof body !== "object") return undefined;
  const record = body as Record<string, unknown>;
  if (record.listing && typeof record.listing === "object") {
    return (record.listing as Record<string, unknown>).demand as Record<string, unknown> | undefined;
  }
  const items = record.items;
  if (Array.isArray(items) && items[0] && typeof items[0] === "object") {
    return (items[0] as Record<string, unknown>).demand as Record<string, unknown> | undefined;
  }
  return undefined;
}

function assertPublicDemandOnly(serialized: string, demand: Record<string, unknown> | undefined) {
  expect(demand).toEqual({ eligible: expect.any(Boolean) });
  expect(Object.keys(demand ?? {}).sort()).toEqual(["eligible"]);
  const demandJson = JSON.stringify(demand);
  for (const key of FORBIDDEN_DEMAND_KEYS) {
    expect(demandJson).not.toContain(`"${key}"`);
  }
  expect(serialized).not.toContain("private-seller@example.com");
}

describe("Native Demand API bridge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listActivePreferredMarketplaceStores.mockResolvedValue([]);
    resolveHomepageFeedItems.mockImplementation((result: unknown) => result);
    getHomepageFeed.mockResolvedValue({
      items: [feedItem()],
      page: 1,
      hasMore: false,
    });
    getProductBySlug.mockResolvedValue(publicProduct());
  });

  it("GET /api/listing/[slug] eligible true", async () => {
    resolveListingDemand.mockResolvedValue({
      state: "IN_DEMAND",
      productId: "11111111-1111-4111-8111-111111111111",
      badge: { card: "🔥 In demand", detailTitle: "🔥 In demand", detailBody: "x" },
    });

    const response = await getListing(new Request("http://localhost:3000/api/listing/nike-air-max-90"), {
      params: Promise.resolve({ slug: "nike-air-max-90" }),
    });
    const body = await response.json();
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(resolveListingDemand).toHaveBeenCalledWith({
      productId: "11111111-1111-4111-8111-111111111111",
    });
    expect(body.listing.demand).toEqual({ eligible: true });
    assertPublicDemandOnly(serialized, demandPayload(body));
  });

  it("GET /api/listing/[slug] eligible false", async () => {
    resolveListingDemand.mockResolvedValue({
      state: "NOT_IN_DEMAND",
      productId: "11111111-1111-4111-8111-111111111111",
      badge: null,
    });

    const response = await getListing(new Request("http://localhost:3000/api/listing/nike-air-max-90"), {
      params: Promise.resolve({ slug: "nike-air-max-90" }),
    });
    const body = await response.json();

    expect(body.listing.demand).toEqual({ eligible: false });
    assertPublicDemandOnly(JSON.stringify(body), demandPayload(body));
  });

  it("GET /api/listing/[slug] unresolved demand → eligible false (fail closed)", async () => {
    resolveListingDemand.mockResolvedValue({
      state: "UNKNOWN",
      productId: "11111111-1111-4111-8111-111111111111",
      badge: null,
    });

    const response = await getListing(new Request("http://localhost:3000/api/listing/nike-air-max-90"), {
      params: Promise.resolve({ slug: "nike-air-max-90" }),
    });
    const body = await response.json();
    expect(body.listing.demand).toEqual({ eligible: false });
  });

  it("GET /api/homepage/feed eligible true / false", async () => {
    resolveListingDemand.mockResolvedValueOnce({
      state: "IN_DEMAND",
      productId: "11111111-1111-4111-8111-111111111111",
      badge: { card: "🔥 In demand", detailTitle: "🔥 In demand", detailBody: "x" },
    });

    const trueRes = await getFeed(new Request("http://localhost:3000/api/homepage/feed?page=1"));
    const trueBody = await trueRes.json();
    expect(trueRes.status).toBe(200);
    expect(trueBody.items[0].demand).toEqual({ eligible: true });
    assertPublicDemandOnly(JSON.stringify(trueBody), demandPayload(trueBody));

    resolveListingDemand.mockResolvedValueOnce({
      state: "NOT_IN_DEMAND",
      productId: "11111111-1111-4111-8111-111111111111",
      badge: null,
    });
    getHomepageFeed.mockResolvedValue({
      items: [feedItem()],
      page: 2,
      hasMore: false,
    });

    const falseRes = await getFeed(new Request("http://localhost:3000/api/homepage/feed?page=2"));
    const falseBody = await falseRes.json();
    expect(falseBody.items[0].demand).toEqual({ eligible: false });
    assertPublicDemandOnly(JSON.stringify(falseBody), demandPayload(falseBody));
  });

  it("routes consume resolveListingDemand — no inline threshold math", () => {
    const listingRoute = read("app/api/listing/[slug]/route.ts");
    const feedRoute = read("app/api/homepage/feed/route.ts");
    const engine = read("lib/demand/demand-engine-v1.ts");
    const resolve = read("lib/demand/demand-engine-resolve-v1.ts");

    for (const src of [listingRoute, feedRoute]) {
      expect(src).toContain("resolveListingDemand");
      expect(src).not.toContain("OFFER_THRESHOLD");
      expect(src).not.toContain("FAVOURITE_THRESHOLD");
      expect(src).not.toContain("QUALIFIED_VIEW_THRESHOLD");
      expect(src).not.toContain("evaluateDemand");
      expect(src).not.toMatch(/offers\s*>=\s*1/);
      expect(src).not.toMatch(/favourites\s*>=\s*3/);
      expect(src).not.toMatch(/views\s*>=\s*10/);
    }

    expect(engine).toContain("evaluateDemand");
    expect(resolve).toContain("evaluateDemand");
    expect(engine).not.toMatch(/from\("messages"\)/);
  });
});
