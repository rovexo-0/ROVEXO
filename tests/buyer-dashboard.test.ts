import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REQUIRED_FILES = [
  "app/buyer/page.tsx",
  "components/buyer/BuyerDashboard.tsx",
  "components/buyer/BuyerHeader.tsx",
  "components/buyer/BuyerHero.tsx",
  "lib/buyer/repository.ts",
  "lib/buyer/queries.ts",
  "hooks/buyer/BuyerDashboardProvider.tsx",
  "types/buyer/dashboard.ts",
  "styles/rovexo-buyer-dashboard.css",
];

const REQUIRED_COMPONENT_FILES = [
  "components/buyer/BuyerProfileCard.tsx",
  "components/buyer/BuyerTrustCard.tsx",
  "components/buyer/BuyerQuickActions.tsx",
  "components/buyer/BuyerStatistics.tsx",
  "components/buyer/BuyerOrders.tsx",
  "components/buyer/BuyerOrderHistory.tsx",
  "components/buyer/BuyerSavedListings.tsx",
  "components/buyer/BuyerRecentlyViewed.tsx",
  "components/buyer/BuyerProtection.tsx",
  "components/buyer/BuyerAddresses.tsx",
  "components/buyer/BuyerPayments.tsx",
  "components/buyer/BuyerMessages.tsx",
  "components/buyer/BuyerNotifications.tsx",
  "components/buyer/BuyerReviews.tsx",
  "components/buyer/BuyerSecurity.tsx",
  "components/buyer/BuyerSettings.tsx",
  "components/buyer/BuyerSupport.tsx",
  "components/buyer/BuyerLogout.tsx",
  "components/buyer/BuyerSkeleton.tsx",
  "components/buyer/BuyerEmptyState.tsx",
  "components/buyer/BuyerErrorState.tsx",
];

describe("Buyer Dashboard v1.0 — single source of truth", () => {
  it("uses the official route and entry component", () => {
    const page = readFileSync(join(process.cwd(), "app/buyer/page.tsx"), "utf8");
    expect(page).toContain("BuyerDashboard");
    expect(page).toContain("@/components/buyer/BuyerDashboard");
    expect(page).not.toContain("BuyerDashboardV2");
  });

  it("includes the required architecture files", () => {
    for (const file of REQUIRED_FILES) {
      expect(existsSync(join(process.cwd(), file))).toBe(true);
    }
  });

  it("includes all official buyer dashboard section files", () => {
    for (const file of REQUIRED_COMPONENT_FILES) {
      expect(existsSync(join(process.cwd(), file))).toBe(true);
    }
  });

  it("composes the dashboard from official section components", () => {
    const dashboard = readFileSync(join(process.cwd(), "components/buyer/BuyerDashboard.tsx"), "utf8");
    expect(dashboard).toContain("BuyerHero");
    expect(dashboard).toContain("BuyerQuickActions");
    expect(dashboard).toContain("BuyerLogout");
    expect(dashboard).not.toContain("BuyerDashboardV2");
  });

  it("uses RovexoIcon and repository layering", () => {
    const header = readFileSync(join(process.cwd(), "components/buyer/BuyerHeader.tsx"), "utf8");
    const repository = readFileSync(join(process.cwd(), "lib/buyer/repository.ts"), "utf8");
    const page = readFileSync(join(process.cwd(), "app/buyer/page.tsx"), "utf8");

    expect(header).toContain("RovexoIcon");
    expect(header).not.toContain("lucide-react");
    expect(repository).toContain("fetchOrdersForUser");
    expect(repository).not.toContain("from(\"products\")");
    expect(page).toContain("fetchBuyerDashboard");
  });

  it("does not modify the frozen homepage", () => {
    const homePage = readFileSync(join(process.cwd(), "components/home/RovexoHomePage.tsx"), "utf8");
    expect(homePage).toContain("RovexoCategoryRail");
    expect(existsSync(join(process.cwd(), "app/page.tsx"))).toBe(true);
  });
});
