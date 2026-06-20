"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { cn } from "@/lib/cn";
import { normalizeCondition } from "@/lib/products/utils";
import type { Product, ProductDetail } from "@/lib/products/types";
import { transitionSlow } from "@/components/ui/tokens";
import { ProductActionBar } from "@/features/product-detail/ProductActionBar";
import { ProductBuyerProtection } from "@/features/product-detail/ProductBuyerProtection";
import { ProductDelivery } from "@/features/product-detail/ProductDelivery";
import { ProductDescription } from "@/features/product-detail/ProductDescription";
import { ProductDetailScrollHeader } from "@/features/product-detail/ProductDetailScrollHeader";
import { ProductDetailTopBar } from "@/features/product-detail/ProductDetailTopBar";
import { ProductEngagementRow } from "@/features/product-detail/ProductEngagementRow";
import { ProductGallery } from "@/features/product-detail/ProductGallery";
import { ProductSimilarItems } from "@/features/product-detail/ProductSimilarItems";

type ProductDetailPageProps = {
  product: ProductDetail;
  similarProducts: Product[];
  initialIsSaved?: boolean;
};

const COLLAPSE_OFFSET = 120;

function triggerHapticFeedback() {
  // Placeholder for native haptic feedback in the future mobile app shell.
}

export function ProductDetailPage({
  product,
  similarProducts,
  initialIsSaved = false,
}: ProductDetailPageProps) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [heartAnimating, setHeartAnimating] = useState(false);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const isPurchasable = product.availability !== "out_of_stock" && product.stock > 0;

  useEffect(() => {
    const onScroll = () => setIsCollapsed(window.scrollY > COLLAPSE_OFFSET);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleSave = useCallback(() => {
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    setHeartAnimating(true);
    window.setTimeout(() => setHeartAnimating(false), 200);

    if (nextSaved) {
      triggerHapticFeedback();
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
  }, [isSaved, product.slug]);

  const handleShare = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.share) return;

    await navigator
      .share({
        title: product.title,
        url: window.location.href,
      })
      .catch(() => undefined);
  }, [product.title]);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <ProductDetailScrollHeader
        visible={isCollapsed}
        title={product.title}
        isSaved={isSaved}
        onSave={toggleSave}
      />

      <div
        className={cn(
          "relative overflow-hidden",
          transitionSlow,
          isCollapsed ? "max-h-0 opacity-0" : "h-[45vh] opacity-100",
        )}
      >
        <ProductGallery images={product.images} title={product.title} className="h-full" />

        {!isCollapsed && (
          <ProductDetailTopBar
            isSaved={isSaved}
            heartAnimating={heartAnimating}
            onSave={toggleSave}
            onShare={() => void handleShare()}
          />
        )}
      </div>

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-ds-5 px-ds-4 py-ds-5 pb-[calc(84px+env(safe-area-inset-bottom))]">
        <section aria-labelledby="product-info-heading" className="flex flex-col gap-ds-3">
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

          {!isPurchasable && (
            <Badge variant="danger" className="w-fit px-ds-3 py-ds-1 text-xs">
              Out of Stock
            </Badge>
          )}

          {cartMessage && (
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

        <ProductBuyerProtection />

        <ProductDescription description={product.description} />

        <ProductDelivery carriers={product.deliveryCarriers} />

        <ProductSimilarItems products={similarProducts} />
      </main>

      <ProductActionBar
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
        onAddToCart={() => {
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
        }}
        onBuy={() => router.push(`/checkout/${product.slug}`)}
      />
    </div>
  );
}
