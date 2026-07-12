import { getListingShareUrl } from "@/lib/share/listing-url";
import type { SellerListing } from "@/lib/listings/types";
import type { ProductStatus } from "@/lib/supabase/types/database";

/** PATCH 4 — canonical post-publish payload stored client-side immediately. */
export type PublishSuccessPayload = {
  listingId: string;
  listingSlug: string;
  listingUrl: string;
  sellerId: string;
  listingStatus: ProductStatus | string;
  publishedAt: string;
  title: string;
  imageUrl?: string;
};

export const LISTING_VIEW_ERROR_MESSAGE = "Unable to open listing. Please try again.";
export const LISTING_LINK_COPIED_MESSAGE = "Link copied successfully.";

export function getListingCanonicalPath(slug: string): string {
  const normalized = slug.replace(/^\/+/, "").trim();
  return `/listing/${normalized}`;
}

export function buildPublishSuccessPayload(
  listing: Pick<
    SellerListing,
    "id" | "slug" | "title" | "status" | "createdAt" | "imageUrl" | "thumbnailUrl"
  >,
  sellerId: string,
  origin?: string,
): PublishSuccessPayload {
  const listingUrl =
    origin && typeof origin === "string"
      ? `${origin.replace(/\/$/, "")}${getListingCanonicalPath(listing.slug)}`
      : getListingShareUrl(listing.slug);

  return {
    listingId: listing.id,
    listingSlug: listing.slug,
    listingUrl,
    sellerId,
    listingStatus: listing.status,
    publishedAt: listing.createdAt,
    title: listing.title,
    imageUrl: listing.thumbnailUrl ?? listing.imageUrl,
  };
}

type ApiPublishResponse = {
  listing?: SellerListing;
  publish?: PublishSuccessPayload;
};

export function parsePublishSuccessResponse(body: ApiPublishResponse): PublishSuccessPayload {
  if (body.publish?.listingId && body.publish.listingSlug) {
    return body.publish;
  }

  const listing = body.listing;
  if (!listing?.id || !listing.slug) {
    throw new Error("Listing was saved but publish details were not returned.");
  }

  throw new Error("Listing was saved but publish details were not returned.");
}
