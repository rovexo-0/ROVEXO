"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useDocumentVisible } from "@/lib/performance/hooks";
import { throttle } from "@/lib/performance/throttle";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { cn } from "@/lib/cn";
import { normalizeCondition } from "@/lib/products/utils";
import type { Product, ProductDetail } from "@/lib/products/types";
import { transitionSlow } from "@/components/ui/tokens";
import { RecordRecentlyViewed } from "@/features/launch/components/RecordRecentlyViewed";
import { ShareListingSheet } from "@/components/share/ShareListingSheet";
import { ProductActionBar } from "@/features/product-detail/ProductActionBar";
import { ProductBuyerProtection } from "@/features/product-detail/ProductBuyerProtection";
import { ProductDelivery } from "@/features/product-detail/ProductDelivery";
import { ProductDescription } from "@/features/product-detail/ProductDescription";
import { ProductDetailScrollHeader } from "@/features/product-detail/ProductDetailScrollHeader";
import { ProductDetailTopBar } from "@/features/product-detail/ProductDetailTopBar";
import { ProductEngagementRow } from "@/features/product-detail/ProductEngagementRow";
import { ProductGallery } from "@/features/product-detail/ProductGallery";
import { ProductSimilarItems } from "@/features/product-detail/ProductSimilarItems";
import { ProductSellerCard } from "@/features/product-detail/ProductSellerCard";
import { ProductReportDialog } from "@/features/product-detail/ProductReportDialog";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import type { CategoryBreadcrumb } from "@/lib/categories/navigation";
import type { PublicTrustSummary } from "@/lib/trust/types";
import { trackGaEvent } from "@/lib/analytics/ga4-events";
import { getActiveMarket } from "@/lib/seo/markets";
import { getTransactionCapabilities } from "@/lib/transaction-mode/capabilities";

type ProductDetailPageProps = {
  product: ProductDetail;
  similarProducts: Product[];
  initialIsSaved?: boolean;
  breadcrumbs?: CategoryBreadcrumb[];
  sellerTrust?: PublicTrustSummary | null;
};

const COLLAPSE_OFFSET = 120;

function triggerHapticFeedback() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(10);
  }
}

export function ProductDetailPage({
  product,
  similarProducts,
  initialIsSaved = false,
  breadcrumbs = [],
  sellerTrust,
}: ProductDetailPageProps) {
  const router = useRouter();
  const visible = useDocumentVisible();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const capabilities = getTransactionCapabilities(product.transactionMode);
  const isPurchasable =
    capabilities.buyNow && product.availability !== "out_of_stock" && product.stock > 0;

  useEffect(() => {
    const { currency } = getActiveMarket();
    trackGaEvent("view_item", {
      item_id: product.id,
      item_name: product.title,
      price: product.price,
      currency,
    });
  }, [product.id, product.price, product.title]);

  useEffect(() => {
    if (!visible) return;

    const onScroll = throttle(() => {
      setIsCollapsed(window.scrollY > COLLAPSE_OFFSET);
    }, 16);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [visible]);

  const toggleSave = useCallback(() => {
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);

    if (nextSaved) {
      triggerHapticFeedback();
      const { currency } = getActiveMarket();
      trackGaEvent("add_to_favorites", {
        item_id: product.id,
        item_name: product.title,
        currency,
      });
      void fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productSlug: product.slug }),
      }).catch(() => setIsSaved(!nextSaved));
    } else {
      void fetch("/api/saved", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productSlugs: [product.slug] }),
      }).catch(() => setIsSaved(!nextSaved));
    }
  }, [isSaved, product.id, product.slug, product.title]);

  const [shareOpen, setShareOpen] = useState(false);

  const openShare = useCallback(() => {
    setShareOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <RecordRecentlyViewed productSlug={product.slug} />
      <ProductDetailScrollHeader
        visible={isCollapsed}
        title={product.title}
        isSaved={isSaved}
        onSave={toggleSave}
        onShare={openShare}
      />

      {/* Outer wrapper is NOT clipped, so the overlay action buttons (and their
          shadows) render fully. Only the gallery itself keeps overflow-hidden
          for the collapse animation. */}
      <div className="relative">
        <div
          className={cn(
            "relative overflow-hidden",
            transitionSlow,
            isCollapsed ? "max-h-0 opacity-0" : "h-[45vh] opacity-100",
          )}
        >
          <ProductGallery images={product.images} title={product.title} className="h-full" />
        </div>

        {!isCollapsed && <ProductDetailTopBar />}
      </div>

      <ShareListingSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={product.title}
        slug={product.slug}
        productId={product.id}
        price={product.price}
      />

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-ds-4 px-ds-4 pt-ds-3 pb-[calc(84px+env(safe-area-inset-bottom))]">
        {breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}

        <section aria-labelledby="product-info-heading" className="flex flex-col gap-ds-2">
          <h2 id="product-info-heading" className="sr-only">
            Product information
          </h2>

          <Price
            amount={product.price}
            size="lg"
            className="[&>span:first-child]:text-3xl [&>span:first-child]:font-extrabold [&>span:first-child]:tracking-tight"
          />

          {product.condition && (
            <Badge variant="success" className="w-fit px-ds-3 py-ds-1 text-xs">
              {normalizeCondition(product.condition)}
            </Badge>
          )}

          {capabilities.buyNow && !isPurchasable && (
            <Badge variant="danger" className="w-fit px-ds-3 py-ds-1 text-xs">
              Out of Stock
            </Badge>
          )}

          {capabilities.addToCart && cartMessage && (
            <p className="text-sm font-medium text-primary">{cartMessage}</p>
          )}

          <h1 className="line-clamp-2 text-xl font-semibold leading-snug text-text-primary">
            {product.title}
          </h1>

          <ProductEngagementRow
            views={product.views ?? 0}
            saves={product.likes ?? 0}
          />
        </section>

        {capabilities.buyerProtection && <ProductBuyerProtection itemPrice={product.price} />}

        <ProductDescription description={product.description} />

        {capabilities.shipping && (
          <ProductDelivery carriers={product.deliveryCarriers} freeDelivery={product.freeDelivery} />
        )}

        <ProductSellerCard
          sellerId={product.sellerId}
          sellerName={product.sellerName}
          sellerUsername={product.sellerUsername}
          sellerAvatar={product.sellerAvatar}
          sellerVerified={product.sellerVerified}
          rating={product.rating}
          reviewCount={product.reviewCount}
          salesCount={product.salesCount}
          sellerTrust={sellerTrust}
        />

        <div className="flex justify-end">
          <ProductReportDialog productSlug={product.slug} />
        </div>

        <ProductSimilarItems products={similarProducts} />
      </main>

      <ProductActionBar
        transactionMode={product.transactionMode}
        disabled={!isPurchasable}
        onMessage={() => {
          void fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productSlug: product.slug }),
          })
            .then(async (response) => {
              const payload = (await response.json()) as {
                href?: string;
                error?: string;
              };
              if (payload.href) {
                router.push(payload.href);
                return;
              }
              router.push("/messages");
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
                      setCartMessage("Added to cart.");
                    } else {
                      setCartMessage(payload.error ?? "Unable to add to cart.");
                    }
                  })
                  .catch(() => setCartMessage("Unable to add to cart."));
              }
            : undefined
        }
        onBuy={
          capabilities.checkout ? () => router.push(`/checkout/${product.slug}`) : undefined
        }
      />
    </div>
  );
}
