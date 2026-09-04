/**
 * Store → Shop bundles → Create bundle (multi-select).
 * Valid selection: Make Offer + Buy Now (canonical OfferComposerSheet + buy-now).
 * Review route preserved for seller conflict Continue / deep links only — not the sticky CTA.
 */

"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ListingCard } from "@/components/ui/ListingCard";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  STORE_VISIT_LISTING_PROPS,
  storeListingCardAttr,
} from "@/lib/store/store-listing-card-premium-v1";
import { BundleSellerConflictDialog } from "@/features/product-detail/AddToBundleSheet";
import { addLineToBundleClient } from "@/features/bundle/add-line-to-bundle-client-v1";
import { BUNDLE_ENGINE_V1 } from "@/lib/bundle/bundle-engine-v1";
import { formatListingPrice } from "@/lib/listing-card/format";
import { readBundleMirror, discardBundleMirror } from "@/lib/bundle/bundle-mirror-v1";
import {
  bundleSubtotal,
  type BundleSnapshotV1,
} from "@/lib/bundle/bundle-domain-v1";
import { BuyNowPublicErrorDialog } from "@/features/checkout/components/BuyNowPublicErrorDialog";
import {
  buildBuyNowCheckoutHref,
  useBuyNowNavigation,
} from "@/features/checkout/hooks/use-buy-now-navigation";
import { OfferComposerSheet } from "@/features/transaction-hub/OfferComposerSheet";
import type { Product } from "@/lib/products/types";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type StoreShopBundlesProps = {
  sellerId: string;
  sellerName: string;
  /** All loaded store listings (same data source as Visit Store). */
  listings: Product[];
  visibleCount: number;
  onLoadMore: () => void;
  isOwnStore: boolean;
  holidayModeEnabled?: boolean;
  holidayEmptyMessage?: string;
  listingCountLabel?: number;
};

function isBundleEligibleListing(product: Product, sellerId: string): boolean {
  if (!product.id || !product.slug) return false;
  if (product.sellerId && product.sellerId !== sellerId) return false;
  if (typeof product.stock === "number" && product.stock <= 0) return false;
  return true;
}

