import { describe, expect, it } from "vitest";

import { readFileSync } from "node:fs";

import { join } from "node:path";

import {

  computeHomepagePriorityScore,

  HOMEPAGE_PRIORITY_WEIGHTS,

  resolveHomepagePromotionBadge,

} from "@/lib/homepage/feed-ranking";

import type { Product } from "@/lib/products/types";



function product(partial: Partial<Product> & Pick<Product, "id" | "slug" | "title" | "price">): Product {

  return {

    condition: "Excellent",

    sellerName: "Seller",

    rating: 4.8,

    reviewCount: 10,

    imageUrl: "/icons/categories/phones.svg",

    sections: ["popular"],

    ...partial,

  };

}



describe("Homepage feed ranking v2.0", () => {

  it("applies canonical promotion priority weights", () => {

    const premium = product({

      id: "1",

      slug: "premium",

      title: "Premium",

      price: 100,

      sellerTier: "premium",

    });

    const boost = product({

      id: "2",

      slug: "boost",

      title: "Boost",

      price: 100,

      isBumped: true,

    });

    const organic = product({ id: "3", slug: "organic", title: "Organic", price: 100 });



    expect(computeHomepagePriorityScore(premium)).toBe(HOMEPAGE_PRIORITY_WEIGHTS.premium);

    expect(computeHomepagePriorityScore(boost)).toBe(HOMEPAGE_PRIORITY_WEIGHTS.boost);

    expect(computeHomepagePriorityScore(organic)).toBe(HOMEPAGE_PRIORITY_WEIGHTS.organic);

    expect(computeHomepagePriorityScore(premium)).toBeGreaterThan(computeHomepagePriorityScore(boost));

  });



  it("returns a single badge without creating homepage sections", () => {

    const listing = product({

      id: "4",

      slug: "mixed",

      title: "Mixed",

      price: 100,

      sellerTier: "premium",

      isBumped: true,

      isFeatured: true,

    });



    expect(resolveHomepagePromotionBadge(listing)).toEqual({

      label: "Premium",

      tone: "premium",

    });

  });

});



describe("Homepage single feed architecture", () => {

  function readSource(relativePath: string): string {

    return readFileSync(join(process.cwd(), relativePath), "utf8");

  }



  it("uses one server fetch and one feed component on the homepage", () => {

    const page = readSource("app/page.tsx");

    const homePage = readSource("components/home/RovexoHomePage.tsx");



    expect(page).toContain("fetchHomepageFeed");

    expect(page).toContain("resolveHomepageFeedItems");

    expect(page).not.toContain("enrichHomepageData");

    expect(page).not.toContain('fetchProducts("popular"');

    expect(homePage).toContain("RovexoAllListings");

    expect(homePage).not.toContain("RovexoFeaturedListings");

    expect(homePage).not.toContain("RovexoBusinesses");

  });



  it("exposes a dedicated homepage feed API", () => {

    const route = readSource("app/api/homepage/feed/route.ts");

    const allListings = readSource("components/home/RovexoAllListings.tsx");



    expect(route).toContain("getHomepageFeed");

    expect(allListings).toContain("/api/homepage/feed?page=");

  });

});

