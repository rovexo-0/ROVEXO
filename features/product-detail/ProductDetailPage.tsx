"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ScrollContainer } from "@/components/ui/ScrollContainer";
import { RecordRecentlyViewed } from "@/features/launch/components/RecordRecentlyViewed";
import { RecordProductViewBeacon } from "@/features/product-detail/RecordProductViewBeacon";
import { ProductViewsLive } from "@/features/product-detail/ProductViewsLive";
import { ProductActionBarV1 } from "@/features/product-detail/ProductActionBarV1";
import { ProductConditionCard } from "@/features/product-detail/ProductConditionCard";
import { ProductDescriptionV1 } from "@/features/product-detail/ProductDescriptionV1";
import { ProductGalleryV1 } from "@/features/product-detail/ProductGalleryV1";
import { ProductPageChrome } from "@/features/product-detail/ProductPageChrome";
import { ProductShippingCard } from "@/features/product-detail/ProductShippingCard";
import { ProductSimilarItems } from "@/features/product-detail/ProductSimilarItems";
import { ProductStockStatus } from "@/features/product-detail/ProductStockStatus";
import { ProductStoreSection } from "@/features/product-detail/ProductStoreSection";
import { useProductOfferNegotiation } from "@/features/product-detail/use-product-offer-negotiation";
import { useAuthOptional } from "@/features/auth/providers/AuthProvider";
import { resolveProductOfferActionView } from "@/lib/transaction-hub/dynamic-offer-action-engine-v1";
import { OfferComposerSheet } from "@/features/transaction-hub/OfferComposerSheet";
import { BuyNowPublicErrorDialog } from "@/features/checkout/components/BuyNowPublicErrorDialog";
import {
  formatListingPrice,
  formatListingPriceIncl,
  resolveListingShippingForIncl,
} from "@/lib/listing-card/format";
import type { Product, ProductDetail } from "@/lib/products/types";
import { trackGaEvent } from "@/lib/analytics/ga4-events";
import { getActiveMarket } from "@/lib/seo/markets";
import { getTransactionCapabilities } from "@/lib/transaction-mode/capabilities";
import { useProductActionBar } from "@/features/product-detail/use-product-action-bar";
import {
  buildBuyNowCheckoutHref,
  useBuyNowNavigation,
} from "@/features/checkout/hooks/use-buy-now-navigation";
import { resolveStoreHrefFromSeller } from "@/lib/store/store-href";

type ProductDetailPageProps = {
  product: ProductDetail;
  similarProducts: Product[];
};

/**
 * ROVEXO Product Page — Cod Sânge v3.1 + Dynamic Offer Action Engine (UI).
 * Sold listings render the canonical public SOLD PDP (never Store unavailable).
 */
