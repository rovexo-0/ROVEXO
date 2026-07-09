"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ModalContainer } from "@/components/ui/ModalContainer";
import type { ResolvedPromotionCatalogEntry } from "@/lib/promotions/catalog";
import type { SellerListing } from "@/lib/listings/types";

type PromotionListingPickerProps = {
  open: boolean;
  entry: ResolvedPromotionCatalogEntry | null;
  listings: SellerListing[];
  onClose: () => void;
};

export function PromotionListingPicker({
  open,
  entry,
  listings,
  onClose,
}: PromotionListingPickerProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const publishedListings = listings.filter((listing) => listing.status === "published");

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
  }, [open]);

  const startCheckout = useCallback(
    async (listingId: string) => {
      if (!entry) return;

      if (entry.checkoutKind === "store_featured") {
        window.location.href = "/account/business";
        return;
      }

      if (!entry.checkoutType || !entry.checkoutDurationId) {
        setError("This promotion is not available for checkout yet.");
        return;
      }

      setBusyId(listingId);
      setError(null);

      try {
        const response = await fetch("/api/promotions/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: listingId,
            type: entry.checkoutType,
            durationId: entry.checkoutDurationId,
          }),
        });

        const payload = (await response.json()) as { success?: boolean; url?: string; error?: string };
        if (!response.ok || !payload.url) {
          setError(payload.error ?? "Unable to start checkout.");
          return;
        }

        window.location.href = payload.url;
      } catch {
        setError("Unable to start checkout.");
      } finally {
        setBusyId(null);
      }
    },
    [entry],
  );

  if (!entry) return null;

  return (
    <ModalContainer
      open={open}
      onClose={onClose}
      variant="sheet"
      zIndex={120}
      ariaLabelledBy="promo-listing-picker-title"
      panelClassName="promo-v1-modal"
    >
      <h2 id="promo-listing-picker-title" className="promo-v1-modal__title">
        Select a listing for {entry.title}
      </h2>
        <p className="promo-v1-modal__empty">
          Choose a published listing to continue with {entry.title.toLowerCase()}.
        </p>

        {publishedListings.length === 0 ? (
          <p className="promo-v1-modal__empty">
            You need at least one published listing.{" "}
            <Link href="/sell" className="font-semibold text-primary">
              Create a listing
            </Link>
          </p>
        ) : (
          <div className="promo-v1-modal__list" role="listbox" aria-label="Published listings">
            {publishedListings.map((listing) => (
              <button
                key={listing.id}
                type="button"
                className="promo-v1-modal__listing"
                disabled={busyId !== null}
                onClick={() => void startCheckout(listing.id)}
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                  <SafeImage
                    src={listing.thumbnailUrl ?? listing.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">
                  {listing.title}
                </span>
              </button>
            ))}
          </div>
        )}

        {error ? <p className="promo-v1-modal__error">{error}</p> : null}

        <div className="promo-v1-modal__actions">
          <button ref={cancelRef} type="button" className="promo-v1-modal__cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
    </ModalContainer>
  );
}
