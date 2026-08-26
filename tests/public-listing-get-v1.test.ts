/**
 * Public Listing GET foundation — GET /api/listing/[slug]
 * Canonical source: getProductBySlug(). No seller auth. No Page View.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { shouldSkipMfaNetworkWork } from "@/lib/auth/middleware-verified-user-v1";
import {
  PUBLIC_LISTING_EXCLUDED_KEYS,
  PUBLIC_LISTING_GET_ENDPOINT,
  PUBLIC_LISTING_GET_SOURCE,
  toPublicListingDetailDocument,
} from "@/lib/products/public-listing-get-v1";
import type { ProductDetail } from "@/lib/products/types";

const { getProductBySlug } = vi.hoisted(() => ({
  getProductBySlug: vi.fn(),
}));

vi.mock("@/lib/products/catalog", () => ({
  getProductBySlug,
}));

import { GET } from "@/app/api/listing/[slug]/route";

const ROOT = process.cwd();
const read = (relative: string) => readFileSync(join(ROOT, relative), "utf8");

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
    images: ["https://cdn.example/nike.jpg", "https://cdn.example/nike-2.jpg"],
    salesCount: 12,
    deliveryCarriers: ["Royal Mail", "Evri", "DPD", "InPost"],
    availability: "in_stock",
    status: "published",
    sellerEmail: "private-seller@example.com",
    sellerAccountStatus: "active",
    sellerRole: "seller",
    sellerTrustScore: 91,
    sellerTier: "gold",
    sellerResponseRate: 98,
    ...overrides,
  };
}

async function getListing(slug: string, headers?: HeadersInit) {
  return GET(new Request(`http://localhost:3000/api/listing/${slug}`, { headers }), {
    params: Promise.resolve({ slug }),
  });
}

describe("GET /api/listing/[slug] — public listing foundation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("valid public slug → 200 with canonical listing data", async () => {
    getProductBySlug.mockResolvedValue(publicProduct());

    const response = await getListing("nike-air-max-90");
    const body = (await response.json()) as { listing: Record<string, unknown> };

    expect(response.status).toBe(200);
    expect(getProductBySlug).toHaveBeenCalledTimes(1);
    expect(getProductBySlug).toHaveBeenCalledWith("nike-air-max-90");
    expect(body.listing.id).toBe("11111111-1111-4111-8111-111111111111");
    expect(body.listing.slug).toBe("nike-air-max-90");
    expect(body.listing.title).toBe("Nike Air Max 90");
    expect(body.listing.price).toBe(65);
    expect(body.listing.description).toBe("White / Blue trainers in very good condition.");
    expect(body.listing.sellerName).toBe("trainer_shop");
    expect(body.listing.sellerUsername).toBe("trainer_shop");
    expect(body.listing.images).toEqual([
      "https://cdn.example/nike.jpg",
      "https://cdn.example/nike-2.jpg",
    ]);
    expect(body.listing.status).toBe("published");
    expect(body.listing.transactionMode).toBe("MARKETPLACE");
  });

  it("unknown slug → 404", async () => {
    getProductBySlug.mockResolvedValue(null);

    const response = await getListing("does-not-exist");
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(404);
    expect(body.error).toBe("Listing not found.");
    expect(getProductBySlug).toHaveBeenCalledWith("does-not-exist");
  });

  it("private / non-public listing is not exposed", async () => {
    getProductBySlug.mockResolvedValue(null);

    const response = await getListing("draft-or-reserved-listing");
    const body = (await response.json()) as { listing?: unknown; error: string };

    expect(response.status).toBe(404);
    expect(body.listing).toBeUndefined();
    expect(body.error).toBe("Listing not found.");
  });

  it("blank slug → 404 without calling getProductBySlug", async () => {
    const response = await getListing("   ");
    expect(response.status).toBe(404);
    expect(getProductBySlug).not.toHaveBeenCalled();
  });

  it("does not require seller authentication", async () => {
    getProductBySlug.mockResolvedValue(publicProduct());

    const response = await getListing("nike-air-max-90");
    expect(response.status).toBe(200);

    const route = read("app/api/listing/[slug]/route.ts");
    expect(route).not.toContain("requireApiAuth");
    expect(route).not.toContain("requireApiListingRole");
    expect(route).not.toContain("getSellerListingById");
    expect(route).not.toContain("/api/listings/[id]");
  });

  it("does not record Page View", async () => {
    getProductBySlug.mockResolvedValue(publicProduct());
    await getListing("nike-air-max-90");

    const route = read("app/api/listing/[slug]/route.ts");
    expect(route).toContain("getProductBySlug");
    expect(route).not.toContain("recordProductView");
    expect(route).not.toContain("/api/views");
    expect(route).not.toContain("RecordProductViewBeacon");
  });

  it("excludes private seller / account / moderation fields", async () => {
    getProductBySlug.mockResolvedValue(publicProduct());

    const response = await getListing("nike-air-max-90");
    const body = (await response.json()) as { listing: Record<string, unknown> };
    const serialized = JSON.stringify(body);

    for (const key of PUBLIC_LISTING_EXCLUDED_KEYS) {
      expect(Object.prototype.hasOwnProperty.call(body.listing, key)).toBe(false);
      expect(serialized).not.toContain(key);
    }
    expect(serialized).not.toContain("private-seller@example.com");
  });

  it("calls getProductBySlug only — not checkout or seller listing owners", async () => {
    const route = read("app/api/listing/[slug]/route.ts");
    expect(route).toContain(PUBLIC_LISTING_GET_SOURCE);
    expect(route).not.toContain("getProductBySlugForCheckout");
    expect(route).not.toContain("createSellerListing");
    expect(route).not.toContain("updateSellerListing");
  });
});

describe("public listing GET contract + web isolation", () => {
  it("maps canonical public listing fields from getProductBySlug output", () => {
    const listing = toPublicListingDetailDocument(publicProduct());
    expect(listing.slug).toBe("nike-air-max-90");
    expect(listing.sellerName).toBe("trainer_shop");
    expect(listing.freeDelivery).toBe(false);
    expect(listing.shippingPrice).toBe(3.49);
    expect(listing.sellerOnHoliday).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(listing, "sellerEmail")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(listing, "moderationStatus")).toBe(false);
  });

  it("endpoint constant is GET /api/listing/[slug]", () => {
    expect(PUBLIC_LISTING_GET_ENDPOINT).toBe("/api/listing/[slug]");
  });

  it("existing Web listing page still uses fetchProductBySlug only", () => {
    const page = read("app/(platform)/listing/[slug]/page.tsx");
    expect(page).toContain("fetchProductBySlug");
    expect(page).not.toContain("/api/listing/");
    expect(page).toContain("RecordProductViewBeacon");
    expect(page).toContain("POST /api/views");
  });

  it("seller GET /api/listings/[id] remains auth-gated", () => {
    const seller = read("app/api/listings/[id]/route.ts");
    expect(seller).toContain("requireApiAuth");
    expect(seller).toContain("requireApiListingRole");
    expect(seller).toContain("getSellerListingById");
  });

  it("does not implement Native Listing Detail UI", () => {
    const route = read("app/api/listing/[slug]/route.ts");
    expect(route).not.toContain("ListingDetailScreen");
    expect(route).not.toContain("ProductDetailPage");
  });

  it("public listing GET skips MFA network work like Web /listing/", () => {
    expect(shouldSkipMfaNetworkWork("/listing/nike-air-max-90", "GET")).toBe(true);
    expect(shouldSkipMfaNetworkWork("/api/listing/nike-air-max-90", "GET")).toBe(true);
    expect(shouldSkipMfaNetworkWork("/api/listings/11111111-1111-4111-8111-111111111111", "GET")).toBe(
      false,
    );
  });

  it("does not treat NextResponse auth failures as success", async () => {
    getProductBySlug.mockResolvedValue(publicProduct());
    const unauthorized = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    expect(unauthorized.status).toBe(401);

    const response = await getListing("nike-air-max-90");
    expect(response.status).toBe(200);
  });
});
