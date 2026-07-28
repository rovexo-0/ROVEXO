"use client";

/**
 * Store Showcase panel — Promote → Store Showcase flow.
 * Wired into Promotion Tools as the canonical store promote (not a duplicate system).
 */

import { useMemo, useState } from "react";
import { StoreShowcase } from "@/features/promote/components/StoreShowcase";
import { StoreShowcaseCheckout } from "@/features/promote/components/StoreShowcaseCheckout";
import { StoreShowcaseSuccess } from "@/features/promote/components/StoreShowcaseSuccess";
import { StoreAnalytics } from "@/features/promote/components/StoreAnalytics";
import {
  getStoreShowcaseOffer,
  resolveStoreShowcasePurchaseGate,
  resolveStoreShowcaseVisibility,
} from "@/lib/master-engine";
import { buildStoreShowcaseAnalyticsSnapshot } from "@/lib/promote/store-showcase-analytics";
import "@/styles/rovexo/store-showcase-v1.css";

export type StoreShowcasePanelProps = {
  activeListingCount: number;
  holidayModeEnabled: boolean;
  hasActiveStoreShowcase: boolean;
  lastExpiredAt?: string | null;
  analytics?: {
    impressions?: number;
    storeViews?: number;
    listingViews?: number;
    profileViews?: number;
  };
};

export function StoreShowcasePanel({
  activeListingCount,
  holidayModeEnabled,
  hasActiveStoreShowcase,
  lastExpiredAt = null,
  analytics,
}: StoreShowcasePanelProps) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibility = resolveStoreShowcaseVisibility({
    activeListingCount,
    holidayModeEnabled,
  });

  const gate = resolveStoreShowcasePurchaseGate({
    activeListingCount,
    holidayModeEnabled,
    hasActiveStoreShowcase,
    lastExpiredAt,
  });

  const disabledReason = useMemo(() => {
    if (!visibility.visible) return null;
    if (visibility.reason === "disabled-holiday-mode") {
      return "Store Showcase is disabled while Holiday Mode is on.";
    }
    if (!gate.antiAbuse.allowed) return gate.antiAbuse.message;
    if (hasActiveStoreShowcase) return "Store Showcase is already active.";
    return null;
  }, [visibility, gate.antiAbuse, hasActiveStoreShowcase]);

  const snapshot = buildStoreShowcaseAnalyticsSnapshot({
    ...analytics,
    isActive: hasActiveStoreShowcase,
    isWaiting: gate.antiAbuse.reason === "repurchase-wait",
    isExpired: Boolean(lastExpiredAt) && !hasActiveStoreShowcase,
  });

  async function confirmCheckout(paymentMethod: import("@/lib/promotions/payment-safe").PromotionPaymentMethodId) {
    setBusy(true);
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
        error?: string;
      };
      if (!response.ok || !payload.success) {
        const { sanitizePromotionCheckoutError } = await import("@/lib/promotions/payment-safe");
        setError(sanitizePromotionCheckoutError(payload.error));
        return;
      }
      window.location.assign(payload.url ?? "/promote?promotion=success&type=store_featured");
    } catch {
      const { sanitizePromotionCheckoutError } = await import("@/lib/promotions/payment-safe");
      setError(sanitizePromotionCheckoutError(null));
    } finally {
      setBusy(false);
    }
  }

  if (!visibility.visible) {
    return null;
  }

  return (
    <div className="store-showcase-v1__panel">
      <StoreShowcase
        visibility={visibility}
        canPurchase={gate.canPurchase}
        disabledReason={disabledReason}
        busy={busy}
        onContinue={() => setCheckoutOpen(true)}
      />
      {(hasActiveStoreShowcase || snapshot.impressions > 0) && (
        <StoreAnalytics snapshot={snapshot} />
      )}
      <StoreShowcaseCheckout
        open={checkoutOpen}
        busy={busy}
        error={error}
        onCancel={() => {
          setCheckoutOpen(false);
          setError(null);
        }}
        onConfirm={(method) => void confirmCheckout(method)}
      />
      <StoreShowcaseSuccess
        open={successOpen}
        onDone={() => setSuccessOpen(false)}
      />
    </div>
  );
}
