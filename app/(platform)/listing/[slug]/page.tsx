import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { StoreUnavailablePage } from "@/components/store/StoreUnavailablePage";
import { ProductDetailPage } from "@/features/product-detail/ProductDetailPage";
import { fetchProductBySlug } from "@/lib/products/queries";
import { getCategoryBreadcrumbsForProduct } from "@/lib/categories/server";
import { productPageMetadata } from "@/lib/seo/engine";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { productJsonLd } from "@/lib/seo/json-ld";
import { STORE_UNAVAILABLE_COPY } from "@/lib/homepage/homepage-final-freeze-v1";
import { isForbiddenMarketplaceSlug } from "@/lib/listings/forbidden-marketplace-inventory";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { awaitCheckoutSessionSelfHeal } from "@/lib/checkout/checkout-session-self-heal-server-v1";

type ListingPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);

  if (!product) {
    return buildPageMetadata({
      title: STORE_UNAVAILABLE_COPY.title,
      description: STORE_UNAVAILABLE_COPY.body,
      path: `/listing/${slug}`,
      noIndex: true,
      omitCanonical: true,
    });
  }

  return productPageMetadata({
    title: product.title,
    description: product.description,
    slug,
    imageUrl: product.images[0],
  });
}

export default async function ListingPage({ params }: ListingPageProps) {
  await awaitCheckoutSessionSelfHeal("listing-view");
  const { slug } = await params;
  // Similar Items are frozen off View Item — do not fetch unused similar products (P6 network).
  // getProductBySlug is React.cache'd — generateMetadata + page share one resolve per request.
  const product = await fetchProductBySlug(slug);

  if (!product) {
    // Owner cleanup: old RUN4 / certification URLs redirect safely to Home.
    if (isForbiddenMarketplaceSlug(slug)) {
      redirect("/");
    }
    return (
      <BetaAppShell bottomNavTab="search">
        <StoreUnavailablePage kind="listing" />
      </BetaAppShell>
    );
  }

  if (product.listingType === "auction") {
    redirect("/search");
  }

  const breadcrumbs = await getCategoryBreadcrumbsForProduct(product.categoryId ?? null);

  // Views: ONLY RecordProductViewBeacon on product page (1.5s dwell) → POST /api/views
  // Forbidden: server auto-increment / Homepage / Search / Saved / refresh automatic +1

  const structuredData = productJsonLd(product, breadcrumbs);

  return (
    <BetaAppShell bottomNavTab="search">
      <JsonLdScript id="jsonld-app-(platform)-listing-slug-page-tsx" data={structuredData} />
      <ProductDetailPage product={{ ...product, categoryBreadcrumbs: breadcrumbs }} />
    </BetaAppShell>
  );
}
