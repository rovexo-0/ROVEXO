import { NextResponse, after } from "next/server";
import { z } from "zod";
import { requireCookieOrBearerListingRole } from "@/lib/saved/saved-api-auth-v1";
import { enforceRateLimitForUser } from "@/lib/api/rate-limit";
import { resolveListingCategoryId } from "@/lib/categories/resolve-listing";
import { resolveTransactionModeFromCategoryPathPayload } from "@/lib/transaction-mode/resolver";
import { isDirectContactMode } from "@/lib/transaction-mode/capabilities";
import {
  createSellerListing,
  getSellerListings,
  reconcileTempListingImagesToProductFolder,
} from "@/lib/listings/repository";
import { revalidatePublishedListing } from "@/lib/listings/revalidate-published-listing";
import { buildPublishSuccessPayload } from "@/lib/sell/publish-success";
import { getAppUrl } from "@/lib/supabase/env";
import { syncAutoVerifiedProfile } from "@/lib/profile/auto-verified";
import { resolveProfileCompletionRedirect } from "@/lib/account/profile-completion.server";
import {
  createListingSchema,
  formatListingApiValidationError,
} from "@/lib/sell/listing-api-schema";
import { validateManualCategorySlugs, validateListingAgainstProhibitedEngine } from "@/lib/sell/category-engine-v1";
import type { ListingFilter } from "@/lib/listings/types";
import { clampInventory, isInventoryValid } from "@/lib/sell/inventory";
import { publishPerfLog } from "@/lib/listings/publish-route-perf-v1";
import {
  processFollowNotificationEvent,
  resolveFollowNotificationActor,
} from "@/lib/follow-notifications";

const FILTERS: ListingFilter[] = [  "all",
  "draft",
  "paused",
  "sold",
  "out_of_stock",
  "low_stock",
  "published",
  "pending",
  "expired",
];

export async function GET(request: Request) {
  const auth = await requireCookieOrBearerListingRole(request);
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
  publishPerfLog("PUBLISH_ROUTE_START");
  const auth = await requireCookieOrBearerListingRole(request);
  if (auth instanceof NextResponse) return auth;
  publishPerfLog("AUTH_END");

  const limited = await enforceRateLimitForUser(auth.user.id, "listings-publish", 20, 60_000);
  if (limited) return limited;

  try {
    const body = createListingSchema.parse(await request.json());

    if (!body.categoryPath) {
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

    const prohibitedGate = validateListingAgainstProhibitedEngine({
      title: body.title,
      description: body.description,
      brand: body.brand,
    });
    if (!prohibitedGate.ok) {
      return NextResponse.json(
        { error: prohibitedGate.message, code: prohibitedGate.code },
        { status: 422 },
      );
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
      return NextResponse.json(
        { error: "Invalid category selected.", code: "UNKNOWN_TAXONOMY_NODE" },
        { status: 400 },
      );
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

    const publishStatus = body.status ?? "published";
    if (publishStatus === "published") {
      const completionRedirect = await resolveProfileCompletionRedirect(
        auth.user.id,
        "publish",
        "/sell",
      );
      if (completionRedirect) {
        return NextResponse.json(
          {
            error: "Add your bank account in Settings before publishing your first listing.",
            redirect: completionRedirect,
          },
          { status: 428 },
        );
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

    await syncAutoVerifiedProfile(auth.user.id);

    // Fail closed: marketplace publish must remain status=published.
    if (publishStatus === "published" && listing.status !== "published") {
      return NextResponse.json(
        {
          error:
            "This listing cannot be published under ROVEXO marketplace rules. Review the content and try again.",
        },
        { status: 422 },
      );
    }

    publishPerfLog("CREATE_RESULT_READY");

    if (listing.status === "published") {
      void (async () => {
        const actor = await resolveFollowNotificationActor(auth.user.id);
        await processFollowNotificationEvent({
          type: "NewListingPublished",
          actorId: auth.user.id,
          actorName: actor.name,
          actorUsername: actor.username,
          actorAvatarUrl: actor.avatarUrl,
          sellerId: auth.user.id,
          listingId: listing.id,
          listingSlug: listing.slug,
          listingTitle: listing.title,
          occurredAt: new Date().toISOString(),
          dedupeKey: `new-listing:${listing.id}`,
        });
      })();
    }

    const origin = getAppUrl().replace(/\/$/, "");
    const publish = buildPublishSuccessPayload(listing, auth.user.id, origin);

    publishPerfLog("RESPONSE_START");
    try {
      after(async () => {
        publishPerfLog("ISR_START");
        try {
          revalidatePublishedListing(listing.slug);
        } catch (error) {
          console.error("[publish-after] ISR failed", {
            listingId: listing.id,
            message: error instanceof Error ? error.message : "unknown",
          });
        }
        publishPerfLog("ISR_END");

        if (publishStatus === "published" && listing.status === "published") {
          try {
            await reconcileTempListingImagesToProductFolder(listing.id, auth.user.id);
            revalidatePublishedListing(listing.slug);
          } catch (error) {
            console.error("[publish-after] storage reconcile failed", {
              listingId: listing.id,
              message: error instanceof Error ? error.message : "unknown",
            });
          }
        }
      });
    } catch (error) {
      console.error("[publish-after] after() registration failed", {
        listingId: listing.id,
        message: error instanceof Error ? error.message : "unknown",
      });
    }
    publishPerfLog("RESPONSE_END");

    return NextResponse.json({ listing, publish });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: formatListingApiValidationError(error) },
        { status: 400 },
      );
    }
    console.error("[POST /api/listings] publish failed", {
      message: error instanceof Error ? error.message : "unknown",
      name: error instanceof Error ? error.name : typeof error,
    });
    if (
      error instanceof Error &&
      /cannot be published under ROVEXO marketplace rules/i.test(error.message)
    ) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    return NextResponse.json({ error: "Unable to publish listing." }, { status: 500 });
  }
}
