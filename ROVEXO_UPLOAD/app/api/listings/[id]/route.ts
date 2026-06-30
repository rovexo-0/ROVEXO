import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth, requireApiRole } from "@/lib/auth/session";
import { resolveListingCategoryId } from "@/lib/categories/resolve-listing";
import {
  deleteSellerListing,
  getSellerListingById,
  updateSellerListing,
} from "@/lib/listings/repository";
import { clampInventory, isInventoryValid } from "@/lib/sell/inventory";
import { sanitizeListingLocationCity } from "@/lib/sell/listing-location";
import { LISTING_TITLE_MAX, LISTING_TITLE_MIN } from "@/lib/sell/listing-title";

type RouteContext = { params: Promise<{ id: string }> };

const imageSchema = z.object({
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  storagePath: z.string().min(1),
  sortOrder: z.number().int().nonnegative(),
  isPrimary: z.boolean(),
});

const updateSchema = z.object({
  title: z.string().min(LISTING_TITLE_MIN).max(LISTING_TITLE_MAX).optional(),
  description: z.string().min(10).optional(),
  brand: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  condition: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  locationCity: z.string().min(1).max(80).nullable().optional(),
  acceptOffers: z.boolean().optional(),
  categoryPath: z
    .object({
      categorySlug: z.string(),
      subcategorySlug: z.string(),
      childCategorySlug: z.string().optional(),
      categorySlugs: z.array(z.string()).optional(),
    })
    .nullable()
    .optional(),
  inventory: z
    .object({
      sku: z.string().optional(),
      stock: z.number().int().nonnegative(),
      lowStockAlert: z.number().int().nonnegative(),
    })
    .optional(),
  images: z.array(imageSchema).min(1).max(8).optional(),
  removeImageIds: z.array(z.string()).optional(),
  deliveryCarriers: z.array(z.string()).optional(),
});

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { id } = await context.params;
  const listing = await getSellerListingById(auth.user.id, id);

  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  return NextResponse.json({ listing });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { id } = await context.params;

  try {
    const body = updateSchema.parse(await request.json());
    let categoryId: string | null | undefined;

    if (body.categoryPath !== undefined) {
      categoryId =
        body.categoryPath === null
          ? null
          : await resolveListingCategoryId(body.categoryPath);

      if (body.categoryPath !== null && !categoryId) {
        return NextResponse.json({ error: "Invalid category selected." }, { status: 400 });
      }
    }

    if (body.inventory) {
      const stock = clampInventory(body.inventory.stock);
      const lowStockAlert = clampInventory(body.inventory.lowStockAlert ?? stock);
      if (!isInventoryValid(stock, lowStockAlert)) {
        return NextResponse.json({ error: "Invalid inventory values." }, { status: 400 });
      }
    }

    const listing = await updateSellerListing(auth.user.id, id, {
      title: body.title,
      description: body.description,
      brand: body.brand,
      color: body.color,
      size: body.size,
      condition: body.condition,
      price: body.price,
      locationCity:
        body.locationCity !== undefined
          ? sanitizeListingLocationCity(body.locationCity)
          : undefined,
      acceptOffers: body.acceptOffers,
      categoryId,
      deliveryCarriers: body.deliveryCarriers,
      inventory: body.inventory
        ? {
            sku: body.inventory.sku?.trim() || null,
            stock: clampInventory(body.inventory.stock),
            lowStockAlert: clampInventory(body.inventory.lowStockAlert),
          }
        : undefined,
      images: body.images,
      removeImageIds: body.removeImageIds,
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    return NextResponse.json({ listing });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid update." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Unable to update listing." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { id } = await context.params;
  const deleted = await deleteSellerListing(auth.user.id, id);

  if (!deleted) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
