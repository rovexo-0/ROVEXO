import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiListingRole } from "@/lib/auth/session";
import { resolveListingCategoryId } from "@/lib/categories/resolve-listing";
import { resolveTransactionModeFromCategoryPathPayload } from "@/lib/transaction-mode/resolver";
import { isDirectContactMode } from "@/lib/transaction-mode/capabilities";
import {
  createSellerListing,
  getSellerListings,
} from "@/lib/listings/repository";
import { revalidatePublishedListing } from "@/lib/listings/revalidate-published-listing";
import {
  createListingSchema,
  formatListingApiValidationError,
} from "@/lib/sell/listing-api-schema";
import type { ListingFilter } from "@/lib/listings/types";
import { clampInventory, isInventoryValid } from "@/lib/sell/inventory";

const FILTERS: ListingFilter[] = [  "all",
  "draft",
  "paused",
  "sold",
  "out_of_stock",
  "low_stock",
  "published",
];

export async function GET(request: Request) {
  // requireApiRole authenticates and authorizes in a single pass, so we avoid a
  // second getUser()/profile round-trip that a separate requireApiAuth would add.
  const auth = await requireApiListingRole();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const filterParam = searchParams.get("filter") ?? "all";
  const filter = FILTERS.includes(filterParam as ListingFilter)
    ? (filterParam as ListingFilter)
    : "all";

  const listings = await getSellerListings(auth.user.id, filter);
  return NextResponse.json({ listings });
}

export async function POST(request: Request) {
  const auth = await requireApiListingRole();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = createListingSchema.parse(await request.json());

    if (!body.categoryPath) {
      return NextResponse.json({ error: "Category is required." }, { status: 400 });
    }

    if (body.listingType === "auction") {
      if (!body.auctionStartPrice || Number(body.auctionStartPrice) < 1) {
        return NextResponse.json({ error: "Auction start price is required." }, { status: 400 });
      }
      if (!body.auctionEndsAt) {
        return NextResponse.json({ error: "Auction end date is required." }, { status: 400 });
      }
    }

    const categoryId = await resolveListingCategoryId(body.categoryPath);
    if (!categoryId) {
      return NextResponse.json({ error: "Invalid category selected." }, { status: 400 });
    }

    if (body.inventory) {
      const stock = clampInventory(body.inventory.stock);
      const lowStockAlert = clampInventory(body.inventory.lowStockAlert ?? stock);
      if (!isInventoryValid(stock, lowStockAlert)) {
        return NextResponse.json({ error: "Invalid inventory values." }, { status: 400 });
      }
    }

    const transactionMode = resolveTransactionModeFromCategoryPathPayload(body.categoryPath);
    const directContact = isDirectContactMode(transactionMode);

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
      freeDelivery: directContact ? false : body.freeDelivery,
      shippingMethod: directContact ? "collection_only" : body.shippingMethod,
      shippingPrice: directContact ? null : body.shippingPrice,
      categoryId,
      deliveryCarriers: directContact ? undefined : body.deliveryCarriers,
      parcelSize: directContact ? undefined : body.parcelSize,
      status: body.status ?? "published",
      listingType: body.listingType,
      auctionStartPrice: body.auctionStartPrice,
      reservePrice: body.reservePrice,
      auctionEndsAt: body.auctionEndsAt,
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

    if (auth.user.email_confirmed_at) {
      await auth.supabase
        .from("profiles")
        .update({ verified: true })
        .eq("id", auth.user.id)
        .eq("verified", false);
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
    return NextResponse.json({ error: "Unable to publish listing." }, { status: 500 });
  }
}
