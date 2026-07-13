import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

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

  it("reads stored seller performance values from the engine service", () => {
    const summary = readSource("lib/account-center/seller-performance-summary.ts");

    expect(summary).toContain("getSellerPerformanceScore");
    expect(summary).toContain("progressToNextLevel");
    expect(summary).toContain("buildNextLevelRequirements");
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
    expect(card).toContain("formatSellerPerformanceRating");
  });
});
