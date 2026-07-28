import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  isStoreId,
  isStoreSlug,
  resolveStoreHrefFromSeller,
} from "@/lib/store/store-href";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Store SSOT — seller_id → store_id → store_slug", () => {
  it("identifies store_id UUID vs store_slug", () => {
    expect(isStoreId("8346d7b6-19e9-4e93-a60a-fb93452a19ad")).toBe(true);
    expect(isStoreId("demo-seller")).toBe(false);
    expect(isStoreSlug("acme-store")).toBe(true);
    expect(isStoreSlug("8346d7b6-19e9-4e93-a60a-fb93452a19ad")).toBe(false);
  });

  it("builds /store href from seller_id / store_slug only", () => {
    expect(
      resolveStoreHrefFromSeller({
        sellerId: "8346d7b6-19e9-4e93-a60a-fb93452a19ad",
        storeSlug: "rovexo_live_seller",
      }),
    ).toBe("/store/rovexo_live_seller");
    expect(
      resolveStoreHrefFromSeller({
        sellerId: "8346d7b6-19e9-4e93-a60a-fb93452a19ad",
        storeSlug: null,
      }),
    ).toBe("/store/8346d7b6-19e9-4e93-a60a-fb93452a19ad");
    expect(resolveStoreHrefFromSeller({ sellerId: null, storeSlug: null })).toBeNull();
  });

  it("store route resolves via repository SSOT — not business-only username gate", () => {
    const page = readSource("app/store/[slug]/page.tsx");
    expect(page).toContain("resolveStoreByRouteParam");
    expect(page).not.toContain("role !== \"business\"");
    expect(page).not.toContain("ILIKE");
    expect(page).not.toContain("demo-seller");
  });

  it("user route loads store via same repository", () => {
    const page = readSource("app/user/[username]/page.tsx");
    expect(page).toContain("resolveStoreByRouteParam");
    expect(page).toContain("StoreUnavailablePage");
    expect(page).not.toContain("notFound(");
  });
});
