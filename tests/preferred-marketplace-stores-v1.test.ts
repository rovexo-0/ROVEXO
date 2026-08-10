import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  injectPreferredMarketplaceStoreSlots,
  isPreferredStoreActiveNow,
  PREFERRED_MARKETPLACE_STORES_ENGINE_V1,
  type PreferredMarketplaceStoreConfig,
} from "@/lib/preferred-marketplace-stores/preferred-marketplace-stores-engine-v1";
import { PRODUCTION_LAUNCH_RESET_V1 } from "@/lib/launch/production-launch-reset-v1";
import type { Product } from "@/lib/products/types";

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function product(partial: Partial<Product> & Pick<Product, "id" | "sellerId" | "title">): Product {
  return {
    slug: partial.id,
    price: 10,
    condition: "good",
    sellerName: "Seller",
    rating: 5,
    reviewCount: 0,
    imageUrl: "/placeholder-product.svg",
    sections: [],
    ...partial,
  };
}

function store(
  partial: Partial<PreferredMarketplaceStoreConfig> & Pick<PreferredMarketplaceStoreConfig, "id" | "sellerId">,
): PreferredMarketplaceStoreConfig {
  return {
    enabled: true,
    homepageVisibility: true,
    promotionPriority: 100,
    minPosition: 10,
    maxPosition: 15,
    startAt: null,
    endAt: null,
    maxSimultaneousListings: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  };
}

describe("Preferred Marketplace Stores Engine v1.0", () => {
  it("forbids special buyer-facing labels and hardcodes", () => {
    expect(PREFERRED_MARKETPLACE_STORES_ENGINE_V1.forbiddenUiLabels).toEqual(
      expect.arrayContaining(["Admin", "Platform", "Official", "Owner"]),
    );
    const homepage = read("app/(platform)/page.tsx");
    const loader = read("lib/homepage/load-homepage-document.ts");
    expect(homepage).not.toMatch(/palademihaita88@gmail\.com/);
    expect(homepage).toContain("loadHomepageDocumentData");
    expect(loader).toContain("listActivePreferredMarketplaceStores");
  });

  it("injects one preferred listing into configured position range", () => {
    const items = Array.from({ length: 20 }, (_, index) =>
      product({
        id: `p${index + 1}`,
        sellerId: index === 14 ? "preferred-seller" : `s${index + 1}`,
        title: `Item ${index + 1}`,
        homepagePriorityScore: 100 - index,
      }),
    );

    const result = injectPreferredMarketplaceStoreSlots(items, [
      store({
        id: "cfg1",
        sellerId: "preferred-seller",
        minPosition: 10,
        maxPosition: 15,
        promotionPriority: 200,
      }),
    ]);

    const preferredIndex = result.findIndex((item) => item.sellerId === "preferred-seller");
    expect(preferredIndex).toBeGreaterThanOrEqual(9);
    expect(preferredIndex).toBeLessThanOrEqual(14);
    expect(result.filter((item) => item.sellerId === "preferred-seller")).toHaveLength(1);
  });

  it("respects enable/disable and date windows", () => {
    expect(
      isPreferredStoreActiveNow(
        store({ id: "a", sellerId: "s", enabled: false }),
      ),
    ).toBe(false);
    expect(
      isPreferredStoreActiveNow(
        store({
          id: "b",
          sellerId: "s",
          startAt: "2099-01-01T00:00:00.000Z",
        }),
      ),
    ).toBe(false);
  });

  it("wires Super Admin route + API + migration", () => {
    expect(read("app/(platform)/super-admin/preferred-marketplace-stores/page.tsx")).toContain(
      "PreferredMarketplaceStoresPanel",
    );
    expect(read("app/api/super-admin/preferred-marketplace-stores/route.ts")).toContain(
      "requireApiSuperAdmin",
    );
    expect(
      read("supabase/migrations/20260730180000_preferred_marketplace_stores_v1.sql"),
    ).toContain("preferred_marketplace_stores");
    expect(read("lib/super-admin/nav.ts")).toContain("/super-admin/preferred-marketplace-stores");
  });

  it("homepage feed resolve accepts preferred stores option", () => {
    const ranked = [
      product({ id: "a", sellerId: "s1", title: "A" }),
      product({ id: "b", sellerId: "pref", title: "B" }),
    ];
    const injected = injectPreferredMarketplaceStoreSlots(ranked, [
      store({ id: "c", sellerId: "pref", minPosition: 1, maxPosition: 1 }),
    ]);
    expect(injected[0]?.sellerId).toBe("pref");
    expect(read("lib/homepage/feed-resolve.ts")).toContain("preferredStores");
    expect(read("lib/homepage/feed-resolve.ts")).toContain("injectPreferredMarketplaceStoreSlots");
  });
});

describe("Production Launch Reset keep-list v1.0", () => {
  it("keeps Owner Super Admin + Admin and Full Demo by law", () => {
    expect(PRODUCTION_LAUNCH_RESET_V1.keepOwnerEmails).toEqual([
      "palademihaita88@gmail.com",
      "mihaitaself@gmail.com",
    ]);
    expect(PRODUCTION_LAUNCH_RESET_V1.fullDemoEmails).toEqual([
      "demo.buyer@rovexo.co.uk",
      "demo.seller@rovexo.co.uk",
    ]);
    expect(PRODUCTION_LAUNCH_RESET_V1.purgeNonKeepUsers).toBe(true);
    expect(PRODUCTION_LAUNCH_RESET_V1.keepOwnerRoles["palademihaita88@gmail.com"]).toBe(
      "super_admin",
    );
    expect(PRODUCTION_LAUNCH_RESET_V1.keepOwnerRoles["mihaitaself@gmail.com"]).toBe("admin");
  });

  it("script purges non-keep users only after Owner gates", () => {
    const script = read("scripts/production-launch-reset-v1.ts");
    expect(script).toContain("purgeNonKeepUsers");
    expect(script).toContain("LAUNCH_RESET_OWNER_APPROVED");
    expect(script).toContain("keepOwnerEmails");
    expect(script).toContain("auth.admin.deleteUser");
  });
});
