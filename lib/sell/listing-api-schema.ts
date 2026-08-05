import { z } from "zod";
import { SELL_PHOTO_MAX } from "@/features/sell/types";
import { LISTING_DEFAULT_LOW_STOCK_ALERT } from "@/lib/sell/build-listing-publish-payload";
import { LISTING_PRICE_MIN } from "@/lib/sell/listing-price";

const imageSchema = z.object({
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  storagePath: z.string().min(1),
  sortOrder: z.number().int().nonnegative(),
  isPrimary: z.boolean(),
});

const inventorySchema = z.object({
  sku: z.string().optional(),
  stock: z.number().int().min(1).max(99999).default(1),
  lowStockAlert: z.number().int().min(1).max(99999).default(LISTING_DEFAULT_LOW_STOCK_ALERT),
});

const updateInventorySchema = z.object({
  sku: z.string().optional(),
  stock: z.number().int().min(1).max(99999),
  lowStockAlert: z.number().int().min(1).max(99999).optional(),
});

export const createListingSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  brand: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  // Sell core-6: condition optional in UI; coerce empty for DB NOT NULL.
  condition: z
    .string()
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? value.trim() : "Good")),
  price: z.coerce.number().finite().min(LISTING_PRICE_MIN),
  locationCity: z.string().min(1).max(80).optional(),
  acceptOffers: z.boolean(),
  freeDelivery: z.boolean().optional(),
  shippingMethod: z.enum(["collection_only", "local_delivery", "delivery_available"]).optional(),
  shippingPrice: z.number().nonnegative().nullish(),
  deliveryCarriers: z.array(z.string()).optional(),
  parcelSize: z.enum(["small", "medium", "large", "xl"]).optional(),
  status: z.enum(["draft", "published"]).optional(),
  categoryPath: z
    .object({
      categorySlug: z.string().min(1),
      subcategorySlug: z.string().min(1),
      childCategorySlug: z.string().min(1),
      categorySlugs: z.array(z.string().min(1)).length(3).optional(),
    })
    .nullable(),
  inventory: inventorySchema.default({
    stock: 1,
    lowStockAlert: LISTING_DEFAULT_LOW_STOCK_ALERT,
  }),
  images: z.array(imageSchema).min(1).max(SELL_PHOTO_MAX),
  listingType: z.enum(["fixed", "auction"]).optional(),
  auctionStartPrice: z.coerce.number().finite().min(LISTING_PRICE_MIN).optional(),
  reservePrice: z.coerce.number().finite().min(LISTING_PRICE_MIN).nullable().optional(),
  auctionEndsAt: z.string().datetime().nullable().optional(),
});

export const updateListingSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  brand: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  condition: z.string().min(1).optional(),
  price: z.coerce.number().finite().min(LISTING_PRICE_MIN).optional(),
  locationCity: z.string().min(1).max(80).nullable().optional(),
  acceptOffers: z.boolean().optional(),
  freeDelivery: z.boolean().optional(),
  shippingMethod: z.enum(["collection_only", "local_delivery", "delivery_available"]).optional(),
  shippingPrice: z.number().nonnegative().nullable().optional(),
  categoryPath: z
    .object({
      categorySlug: z.string().min(1),
      subcategorySlug: z.string().min(1),
      childCategorySlug: z.string().min(1),
      categorySlugs: z.array(z.string().min(1)).length(3).optional(),
    })
    .nullable()
    .optional(),
  inventory: updateInventorySchema.optional(),
  images: z.array(imageSchema).min(1).max(SELL_PHOTO_MAX).optional(),
  removeImageIds: z.array(z.string()).optional(),
  deliveryCarriers: z.array(z.string()).optional(),
  parcelSize: z.enum(["small", "medium", "large", "xl"]).optional(),
  /** Promote draft → published (Sell Draft SSOT). */
  status: z.enum(["draft", "published"]).optional(),
});

export function formatListingApiValidationError(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid listing.";
  const path = issue.path.length > 0 ? issue.path.join(".") : "listing";
  return `${path}: ${issue.message}`;
}
