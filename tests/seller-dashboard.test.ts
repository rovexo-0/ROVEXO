import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REQUIRED_FILES = [
  "app/seller/page.tsx",
  "app/seller/layout.tsx",
  "app/seller/loading.tsx",
  "app/seller/error.tsx",
  "components/seller/SellerDashboard.tsx",
  "lib/seller/repository.ts",
  "lib/seller/queries.ts",
  "hooks/seller/SellerDashboardProvider.tsx",
  "types/seller/dashboard.ts",
  "styles/rovexo-seller-dashboard.css",
  "docs/modules/seller-dashboard/MASTER_ENGINEERING_SPEC.md",
];

const REQUIRED_COMPONENTS = [
  "SellerHeroCard",
  "SellerStatsGrid",
  "SellerPerformanceCard",
  "SellerOrdersCard",
  "SellerListingsCard",
  "SellerDraftsCard",
  "SellerMessagesCard",
  "SellerReviewsCard",
  "SellerPayoutCard",
  "SellerBalanceCard",
  "SellerShippingCard",
  "SellerAnalyticsCard",
  "SellerPromotionCard",
  "SellerStoreCard",
  "SellerVerificationCard",
  "SellerSubscriptionCard",
  "SellerNotificationCard",
  "SellerQuickActions",
  "SellerRecentActivity",
  "SellerSupportCard",
  "SellerSettingsShortcut",
  "SellerFooterActions",
];

describe("Seller Dashboard v1.0 — single source of truth", () => {
  it("uses the official /seller route with Account Center module", () => {
    const page = readFileSync(join(process.cwd(), "app/seller/page.tsx"), "utf8");
    expect(page).toContain("AccountCenterModulePage");
    expect(page).toContain('moduleId="seller"');
    expect(page).not.toContain("SellerDashboardV2");
  });

  it("redirects legacy /seller/dashboard", () => {
    const legacy = readFileSync(join(process.cwd(), "app/seller/dashboard/page.tsx"), "utf8");
    expect(legacy).toContain('redirect("/seller")');
  });

  it("includes required architecture files", () => {
    for (const file of REQUIRED_FILES) {
      expect(existsSync(join(process.cwd(), file))).toBe(true);
    }
  });

  it("composes all official section components", () => {
    const dashboard = readFileSync(join(process.cwd(), "components/seller/SellerDashboard.tsx"), "utf8");
    for (const name of REQUIRED_COMPONENTS) {
      expect(dashboard).toContain(name);
    }
  });

  it("uses repository layering and RovexoIcon", () => {
    const repository = readFileSync(join(process.cwd(), "lib/seller/repository.ts"), "utf8");
    const hero = readFileSync(join(process.cwd(), "components/seller/SellerHeroCard.tsx"), "utf8");
    expect(repository).toContain("fetchSellerDashboardRepository");
    expect(repository).toContain("getSellerDashboardData");
    expect(hero).toContain("RovexoIcon");
    expect(hero).not.toContain("lucide-react");
  });
});