export function ProductDetailPage({ product, similarProducts }: ProductDetailPageProps) {
  const router = useRouter();
  const { executeBuyNow } = useBuyNowNavigation();
  const [offerOpen, setOfferOpen] = useState(false);
  const [buyNowError, setBuyNowError] = useState<string | null>(null);
  const capabilities = getTransactionCapabilities(product.transactionMode);
  const isSold = product.status === "sold";
  const isFixedPrice = product.listingType !== "auction";
  const outOfStock =
    isSold || product.availability === "out_of_stock" || product.stock <= 0;
  const isPurchasable = !isSold && capabilities.buyNow && !outOfStock;
  const offerEnabled =
    !isSold && Boolean(product.acceptOffers) && isFixedPrice && isPurchasable;

  const amount =
    product.listingType === "auction" && product.auctionCurrentBid != null
      ? product.auctionCurrentBid
      : product.price;

  const shippingForIncl = resolveListingShippingForIncl({
    freeDelivery: product.freeDelivery,
    shippingPrice: product.shippingPrice,
  });
  const displayPrice =
    /* negotiated lock shown in action card; listing price remains above until buy */
    amount;
  const inclLabel = formatListingPriceIncl(displayPrice, shippingForIncl);

  const offerProduct = useMemo(
    () => ({
      id: product.id,
      slug: product.slug,
      title: product.title,
      price: amount,
      imageUrl: product.images[0] ?? null,
    }),
    [amount, product.id, product.images, product.slug, product.title],
  );

  const auth = useAuthOptional();
  const viewerId = auth?.profile?.id ?? null;
  const isOwnListing = Boolean(viewerId && product.sellerId && viewerId === product.sellerId);
  const canNegotiateAsBuyer = Boolean(viewerId && !isOwnListing && !isSold);

  const negotiation = useProductOfferNegotiation({
    productSlug: product.slug,
    outOfStock,
    enabled: canNegotiateAsBuyer,
  });

  const negotiationView =
    canNegotiateAsBuyer || outOfStock
      ? negotiation.view
      : resolveProductOfferActionView({ outOfStock, offers: [] });

  const acceptedOfferId =
    negotiationView.buyUsesNegotiatedPrice && negotiationView.offerId
      ? negotiationView.offerId
      : null;

  const similarHref = product.categoryId
    ? `/search?category=${product.categoryId}`
    : "/search";
  const sellerHref = resolveStoreHrefFromSeller({
    sellerId: product.sellerId,
    storeSlug: product.sellerUsername,
  });

  const { buyState, handleBuyNow, handleMakeOffer } = useProductActionBar({
    productSlug: product.slug,
    productId: product.id,
    canBuyNow: Boolean(capabilities.checkout && isPurchasable && !isOwnListing),
    // Product page freeze: Buy Now + Make Offer only. Negotiation CTAs live in Conversation Hub.
    canMakeOffer:
      offerEnabled &&
      !isOwnListing &&
      (negotiationView.showMakeOffer || negotiationView.mode === "seller_counter"),
    onBuyNow: async () => {
      const result = await executeBuyNow({
        productSlug: product.slug,
        offerId: acceptedOfferId,
        onError: (message) => setBuyNowError(message),
      });
      if (!result.ok) return false;
      router.push(buildBuyNowCheckoutHref(product.slug, result.checkoutPath));
      return true;
    },
    onMakeOffer: () => setOfferOpen(true),
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
    <div
      className="pd-v1"
      data-pd-detail-version="cod-sange-v3.1"
      data-product-page-freeze="FINAL_FREEZE"
      data-add-to-cart="removed-forever"
      data-dynamic-offer-action="v1.0"
      data-listing-sold={isSold ? "true" : "false"}
    >
      <RecordRecentlyViewed productSlug={product.slug} />
      {!isSold ? <RecordProductViewBeacon productSlug={product.slug} /> : null}

      <div className="pd-v1__shell">
        <div className="pd-v1__hero">
          <ProductPageChrome productSlug={product.slug} productTitle={product.title} />
          <ProductGalleryV1 images={product.images} title={product.title} />
        </div>

        <ScrollContainer withBottomNav={false} className="pd-v1__main">
          {isSold ? (
            <div className="pd-v1__sold-banner" data-sold-banner role="status">
              <span className="pd-v1__badge pd-v1__badge--sold" aria-label="Sold">
                🟥 SOLD
              </span>
              <p className="pd-v1__sold-subtitle">This item has been sold.</p>
            </div>
          ) : null}

          <section aria-labelledby="pd-product-title" className="pd-v1__price-block">
            <h1 id="pd-product-title" className="pd-v1__title">
              {product.title}
            </h1>
            <p className="pd-v1__price">{formatListingPrice(amount)}</p>
            {!isSold ? (
              <ProductStockStatus stock={product.stock} availability={product.availability} />
            ) : null}
            <div className="pd-v1__price-row">
              {capabilities.buyNow && !isSold ? (
                <p className="pd-v1__price-incl">
                  <span>{inclLabel}</span>
                </p>
              ) : (
                <span />
              )}
              <ProductViewsLive slug={product.slug} initialViews={product.views ?? 0} />
            </div>
          </section>

          <ProductDescriptionV1 description={product.description} />

          {product.condition ? <ProductConditionCard condition={product.condition} /> : null}

          {capabilities.shipping ? <ProductShippingCard product={product} /> : null}

          <ProductStoreSection product={product} />

          <ProductSimilarItems products={similarProducts} categoryId={product.categoryId} />
        </ScrollContainer>
      </div>

      <ProductActionBarV1
        transactionMode={product.transactionMode}
        sold={isSold}
        similarHref={similarHref}
        sellerHref={sellerHref}
        outOfStock={outOfStock}
        negotiation={isSold ? null : negotiationView}
        negotiationBusy={canNegotiateAsBuyer ? negotiation.busy : null}
        buyDisabled={!isPurchasable || isOwnListing}
        offerDisabled={!offerEnabled || isOwnListing}
        buyState={buyState}
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
        onMakeOffer={handleMakeOffer}
        onCancelOffer={() => {
          if (!negotiationView.offerId) return;
          void negotiation.cancel(negotiationView.offerId);
        }}
      />
      {!isSold ? (
        <OfferComposerSheet
          open={offerOpen}
          onClose={() => setOfferOpen(false)}
          product={offerProduct}
          onOfferSent={({ conversationHref }) => {
            negotiation.refresh();
            if (conversationHref) router.push(conversationHref);
          }}
        />
      ) : null}

      <BuyNowPublicErrorDialog
        open={Boolean(buyNowError || negotiation.error)}
        message={buyNowError ?? negotiation.error ?? ""}
        onClose={() => {
          setBuyNowError(null);
          negotiation.clearError();
        }}
      />
    </div>
  );
}
