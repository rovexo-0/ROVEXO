import { describe, expect, it } from "vitest";
import { createEmptyDraft } from "@/features/sell/types";
import { resolveCategoryPathBySlugs } from "@/lib/categories/queries";
import {
  buildListingPublishPayload,
  parsePublishPrice,
} from "@/lib/sell/build-listing-publish-payload";
import { createListingSchema } from "@/lib/sell/listing-api-schema";

describe("buildListingPublishPayload", () => {
  it("includes lowStockAlert so Zod never receives undefined", () => {
    const draft = createEmptyDraft();
    draft.title = "Nike Air Max 90";
    draft.description = "Great trainers in good condition.";
    draft.categoryPath = resolveCategoryPathBySlugs(["shoes", "trainers", "nike"]);
    draft.condition = "Good";
    draft.price = "49.99";
    draft.stock = 2;
    draft.shippingMethod = "delivery_available";

    const payload = buildListingPublishPayload(draft, [
      {
        id: "1",
        previewUrl: "https://example.com/a.jpg",
        url: "https://example.com/a.jpg",
        thumbnailUrl: "https://example.com/a-thumb.jpg",
        storagePath: "seller/temp/a.jpg",
        uploaded: true,
      },
    ]);

    expect(payload.inventory).toEqual({ stock: 2, lowStockAlert: 5 });
    expect(payload.shippingPrice).toBeUndefined();
    expect(JSON.stringify(payload)).not.toContain("undefined");

    const parsed = createListingSchema.parse(payload);
    expect(parsed.inventory.lowStockAlert).toBe(5);
    expect(parsed.price).toBe(49.99);
  });

  it("sets shippingPrice to 0 for free delivery only", () => {
    const draft = createEmptyDraft();
    draft.title = "Free delivery item";
    draft.description = "Listing with free delivery enabled.";
    draft.categoryPath = resolveCategoryPathBySlugs(["shoes", "trainers", "nike"]);
    draft.condition = "Good";
    draft.price = "10";
    draft.freeDelivery = true;
    draft.shippingMethod = "delivery_available";

    const payload = buildListingPublishPayload(draft, [
      {
        id: "1",
        previewUrl: "https://example.com/a.jpg",
        url: "https://example.com/a.jpg",
        storagePath: "seller/temp/a.jpg",
        uploaded: true,
      },
    ]);

    expect(payload.shippingPrice).toBe(0);
    expect(createListingSchema.parse(payload).shippingPrice).toBe(0);
  });

  it("defaults lowStockAlert when API receives partial inventory", () => {
    const parsed = createListingSchema.parse({
      title: "Test listing title",
      description: "A long enough description for validation.",
      condition: "Good",
      price: 12,
      acceptOffers: true,
      categoryPath: {
        categorySlug: "shoes",
        subcategorySlug: "trainers",
        childCategorySlug: "nike",
      },
      inventory: { stock: 3 },
      images: [
        {
          url: "https://example.com/a.jpg",
          storagePath: "seller/a.jpg",
          sortOrder: 0,
          isPrimary: true,
        },
      ],
    });

    expect(parsed.inventory).toEqual({ stock: 3, lowStockAlert: 5 });
  });
});

describe("parsePublishPrice", () => {
  it("rejects empty and non-positive values", () => {
    expect(() => parsePublishPrice("")).toThrow(/greater than zero/i);
    expect(() => parsePublishPrice("abc")).toThrow(/greater than zero/i);
    expect(parsePublishPrice("12.50")).toBe(12.5);
  });
});
