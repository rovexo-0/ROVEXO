import { z } from "zod";
import { LISTING_DEFAULT_LOW_STOCK_ALERT } from "@/lib/sell/build-listing-publish-payload";

const imageSchema = z.object({
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  storagePath: z.string().min(1),
  sortOrder: z.number().int().nonnegative(),
  isPrimary: z.boolean(),
});

const inventorySchema = z.object({
  sku: z.string().optional(),
  stock: z.number().int().nonnegative().default(1),
  lowStockAlert: z.number().int().nonnegative().default(LISTING_DEFAULT_LOW_STOCK_ALERT),
});

export const createListingSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  brand: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  condition: z.string().min(1),
  price: z.number().positive(),
  locationCity: z.string().min(1).max(80).optional(),
  acceptOffers: z.boolean(),
  freeDelivery: z.boolean().optional(),
  shippingMethod: z.enum(["collection_only", "local_delivery", "delivery_available"]).optional(),
  shippingPrice: z.number().nonnegative().nullish(),
  deliveryCarriers: z.array(z.string()).optional(),
  status: z.enum(["draft", "published"]).optional(),
  categoryPath: z
    .object({
      categorySlug: z.string(),
      subcategorySlug: z.string(),
      childCategorySlug: z.string().optional(),
      categorySlugs: z.array(z.string()).optional(),
    })
    .nullable(),
  inventory: inventorySchema.default({
    stock: 1,
    lowStockAlert: LISTING_DEFAULT_LOW_STOCK_ALERT,
  }),
  images: z.array(imageSchema).min(1).max(8),
  listingType: z.enum(["fixed", "auction"]).optional(),
  auctionStartPrice: z.number().positive().optional(),
  reservePrice: z.number().positive().nullable().optional(),
  auctionEndsAt: z.string().datetime().nullable().optional(),
});

export const updateListingSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  brand: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  condition: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  locationCity: z.string().min(1).max(80).nullable().optional(),
  acceptOffers: z.boolean().optional(),
  freeDelivery: z.boolean().optional(),
  shippingMethod: z.enum(["collection_only", "local_delivery", "delivery_available"]).optional(),
  shippingPrice: z.number().nonnegative().nullable().optional(),
  categoryPath: z
    .object({
      categorySlug: z.string(),
      subcategorySlug: z.string(),
      childCategorySlug: z.string().optional(),
      categorySlugs: z.array(z.string()).optional(),
    })
    .nullable()
    .optional(),
  inventory: inventorySchema.optional(),
  images: z.array(imageSchema).min(1).max(8).optional(),
  removeImageIds: z.array(z.string()).optional(),
  deliveryCarriers: z.array(z.string()).optional(),
});

export function formatListingApiValidationError(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid listing.";
  const path = issue.path.length > 0 ? issue.path.join(".") : "listing";
  return `${path}: ${issue.message}`;
}
