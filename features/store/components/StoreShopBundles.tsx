/**
 * Store → Shop bundles → Create bundle (multi-select).
 * Reuses ListingCard + Bundle Engine POST /api/bundle → /bundle/review.
 * Selection SSOT = listing IDs only; prices from store listings data.
 */

"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ListingCard } from "@/components/ui/ListingCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { HP_CANONICAL_LISTING_PROPS } from "@/components/homepage/canonical/constants";
import { BundleSellerConflictDialog } from "@/features/product-detail/AddToBundleSheet";
import { addLineToBundleClient } from "@/features/bundle/add-line-to-bundle-client-v1";
import { BUNDLE_ENGINE_V1 } from "@/lib/bundle/bundle-engine-v1";
import { formatListingPrice } from "@/lib/listing-card/format";
import { storeListingCardAttr } from "@/lib/store/store-listing-card-premium-v1";
import { readBundleMirror } from "@/lib/bundle/bundle-mirror-v1";
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
  const [building, setBuilding] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);

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
    setBuilding(true);
  }, [canCreateMulti]);

  const cancelCreate = useCallback(() => {
    setBuilding(false);
    setSelectedIds([]);
    setError(null);
  }, []);

  const toggleId = useCallback(
    (id: string) => {
      if (!byId.has(id)) return;
      setSelectedIds((prev) => {
        if (prev.includes(id)) return prev.filter((x) => x !== id);
        return [...prev, id];
      });
      setError(null);
    },
    [byId],
  );

  const handleConflictContinue = useCallback(() => {
    setConflictOpen(false);
    router.push(BUNDLE_ENGINE_V1.ssot.reviewRoute);
  }, [router]);

  const reviewBundle = useCallback(async () => {
    if (submitting || selectedIds.length < 2) return;
    if (!sellerId) {
      setError("Seller could not be verified. Bundle creation stopped.");
      return;
    }

    for (const id of selectedIds) {
      const product = byId.get(id);
      if (!product || (product.sellerId && product.sellerId !== sellerId)) {
        setError("A selected listing is not available from this store.");
        setSelectedIds((prev) => prev.filter((x) => byId.has(x) && (!byId.get(x)?.sellerId || byId.get(x)?.sellerId === sellerId)));
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    try {
      const mirror = readBundleMirror();
      if (mirror?.items?.length && mirror.sellerId && mirror.sellerId !== sellerId) {
        setConflictOpen(true);
        return;
      }

      for (const id of selectedIds) {
        const product = byId.get(id);
        if (!product) {
          setSelectedIds((prev) => prev.filter((x) => x !== id));
          setError("A listing became unavailable and was removed from your selection.");
          return;
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
            return;
          }
          if (result.kind === "other_seller") {
            setConflictOpen(true);
            return;
          }
          setError(result.message);
          return;
        }
      }
      router.push(BUNDLE_ENGINE_V1.ssot.reviewRoute);
    } finally {
      setSubmitting(false);
    }
  }, [submitting, selectedIds, sellerId, sellerName, byId, router, pathname]);

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
                    {...HP_CANONICAL_LISTING_PROPS}
                    surface="store"
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
                      {...HP_CANONICAL_LISTING_PROPS}
                      surface="store"
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
              <button
                type="button"
                className={cn("sv2__bundle-review-btn", focusRing)}
                disabled={selectedIds.length < 2 || submitting}
                onClick={() => void reviewBundle()}
              >
                {submitting ? "Preparing…" : "Review bundle"}
              </button>
            </div>
          ) : null}
        </>
      )}

      <BundleSellerConflictDialog
        open={conflictOpen}
        onCancel={() => setConflictOpen(false)}
        onContinue={handleConflictContinue}
      />
    </section>
  );
}
