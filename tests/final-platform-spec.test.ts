import { describe, expect, it } from "vitest";
import { buildShowcaseSellerSections } from "@/lib/homepage/showcase-sellers";
import type { Product } from "@/lib/products/types";
import { resolveHomepagePromotionBadge } from "@/lib/homepage/feed-ranking";
import {
  DEFAULT_MARKETPLACE_PRICING,
  marketplacePricingToBumpOptions,
  marketplacePricingToFeatureOptions,
} from "@/lib/promotions/marketplace-pricing";
import { SELL_PHOTO_MAX } from "@/features/sell/types";

function product(partial: Partial<Product> & Pick<Product, "id" | "sellerId">): Product {
  return {
    slug: partial.slug ?? partial.id,
    title: partial.title ?? "Item",
    price: partial.price ?? 10,
    condition: "new",
    sellerName: partial.sellerName ?? "Seller",
    rating: partial.rating ?? 4.8,
    reviewCount: partial.reviewCount ?? 12,
    imageUrl: partial.imageUrl ?? "/placeholder.png",
    sections: partial.sections ?? [],
    isFeatured: partial.isFeatured ?? false,
    ...partial,
  };
}

describe("final platform spec surfaces", () => {
  it("groups paid showcase sellers into dedicated homepage sections", () => {
    const sections = buildShowcaseSellerSections([
      product({ id: "a1", sellerId: "s1", isFeatured: true, sellerName: "Alpha" }),
      product({ id: "a2", sellerId: "s1", isFeatured: true }),
      product({ id: "b1", sellerId: "s2", isFeatured: true, sellerName: "Beta" }),
      product({ id: "c1", sellerId: "s3", isFeatured: false }),
    ]);

    expect(sections).toHaveLength(2);
    expect(sections[0]?.listings).toHaveLength(2);
    expect(sections[0]?.profileHref).toContain("/search?seller=");
  });

  it("labels showcase promotions on listing cards", () => {
    const badge = resolveHomepagePromotionBadge(
      product({ id: "x", sellerId: "s1", isFeatured: true }),
    );
    expect(badge?.label).toBe("Featured");
  });

  it("uses super-admin marketplace pricing defaults", () => {
    expect(marketplacePricingToBumpOptions(DEFAULT_MARKETPLACE_PRICING)).toEqual([
      expect.objectContaining({ id: "3d", priceCents: 100, priceLabel: "£1" }),
      expect.objectContaining({ id: "7d", priceCents: 200, priceLabel: "£2" }),
    ]);
    expect(marketplacePricingToFeatureOptions(DEFAULT_MARKETPLACE_PRICING)).toEqual([
      expect.objectContaining({ priceCents: 550, priceLabel: "£5.50" }),
    ]);
  });

  it("caps sell flow photos at eight", () => {
    expect(SELL_PHOTO_MAX).toBe(8);
  });

  it("aligns listing API schema with sell photo cap", async () => {
    const { createListingSchema } = await import("@/lib/sell/listing-api-schema");
    const tooMany = Array.from({ length: SELL_PHOTO_MAX + 1 }, (_, index) => ({
      url: "https://example.com/a.jpg",
      storagePath: `path/${index}`,
      sortOrder: index,
      isPrimary: index === 0,
    }));
    expect(
      createListingSchema.safeParse({
        title: "Test listing title",
        description: "Test listing description long enough",
        condition: "new",
        price: 10,
        acceptOffers: false,
        categoryPath: null,
        images: tooMany,
      }).success,
    ).toBe(false);
  });
});
