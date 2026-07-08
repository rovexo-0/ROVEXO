import { Suspense } from "react";
import { SellerListingsV1 } from "@/features/account-module/components/SellerListingsV1";
import type { ListingFilter } from "@/lib/listings/types";
import { fetchSellerListings } from "@/lib/seller/listings-queries";
import { getProfile } from "@/lib/profile/data";

export const dynamic = "force-dynamic";

const FILTERS: ListingFilter[] = [
  "all",
  "published",
  "pending",
  "sold",
  "draft",
  "paused",
  "expired",
  "out_of_stock",
  "low_stock",
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

  await getProfile();
  const data = await fetchSellerListings(filter);

  return (
    <Suspense
      fallback={
        <div className="acm" data-listings-version="v1.0" style={{ padding: 24 }}>
          <p>Loading listings…</p>
        </div>
      }
    >
      <SellerListingsV1 data={data} />
    </Suspense>
  );
}
