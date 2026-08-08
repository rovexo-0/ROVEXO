"use client";

/**
 * Canonical Promote page — 3 compact premium cards (Bump · Store Showcase · Boost).
 * Layout SSOT: Owner canonical mockup (horizontal card · purple system).
 */

import { useCallback, useMemo, useState } from "react";
import { CanonicalInfoBlock, CanonicalButton } from "@/src/components/canonical";
import { AccountCanonicalShell, AccountPageStack } from "@/features/account-canonical";
import { PromotionCard } from "@/components/promotions/cards-v1/PromotionCard";
import { PromotionListingPicker } from "@/components/promotions/cards-v1/PromotionListingPicker";
import { PromotionPackagePicker } from "@/components/promotions/cards-v1/PromotionPackagePicker";
import { StoreShowcaseCheckout } from "@/features/promote/components/StoreShowcaseCheckout";
import {
  getStoreShowcaseOffer,
  resolveStoreShowcasePurchaseGate,
  resolveStoreShowcaseVisibility,
} from "@/lib/master-engine";
import type { ResolvedPromotionCatalogEntry } from "@/lib/promotions/catalog";
import type { SellerListing } from "@/lib/listings/types";
import {
  sanitizePromotionCheckoutError,
  type PromotionPaymentMethodId,
} from "@/lib/promotions/payment-safe";
import { resolvePromotionSuccessContent } from "@/lib/promotions/success-copy";
import "@/styles/rovexo/promotion-cards-v1.css";
import "@/styles/rovexo/store-showcase-v1.css";
import "@/styles/rovexo/promotion-payment-v1.css";

type PromotionToolsV1Props = {
  entries: ResolvedPromotionCatalogEntry[];
  listings: SellerListing[];
  activeListingCount: number;
  holidayModeEnabled: boolean;
  hasActiveStoreShowcase: boolean;
  lastStoreShowcaseExpiredAt?: string | null;
  backHref?: string;
  backLabel?: string;
  initialSuccessMessage?: string | null;
  initialSuccessType?: string | null;
};

