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
  const profile = await getProfile();
  const role = profile.accountType;

  if (role !== "seller" && role !== "business" && role !== "admin") {
    redirect("/account");
  }

  const params = await searchParams;
  const filterParam = params.filter ?? "all";
  const filter = FILTERS.includes(filterParam as ListingFilter)
    ? (filterParam as ListingFilter)
    : "all";

  const data = await fetchSellerListings(filter);

  return (
    <Suspense>
      <SellerListingsPage data={data} />
    </Suspense>
  );
}