export function StoreShopBundles({
  sellerId,
  sellerName,
  listings,
  visibleCount,
  onLoadMore,
  isOwnStore,
  holidayModeEnabled = false,
  holidayEmptyMessage,
}: StoreShopBundlesProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { executeBuyNow } = useBuyNowNavigation();
  const [building, setBuilding] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [serverBundle, setServerBundle] = useState<BundleSnapshotV1 | null>(null);
  const [buyBusy, setBuyBusy] = useState(false);
  const [buyNowError, setBuyNowError] = useState<string | null>(null);

  const eligible = useMemo(
    () => listings.filter((p) => isBundleEligibleListing(p, sellerId)),
    [listings, sellerId],
  );
  const byId = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of eligible) map.set(p.id, p);
    return map;
  }, [eligible]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const canCreateMulti = eligible.length >= 2 && !isOwnStore && Boolean(sellerId);
  const hasValidSelection = selectedIds.length >= 2;

  const browseListings = building ? eligible : listings.slice(0, visibleCount);
  const hasMore = !building && visibleCount < listings.length;

  const selectedProducts = useMemo(
    () => selectedIds.map((id) => byId.get(id)).filter(Boolean) as Product[],
    [selectedIds, byId],
  );

  const subtotal = useMemo(
    () => selectedProducts.reduce((sum, p) => sum + Number(p.price || 0), 0),
    [selectedProducts],
  );

  const startCreate = useCallback(() => {
    if (!canCreateMulti) return;
    setError(null);
    setSelectedIds([]);
    setServerBundle(null);
    setBuilding(true);
  }, [canCreateMulti]);

  const cancelCreate = useCallback(() => {
    setBuilding(false);
    setSelectedIds([]);
    setError(null);
    setServerBundle(null);
    setOfferOpen(false);
  }, []);

  const toggleId = useCallback(
    (id: string) => {
      if (!byId.has(id)) return;
      setSelectedIds((prev) => {
        if (prev.includes(id)) return prev.filter((x) => x !== id);
        return [...prev, id];
      });
      setError(null);
      setServerBundle(null);
    },
    [byId],
  );

  const handleConflictContinue = useCallback(() => {
    setConflictOpen(false);
    router.push(BUNDLE_ENGINE_V1.ssot.reviewRoute);
  }, [router]);

  /** Sync selection to Bundle Engine — no auto-navigate to review. */
  const ensureServerBundle = useCallback(async (): Promise<BundleSnapshotV1 | null> => {
    if (submitting || selectedIds.length < 2) return null;
    if (!sellerId) {
      setError("Seller could not be verified. Bundle creation stopped.");
      return null;
    }

    for (const id of selectedIds) {
      const product = byId.get(id);
      if (!product || (product.sellerId && product.sellerId !== sellerId)) {
        setError("A selected listing is not available from this store.");
        setSelectedIds((prev) =>
          prev.filter((x) => byId.has(x) && (!byId.get(x)?.sellerId || byId.get(x)?.sellerId === sellerId)),
        );
        return null;
      }
    }

    setSubmitting(true);
    setError(null);
    try {
      const mirror = readBundleMirror();
      if (mirror?.items?.length && mirror.sellerId && mirror.sellerId !== sellerId) {
        setConflictOpen(true);
        return null;
      }

      let last: BundleSnapshotV1 | null = null;
      for (const id of selectedIds) {
        const product = byId.get(id);
        if (!product) {
          setSelectedIds((prev) => prev.filter((x) => x !== id));
          setError("A listing became unavailable and was removed from your selection.");
          return null;
        }
        const stock = typeof product.stock === "number" ? Math.max(1, product.stock) : 1;
        const result = await addLineToBundleClient({
          sellerId,
          sellerName: sellerName || "Seller",
          line: {
            productId: product.id,
            slug: product.slug,
            title: product.title,
            imageUrl: product.imageUrl || "",
            unitPrice: Number(product.price) || 0,
            quantity: 1,
            maxStock: stock,
          },
        });
        if (!result.ok) {
          if (result.kind === "unauthorized") {
            router.push(`/login?next=${encodeURIComponent(pathname || `/store`)}`);
            return null;
          }
          if (result.kind === "other_seller") {
            setConflictOpen(true);
            return null;
          }
          setError(result.message);
          return null;
        }
        last = result.bundle;
      }
      setServerBundle(last);
      return last;
    } finally {
      setSubmitting(false);
    }
  }, [submitting, selectedIds, sellerId, sellerName, byId, router, pathname]);

  const offerProduct = useMemo(() => {
    if (!serverBundle?.items?.length) return null;
    const primary = serverBundle.items[0];
    const n = serverBundle.items.length;
    return {
      id: primary.productId,
      slug: primary.slug,
      title: n === 1 ? primary.title : `Bundle · ${n} items`,
      price: bundleSubtotal(serverBundle),
      imageUrl: primary.imageUrl,
    };
  }, [serverBundle]);

  const offerBundleContext = useMemo(() => {
    if (!serverBundle?.id || !serverBundle.items[0]) return null;
    return {
      bundleId: serverBundle.id,
      sellerId: serverBundle.sellerId,
      sellerName: serverBundle.sellerName || "Seller",
      currency: serverBundle.currency,
      lines: serverBundle.items.map((item) => ({
        productId: item.productId,
        slug: item.slug,
        title: item.title,
        imageUrl: item.imageUrl,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        maxStock: item.maxStock,
      })),
    };
  }, [serverBundle]);

  const handleMakeOffer = useCallback(async () => {
    if (!hasValidSelection || submitting || buyBusy) return;
    const bundle = serverBundle?.id ? serverBundle : await ensureServerBundle();
    if (!bundle?.id) {
      if (!error) setError("Bundle is not ready. Please try again.");
      return;
    }
    setOfferOpen(true);
  }, [hasValidSelection, submitting, buyBusy, serverBundle, ensureServerBundle, error]);

  const handleBuyNow = useCallback(async () => {
    if (!hasValidSelection || submitting || buyBusy) return;
    const bundle = serverBundle?.id ? serverBundle : await ensureServerBundle();
    if (!bundle?.id || !bundle.items[0]) {
      if (!error) setError("Bundle is not ready. Please try again.");
      return;
    }
    const primary = bundle.items[0];
    setBuyBusy(true);
    try {
      const result = await executeBuyNow({
        productSlug: primary.slug,
        bundleId: bundle.id,
        onError: (message) => setBuyNowError(message),
      });
      if (!result.ok) return;
      discardBundleMirror();
      setServerBundle(null);
      router.push(buildBuyNowCheckoutHref(primary.slug, result.checkoutPath));
    } finally {
      setBuyBusy(false);
    }
  }, [
    hasValidSelection,
    submitting,
    buyBusy,
    serverBundle,
    ensureServerBundle,
    executeBuyNow,
    router,
    error,
  ]);

  return (
    <section
      className="sv2__shop-bundles"
      aria-label="Shop bundles"
      data-shop-bundles="v1"
      data-bundle-engine={BUNDLE_ENGINE_V1.version}
    >
      {!isOwnStore ? (
        <div className="sv2__shop-bundles-head">
          <h2 className="sv2__shop-bundles-title">Shop bundles</h2>
          {building ? (
            <button
              type="button"
              className={cn("sv2__shop-bundles-cancel", focusRing)}
              onClick={cancelCreate}
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              className={cn("sv2__create-bundle", focusRing)}
              onClick={startCreate}
              disabled={!canCreateMulti}
              aria-disabled={!canCreateMulti}
              title={
                canCreateMulti
                  ? "Create a bundle from this store’s listings"
                  : eligible.length < 2
                    ? "At least two eligible listings are required"
                    : undefined
              }
              data-bundle-cta="create"
            >
              Create bundle
            </button>
          )}
        </div>
      ) : null}

      {building ? (
        <p className="sv2__shop-bundles-hint">Select listings from this store to create a bundle.</p>
      ) : null}

      {listings.length === 0 ? (
        <EmptyState
          title={holidayModeEnabled ? "Store on holiday" : "No listings yet"}
          description={
            holidayModeEnabled
              ? holidayEmptyMessage ?? "This seller is on holiday."
              : "This seller has no active listings right now."
          }
        />
      ) : (
        <>
          <div className="rx-listing-grid sv2__grid" {...storeListingCardAttr("visit")}>
            {browseListings.map((product) => {
              if (!building) {
                return (
                  <ListingCard
                    key={product.id}
                    product={product}
                    variant="grid"
                    {...STORE_VISIT_LISTING_PROPS}
                  />
                );
              }
              const selected = selectedSet.has(product.id);
              return (
                <div
                  key={product.id}
                  className={cn(
                    "sv2__bundle-select",
                    selected && "sv2__bundle-select--on",
                    focusRing,
                  )}
                  role="checkbox"
                  aria-checked={selected}
                  aria-label={`${selected ? "Deselect" : "Select"} ${product.title}`}
                  tabIndex={0}
                  onClick={() => toggleId(product.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleId(product.id);
                    }
                  }}
                >
                  <div className="sv2__bundle-select__card" aria-hidden>
                    <ListingCard
                      product={product}
                      variant="grid"
                      {...STORE_VISIT_LISTING_PROPS}
                      showFavorite={false}
                    />
                  </div>
                  <span className="sv2__bundle-select__check" aria-hidden>
                    {selected ? "✓" : ""}
                  </span>
                </div>
              );
            })}
          </div>

          {hasMore ? (
            <button
              type="button"
              className={cn("sv2__load-more", focusRing)}
              onClick={onLoadMore}
            >
              Load more
            </button>
          ) : null}

          {building ? (
            <div className="sv2__bundle-builder-bar" data-bundle-builder-summary>
              <div className="sv2__bundle-builder-summary">
                <p>
                  Selected: <strong>{selectedIds.length}</strong>{" "}
                  {selectedIds.length === 1 ? "listing" : "listings"}
                </p>
                <p>
                  Subtotal: <strong>{formatListingPrice(subtotal)}</strong>
                </p>
              </div>
              {error ? (
                <p className="sv2__bundle-builder-error" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="sv2__bundle-builder-actions" data-bundle-builder-ctas="make-offer-buy-now">
                <button
                  type="button"
                  className={cn("sv2__bundle-offer-btn", focusRing)}
                  disabled={!hasValidSelection || submitting || buyBusy}
                  data-bundle-cta="make-offer"
                  onClick={() => void handleMakeOffer()}
                >
                  {submitting && !buyBusy ? "Preparing…" : "Make Offer"}
                </button>
                <button
                  type="button"
                  className={cn("sv2__bundle-buy-btn", focusRing)}
                  disabled={!hasValidSelection || submitting || buyBusy}
                  data-bundle-cta="buy-now"
                  onClick={() => void handleBuyNow()}
                >
                  {buyBusy ? "Loading…" : "Buy Now"}
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <BundleSellerConflictDialog
        open={conflictOpen}
        onCancel={() => setConflictOpen(false)}
        onContinue={handleConflictContinue}
      />

      {serverBundle && offerProduct && offerBundleContext && offerOpen ? (
        <OfferComposerSheet
          open={offerOpen}
          onClose={() => setOfferOpen(false)}
          product={offerProduct}
          bundle={offerBundleContext}
          onOfferSent={({ conversationHref }) => {
            discardBundleMirror();
            setServerBundle(null);
            setOfferOpen(false);
            if (conversationHref) router.push(conversationHref);
          }}
        />
      ) : null}

      <BuyNowPublicErrorDialog
        open={Boolean(buyNowError)}
        message={buyNowError ?? ""}
        onClose={() => setBuyNowError(null)}
      />
    </section>
  );
}
