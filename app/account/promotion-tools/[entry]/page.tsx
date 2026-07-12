import { notFound } from "next/navigation";
import { PromotionToolEntryV1 } from "@/features/account-module/components/PromotionToolEntryV1";
import {
  getPromotionToolMenuItem,
  resolvePromotionToolSlug,
} from "@/lib/account-center/promotion-tools";
import { getResolvedPromotionCatalog } from "@/lib/promotions/catalog";
import { fetchSellerListings } from "@/lib/seller/listings-queries";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = privatePageMetadata;

type PromotionToolEntryRouteProps = {
  params: Promise<{ entry: string }>;
};

export default async function PromotionToolEntryRoute({ params }: PromotionToolEntryRouteProps) {
  const { entry: entryParam } = await params;
  const slug = resolvePromotionToolSlug(entryParam);
  if (!slug) {
    notFound();
  }

  const menuItem = getPromotionToolMenuItem(slug);
  const [catalog, listingsData] = await Promise.all([
    getResolvedPromotionCatalog(),
    fetchSellerListings("published"),
  ]);

  const entry = catalog.entries.find((item) => item.id === menuItem.catalogId && item.visible);
  if (!entry) {
    notFound();
  }

  return (
    <PromotionToolEntryV1
      menuItem={menuItem}
      entry={entry}
      trustItems={catalog.trustItems}
      listings={listingsData.listings}
    />
  );
}
