import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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
    expect(page).toContain("fetchAccountSellerPerformanceSummary");
    expect(page).toContain("sellerPerformance={sellerPerformance}");
    expect(card).toContain('href="/seller/performance"');
    expect(card).toContain("View details");
    expect(card).toContain("SellerLevelBadge");
    expect(card).toContain("AccountSellerScoreRing");
    expect(card).toContain('data-ac-seller-performance="v1.0"');
  });

  it("uses compact summary layout markers", () => {
    const card = readSource("features/account-center/components/AccountSellerPerformanceCard.tsx");
    const css = readSource("styles/rovexo/account-canonical-v2.css");

    expect(card).toContain("ac-canonical__seller-performance-link");
    expect(card).toContain("AccountSellerStarRating");
    expect(card).toContain("Completed Sales");
    expect(card).not.toContain("ac-canonical__seller-performance-cta");
    expect(css).toContain(".ac-canonical__seller-performance-grid");
    expect(css).toContain(".ac-canonical__seller-progress-bar-row");
    expect(css).not.toContain(".ac-canonical__seller-performance-cta");
  });

  it("reads stored seller performance values from the engine service", () => {
    const summary = readSource("lib/account-center/seller-performance-summary.ts");

    expect(summary).toContain("getSellerPerformanceScore");
    expect(summary).toContain("progressToNextLevel");
    expect(summary).toContain("buildNextLevelRequirements");
    expect(summary).toContain("Start selling to build your reputation.");
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
    expect(card).toContain("performance.reviewCount");
  });
});

describe("account seller performance summary messages", () => {
  const emptyFactors: SellerPerformanceFactors = {
    completedOrders: 0,
    reviews: {
      averageRating: 0,
      reviewCount: 0,
      stars: { five: 0, four: 0, three: 0, two: 0, one: 0 },
    },
    responseRatePercent: 0,
    averageResponseTimeMinutes: null,
    averageDispatchTimeHours: null,
    cancellationRatePercent: 0,
    validatedReports: 0,
    profileCompletion: { percent: 0, completed: [], missing: [] },
    storeActivity: { score: 0 },
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
