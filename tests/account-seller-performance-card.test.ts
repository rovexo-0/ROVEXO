import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { formatAccountSellerRatingDisplay } from "@/lib/account-center/format-seller-rating";
import {
  buildNextLevelRequirements,
  progressToNextLevel,
} from "@/lib/seller-performance/levels";
import type { ComponentScores, SellerPerformanceFactors } from "@/lib/seller-performance/types";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("My Account Seller Performance card", () => {
  it("wires hub card between quick stats and manage menu", () => {
    const home = readSource("features/account-center/components/AccountCenterHome.tsx");
    const page = readSource("app/account/page.tsx");
    const card = readSource("features/account-center/components/AccountSellerPerformanceCard.tsx");

    expect(home).toContain("AccountSellerPerformanceCard");
    expect(home).toMatch(
      /AccountStatsStrip[\s\S]*AccountSellerPerformanceCard[\s\S]*AccountMenuSections/,
    );
    expect(page).toContain("getSellerPerformanceSummary");
    expect(page).toContain("sellerPerformance={sellerPerformance}");
    expect(card).toContain('router.push("/seller/performance")');
    expect(card).toContain("View details");
    expect(card).toContain("AccountSellerLevelBadge");
    expect(card).toContain("AccountSellerScoreRing");
    expect(card).toContain('data-ac-seller-performance="v1.0-frozen"');
  });

  it("uses compact summary layout markers", () => {
    const card = readSource("features/account-center/components/AccountSellerPerformanceCard.tsx");
    const css = readSource("styles/rovexo/account-canonical-v2.css");

    expect(card).toContain("ac-canonical__seller-performance-link");
    expect(card).toContain("BagLineIcon");
    expect(card).toContain("performance.ratingDisplay");
    expect(card).toContain("Completed Sales");
    expect(card).not.toContain("ac-canonical__seller-performance-cta");
    expect(css).toContain(".ac-canonical__seller-performance-grid");
    expect(css).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");
    expect(css).toContain("height: 64px");
    expect(css).toContain("margin-bottom: 10px");
    expect(css).toContain("ac-canonical__seller-score-ring--animate");
    expect(css).toContain("font-size: 28px");
    expect(css).toContain("height: 6px");
    expect(css).toContain("cursor: pointer");
    expect(css).not.toContain(".ac-canonical__seller-performance-cta");
  });

  it("reads stored seller performance values from the engine service", () => {
    const summary = readSource("lib/account-center/seller-performance-summary.ts");

    expect(summary).toContain("getSellerPerformanceSummary");
    expect(summary).toContain("getSellerPerformanceScore");
    expect(summary).toContain("progressToNextLevel");
    expect(summary).toContain("buildNextLevelRequirements");
    expect(summary).toContain("Start selling to build your reputation.");
    expect(summary).toContain("Almost ");
    expect(summary).not.toContain("calculateSellerPerformanceScore");
    expect(summary).not.toContain("placeholder");
    expect(summary).not.toContain("demo");
  });

  it("renders required card fields from summary props", () => {
    const card = readSource("features/account-center/components/AccountSellerPerformanceCard.tsx");

    expect(card).toContain("performance.level");
    expect(card).toContain("performance.score");
    expect(card).toContain("performance.totalSales");
    expect(card).toContain("performance.progressPercent");
    expect(card).toContain("performance.progressMessage");
    expect(card).toContain("performance.ratingDisplay");
  });
});

describe("formatAccountSellerRatingDisplay", () => {
  it("formats new and rated seller lines", () => {
    expect(formatAccountSellerRatingDisplay(0, 0)).toBe("⭐ New");
    expect(formatAccountSellerRatingDisplay(4.8, 12)).toBe("★★★★☆ 4.8");
    expect(formatAccountSellerRatingDisplay(4.3, 2)).toBe("★★★★☆ 4.3");
  });
});

describe("account seller performance summary messages", () => {
  const emptyFactors: SellerPerformanceFactors = {
    reviews: {
      averageRating: 0,
      reviewCount: 0,
      stars: { five: 0, four: 0, three: 0, two: 0, one: 0 },
    },
    completedOrders: 0,
    messagesReceived: 0,
    messagesReplied: 0,
    responseRatePercent: 0,
    averageResponseTimeMinutes: null,
    averageDispatchTimeHours: null,
    dispatchWithin24hPercent: null,
    dispatchWithin48hPercent: null,
    cancelledOrders: 0,
    cancellationRatePercent: 0,
    validatedReports: 0,
    profileCompletion: { percent: 0, completed: [], missing: [] },
    storeActivity: {
      recentListings: 0,
      recentLogins: 0,
      recentMessages: 0,
      recentSales: 0,
      recentUpdates: 0,
      score: 0,
    },
    identityVerified: false,
    businessVerified: false,
  };

  const components: ComponentScores = {
    reviews: 0,
    completedOrders: 0,
    responseRate: 0,
    averageResponseTime: 50,
    dispatchTime: 50,
    cancellationRate: 100,
    validReports: 100,
    profileCompletion: 0,
    storeActivity: 0,
  };

  it("builds progress requirements from engine levels", () => {
    const progress = progressToNextLevel(45);
    const factors = { ...emptyFactors, completedOrders: 3 };
    progress.requirements = buildNextLevelRequirements(45, factors, components);

    expect(progress.nextLevel).toBe("trusted_seller");
    expect(progress.pointsToNext).toBeGreaterThan(0);
    expect(progress.requirements.length).toBeGreaterThan(0);
  });
});
