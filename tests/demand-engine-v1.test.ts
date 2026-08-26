import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { encodeBundleMessageMeta } from "@/lib/bundle/bundle-payload-v1";
import { encodeCounterOfferMessageMeta } from "@/lib/offers/counter-offer-engine-v1";
import {
  CATEGORY_DEMAND_ENABLED,
  DEMAND_CARD_COPY,
  DEMAND_DETAIL_BODY_COPY,
  DEMAND_DETAIL_TITLE_COPY,
  DEMAND_ENGINE_CONFIG_V1,
  DEMAND_WINDOW_DAYS,
  DEMAND_WINDOW_MS,
  FAVOURITE_THRESHOLD,
  MESSAGES_ENABLED,
  OFFER_THRESHOLD,
  QUALIFIED_VIEW_THRESHOLD,
  SEARCH_DEMAND_ENABLED,
} from "@/lib/demand/demand-engine-config-v1";
import {
  countQualifyingOfferBuyers,
  demandBadgeFromState,
  evaluateDemand,
  type DemandAvailabilityRow,
  type DemandDataSource,
  type DemandEvaluationInput,
  type DemandFavouriteRow,
  type DemandOfferRow,
  type DemandQualifiedViewRow,
} from "@/lib/demand/demand-engine-v1";
import { resolveListingDemand } from "@/lib/demand/demand-engine-resolve-v1";

const PRODUCT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const SELLER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const BUYER_A = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const BUYER_B = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const PARENT_OFFER = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const OTHER_PRODUCT = "99999999-9999-4999-8999-999999999999";

const NOW = new Date("2026-08-26T12:00:00.000Z");

function hoursAgo(hours: number): string {
  return new Date(NOW.getTime() - hours * 60 * 60 * 1000).toISOString();
}

function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

function publishedAvailability(
  overrides: Partial<DemandAvailabilityRow> = {},
): DemandAvailabilityRow {
  return {
    productId: PRODUCT_ID,
    sellerId: SELLER_ID,
    status: "published",
    stock: 1,
    ...overrides,
  };
}

function evaluate(overrides: Partial<DemandEvaluationInput> = {}) {
  return evaluateDemand({
    productId: PRODUCT_ID,
    sellerId: SELLER_ID,
    availability: publishedAvailability(),
    offers: [],
    favourites: [],
    views: [],
    now: NOW,
    ...overrides,
  });
}

function buyerOffer(buyerId: string, createdAt: string, message?: string | null): DemandOfferRow {
  return { productId: PRODUCT_ID, buyerId, createdAt, message: message ?? null, status: "pending" };
}

function favourite(userId: string, savedAt: string): DemandFavouriteRow {
  return { productId: PRODUCT_ID, userId, savedAt };
}

function view(viewerKey: string, createdAt: string, extra: Partial<DemandQualifiedViewRow> = {}): DemandQualifiedViewRow {
  return { productId: PRODUCT_ID, viewerKey, createdAt, qualified: true, ...extra };
}

function uniqueViews(count: number, createdAt = hoursAgo(1)): DemandQualifiedViewRow[] {
  return Array.from({ length: count }, (_, i) => view(`user:viewer-${i}`, createdAt));
}

function uniqueFavourites(count: number, savedAt = hoursAgo(1)): DemandFavouriteRow[] {
  return Array.from({ length: count }, (_, i) => favourite(`buyer-${i}`, savedAt));
}

