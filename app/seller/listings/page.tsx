import { Suspense } from "react";
import { SellerListingsV1 } from "@/features/account-module/components/SellerListingsV1";
import type { ListingFilter } from "@/lib/listings/types";
import { fetchSellerListings } from "@/lib/seller/listings-queries";
import { getProfile } from "@/lib/profile/data";

export const dynamic = "force-dynamic";

const LISTING_FILTERS = ["published", "sold"] as const satisfies readonly ListingFilter[];

type SellerListingsRouteProps = {
  searchParams: Promise<{ filter?: string }>;
};

export default async function SellerListingsRoute({ searchParams }: SellerListingsRouteProps) {
  const params = await searchParams;
  const filterParam = params.filter ?? "published";
  const filter: ListingFilter = LISTING_FILTERS.includes(filterParam as (typeof LISTING_FILTERS)[number])
    ? (filterParam as ListingFilter)
    : "published";

  await getProfile();
  const data = await fetchSellerListings(filter);

  return (
    <Suspense
      fallback={
        <div className="acm" data-listings-version="v2.0-final" style={{ padding: 24 }}>
          <p>Loading listings…</p>
        </div>
      }
    >
      <SellerListingsV1 data={data} />
    </Suspense>
  );
}
