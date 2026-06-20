import { requireAuthContext } from "@/lib/auth/session";
import { countLowStockListings, getSellerListings } from "@/lib/listings/repository";
import type { ListingFilter, SellerListing } from "@/lib/listings/types";

export type SellerListingsData = {
  listings: SellerListing[];
  filter: ListingFilter;
  lowStockCount: number;
};

export async function fetchSellerListings(
  filter: ListingFilter = "all",
): Promise<SellerListingsData> {
  const { user } = await requireAuthContext();
  const [listings, lowStockCount] = await Promise.all([
    getSellerListings(user.id, filter),
    countLowStockListings(user.id),
  ]);

  return { listings, filter, lowStockCount };
}
