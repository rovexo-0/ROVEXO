import { describe, expect, it } from "vitest";
import { rotateShowcaseStores } from "@/lib/homepage/store-rotation";
import { resolveStoreBadge } from "@/lib/homepage/store-badges";
import type { ShowcaseSellerSection } from "@/lib/homepage/showcase-sellers";
import type { Product } from "@/lib/products/types";

function section(
  partial: Partial<ShowcaseSellerSection> & Pick<ShowcaseSellerSection, "sellerId" | "sellerName">,
): ShowcaseSellerSection {
  return {
    sellerUsername: null,
    sellerAvatar: null,
    sellerVerified: false,
    rating: 4.5,
    reviewCount: 10,
    listings: [],
    profileHref: `/user/${partial.sellerId}`,
    ...partial,
  };
}

function listing(partial: Partial<Product> & Pick<Product, "id">): Product {
  return {
    slug: partial.id,
    title: "Item",
    price: 100,
    condition: "new",
    sellerName: "Seller",
    rating: 4.8,
    reviewCount: 5,
    imageUrl: "/placeholder.png",
    sections: [],
    isFeatured: false,
    ...partial,
  };
}

describe("homepage store rotation", () => {
  it("prioritises premium stores before verified stores", () => {
    const rotated = rotateShowcaseStores([
      section({ sellerId: "verified", sellerName: "Verified Shop", sellerVerified: true }),
      section({
        sellerId: "premium",
        sellerName: "Premium Shop",
        sellerTier: "premium",
        listings: [listing({ id: "p1", sellerTier: "premium" })],
      }),
    ]);

    expect(rotated[0]?.sellerId).toBe("premium");
  });

  it("returns only one store badge at a time", () => {
    const badge = resolveStoreBadge(
      section({
        sellerId: "mix",
        sellerName: "Mix",
        sellerTier: "premium",
        sellerVerified: true,
        listings: [listing({ id: "x", isFeatured: true })],
      }),
    );

    expect(badge).toEqual({ label: "Premium", tone: "premium" });
  });
});
