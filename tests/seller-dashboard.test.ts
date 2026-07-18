import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REQUIRED_FILES = [
  "app/seller/page.tsx",
  "app/seller/layout.tsx",
  "app/seller/loading.tsx",
  "app/seller/error.tsx",
  "lib/account-center/selling-menu.ts",
  "features/account-center/components/SellingMenuSections.tsx",
  "components/seller/SellerSkeleton.tsx",
  "components/seller/SellerErrorState.tsx",
  "lib/seller/repository.ts",
  "lib/seller/queries.ts",
];

describe("Selling workspace v1.0 — single source of truth", () => {
  it("uses the official /seller route with Account Center module", () => {
    const page = readFileSync(join(process.cwd(), "app/seller/page.tsx"), "utf8");
    expect(page).toContain("AccountCenterModulePage");
    expect(page).toContain('moduleId="selling"');
    expect(page).not.toContain("SellerDashboardV2");
    expect(page).not.toContain("SellerDashboardPage");
  });

  it("redirects legacy /seller/dashboard", () => {
    const legacy = readFileSync(join(process.cwd(), "app/seller/dashboard/page.tsx"), "utf8");
    expect(legacy).toContain('redirect("/seller")');
  });

  it("includes required Selling hub architecture files", () => {
    for (const file of REQUIRED_FILES) {
      expect(existsSync(join(process.cwd(), file)), file).toBe(true);
    }
  });

  it("does not ship orphan SellerDashboard UI", () => {
    expect(existsSync(join(process.cwd(), "components/seller/SellerDashboard.tsx"))).toBe(false);
    expect(existsSync(join(process.cwd(), "features/seller/dashboard/components/SellerDashboardPage.tsx"))).toBe(
      false,
    );
  });

  it("keeps seller repository layering for data", () => {
    const repository = readFileSync(join(process.cwd(), "lib/seller/repository.ts"), "utf8");
    expect(repository).toContain("fetchSellerDashboardRepository");
    expect(repository).toContain("getSellerDashboardData");
  });
});
