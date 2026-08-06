import type { Metadata } from "next";
import { StoreUnavailablePage } from "@/components/store/StoreUnavailablePage";
import { StoreVisitPageV2 } from "@/features/store/components/StoreVisitPageV2";
import { storePageJsonLd, storePageMetadata } from "@/lib/seo/engine";
import { STORE_UNAVAILABLE_COPY } from "@/lib/homepage/homepage-final-freeze-v1";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { loadStoreVisitPayload } from "@/lib/store/load-store-visit-payload";
import {
  resolveStoreByRouteParam,
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
 * Canonical STORE PAGE — SSOT Release 2:
 * `/store/[slug]` → loadStoreVisitPayload → StoreVisitPageV2
 * SEO (generateMetadata + Store/ItemList JSON-LD) preserved.
 * Legacy store page component retired from this route.
 */
export default async function StorePage({ params }: PageProps) {
  const { slug } = await params;
  const payload = await loadStoreVisitPayload(slug);

  if (payload.kind === "unavailable") {
    return <StoreUnavailablePage kind="store" />;
  }

  const { store, listings, reviews, memberSinceLabel, isOwnStore, isFollowing, followerCount, followingCount, loadFailed } =
    payload;

  // SEO ItemList uses repository store.listings (same source as pre-cutover).
  const jsonLd = storePageJsonLd({
    name: store.storeName,
    slug: store.storeSlug || store.storeId,
    description: store.bio ?? undefined,
    products: store.listings,
    rating: store.rating,
    reviewCount: store.reviewCount,
  });

  return (
    <>
      <JsonLdScript
        id="jsonld-app-(platform)-store-slug-page-tsx"
        data={[jsonLd.store, jsonLd.itemList].filter(Boolean)}
      />
      <StoreVisitPageV2
        store={store}
        listings={listings}
        reviews={reviews}
        memberSinceLabel={memberSinceLabel}
        isOwnStore={isOwnStore}
        initialFollowing={isFollowing}
        followerCount={followerCount}
        followingCount={followingCount}
        loadFailed={loadFailed}
      />
    </>
  );
}
