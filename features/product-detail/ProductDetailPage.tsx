"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { RecordRecentlyViewed } from "@/features/launch/components/RecordRecentlyViewed";
import { RecordProductViewBeacon } from "@/features/product-detail/RecordProductViewBeacon";
import { ProductViewsLive } from "@/features/product-detail/ProductViewsLive";
import { ProductActionBarV1 } from "@/features/product-detail/ProductActionBarV1";
import { ProductDescriptionV1 } from "@/features/product-detail/ProductDescriptionV1";
import { ProductGalleryV1 } from "@/features/product-detail/ProductGalleryV1";
import { ProductInformationRows } from "@/features/product-detail/ProductInformationRows";
import { ProductPageChrome } from "@/features/product-detail/ProductPageChrome";
import { ProductQuantityStepper } from "@/features/product-detail/ProductQuantityStepper";
import { ProductStockStatus } from "@/features/product-detail/ProductStockStatus";
import { ProductStoreSection } from "@/features/product-detail/ProductStoreSection";
import {
  AddToBundleSheet,
  BundleSellerConflictDialog,
} from "@/features/product-detail/AddToBundleSheet";
import { StickyBundleBar } from "@/features/bundle/StickyBundleBar";
import { buildProductInformationRows } from "@/features/product-detail/build-product-information-rows";
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
import type { ProductDetail } from "@/lib/products/types";
import { trackGaEvent } from "@/lib/analytics/ga4-events";
import { getActiveMarket } from "@/lib/seo/markets";
import { getTransactionCapabilities } from "@/lib/transaction-mode/capabilities";
import { useProductActionBar } from "@/features/product-detail/use-product-action-bar";
import {
  buildBuyNowCheckoutHref,
  useBuyNowNavigation,
} from "@/features/checkout/hooks/use-buy-now-navigation";
import { resolveStoreHrefFromSeller } from "@/lib/store/store-href";
import { clampStockLevel } from "@/lib/sell/inventory";
import {
  readBundleMirror,
  rehydrateBundleMirrorFromServer,
  writeBundleMirror,
  type BundleLineItemV1,
  type BundleSnapshotV1,
} from "@/lib/bundle/bundle-mirror-v1";
import { mergeLineIntoBundle } from "@/lib/bundle/bundle-domain-v1";
import { BUNDLE_ENGINE_V1 } from "@/lib/bundle/bundle-engine-v1";

type ProductDetailPageProps = {
  product: ProductDetail;
};

/**
 * ROVEXO View Item v2.0 — Owner-approved mockup (pixel UI).
 * Business logic / APIs / Bundle / Offers / Buy Now unchanged.
 */
