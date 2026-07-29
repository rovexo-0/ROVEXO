import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  excludeHolidayModeSellerRows,
  HOLIDAY_MODE_DISABLE_CONFIRM,
  HOLIDAY_MODE_ENABLE_CONFIRM,
  HOLIDAY_MODE_LISTING_UNAVAILABLE_MESSAGE,
  HOLIDAY_MODE_PROFILE_EMPTY_MESSAGE,
  HOLIDAY_MODE_VISIBILITY_VERSION,
} from "@/lib/listings/holiday-mode-visibility-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Holiday Mode — Global Listing Visibility Engine", () => {
  it("locks seller-state SSOT copy and version", () => {
    expect(HOLIDAY_MODE_VISIBILITY_VERSION).toBe("1.0");
    expect(HOLIDAY_MODE_LISTING_UNAVAILABLE_MESSAGE).toContain("Holiday Mode");
    expect(HOLIDAY_MODE_PROFILE_EMPTY_MESSAGE).toContain("Holiday Mode");
    expect(HOLIDAY_MODE_ENABLE_CONFIRM.confirm).toBe("Enable");
    expect(HOLIDAY_MODE_DISABLE_CONFIRM.confirm).toBe("Disable");
  });

  it("filters rows by seller holiday set without mutating listing status", () => {
    const rows = [
      { seller_id: "a", slug: "one" },
      { seller_id: "b", slug: "two" },
      { seller_id: "a", slug: "three" },
    ];
    const next = excludeHolidayModeSellerRows(rows, new Set(["a"]));
    expect(next.map((r) => r.slug)).toEqual(["two"]);
  });

  it("wires discovery repositories through holiday visibility filter", () => {
    // Cluster 1 isolation: listings/repository Counter SSOT only.
    // Holiday visibility SSOT remains holiday-mode-visibility-v1 + products repository.
    const holidayEngine = readSource("lib/listings/holiday-mode-visibility-v1.ts");
    const productsRepo = readSource("lib/products/repository.ts");
    const eligible = readSource("lib/listings/eligible-listings.ts");
    const listingsRepo = readSource("lib/listings/repository.ts");
    expect(holidayEngine).toContain("applyHolidayModeVisibilityFilter");
    expect(productsRepo).toContain("applyHolidayModeVisibilityFilter");
    expect(productsRepo).toContain("isSellerOnVacation");
    expect(productsRepo).toContain("sellerOnHoliday");
    expect(eligible).toContain("Holiday Mode");
    expect(listingsRepo).not.toContain("applyHolidayModeVisibilityFilter");
  });

  it("confirms toggle + hides PDP purchase CTAs + profile empty copy", () => {
    const row = readSource("features/account-center/components/HolidayModeProfileRow.tsx");
    const pdp = readSource("features/product-detail/ProductDetailPage.tsx");
    const profile = readSource("features/profile/components/ViewProfilePage.tsx");
    expect(row).toContain("HOLIDAY_MODE_ENABLE_CONFIRM");
    expect(row).toContain("HOLIDAY_MODE_DISABLE_CONFIRM");
    expect(row).toContain("Dialog");
    expect(row).not.toContain("no confirmation");
    expect(pdp).toContain("HOLIDAY_MODE_LISTING_UNAVAILABLE_MESSAGE");
    expect(pdp).toContain("sellerOnHoliday");
    expect(pdp).toContain("{!sellerOnHoliday ? (");
    expect(profile).toContain("HOLIDAY_MODE_PROFILE_EMPTY_MESSAGE");
    expect(profile).toContain("holidayMode");
  });

  it("does not mass-edit product status for holiday mode", () => {
    const visibility = readSource("lib/listings/holiday-mode-visibility-v1.ts");
    expect(visibility).toContain("user_settings.vacation_mode");
    expect(visibility).not.toContain('.update("status"');
    expect(visibility).not.toContain("status: \"paused\"");
    expect(visibility).not.toContain("status: \"archived\"");
  });
});
