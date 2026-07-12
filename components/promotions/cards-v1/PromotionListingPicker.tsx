"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import {
  CanonicalInfoBlock,
  CanonicalModal,
} from "@/src/components/canonical";
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
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const publishedListings = listings.filter(
    (listing) => listing.status === "published" && listing.stock > 0,
  );

  const startCheckout = useCallback(
    async (listingId: string) => {
      if (!entry) return;

      if (entry.checkoutKind === "store_featured" || entry.id === "boost") {
        setError("Use the main Promotion Tools page for this promotion.");
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
    <CanonicalModal
      open={open}
      variant="information"
      title={`Select a listing for ${entry.title}`}
      cancelLabel="Close"
      onClose={onClose}
    >
      <div className="flex flex-col gap-ds-3">
        <CanonicalInfoBlock variant="description">
          Choose a published listing to continue with {entry.title.toLowerCase()}.
        </CanonicalInfoBlock>

        {publishedListings.length === 0 ? (
          <CanonicalInfoBlock variant="warning">
            You need at least one published listing.{" "}
            <Link href="/sell" className="font-semibold text-primary">
              Create a listing
            </Link>
          </CanonicalInfoBlock>
        ) : (
          <div role="listbox" aria-label="Published listings">
            {publishedListings.map((listing) => (
              <button
                key={listing.id}
                type="button"
                className="cds-menu-row w-full"
                disabled={busyId !== null}
                onClick={() => void startCheckout(listing.id)}
              >
                <span className="relative mr-ds-3 inline-flex h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                  <SafeImage
                    src={listing.thumbnailUrl ?? listing.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </span>
                <span className="cds-menu-row__title truncate">{listing.title}</span>
              </button>
            ))}
          </div>
        )}

        {error ? <CanonicalInfoBlock variant="error">{error}</CanonicalInfoBlock> : null}
      </div>
    </CanonicalModal>
  );
}
