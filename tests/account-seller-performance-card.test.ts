import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("My Account Seller Performance card", () => {
  it("wires compact hub card above the account menu", () => {
    const home = readSource("features/account-center/components/AccountCenterHome.tsx");
    const page = readSource("app/account/page.tsx");
    const card = readSource("features/account-center/components/AccountSellerPerformanceCard.tsx");

    expect(home).toContain("AccountSellerPerformanceCard");
    expect(home).toMatch(/AccountSellerPerformanceCard[\s\S]*AccountMenuSections/);
    expect(page).toContain("getSellerPerformanceSummary");
    expect(page).toContain("sellerPerformance={sellerPerformance}");
    expect(card).toContain('router.push("/seller/performance")');
    expect(card).toContain("View Details");
    expect(card).toContain("AccountSellerLevelBadge");
    expect(card).toContain("Response Rate");
    expect(card).toContain('data-ac-seller-performance="v1.0-compact"');
  });

  it("uses compact summary layout markers", () => {
    const card = readSource("features/account-center/components/AccountSellerPerformanceCard.tsx");
    const css = readSource("styles/rovexo/account-canonical-v2.css");

    expect(card).toContain("ac-v1__seller-card");
    expect(card).toContain("performance.ratingDisplay");
    expect(card).toContain("Completed Sales");
    expect(css).toContain(".ac-v1__seller-metrics");
    expect(css).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
  });

  it("reads stored seller performance values from the engine service", () => {
    const summary = readSource("lib/account-center/seller-performance-summary.ts");

    expect(summary).toContain("getSellerPerformanceSummary");
    expect(summary).toContain("getSellerPerformanceScore");
    expect(summary).toContain("responseRatePercent");
    expect(summary).toContain("Start selling to build your reputation.");
  });

  it("renders required card fields from summary props", () => {
    const card = readSource("features/account-center/components/AccountSellerPerformanceCard.tsx");

    expect(card).toContain("performance.level");
    expect(card).toContain("performance.totalSales");
    expect(card).toContain("performance.responseRatePercent");
    expect(card).toContain("performance.ratingDisplay");
  });
});
