import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth, requireApiRole } from "@/lib/auth/session";
import { resolveListingCategoryId } from "@/lib/categories/resolve-listing";
import {
  createSellerListing,
  getSellerListings,
} from "@/lib/listings/repository";
import type { ListingFilter } from "@/lib/listings/types";
import { clampInventory, isInventoryValid } from "@/lib/sell/inventory";

const imageSchema = z.object({
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  storagePath: z.string().min(1),
  sortOrder: z.number().int().nonnegative(),
  isPrimary: z.boolean(),
});

const listingSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  brand: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  condition: z.string().min(1),
  price: z.number().positive(),
  acceptOffers: z.boolean(),
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
  inventory: z
    .object({
      sku: z.string().optional(),
      stock: z.number().int().nonnegative(),
      lowStockAlert: z.number().int().nonnegative(),
    })
    .optional(),
  images: z.array(imageSchema).min(1).max(8),
});

const FILTERS: ListingFilter[] = [
  "all",
  "draft",
  "paused",
  "sold",
  "out_of_stock",
  "low_stock",
  "published",
];

export async function GET(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { searchParams } = new URL(request.url);
  const filterParam = searchParams.get("filter") ?? "all";
  const filter = FILTERS.includes(filterParam as ListingFilter)
    ? (filterParam as ListingFilter)
    : "all";

  const listings = await getSellerListings(auth.user.id, filter);
  return NextResponse.json({ listings });
}

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  try {
    const body = listingSchema.parse(await request.json());

    if (!body.categoryPath) {
      return NextResponse.json({ error: "Category is required." }, { status: 400 });
    }

    const categoryId = await resolveListingCategoryId(body.categoryPath);

    if (body.inventory) {
      const stock = clampInventory(body.inventory.stock);
      const lowStockAlert = clampInventory(body.inventory.lowStockAlert ?? stock);
      if (!isInventoryValid(stock, lowStockAlert)) {
        return NextResponse.json({ error: "Invalid inventory values." }, { status: 400 });
      }
    }

    const listing = await createSellerListing({
      sellerId: auth.user.id,
      title: body.title,
      description: body.description,
      brand: body.brand,
      color: body.color,
      size: body.size,
      condition: body.condition,
      price: body.price,
      acceptOffers: body.acceptOffers,
      categoryId,
      deliveryCarriers: body.deliveryCarriers,
      status: body.status ?? "published",
      inventory: body.inventory
        ? {
            sku: body.inventory.sku?.trim() || null,
            stock: clampInventory(body.inventory.stock),
            lowStockAlert: clampInventory(body.inventory.lowStockAlert),
          }
        : undefined,
      images: body.images,
    });

    if (!listing) {
      return NextResponse.json({ error: "Unable to publish listing." }, { status: 500 });
    }

    return NextResponse.json({ listing });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid listing." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Unable to publish listing." }, { status: 500 });
  }
}
