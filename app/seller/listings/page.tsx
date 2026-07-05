import { Suspense } from "react";
import { SellerListingsPage } from "@/features/seller/listings/components/SellerListingsPage";
import type { ListingFilter } from "@/lib/listings/types";
import { fetchSellerListings } from "@/lib/seller/listings-queries";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/profile/data";

const FILTERS: ListingFilter[] = [
  "all",
  "draft",
  "paused",
  "sold",
  "out_of_stock",
  "low_stock",
  "published",
];

type SellerListingsRouteProps = {
  searchParams: Promise<{ filter?: string }>;
};

export default async function SellerListingsRoute({ searchParams }: SellerListingsRouteProps) {
  const params = await searchParams;
  const filterParam = params.filter ?? "all";
  const filter = FILTERS.includes(filterParam as ListingFilter)
    ? (filterParam as ListingFilter)
    : "all";

  // Overlap the profile check with the listings query. fetchSellerListings is
  // scoped to the authenticated user's own listings, so fetching before the
  // isSeller redirect leaks nothing and removes a sequential round-trip chain.
  const [profile, data] = await Promise.all([getProfile(), fetchSellerListings(filter)]);
  if (!profile.isSeller) {
    redirect("/account");
  }

  return (
    <Suspense>
      <SellerListingsPage data={data} />
    </Suspense>
  );
}
