import { describe, expect, it } from "vitest";
import { homePageJsonLd } from "@/lib/seo/home-jsonld";
import type { Product } from "@/lib/products/types";

const HOMEPAGE_CANONICAL = "https://www.rovexo.co.uk/";

function sampleProduct(slug: string): Product {
  return {
    id: "p1",
    slug,
    title: "Sample",
    price: 10,
    condition: "New",
    sellerName: "Seller",
    imageUrl: "https://example.com/a.jpg",
    images: ["https://example.com/a.jpg"],
    createdAt: "2026-01-01T00:00:00.000Z",
    category: "electronics",
    availability: "in_stock",
    rating: 0,
    reviewCount: 0,
    views: 0,
  } as Product;
}

describe("SEO Wave 1 Task 1A — homepage JSON-LD URL normalization", () => {
  it("keeps WebSite.url with trailing slash and emits single-slash path URLs", () => {
    const data = homePageJsonLd(
      [sampleProduct("item-one"), sampleProduct("item-two")],
      HOMEPAGE_CANONICAL,
    );
    const json = JSON.stringify(data);

    expect(data.url).toBe("https://www.rovexo.co.uk/");
    expect(data.potentialAction.target).toBe(
      "https://www.rovexo.co.uk/search?q={search_term_string}",
    );
    expect(json).not.toContain("//listing/");
    expect(json).not.toContain("//search?");
    expect(data.mainEntity.itemListElement[0].url).toBe(
      "https://www.rovexo.co.uk/listing/item-one",
    );
    expect(data.mainEntity.itemListElement[1].url).toBe(
      "https://www.rovexo.co.uk/listing/item-two",
    );

    for (const entry of data.mainEntity.itemListElement) {
      const afterHost = entry.url.replace(/^https:\/\/www\.rovexo\.co\.uk/, "");
      expect(afterHost.startsWith("/")).toBe(true);
      expect(afterHost.startsWith("//")).toBe(false);
    }
  });

  it("also normalizes when siteUrl has no trailing slash", () => {
    const data = homePageJsonLd([sampleProduct("solo")], "https://www.rovexo.co.uk");
    expect(data.url).toBe("https://www.rovexo.co.uk");
    expect(data.potentialAction.target).toBe(
      "https://www.rovexo.co.uk/search?q={search_term_string}",
    );
    expect(data.mainEntity.itemListElement[0].url).toBe(
      "https://www.rovexo.co.uk/listing/solo",
    );
  });
});
