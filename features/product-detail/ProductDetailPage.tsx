"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RecordRecentlyViewed } from "@/features/launch/components/RecordRecentlyViewed";
import { AddedToCartToast } from "@/features/product-detail/AddedToCartToast";
import { ProductActionBarV1 } from "@/features/product-detail/ProductActionBarV1";
import { ProductConditionCard } from "@/features/product-detail/ProductConditionCard";
import { ProductDescriptionV1 } from "@/features/product-detail/ProductDescriptionV1";
import { ProductDetailBadges } from "@/features/product-detail/ProductDetailBadges";
import { ProductGalleryV1 } from "@/features/product-detail/ProductGalleryV1";
import { ProductRecentlyViewed } from "@/features/product-detail/ProductRecentlyViewed";
import { ProductShippingCard } from "@/features/product-detail/ProductShippingCard";
import { ProductSimilarItems } from "@/features/product-detail/ProductSimilarItems";
import { ProductStoreSection } from "@/features/product-detail/ProductStoreSection";
import { formatListingPrice, formatListingPriceIncl } from "@/lib/listing-card/format";
import { resolveProductSubtitle } from "@/lib/product-detail/format";
import type { Product, ProductDetail } from "@/lib/products/types";
import { trackGaEvent } from "@/lib/analytics/ga4-events";
import { getActiveMarket } from "@/lib/seo/markets";
import { getTransactionCapabilities } from "@/lib/transaction-mode/capabilities";
import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";
import { ShieldCheck } from "lucide-react";

type ProductDetailPageProps = {
  product: ProductDetail;
  similarProducts: Product[];
};

export function ProductDetailPage({ product, similarProducts }: ProductDetailPageProps) {
  const router = useRouter();
  const { refresh: refreshBadges } = useRealtimeNotifications();
  const [cartToastOpen, setCartToastOpen] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const capabilities = getTransactionCapabilities(product.transactionMode);
  const isPurchasable =
    capabilities.buyNow && product.availability !== "out_of_stock" && product.stock > 0;
  const subtitle = resolveProductSubtitle(product);
  const amount =
    product.listingType === "auction" && product.auctionCurrentBid != null
      ? product.auctionCurrentBid
      : product.price;

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
      <div className="pd-v1__shell">
        <ProductGalleryV1 images={product.images} title={product.title} />

        <main className="pd-v1__main">
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

            {capabilities.addToCart && cartError ? (
              <p className="pd-v1__cart-message" role="alert">
                {cartError}
              </p>
            ) : null}
          </section>

          <ProductDescriptionV1 description={product.description} />

          {product.condition ? <ProductConditionCard condition={product.condition} /> : null}

          {capabilities.shipping ? <ProductShippingCard product={product} /> : null}

          <ProductStoreSection product={product} />

          <ProductSimilarItems products={similarProducts} categoryId={product.categoryId} />

          <ProductRecentlyViewed currentSlug={product.slug} />
        </main>
      </div>

      <ProductActionBarV1
        transactionMode={product.transactionMode}
        disabled={!isPurchasable}
        onContact={() => {
          void fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productSlug: product.slug }),
          })
            .then(async (response) => {
              const payload = (await response.json()) as { href?: string };
              router.push(payload.href ?? "/messages");
            })
            .catch(() => router.push("/messages"));
        }}
        onAddToCart={
          capabilities.addToCart
            ? () => {
                void fetch("/api/cart", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "add", productSlug: product.slug }),
                })
                  .then(async (response) => {
                    const payload = (await response.json()) as { success?: boolean; error?: string };
                    if (payload.success) {
                      setCartError(null);
                      setCartToastOpen(true);
                      void refreshBadges();
                      return;
                    }
                    setCartError(payload.error ?? "Unable to add to cart.");
                  })
                  .catch(() => setCartError("Unable to add to cart."));
              }
            : undefined
        }
        onBuy={capabilities.checkout ? () => router.push(`/checkout/${product.slug}`) : undefined}
      />

      <AddedToCartToast open={cartToastOpen} onDismiss={() => setCartToastOpen(false)} />
    </div>
  );
}
