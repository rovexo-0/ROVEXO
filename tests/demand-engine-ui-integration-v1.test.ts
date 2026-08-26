import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DEMAND_CARD_COPY,
  DEMAND_DETAIL_BODY_COPY,
  DEMAND_DETAIL_TITLE_COPY,
} from "@/lib/demand/demand-engine-config-v1";
import { demandBadgeLabelFromResult } from "@/lib/demand/demand-badge-label-v1";
import {
  evaluateDemand,
  type DemandAvailabilityRow,
  type DemandEvaluationInput,
} from "@/lib/demand/demand-engine-v1";

const PRODUCT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const SELLER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const BUYER_A = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const NOW = new Date("2026-08-26T12:00:00.000Z");

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
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

describe("GATE 4.2 — Demand Engine UI integration", () => {
  describe("Listing Card demandBadgeLabel", () => {
    it("IN_DEMAND → demandBadgeLabel = 🔥 In demand", () => {
      const result = evaluate({
        offers: [
          {
            productId: PRODUCT_ID,
            buyerId: BUYER_A,
            createdAt: "2026-08-25T12:00:00.000Z",
            message: null,
            status: "pending",
          },
        ],
      });
      expect(result.state).toBe("IN_DEMAND");
      expect(demandBadgeLabelFromResult(result)).toBe(DEMAND_CARD_COPY);
      expect(demandBadgeLabelFromResult(result)).toBe("🔥 In demand");
    });

    it("NOT_IN_DEMAND → no demand badge", () => {
      const result = evaluate();
      expect(result.state).toBe("NOT_IN_DEMAND");
      expect(demandBadgeLabelFromResult(result)).toBeNull();
    });

    it("UNKNOWN → no demand badge", () => {
      const result = evaluate({ offers: "error" });
      expect(result.state).toBe("UNKNOWN");
      expect(demandBadgeLabelFromResult(result)).toBeNull();
      expect(
        demandBadgeLabelFromResult({
          state: "UNKNOWN",
          productId: PRODUCT_ID,
          badge: null,
        }),
      ).toBeNull();
    });

    it("ListingCard renders the engine card copy when demandBadgeLabel is supplied", () => {
      const card = readSource("components/ui/ListingCard.tsx");
      expect(card).toContain("demandOverlayLabel");
      expect(card).toContain('data-demand-badge": "in-demand"');
      expect(card).toContain("demandOverlayLabel ? (");
      expect(card).not.toContain("evaluateDemand");
      expect(card).not.toContain("resolveListingDemand");
      expect(card).not.toContain("demandBadgeLabelFromResult");
    });
  });

  describe("Promo coexistence", () => {
    const card = readSource("components/ui/ListingCard.tsx");

    it("does not let Promo replace In demand", () => {
      expect(card).not.toContain("promotionBadge ??");
      expect(card).not.toContain("demandBadgeLabel ??");
      expect(card).toContain("promotionBadge || demandOverlayLabel");
    });

    it("PROMO only, IN_DEMAND only, and both can render independently", () => {
      expect(card).toContain("{promotionBadge ? (");
      expect(card).toContain("{demandOverlayLabel ? (");
      expect(card).toContain("css.badgeStack");
      expect(card).toContain("ListingPromotionBadge");
    });
  });

  describe("Cross-surface same product_id", () => {
    it("IN_DEMAND maps to ListingCard copy and Product Detail copy from one result", () => {
      const result = evaluate({
        offers: [
          {
            productId: PRODUCT_ID,
            buyerId: BUYER_A,
            createdAt: "2026-08-25T12:00:00.000Z",
            message: null,
            status: "pending",
          },
        ],
      });
      expect(result.productId).toBe(PRODUCT_ID);
      expect(demandBadgeLabelFromResult(result)).toBe("🔥 In demand");
      expect(result.badge?.detailTitle).toBe(DEMAND_DETAIL_TITLE_COPY);
      expect(result.badge?.detailBody).toBe(DEMAND_DETAIL_BODY_COPY);
    });

    it("Listing Detail consumes the listing-page resolver; ListingCard does not calculate", () => {
      const listingPage = readSource("app/(platform)/listing/[slug]/page.tsx");
      const detail = readSource("features/product-detail/ProductDetailPage.tsx");
      const card = readSource("components/ui/ListingCard.tsx");
      const categoryPage = readSource("app/(platform)/category/[...slug]/page.tsx");
      const categoryView = readSource(
        "features/categories/components/CategoryPageView.tsx",
      );

      expect(listingPage).toContain("resolveListingDemand");
      expect(listingPage).toContain("demandBadgeLabelFromResult");
      expect(listingPage).toContain("productId: product.id");
      expect(detail).toContain("demandBadge.title");
      expect(detail).toContain("demandBadge.body");
      expect(detail).toContain('data-demand-badge="in-demand"');
      expect(detail).not.toContain("evaluateDemand");
      expect(detail).not.toContain("resolveListingDemand");
      expect(card).not.toContain("evaluateDemand");
      expect(card).not.toContain("resolveListingDemand");
      expect(categoryPage).toContain("resolveDemandBadgeLabels");
      expect(categoryView).toContain("demandBadgeLabel={demandBadgeLabels?.[product.id]");
      expect(categoryView).not.toContain("evaluateDemand");
      expect(categoryView).not.toContain("resolveListingDemand");
    });

    it("does not wire Homepage, Search, Saved, or Store demand callers", () => {
      const homepage = readSource(
        "components/homepage/canonical/CanonicalMarketplaceFeed.tsx",
      );
      const search = readSource("features/search/components/SearchResultsView.tsx");
      const saved = readSource("features/account-module/components/SavedItemsV1.tsx");
      const store = readSource("features/store/components/ProStorePage.tsx");

      for (const source of [homepage, search, saved, store]) {
        expect(source).not.toContain("resolveListingDemand");
        expect(source).not.toContain("resolveDemandBadgeLabels");
        expect(source).not.toContain("evaluateDemand");
        expect(source).not.toContain("demandBadgeLabelFromResult");
      }
    });
  });
});
