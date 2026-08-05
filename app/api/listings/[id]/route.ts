import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth, requireApiListingRole } from "@/lib/auth/session";
import { resolveListingCategoryId } from "@/lib/categories/resolve-listing";
import {
  deleteSellerListing,
  getSellerListingById,
  updateSellerListing,
} from "@/lib/listings/repository";
import {
  revalidateDeletedListing,
  revalidatePublishedListing,
} from "@/lib/listings/revalidate-published-listing";
import { syncProfileVerifiedOnPublish } from "@/lib/profile/sync-verified";
import { clampInventory, isInventoryValid } from "@/lib/sell/inventory";
import { sanitizeListingLocationCity } from "@/lib/sell/listing-location";
import {
  formatListingApiValidationError,
  updateListingSchema,
} from "@/lib/sell/listing-api-schema";
import { validateManualCategorySlugs } from "@/lib/sell/category-engine-v1";
import {
  processFollowNotificationEvent,
  resolveFollowNotificationActor,
} from "@/lib/follow-notifications";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiListingRole();
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

  const roleCheck = await requireApiListingRole();
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { id } = await context.params;

  try {
    const body = updateListingSchema.parse(await request.json());
    let categoryId: string | null | undefined;

    const existing = await getSellerListingById(auth.user.id, id);

    if (body.categoryPath !== undefined) {
      if (body.categoryPath === null) {
        return NextResponse.json({ error: "Category is required." }, { status: 400 });
      }

      const pathSlugs = body.categoryPath.categorySlugs?.length
        ? body.categoryPath.categorySlugs
        : [
            body.categoryPath.categorySlug,
            body.categoryPath.subcategorySlug,
            body.categoryPath.childCategorySlug,
          ];
      const taxonomyGate = validateManualCategorySlugs(pathSlugs);
      if (!taxonomyGate.ok) {
        return NextResponse.json(
          { error: taxonomyGate.message, code: taxonomyGate.code },
          { status: 400 },
        );
      }

      categoryId = await resolveListingCategoryId(body.categoryPath);

      if (!categoryId) {
        return NextResponse.json(
          { error: "Invalid category selected.", code: "UNKNOWN_TAXONOMY_NODE" },
          { status: 400 },
        );
      }
    }

    if (body.inventory) {
      const stock = clampInventory(body.inventory.stock);
      const lowStockAlert =
        body.inventory.lowStockAlert !== undefined
          ? clampInventory(body.inventory.lowStockAlert)
          : stock;
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
      parcelSize: body.parcelSize,
      status: body.status,
      inventory: body.inventory
        ? {
            sku: body.inventory.sku?.trim() || null,
            stock: clampInventory(body.inventory.stock),
            ...(body.inventory.lowStockAlert !== undefined
              ? { lowStockAlert: clampInventory(body.inventory.lowStockAlert) }
              : {}),
          }
        : undefined,
      images: body.images,
      removeImageIds: body.removeImageIds,
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    // Fail closed: draft→publish must land as published.
    if (body.status === "published" && listing.status !== "published") {
      return NextResponse.json(
        {
          error:
            "This listing cannot be published under ROVEXO marketplace rules. Review the content and try again.",
        },
        { status: 422 },
      );
    }

    if (listing.status === "published" && auth.user.email_confirmed_at) {
      await syncProfileVerifiedOnPublish(auth.user.id, auth.user.email_confirmed_at);
    }

    revalidatePublishedListing(listing.slug);

    if (
      existing &&
      listing.status === "published" &&
      typeof body.price === "number" &&
      body.price < existing.price
    ) {
      void (async () => {
        const actor = await resolveFollowNotificationActor(auth.user.id);
        await processFollowNotificationEvent({
          type: "PriceReduced",
          actorId: auth.user.id,
          actorName: actor.name,
          actorUsername: actor.username,
          actorAvatarUrl: actor.avatarUrl,
          sellerId: auth.user.id,
          listingId: listing.id,
          listingSlug: listing.slug,
          listingTitle: listing.title,
          occurredAt: new Date().toISOString(),
          dedupeKey: `price-reduced:${listing.id}:${body.price}`,
        });
      })();
    }

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

  const roleCheck = await requireApiListingRole();
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { id } = await context.params;

  try {
    const existing = await getSellerListingById(auth.user.id, id);
    if (!existing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    const deleted = await deleteSellerListing(auth.user.id, id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Unable to delete listing." },
        { status: 500 },
      );
    }

    if (existing.slug) {
      revalidateDeletedListing(existing.slug);
    } else {
      revalidateDeletedListing();
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete listing." }, { status: 500 });
  }
}
