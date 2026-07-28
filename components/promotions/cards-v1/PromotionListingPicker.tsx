"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import {
  CanonicalInfoBlock,
  CanonicalModal,
} from "@/src/components/canonical";
import { PromotionPaymentMethodSelector } from "@/components/promotions/cards-v1/PromotionPaymentMethodSelector";
import type { ResolvedPromotionCatalogEntry } from "@/lib/promotions/catalog";
import type { SellerListing } from "@/lib/listings/types";
import {
  sanitizePromotionCheckoutError,
  type PromotionPaymentMethodId,
} from "@/lib/promotions/payment-safe";
import { formatPromotionPrice } from "@/lib/promotions/catalog";
import {
  PROMOTE_PAYMENT_CONTINUE_LABEL,
  PROMOTE_PAYMENT_PROCESSING_LABEL,
} from "@/lib/promotions/promote-payment-freeze-v1";
import "@/styles/rovexo/promotion-payment-v1.css";

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
  const [selectedListing, setSelectedListing] = useState<SellerListing | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PromotionPaymentMethodId | null>(null);
  const [hasPayableMethod, setHasPayableMethod] = useState(false);

  const publishedListings = listings.filter(
    (listing) => listing.status === "published" && listing.stock > 0,
  );

  const reset = () => {
    setSelectedListing(null);
    setPaymentMethod(null);
    setHasPayableMethod(false);
    setError(null);
    setBusyId(null);
  };

  const startCheckout = useCallback(
    async (listingId: string, method: PromotionPaymentMethodId) => {
      if (!entry) return;

      if (entry.checkoutKind === "store_featured" || entry.id === "boost") {
        setError(sanitizePromotionCheckoutError(null));
        return;
      }

      if (!entry.checkoutType || !entry.checkoutDurationId) {
        setError(sanitizePromotionCheckoutError(null));
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
            paymentMethod: method,
          }),
        });

        const payload = (await response.json()) as {
          success?: boolean;
          url?: string;
          error?: string;
        };
        if (!response.ok || !payload.success) {
          setError(sanitizePromotionCheckoutError(payload.error));
          return;
        }

        window.location.href = payload.url ?? `/promote?promotion=success&type=${entry.checkoutType}`;
      } catch {
        setError(sanitizePromotionCheckoutError(null));
      } finally {
        setBusyId(null);
      }
    },
    [entry],
  );

  if (!entry) return null;

  const priceLabel = formatPromotionPrice(entry.resolvedPriceCents ?? entry.priceCents);

  return (
    <CanonicalModal
      open={open}
      variant="information"
      title={selectedListing ? entry.title : `Select a listing for ${entry.title}`}
      cancelLabel="Close"
      onClose={() => {
        reset();
        onClose();
      }}
    >
      <div className="flex flex-col gap-ds-3">
        {!selectedListing ? (
          <>
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
                    onClick={() => {
                      setError(null);
                      setSelectedListing(listing);
                    }}
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
          </>
        ) : (
          <>
            <CanonicalInfoBlock variant="description">
              {selectedListing.title} · {entry.durationLabel} · {priceLabel}
            </CanonicalInfoBlock>

            <PromotionPaymentMethodSelector
              amountCents={entry.resolvedPriceCents ?? entry.priceCents}
              selected={paymentMethod}
              onSelect={setPaymentMethod}
              disabled={busyId !== null}
              onOptionsLoaded={(options) => {
                setHasPayableMethod(Boolean(options?.wallet.canPay || options?.defaultCard));
                if (!options?.wallet.canPay && !options?.defaultCard) {
                  setPaymentMethod(null);
                }
              }}
            />

            <div className="promo-pay__actions">
              <button
                type="button"
                className="promo-pay__secondary"
                disabled={busyId !== null}
                onClick={() => {
                  setSelectedListing(null);
                  setPaymentMethod(null);
                  setHasPayableMethod(false);
                  setError(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="promo-pay__primary"
                disabled={!paymentMethod || !hasPayableMethod || busyId !== null}
                onClick={() => {
                  if (paymentMethod) void startCheckout(selectedListing.id, paymentMethod);
                }}
              >
                {busyId ? PROMOTE_PAYMENT_PROCESSING_LABEL : PROMOTE_PAYMENT_CONTINUE_LABEL}
              </button>
            </div>
          </>
        )}

        {error ? <CanonicalInfoBlock variant="error">{error}</CanonicalInfoBlock> : null}
      </div>
    </CanonicalModal>
  );
}