export function PromotionToolsV1({
  entries,
  listings,
  activeListingCount,
  holidayModeEnabled,
  hasActiveStoreShowcase,
  lastStoreShowcaseExpiredAt = null,
  backHref = "/account",
  backLabel = "Profile",
  initialSuccessMessage = null,
  initialSuccessType = null,
}: PromotionToolsV1Props) {
  const [selectedEntry, setSelectedEntry] = useState<ResolvedPromotionCatalogEntry | null>(null);
  const [listingPickerOpen, setListingPickerOpen] = useState(false);
  const [packagePickerOpen, setPackagePickerOpen] = useState(false);
  const [storeCheckoutOpen, setStoreCheckoutOpen] = useState(false);
  const [storeBusy, setStoreBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successType, setSuccessType] = useState<string | null>(
    initialSuccessMessage ? initialSuccessType : null,
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(initialSuccessMessage);

  const visibility = resolveStoreShowcaseVisibility({
    activeListingCount,
    holidayModeEnabled,
  });

  const gate = resolveStoreShowcasePurchaseGate({
    activeListingCount,
    holidayModeEnabled,
    hasActiveStoreShowcase,
    lastExpiredAt: lastStoreShowcaseExpiredAt,
  });

  const storeDisabledReason = useMemo(() => {
    if (!visibility.visible) return "Store Showcase is not available right now.";
    if (visibility.reason === "disabled-holiday-mode") {
      return "Store Showcase is disabled while Holiday Mode is on.";
    }
    if (!gate.antiAbuse.allowed) return gate.antiAbuse.message;
    if (hasActiveStoreShowcase) return "Store Showcase is already active.";
    return null;
  }, [visibility, gate.antiAbuse, hasActiveStoreShowcase]);

  const orderedEntries = useMemo(() => {
    const order = ["bump", "store_featured", "boost"] as const;
    return order
      .map((id) => entries.find((entry) => entry.id === id))
      .filter((entry): entry is ResolvedPromotionCatalogEntry => Boolean(entry));
  }, [entries]);

  const successContent = useMemo(() => {
    if (!successMessage && !successType) return null;
    return resolvePromotionSuccessContent(successType);
  }, [successMessage, successType]);

  const confirmStoreCheckout = useCallback(async (paymentMethod: PromotionPaymentMethodId) => {
    setStoreBusy(true);
    setError(null);
    try {
      const offer = getStoreShowcaseOffer();
      const response = await fetch("/api/promotions/seller-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: offer.persistenceType,
          packageId: offer.packageId,
          paymentMethod,
        }),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        url?: string;
        activated?: boolean;
        error?: string;
      };
      if (!response.ok || !payload.success) {
        setError(sanitizePromotionCheckoutError(payload.error));
        return;
      }
      setStoreCheckoutOpen(false);
      if (payload.url) {
        window.location.assign(payload.url);
        return;
      }
      setSuccessType("store_featured");
      setSuccessMessage(
        resolvePromotionSuccessContent("store_featured").title,
      );
    } catch {
      setError(sanitizePromotionCheckoutError(null));
    } finally {
      setStoreBusy(false);
    }
  }, []);

  const handleSelect = (entry: ResolvedPromotionCatalogEntry) => {
    setError(null);

    if (entry.id === "boost") {
      setPackagePickerOpen(true);
      return;
    }

    if (entry.id === "store_featured") {
      if (storeDisabledReason) {
        setError(storeDisabledReason);
        return;
      }
      setStoreCheckoutOpen(true);
      return;
    }

    setSelectedEntry(entry);
    setListingPickerOpen(true);
  };

  return (
    <AccountCanonicalShell
      title="Promote"
      backHref={backHref}
      backLabel={backLabel}
      showHeaderTitle
      contentClassName="w-full max-w-none"
      dataMyAccountSurface="promote"
    >
      <AccountPageStack className="promo-v1-stack">
        {successContent ? (
          <div className="promo-v1-success" role="status" data-promote-success>
            <p className="promo-v1-success__title">{successContent.title}</p>
            <p className="promo-v1-success__body">{successContent.body}</p>
            <p className="promo-v1-success__meta">Expires in: {successContent.expiresLabel}</p>
            <div className="promo-v1-success__actions">
              <CanonicalButton
                variant="primary"
                fullWidth
                onClick={() => {
                  window.location.assign("/");
                }}
              >
                Continue Shopping
              </CanonicalButton>
              <CanonicalButton
                variant="outline"
                fullWidth
                onClick={() => {
                  window.location.assign("/seller/listings");
                }}
              >
                Go to My Listings
              </CanonicalButton>
            </div>
          </div>
        ) : null}

        <div className="promo-v1 promo-v1--account promo-v1--vertical promo-v1--compact" data-promote-page="v1.0">
          <section
            className="promo-v1__grid"
            aria-label="Promotion options"
            data-testid="promotion-tools-grid"
          >
            {orderedEntries.map((entry) => (
              <PromotionCard
                key={entry.id}
                entry={entry}
                busy={storeBusy && entry.id === "store_featured"}
                onSelect={handleSelect}
              />
            ))}
          </section>
        </div>

        {error && !storeCheckoutOpen ? (
          <CanonicalInfoBlock variant="error">{error}</CanonicalInfoBlock>
        ) : null}

        <PromotionListingPicker
          open={listingPickerOpen}
          entry={selectedEntry}
          listings={listings}
          onClose={() => setListingPickerOpen(false)}
        />
        <PromotionPackagePicker open={packagePickerOpen} onClose={() => setPackagePickerOpen(false)} />
        <StoreShowcaseCheckout
          open={storeCheckoutOpen}
          busy={storeBusy}
          error={error}
          onCancel={() => {
            setStoreCheckoutOpen(false);
            setError(null);
          }}
          onConfirm={(method) => void confirmStoreCheckout(method)}
        />
      </AccountPageStack>
    </AccountCanonicalShell>
  );
}
