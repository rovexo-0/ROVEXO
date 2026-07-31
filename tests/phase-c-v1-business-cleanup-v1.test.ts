import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  isV1BusinessUxRemoved,
  PHASE_C_V1_BUSINESS_CLEANUP_V1,
} from "@/lib/phase-c-v1-business-cleanup-v1";
import {
  resolveBusinessAddressesVisibility,
  resolveBusinessVisibility,
} from "@/lib/master-engine";

function readSource(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("Phase C — Business cleanup & branding lock", () => {
  it("locks Business UX removed for v1.0", () => {
    expect(PHASE_C_V1_BUSINESS_CLEANUP_V1.status).toBe("ACTIVE");
    expect(isV1BusinessUxRemoved()).toBe(true);
    expect(resolveBusinessVisibility({ isBusinessVerified: true }).showBusinessBank).toBe(false);
    expect(resolveBusinessAddressesVisibility().showBusinessAddressesTab).toBe(false);
  });

  it("redirects /business layout to Personal Account", () => {
    const layout = readSource("app/business/layout.tsx");
    expect(layout).toContain("isV1BusinessUxRemoved");
    expect(layout).toContain('redirect(PHASE_C_V1_BUSINESS_CLEANUP_V1.redirectBusinessRoutesTo)');
  });

  it("removes Following feed from Canonical Homepage", () => {
    const home = readSource("components/homepage/canonical/CanonicalHomepage.tsx");
    expect(home).not.toContain("FollowingFeedSection");
    expect(home).toContain("CanonicalMarketplaceFeed");
  });

  it("removes Holiday Mode enabled banner toast + PDP banner", () => {
    expect(readSource("features/account-center/components/HolidayModeProfileRow.tsx")).not.toContain(
      "Holiday Mode enabled.",
    );
    expect(readSource("features/product-detail/ProductDetailPage.tsx")).not.toContain(
      "data-holiday-mode-banner",
    );
    expect(readSource("features/account-center/components/HolidayModeProfileRow.tsx")).toContain(
      "CanonicalSwitch",
    );
  });

  it("removes Continue where you left off from Bank Accounts", () => {
    expect(readSource("features/wallet/components/WalletBankAccountsPage.tsx")).not.toContain(
      "Continue where you left off",
    );
  });

  it("wires layout icons to Level III App Icon", () => {
    expect(readSource("app/layout.tsx")).toContain("/brand/canonical-rx/app-icon-v1.png");
    expect(readSource("app/layout.tsx")).not.toContain("/brand/canonical-rx/rx-mark-v3.png");
  });

  it("removes Businesses search scope", () => {
    expect(readSource("features/search/types/index.ts")).not.toContain('"businesses"');
    expect(readSource("features/search/components/SearchScopeChips.tsx")).not.toContain(
      "/business/directory",
    );
  });
});
