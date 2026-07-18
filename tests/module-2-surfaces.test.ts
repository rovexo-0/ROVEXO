import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Module 2 — Core Surface Simplification", () => {
  it("defines BusinessBadge as the single source of truth", () => {
    const badge = readSource("components/ui/BusinessBadge.tsx");
    expect(badge).toContain("data-business-badge");
    expect(badge).toContain("Verified Business");
    expect(badge).toContain("resolveBusinessBadgeKinds");
  });

  it("wires BusinessBadge into listing, profile, and business surfaces", () => {
    expect(readSource("components/ui/ListingCard.tsx")).toContain("resolveHomepagePromotionBadge");
    expect(readSource("features/account/components/ProfileEditPage.tsx")).toContain("AvatarUploader");
    expect(readSource("features/business/components/BusinessDirectoryPage.tsx")).toContain(
      "BusinessBadge",
    );
    expect(readSource("features/business/dashboard/components/BusinessProfileCard.tsx")).toContain(
      "BusinessBadge",
    );
    expect(readSource("features/product-detail/ProductStoreSection.tsx")).toContain("Verified Store");
  });

  it("uses design tokens on showcase grid and sell upload surfaces", () => {
    const gridLock = readSource("styles/rovexo/home-listing-grid-lock.css");
    const sell = readSource("styles/rovexo/sell.css");

    expect(gridLock).toContain("var(--ds-color-surface)");
    expect(gridLock).not.toContain('[data-theme="dark"]');
    expect(sell).toContain("var(--ds-color-surface-muted)");
    expect(sell).toContain("background: #ffffff");
  });

  it("keeps promotional tools linked from Selling hub", () => {
    const selling = readSource("lib/account-center/selling-menu.ts");
    expect(selling).toContain("Promotions");
    expect(selling).toContain("/account/promotion-tools");
  });

  it("ships module 2 screenshot and audit scripts", () => {
    expect(existsSync(join(process.cwd(), "scripts/module2-screenshots.mjs"))).toBe(true);
    expect(existsSync(join(process.cwd(), "scripts/module2-audit.mjs"))).toBe(true);
  });
});
