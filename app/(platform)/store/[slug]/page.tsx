import type { Metadata } from "next";
import { StoreUnavailablePage } from "@/components/store/StoreUnavailablePage";
import { ProStorePage } from "@/features/store/components/ProStorePage";
import { getPublicTrustSummary } from "@/lib/trust/service";
import { storePageJsonLd, storePageMetadata } from "@/lib/seo/engine";
import { STORE_UNAVAILABLE_COPY } from "@/lib/homepage/homepage-final-freeze-v1";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import {
  resolveStoreByRouteParam,
  storeMemberSinceLabel,
  type StoreRecord,
} from "@/lib/store/store-repository";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function toMeta(store: StoreRecord) {
  return storePageMetadata({
    name: store.storeName,
    slug: store.storeSlug || store.storeId,
    listingCount: store.listingCount,
    avatarUrl: store.avatarUrl,
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = await resolveStoreByRouteParam(slug).catch(() => null);
  if (!store) {
    return {
      title: `${STORE_UNAVAILABLE_COPY.title} · ROVEXO`,
      robots: { index: false, follow: false },
    };
  }
  return toMeta(store);
}

/**
 * Canonical STORE PAGE — SSOT:
 * PRODUCT.seller_id → store_id → store_slug → this route.
 * Param may be store_id (UUID) or store_slug.
 */
export default async function StorePage({ params }: PageProps) {
  const { slug } = await params;
  const store = await resolveStoreByRouteParam(slug).catch(() => null);

  if (!store) {
    return <StoreUnavailablePage kind="store" />;
  }

  const trustSummary = await getPublicTrustSummary(store.sellerId).catch(() => undefined);
  const jsonLd = storePageJsonLd({
    name: store.storeName,
    slug: store.storeSlug || store.storeId,
    description: store.bio ?? undefined,
    products: store.listings,
    rating: store.rating,
    reviewCount: store.reviewCount,
  });

  void storeMemberSinceLabel(store.memberSinceIso);

  return (
    <>
      <JsonLdScript id="jsonld-app-(platform)-store-slug-page-tsx" data={[jsonLd.store, jsonLd.itemList].filter(Boolean)} />
      <ProStorePage
        storeName={store.storeName}
        username={store.storeSlug}
        avatarUrl={store.avatarUrl}
        verified={store.verified}
        bio={store.bio}
        website={store.website}
        rating={store.rating}
        reviewCount={store.reviewCount}
        listingCount={store.listingCount}
        salesCount={store.salesCount}
        listings={store.listings}
        sellerTrust={trustSummary}
      />
    </>
  );
}