export function ProductDetailPage({ product }: ProductDetailPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { pushToast } = useToast();
  const { executeBuyNow } = useBuyNowNavigation();
  const [offerOpen, setOfferOpen] = useState(false);
  const [buyNowError, setBuyNowError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [sheetBundle, setSheetBundle] = useState<BundleSnapshotV1 | null>(null);
  const [sheetLine, setSheetLine] = useState<BundleLineItemV1 | null>(null);
  const stockQty = clampStockLevel(product.stock);
  const [qtyState, setQtyState] = useState({ productId: product.id, quantity: 1 });
  const quantity = qtyState.productId === product.id ? qtyState.quantity : 1;
  const capabilities = getTransactionCapabilities(product.transactionMode);
  const isSold = product.status === "sold";
  const sellerOnHoliday = product.sellerOnHoliday === true;
  const isFixedPrice = product.listingType !== "auction";
  const outOfStock =
    isSold || product.availability === "out_of_stock" || product.stock <= 0;
  const isPurchasable =
    !isSold && !sellerOnHoliday && capabilities.buyNow && !outOfStock;
  const offerEnabled =
    !isSold &&
    !sellerOnHoliday &&
    Boolean(product.acceptOffers) &&
    isFixedPrice &&
    isPurchasable;

  const amount =
    product.listingType === "auction" && product.auctionCurrentBid != null
      ? product.auctionCurrentBid
      : product.price;

  const shippingForIncl = resolveListingShippingForIncl({
    freeDelivery: product.freeDelivery,
    shippingPrice: product.shippingPrice,
  });
  const displayPrice = amount;
  const inclLabel = formatListingPriceIncl(displayPrice, shippingForIncl);
  const discountPercent = useMemo(() => {
    const original = product.originalPrice;
    if (original == null || !Number.isFinite(original) || original <= displayPrice || displayPrice <= 0) {
      return null;
    }
    return Math.max(1, Math.round(((original - displayPrice) / original) * 100));
  }, [displayPrice, product.originalPrice]);

  const infoRows = useMemo(() => buildProductInformationRows(product), [product]);

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

  const buildLine = (): BundleLineItemV1 => ({
    productId: product.id,
    slug: product.slug,
    title: product.title,
    imageUrl: product.images[0] ?? "",
    unitPrice: amount,
    quantity,
    maxStock: stockQty,
  });

  const persistAddToBundle = async (line: BundleLineItemV1) => {
    // Domain pre-check only (no mirror write) — server is sole authority.
    const preview = mergeLineIntoBundle({
      current: readBundleMirror(),
      sellerId: product.sellerId,
      sellerName: product.sellerName || "Seller",
      line,
    });
    if (!preview.ok) {
      if (preview.reason === "other_seller") {
        setConflictOpen(true);
      }
      return;
    }

    try {
      const res = await fetch("/api/bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "add",
          productId: line.productId,
          sellerId: product.sellerId,
          sellerName: product.sellerName || "Seller",
          quantity: line.quantity,
          slug: line.slug,
          title: line.title,
          imageUrl: line.imageUrl,
          unitPrice: line.unitPrice,
          maxStock: line.maxStock,
        }),
      });
      const payload = (await res.json()) as {
        ok?: boolean;
        reason?: string;
        bundle?: BundleSnapshotV1 | null;
        error?: string;
      };
      if (res.status === 401) {
        await rehydrateBundleMirrorFromServer();
        pushToast({ title: "Sign in to add items to your bundle.", variant: "error" });
        router.push(`/login?next=${encodeURIComponent(pathname || "/")}`);
        return;
      }
      if (res.status === 409 || payload.reason === "other_seller") {
        await rehydrateBundleMirrorFromServer();
        setConflictOpen(true);
        return;
      }
      if (!res.ok || !payload.ok || !payload.bundle) {
        await rehydrateBundleMirrorFromServer();
        pushToast({ title: payload.error ?? "Unable to add to bundle.", variant: "error" });
        return;
      }
      writeBundleMirror(payload.bundle);
      setSheetBundle(payload.bundle);
      setSheetLine(line);
      setSheetOpen(true);
    } catch {
      await rehydrateBundleMirrorFromServer();
      pushToast({ title: "Unable to add to bundle.", variant: "error" });
    }
  };

  const handleAddToBundle = () => {
    if (!isPurchasable || isOwnListing) return;
    void persistAddToBundle(buildLine());
  };

  const handleContact = useCallback(() => {
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
  }, [product.slug, router]);

  const handleCancelOffer = useCallback(() => {
    if (!negotiationView.offerId) return;
    void negotiation.cancel(negotiationView.offerId);
    // negotiation.cancel is referentially stable (P6 hook memo).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable cancel callback
  }, [negotiation.cancel, negotiationView.offerId]);

  const handleCloseSheet = useCallback(() => setSheetOpen(false), []);
  const handleCloseConflict = useCallback(() => setConflictOpen(false), []);
  const handleConflictContinue = useCallback(() => {
    setConflictOpen(false);
    router.push(BUNDLE_ENGINE_V1.ssot.reviewRoute);
  }, [router]);
  const handleCloseOffer = useCallback(() => setOfferOpen(false), []);
  const handleOfferSent = useCallback(
    ({ conversationHref }: { conversationHref?: string }) => {
      negotiation.refresh();
      if (conversationHref) router.push(conversationHref);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable refresh callback
    [negotiation.refresh, router],
  );
  const handleCloseBuyError = useCallback(() => {
    setBuyNowError(null);
    negotiation.clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable clearError callback
  }, [negotiation.clearError]);

  const setQuantity = useCallback(
    (next: number) => setQtyState({ productId: product.id, quantity: next }),
    [product.id],
  );
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
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("updated") !== "1") return;
    pushToast({ title: "Listing updated.", variant: "success" });
    router.replace(`/listing/${product.slug}`, { scroll: false });
  }, [product.slug, pushToast, router]);

  return (
    <div
      className="pd-v1"
      data-pd-detail-version="cod-sange-v3.1"
      data-product-page-freeze="FROZEN"
      data-view-item-ui-lock="FROZEN"
      data-view-item-version="2.0"
      data-view-item-canonical="view-item-v2.0-final"
      data-view-item-mockup="v2.0"
      data-bundle-engine={BUNDLE_ENGINE_V1.version}
      data-add-to-cart="removed-forever"
      data-dynamic-offer-action="v1.0"
      data-listing-sold={isSold ? "true" : "false"}
    >
      <RecordRecentlyViewed productSlug={product.slug} />
      {!isSold ? <RecordProductViewBeacon productSlug={product.slug} /> : null}

      <div className="pd-v1__shell">
        <div className="pd-v1__hero">
          <ProductPageChrome
            productId={product.id}
            productSlug={product.slug}
            productTitle={product.title}
            productStatus={product.status ?? "published"}
            sellerId={product.sellerId}
            sellerName={product.sellerName}
            sellerUsername={product.sellerUsername ?? null}
            isOwner={isOwnListing}
          />
          <ProductGalleryV1
            images={product.images}
            title={product.title}
            discountPercent={discountPercent}
          />
        </div>

        <main className="pd-v1__main" data-pd-scroll="document">
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
            <div className="pd-v1__price-row">
              <div className="pd-v1__price-col">
                <p className="pd-v1__price">{formatListingPrice(amount)}</p>
                {capabilities.buyNow && !isSold ? (
                  <p className="pd-v1__price-incl">
                    <span>{inclLabel}</span>
                  </p>
                ) : null}
              </div>
              <ProductViewsLive slug={product.slug} initialViews={product.views ?? 0} />
            </div>
          </section>

          <ProductStoreSection product={product} />

          {!isSold ? (
            <ProductStockStatus stock={product.stock} availability={product.availability} />
          ) : null}

          <ProductDescriptionV1 description={product.description} />

          <ProductInformationRows rows={infoRows} />

          {!isSold && !outOfStock && stockQty > 1 ? (
            <ProductQuantityStepper max={stockQty} value={quantity} onChange={setQuantity} />
          ) : null}

          <div className="pd-v1__scroll-end" data-pd-scroll-end aria-hidden />
        </main>
      </div>

      {!sellerOnHoliday ? (
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
          onContact={handleContact}
          onBuy={handleBuyNow}
          onMakeOffer={handleMakeOffer}
          onAddToBundle={
            isPurchasable && !isOwnListing ? handleAddToBundle : undefined
          }
          addToBundleDisabled={!isPurchasable || isOwnListing}
          onCancelOffer={handleCancelOffer}
        />
      ) : null}
      {!isSold && !sellerOnHoliday ? (
        <StickyBundleBar hostOnProductPage />
      ) : null}
      {sheetOpen && sheetBundle && sheetLine ? (
        <AddToBundleSheet
          open={sheetOpen}
          onClose={handleCloseSheet}
          bundle={sheetBundle}
          line={sheetLine}
        />
      ) : null}
      <BundleSellerConflictDialog
        open={conflictOpen}
        onCancel={handleCloseConflict}
        onContinue={handleConflictContinue}
      />
      {!isSold && !sellerOnHoliday ? (
        <OfferComposerSheet
          open={offerOpen}
          onClose={handleCloseOffer}
          product={offerProduct}
          onOfferSent={handleOfferSent}
        />
      ) : null}

      <BuyNowPublicErrorDialog
        open={Boolean(buyNowError || negotiation.error)}
        message={buyNowError ?? negotiation.error ?? ""}
        onClose={handleCloseBuyError}
      />
    </div>
  );
}
