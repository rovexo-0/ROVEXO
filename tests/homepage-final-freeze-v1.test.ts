import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  HOMEPAGE_CEO_FINAL_LOCK,
  isValidHomepageListingHref,
  isValidHomepageStoreHref,
  listingHrefFromSlug,
  STORE_UNAVAILABLE_COPY,
} from "@/lib/homepage/homepage-final-freeze-v1";
import { resolveShowcaseProfileHref } from "@/lib/homepage/showcase-sellers";
import type { Product } from "@/lib/products/types";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function product(partial: Partial<Product>): Product {
  return {
    id: partial.id ?? "id",
    slug: partial.slug ?? "slug",
    title: partial.title ?? "Item",
    price: 10,
    condition: "new",
    sellerName: partial.sellerName ?? "Seller",
    sellerId: partial.sellerId ?? "s1",
    sellerUsername: partial.sellerUsername ?? null,
    sellerRole: partial.sellerRole,
    rating: 5,
    reviewCount: 1,
    imageUrl: "/placeholder.png",
    sections: [],
    ...partial,
  };
}

describe("ROVEXO v1.0 — Homepage Final Freeze", () => {
  it("records CEO Final Lock status and Showcase 9+1 rail", () => {
    expect(HOMEPAGE_CEO_FINAL_LOCK.status).toBe("FINAL_LOCK");
    expect(HOMEPAGE_CEO_FINAL_LOCK.priority).toBe("P0");
    expect(HOMEPAGE_CEO_FINAL_LOCK.socialFollow).toBe("PERMANENTLY_REMOVED");
    expect(HOMEPAGE_CEO_FINAL_LOCK.showcase.listingMax).toBe(9);
    expect(HOMEPAGE_CEO_FINAL_LOCK.showcase.viewAllCards).toBe(1);
    expect(HOMEPAGE_CEO_FINAL_LOCK.showcase.railMax).toBe(10);
    expect(HOMEPAGE_CEO_FINAL_LOCK.showcase.infiniteScroll).toBe(false);
  });

  it("allows only /user /store /listing routes", () => {
    expect(isValidHomepageStoreHref("/user/demo-seller")).toBe(true);
    expect(isValidHomepageStoreHref("/store/acme")).toBe(true);
    expect(isValidHomepageStoreHref("/search?seller=x")).toBe(false);
    expect(isValidHomepageStoreHref("/")).toBe(false);
    expect(isValidHomepageStoreHref("/user/null")).toBe(false);
    expect(isValidHomepageListingHref("/listing/iphone-18-pro")).toBe(true);
    expect(listingHrefFromSlug("undefined")).toBeNull();
    // Public Profile: username → /user/... · fallback store_slug → /store/...
    expect(resolveShowcaseProfileHref(product({ sellerUsername: "alpha", sellerId: "s1" }))).toBe(
      "/user/alpha",
    );
    expect(
      resolveShowcaseProfileHref(
        product({
          sellerUsername: "acme",
          sellerRole: "business",
          sellerId: "8346d7b6-19e9-4e93-a60a-fb93452a19ad",
        }),
      ),
    ).toBe("/user/acme");
    expect(
      resolveShowcaseProfileHref(
        product({
          sellerUsername: null,
          sellerId: "8346d7b6-19e9-4e93-a60a-fb93452a19ad",
        }),
      ),
    ).toBe("/store/8346d7b6-19e9-4e93-a60a-fb93452a19ad");
    expect(resolveShowcaseProfileHref(product({ sellerUsername: null, sellerId: "s1" }))).toBeNull();
  });

  it("never calls notFound for store / user / listing missing resources", () => {
    const userPage = readSource("app/user/[username]/page.tsx");
    const storePage = readSource("app/store/[slug]/page.tsx");
    const listingPage = readSource("app/listing/[slug]/page.tsx");
    expect(userPage).not.toContain("notFound(");
    expect(storePage).not.toContain("notFound(");
    expect(listingPage).not.toContain("notFound(");
    expect(userPage).toContain("StoreUnavailablePage");
    expect(STORE_UNAVAILABLE_COPY.title).toBe("Store unavailable");
  });
});