describe("ROVEXO Demand Engine V1.0", () => {
  it("locks frozen V1.0 configuration", () => {
    expect(DEMAND_WINDOW_DAYS).toBe(7);
    expect(DEMAND_WINDOW_MS).toBe(7 * 24 * 60 * 60 * 1000);
    expect(OFFER_THRESHOLD).toBe(1);
    expect(FAVOURITE_THRESHOLD).toBe(3);
    expect(QUALIFIED_VIEW_THRESHOLD).toBe(10);
    expect(MESSAGES_ENABLED).toBe(false);
    expect(SEARCH_DEMAND_ENABLED).toBe(false);
    expect(CATEGORY_DEMAND_ENABLED).toBe(false);
    expect(DEMAND_ENGINE_CONFIG_V1.engine).toBe("demand-engine-v1");
  });

  describe("offers", () => {
    it("1 qualifying buyer offer → IN_DEMAND", () => {
      expect(evaluate({ offers: [buyerOffer(BUYER_A, hoursAgo(2))] }).state).toBe("IN_DEMAND");
    });

    it("seller counter only → NOT_IN_DEMAND", () => {
      const result = evaluate({
        offers: [
          buyerOffer(
            BUYER_A,
            hoursAgo(2),
            encodeCounterOfferMessageMeta("seller", PARENT_OFFER),
          ),
        ],
      });
      expect(result.state).toBe("NOT_IN_DEMAND");
    });

    it("multiple offers from same buyer → contribution capped at 1", () => {
      const rows = [
        buyerOffer(BUYER_A, hoursAgo(1), null),
        buyerOffer(BUYER_A, hoursAgo(2), null),
        buyerOffer(BUYER_A, hoursAgo(3), "cancelled parent"),
        { ...buyerOffer(BUYER_A, hoursAgo(4)), status: "cancelled" },
      ];
      const windowInput = {
        productId: PRODUCT_ID,
        sellerId: SELLER_ID,
        windowStartMs: NOW.getTime() - DEMAND_WINDOW_MS,
        nowMs: NOW.getTime(),
      };
      expect(countQualifyingOfferBuyers(rows, windowInput)).toBe(1);
      expect(evaluate({ offers: rows }).state).toBe("IN_DEMAND");
    });
  });

  describe("favourites", () => {
    it("3 unique qualifying buyer favourites → IN_DEMAND", () => {
      expect(evaluate({ favourites: uniqueFavourites(3) }).state).toBe("IN_DEMAND");
    });

    it("2 favourites → NOT_IN_DEMAND", () => {
      expect(evaluate({ favourites: uniqueFavourites(2) }).state).toBe("NOT_IN_DEMAND");
    });

    it("seller favourite → ignored", () => {
      expect(
        evaluate({
          favourites: [
            favourite(SELLER_ID, hoursAgo(1)),
            favourite(BUYER_A, hoursAgo(1)),
            favourite(BUYER_B, hoursAgo(1)),
          ],
        }).state,
      ).toBe("NOT_IN_DEMAND");
    });
  });

  describe("qualified views", () => {
    it("10 unique qualified viewers → IN_DEMAND", () => {
      expect(evaluate({ views: uniqueViews(10) }).state).toBe("IN_DEMAND");
    });

    it("9 qualified viewers → NOT_IN_DEMAND", () => {
      expect(evaluate({ views: uniqueViews(9) }).state).toBe("NOT_IN_DEMAND");
    });

    it("seller view → ignored", () => {
      const views = [
        ...uniqueViews(9),
        view(`user:${SELLER_ID}`, hoursAgo(1), { viewerUserId: SELLER_ID }),
      ];
      expect(evaluate({ views }).state).toBe("NOT_IN_DEMAND");
    });

    it("bot view → ignored", () => {
      const views = [...uniqueViews(9), view("bot:blocked", hoursAgo(1))];
      expect(evaluate({ views }).state).toBe("NOT_IN_DEMAND");
    });

    it("unqualified view → ignored", () => {
      const views = [...uniqueViews(9), view("user:extra", hoursAgo(1), { qualified: false })];
      expect(evaluate({ views }).state).toBe("NOT_IN_DEMAND");
    });
  });

  describe("window", () => {
    it("qualifying event inside 7 days → counts", () => {
      expect(evaluate({ offers: [buyerOffer(BUYER_A, daysAgo(6.9))] }).state).toBe("IN_DEMAND");
    });

    it("qualifying event outside 7 days → does not count", () => {
      expect(evaluate({ offers: [buyerOffer(BUYER_A, daysAgo(7.01))] }).state).toBe(
        "NOT_IN_DEMAND",
      );
    });
  });

  describe("OR logic", () => {
    it("1 offer + 0 favourites + 0 views → IN_DEMAND", () => {
      expect(evaluate({ offers: [buyerOffer(BUYER_A, hoursAgo(1))] }).state).toBe("IN_DEMAND");
    });

    it("0 offers + 3 favourites + 0 views → IN_DEMAND", () => {
      expect(evaluate({ favourites: uniqueFavourites(3) }).state).toBe("IN_DEMAND");
    });

    it("0 offers + 0 favourites + 10 views → IN_DEMAND", () => {
      expect(evaluate({ views: uniqueViews(10) }).state).toBe("IN_DEMAND");
    });
  });

  describe("availability", () => {
    it("published + stock > 0 + qualifying demand → IN_DEMAND", () => {
      expect(
        evaluate({
          availability: publishedAvailability({ stock: 2 }),
          offers: [buyerOffer(BUYER_A, hoursAgo(1))],
        }).state,
      ).toBe("IN_DEMAND");
    });

    it("sold → NOT_IN_DEMAND", () => {
      expect(
        evaluate({
          availability: publishedAvailability({ status: "sold", stock: 1 }),
          offers: [buyerOffer(BUYER_A, hoursAgo(1))],
        }).state,
      ).toBe("NOT_IN_DEMAND");
    });

    it("stock = 0 → NOT_IN_DEMAND", () => {
      expect(
        evaluate({
          availability: publishedAvailability({ stock: 0 }),
          offers: [buyerOffer(BUYER_A, hoursAgo(1))],
        }).state,
      ).toBe("NOT_IN_DEMAND");
    });

    it("reserved → NOT_IN_DEMAND", () => {
      expect(
        evaluate({
          availability: publishedAvailability({ status: "reserved", stock: 1 }),
          offers: [buyerOffer(BUYER_A, hoursAgo(1))],
        }).state,
      ).toBe("NOT_IN_DEMAND");
    });
  });

  describe("messages / market demand", () => {
    it("buyer message → does NOT affect V1.0 demand", () => {
      expect(MESSAGES_ENABLED).toBe(false);
      const withNoise = evaluate({
        offers: [],
        favourites: [],
        views: [],
      });
      expect(withNoise.state).toBe("NOT_IN_DEMAND");
      const engine = readFileSync(join(process.cwd(), "lib/demand/demand-engine-v1.ts"), "utf8");
      const resolve = readFileSync(
        join(process.cwd(), "lib/demand/demand-engine-resolve-v1.ts"),
        "utf8",
      );
      expect(engine).not.toMatch(/from\("messages"\)/);
      expect(resolve).not.toMatch(/from\("messages"\)/);
      expect(engine).not.toMatch(/conversations/);
    });

    it("search demand → does NOT affect demand", () => {
      expect(SEARCH_DEMAND_ENABLED).toBe(false);
      const src = readFileSync(join(process.cwd(), "lib/demand/demand-engine-v1.ts"), "utf8");
      expect(src).not.toContain("computeSearchDemand");
      expect(evaluate({ views: uniqueViews(9) }).state).toBe("NOT_IN_DEMAND");
    });

    it("category demand → does NOT affect demand", () => {
      expect(CATEGORY_DEMAND_ENABLED).toBe(false);
      const src = readFileSync(join(process.cwd(), "lib/demand/demand-engine-v1.ts"), "utf8");
      expect(src).not.toContain("evaluateCategoryHealth");
      expect(src).not.toContain("demandScore");
    });
  });

  describe("fail closed", () => {
    it("required read failure → UNKNOWN", () => {
      expect(evaluate({ offers: "error" }).state).toBe("UNKNOWN");
      expect(evaluate({ favourites: "error" }).state).toBe("UNKNOWN");
      expect(evaluate({ views: "error" }).state).toBe("UNKNOWN");
      expect(evaluate({ availability: "error" }).state).toBe("UNKNOWN");
    });

    it("inconsistent data → UNKNOWN", () => {
      expect(
        evaluate({
          availability: publishedAvailability({ productId: OTHER_PRODUCT }),
          offers: [buyerOffer(BUYER_A, hoursAgo(1))],
        }).state,
      ).toBe("UNKNOWN");
    });

    it("unresolvable eligibility → UNKNOWN", () => {
      expect(evaluate({ productId: "", sellerId: SELLER_ID }).state).toBe("UNKNOWN");
      expect(evaluate({ productId: PRODUCT_ID, sellerId: "" }).state).toBe("UNKNOWN");
      expect(evaluate({ availability: null }).state).toBe("UNKNOWN");
    });

    it("UNKNOWN → no badge", () => {
      expect(demandBadgeFromState("UNKNOWN")).toBeNull();
      expect(evaluate({ offers: "error" }).badge).toBeNull();
      expect(demandBadgeFromState("NOT_IN_DEMAND")).toBeNull();
      expect(demandBadgeFromState("IN_DEMAND")).toEqual({
        card: DEMAND_CARD_COPY,
        detailTitle: DEMAND_DETAIL_TITLE_COPY,
        detailBody: DEMAND_DETAIL_BODY_COPY,
      });
    });
  });

  it("does not treat unrelated bundle offers as this listing's demand", () => {
    const bundleMessage = encodeBundleMessageMeta({
      v: 1,
      sellerId: SELLER_ID,
      sellerName: "Seller",
      lines: [
        {
          productId: OTHER_PRODUCT,
          slug: "other",
          title: "Other",
          imageUrl: "/x.jpg",
          unitPrice: 10,
          quantity: 1,
          maxStock: 1,
        },
      ],
      listSubtotal: 10,
      itemCount: 1,
      quantitySum: 1,
    });
    expect(
      evaluate({
        offers: [buyerOffer(BUYER_A, hoursAgo(1), bundleMessage)],
      }).state,
    ).toBe("NOT_IN_DEMAND");
  });

  it("resolveListingDemand uses injected read-only source and fail-closes on throw", async () => {
    const source: DemandDataSource = {
      readAvailability: async () => publishedAvailability(),
      readOffers: async () => [buyerOffer(BUYER_A, hoursAgo(1))],
      readFavourites: async () => [],
      readQualifiedViews: async () => [],
    };
    const pass = await resolveListingDemand({ productId: PRODUCT_ID, now: NOW, source });
    expect(pass.state).toBe("IN_DEMAND");

    const failing: DemandDataSource = {
      readAvailability: async () => {
        throw new Error("unavailable");
      },
      readOffers: async () => [],
      readFavourites: async () => [],
      readQualifiedViews: async () => [],
    };
    const unknown = await resolveListingDemand({
      productId: PRODUCT_ID,
      now: NOW,
      source: failing,
    });
    expect(unknown.state).toBe("UNKNOWN");
    expect(unknown.badge).toBeNull();
  });

  it("does not introduce demand score or demand columns", () => {
    const engine = readFileSync(join(process.cwd(), "lib/demand/demand-engine-v1.ts"), "utf8");
    const resolve = readFileSync(
      join(process.cwd(), "lib/demand/demand-engine-resolve-v1.ts"),
      "utf8",
    );
    expect(engine).not.toMatch(/demand_score|weighted_score|heat_score/);
    expect(resolve).not.toMatch(/in_demand|demand_status/);
    expect(resolve).not.toContain(".update(");
    expect(resolve).not.toContain(".insert(");
  });

  it("UI consumes engine copy and never calculates demand", () => {
    const card = readFileSync(join(process.cwd(), "components/ui/ListingCard.tsx"), "utf8");
    const detail = readFileSync(
      join(process.cwd(), "features/product-detail/ProductDetailPage.tsx"),
      "utf8",
    );
    const listingPage = readFileSync(
      join(process.cwd(), "app/(platform)/listing/[slug]/page.tsx"),
      "utf8",
    );
    const homepage = readFileSync(
      join(process.cwd(), "components/homepage/canonical/CanonicalMarketplaceFeed.tsx"),
      "utf8",
    );
    const search = readFileSync(
      join(process.cwd(), "features/search/components/SearchResultsView.tsx"),
      "utf8",
    );
    expect(card).not.toContain("evaluateDemand");
    expect(card).not.toContain("resolveListingDemand");
    expect(detail).not.toContain("evaluateDemand");
    expect(detail).not.toContain("resolveListingDemand");
    expect(listingPage).toContain("resolveListingDemand");
    expect(listingPage).toContain("demandBadgeLabelFromResult");
    expect(homepage).not.toContain("resolveListingDemand");
    expect(homepage).not.toContain("evaluateDemand");
    expect(search).not.toContain("resolveListingDemand");
    expect(search).not.toContain("evaluateDemand");
    expect(card).not.toContain("promotionBadge ??");
  });

});
