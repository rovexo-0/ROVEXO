import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth, requireApiRole } from "@/lib/auth/session";
import { resolveListingCategoryId } from "@/lib/categories/resolve-listing";
import {
  deleteSellerListing,
  getSellerListingById,
  updateSellerListing,
} from "@/lib/listings/repository";
import { revalidatePublishedListing } from "@/lib/listings/revalidate-published-listing";
import { clampInventory, isInventoryValid } from "@/lib/sell/inventory";
import { sanitizeListingLocationCity } from "@/lib/sell/listing-location";
import {
  formatListingApiValidationError,
  updateListingSchema,
} from "@/lib/sell/listing-api-schema";

type RouteContext = { params: Promise<{ id: string }> };

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
    const body = updateListingSchema.parse(await request.json());
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
      freeDelivery: body.freeDelivery,
      shippingMethod: body.shippingMethod,
      shippingPrice: body.shippingPrice ?? undefined,
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

    revalidatePublishedListing(listing.slug);

    return NextResponse.json({ listing });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: formatListingApiValidationError(error) },
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
