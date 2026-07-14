"use client";



import { useRouter } from "next/navigation";

import { useEffect, useMemo, useState } from "react";

import { ScrollContainer } from "@/components/ui/ScrollContainer";

import { CanonicalPageHeader } from "@/components/navigation/CanonicalPageHeader";

import { RecordRecentlyViewed } from "@/features/launch/components/RecordRecentlyViewed";

import { ProductActionBarV1 } from "@/features/product-detail/ProductActionBarV1";

import { ProductConditionCard } from "@/features/product-detail/ProductConditionCard";

import { ProductDescriptionV1 } from "@/features/product-detail/ProductDescriptionV1";

import { ProductDetailBadges } from "@/features/product-detail/ProductDetailBadges";

import { ProductGalleryV1 } from "@/features/product-detail/ProductGalleryV1";

import { ProductRecentlyViewed } from "@/features/product-detail/ProductRecentlyViewed";

import { ProductShippingCard } from "@/features/product-detail/ProductShippingCard";

import { ProductSimilarItems } from "@/features/product-detail/ProductSimilarItems";

import { ProductStoreSection } from "@/features/product-detail/ProductStoreSection";

import { ProductReportDialog } from "@/features/product-detail/ProductReportDialog";

import { OfferComposerSheet } from "@/features/transaction-hub/OfferComposerSheet";

import { formatListingPrice, formatListingPriceIncl } from "@/lib/listing-card/format";

import { resolveProductSubtitle } from "@/lib/product-detail/format";

import type { Product, ProductDetail } from "@/lib/products/types";

import { trackGaEvent } from "@/lib/analytics/ga4-events";

import { getActiveMarket } from "@/lib/seo/markets";

import { getTransactionCapabilities } from "@/lib/transaction-mode/capabilities";

import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";

import { useProductActionBar } from "@/features/product-detail/use-product-action-bar";

import { useToast } from "@/components/ui/Toast";

import { PRODUCT_ACTION_BAR_COPY } from "@/lib/transaction-hub/product-action-bar";

import { ShieldCheck } from "lucide-react";



type ProductDetailPageProps = {

  product: ProductDetail;

  similarProducts: Product[];

};



export function ProductDetailPage({ product, similarProducts }: ProductDetailPageProps) {

  const router = useRouter();

  const { pushToast } = useToast();

  const { refresh: refreshBadges } = useRealtimeNotifications();

  const [offerOpen, setOfferOpen] = useState(false);

  const capabilities = getTransactionCapabilities(product.transactionMode);

  const isFixedPrice = product.listingType !== "auction";

  const isPurchasable =

    capabilities.buyNow && product.availability !== "out_of_stock" && product.stock > 0;

  const offerEnabled = Boolean(product.acceptOffers) && isFixedPrice && isPurchasable;

  const subtitle = resolveProductSubtitle(product);

  const amount =

    product.listingType === "auction" && product.auctionCurrentBid != null

      ? product.auctionCurrentBid

      : product.price;



  const offerProduct = useMemo(

    () => ({

      id: product.id,

      slug: product.slug,

      title: product.title,

      price: amount,

    }),

    [amount, product.id, product.slug, product.title],

  );



  const {

    buyState,

    cartState,

    handleBuyNow,

    handleAddToCart,

    handleMakeOffer,

  } = useProductActionBar({

    productSlug: product.slug,

    productId: product.id,

    canBuyNow: Boolean(capabilities.checkout && isPurchasable),

    canAddToCart: Boolean(capabilities.addToCart && isPurchasable),

    canMakeOffer: offerEnabled,

    onBuyNow: () => router.push(`/checkout/${product.slug}`),

    onMakeOffer: () => setOfferOpen(true),

    onCartSuccess: ({ queued } = {}) => {

      void refreshBadges();

      pushToast({

        title: queued ? "Queued — will add when you're back online." : PRODUCT_ACTION_BAR_COPY.addedToCart,

        variant: "success",

      });

    },

    onCartError: (message) => pushToast({ title: message, variant: "error" }),

  });



  useEffect(() => {

    const { currency } = getActiveMarket();

    trackGaEvent("view_item", {

      item_id: product.id,

      item_name: product.title,

      price: product.price,

      currency,

    });

  }, [product.id, product.price, product.title]);



  return (

    <div className="pd-v1" data-pd-detail-version="v1.1">

      <RecordRecentlyViewed productSlug={product.slug} />

      <CanonicalPageHeader title={product.title} backHref="/" backLabel="Back" />

      <div className="pd-v1__shell">

        <ProductGalleryV1 images={product.images} title={product.title} />



        <ScrollContainer withBottomNav={false} className="pd-v1__main">

          <section aria-labelledby="pd-product-title">

            <h1 id="pd-product-title" className="pd-v1__title">

              {product.title}

            </h1>

            {subtitle ? <p className="pd-v1__subtitle">{subtitle}</p> : null}



            <p className="pd-v1__price">{formatListingPrice(amount)}</p>

            {capabilities.buyNow ? (

              <p className="pd-v1__price-incl">

                <span>{formatListingPriceIncl(amount)}</span>

                <ShieldCheck width={14} height={14} strokeWidth={2.25} aria-hidden />

              </p>

            ) : null}



            <ProductDetailBadges product={product} />

          </section>



          <ProductDescriptionV1 description={product.description} />



          <div className="pd-v1__report-row px-ds-4">

            <ProductReportDialog productSlug={product.slug} productTitle={product.title} />

          </div>



          {product.condition ? <ProductConditionCard condition={product.condition} /> : null}



          {capabilities.shipping ? <ProductShippingCard product={product} /> : null}



          <ProductStoreSection product={product} />



          <ProductSimilarItems products={similarProducts} categoryId={product.categoryId} />



          <ProductRecentlyViewed currentSlug={product.slug} />

        </ScrollContainer>

      </div>



      <ProductActionBarV1

        transactionMode={product.transactionMode}

        buyDisabled={!isPurchasable}

        cartDisabled={!isPurchasable || !capabilities.addToCart}

        offerDisabled={!offerEnabled}

        buyState={buyState}

        cartState={cartState}

        onContact={() => {

          void fetch("/api/messages", {

            method: "POST",

            headers: { "Content-Type": "application/json" },

            body: JSON.stringify({ productSlug: product.slug }),

          })

            .then(async (response) => {

              const payload = (await response.json()) as { href?: string };

              router.push(payload.href ?? "/inbox");

            })

            .catch(() => router.push("/inbox"));

        }}

        onBuy={handleBuyNow}

        onAddToCart={handleAddToCart}

        onMakeOffer={handleMakeOffer}

      />

      <OfferComposerSheet

        open={offerOpen}

        onClose={() => setOfferOpen(false)}

        product={offerProduct}

        onOfferSent={({ conversationHref }) => {

          if (conversationHref) router.push(conversationHref);

        }}

      />

    </div>

  );

}


