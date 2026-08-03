"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SafeImage } from "@/components/ui/SafeImage";
import { AccountCanonicalShell } from "@/features/account-canonical/shell/AccountCanonicalShell";
import { BuyNowPublicErrorDialog } from "@/features/checkout/components/BuyNowPublicErrorDialog";
import {
  buildBuyNowCheckoutHref,
  useBuyNowNavigation,
} from "@/features/checkout/hooks/use-buy-now-navigation";
import { useToast } from "@/components/ui/Toast";
import { formatListingPrice } from "@/lib/listing-card/format";
import {
  bundleItemCount,
  bundleSubtotal,
  type BundleSnapshotV1,
} from "@/lib/bundle/bundle-domain-v1";
import {
  discardBundleMirror,
  rehydrateBundleMirrorFromServer,
  writeBundleMirror,
} from "@/lib/bundle/bundle-mirror-v1";
import { useActiveBundle } from "@/features/product-detail/AddToBundleSheet";
import { BUNDLE_ENGINE_V1 } from "@/lib/bundle/bundle-engine-v1";

/**
 * Review Bundle — Owner Master Spec.
 * Make Offer / Buy Now reuse existing hubs (no parallel checkout).
 * Server snapshot is the only authority — mirror is cache after confirmed writes.
 */
export function BundleReviewPage() {
  const router = useRouter();
  const { pushToast } = useToast();
  const { executeBuyNow } = useBuyNowNavigation();
  const live = useActiveBundle();
  const [local, setLocal] = useState<BundleSnapshotV1 | null>(null);
  const bundle = live ?? local;
  const [offerOpen, setOfferOpen] = useState(false);
  const [buyBusy, setBuyBusy] = useState(false);
  const [buyNowError, setBuyNowError] = useState<string | null>(null);

  const count = bundleItemCount(bundle);
  const subtotal = bundleSubtotal(bundle);
  const sellerLabel = bundle?.sellerName?.trim() || "Seller";
  const empty = !bundle || bundle.items.length === 0;
  const primary = bundle?.items[0] ?? null;

  const refresh = useCallback((next: BundleSnapshotV1 | null) => {
    writeBundleMirror(next);
    setLocal(next);
  }, []);

  const syncQty = async (productId: string, quantity: number) => {
    try {
      const res = await fetch("/api/bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "set_qty", productId, quantity }),
      });
      const payload = (await res.json()) as { ok?: boolean; bundle?: BundleSnapshotV1 | null; error?: string };
      if (!res.ok || !payload.ok) {
        const server = await rehydrateBundleMirrorFromServer();
        refresh(server);
        pushToast({ title: payload.error ?? "Unable to update quantity.", variant: "error" });
        return;
      }
      refresh(payload.bundle ?? null);
    } catch {
      const server = await rehydrateBundleMirrorFromServer();
      refresh(server);
      pushToast({ title: "Unable to update quantity.", variant: "error" });
    }
  };

  const syncRemove = async (productId: string) => {
    try {
      const res = await fetch("/api/bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "remove", productId }),
      });
      const payload = (await res.json()) as { ok?: boolean; bundle?: BundleSnapshotV1 | null; error?: string };
      if (!res.ok || !payload.ok) {
        const server = await rehydrateBundleMirrorFromServer();
        refresh(server);
        pushToast({ title: payload.error ?? "Unable to remove item.", variant: "error" });
        return;
      }
      refresh(payload.bundle ?? null);
    } catch {
      const server = await rehydrateBundleMirrorFromServer();
      refresh(server);
      pushToast({ title: "Unable to remove item.", variant: "error" });
    }
  };

  // Hydration is owned by useActiveBundle (GET). No duplicate POST revalidate on mount.

  const handleBuyNow = async () => {
    if (!bundle || !primary || buyBusy) return;
    if (!bundle.id) {
      setBuyNowError("Bundle is not ready. Please refresh and try again.");
      return;
    }
    setBuyBusy(true);
    try {
      const result = await executeBuyNow({
        productSlug: primary.slug,
        bundleId: bundle.id,
        onError: (message) => setBuyNowError(message),
      });
      if (!result.ok) return;
      discardBundleMirror();
      refresh(null);
      router.push(buildBuyNowCheckoutHref(primary.slug, result.checkoutPath));
    } finally {
      setBuyBusy(false);
    }
  };

  return (
    <AccountCanonicalShell title="Review Bundle" backHref="/" showBottomNav showHeaderTitle>
      {empty ? (
        <div className="pd-v1__bundle-review-empty">
          <p>Your bundle is empty.</p>
          <Link href="/search" className="pd-v1__bundle-sheet-btn pd-v1__bundle-sheet-btn--primary">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="pd-v1__bundle-review" data-bundle-review={BUNDLE_ENGINE_V1.version}>
          <section className="pd-v1__bundle-review-seller" aria-label="Seller">
            <p className="pd-v1__bundle-review-seller-name">{sellerLabel}</p>
            <p className="pd-v1__bundle-review-seller-meta">
              {count} {count === 1 ? "item" : "items"}
            </p>
          </section>

          <ul className="pd-v1__bundle-review-list">
            {bundle!.items.map((item) => (
              <li key={item.productId} className="pd-v1__bundle-review-card">
                <Link href={`/listing/${item.slug}`} className="pd-v1__bundle-review-thumb">
                  <SafeImage src={item.imageUrl} alt="" width={80} height={80} />
                </Link>
                <div className="pd-v1__bundle-review-copy">
                  <Link href={`/listing/${item.slug}`} className="pd-v1__bundle-review-title">
                    {item.title}
                  </Link>
                  <p className="pd-v1__bundle-review-price">{formatListingPrice(item.unitPrice)}</p>
                  <p className="pd-v1__bundle-review-seller-meta">
                    Stock · {item.maxStock} available
                  </p>
                  <div
                    className="pd-v1__qty-stepper pd-v1__qty-stepper--compact"
                    role="group"
                    aria-label={`Quantity for ${item.title}`}
                  >
                    <button
                      type="button"
                      className="pd-v1__qty-btn"
                      aria-label="Decrease quantity"
                      disabled={item.quantity <= 1}
                      onClick={() => void syncQty(item.productId, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="pd-v1__qty-value">{item.quantity}</span>
                    <button
                      type="button"
                      className="pd-v1__qty-btn"
                      aria-label="Increase quantity"
                      disabled={item.quantity >= item.maxStock}
                      onClick={() => {
                        if (item.quantity >= item.maxStock) {
                          pushToast({ title: "Maximum stock reached.", variant: "info" });
                          return;
                        }
                        void syncQty(item.productId, item.quantity + 1);
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  className="pd-v1__bundle-review-remove"
                  aria-label={`Remove ${item.title}`}
                  onClick={() => void syncRemove(item.productId)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          <div className="pd-v1__bundle-review-totals">
            <div className="pd-v1__bundle-review-total-row">
              <span>Subtotal</span>
              <strong>{formatListingPrice(subtotal)}</strong>
            </div>
            <div className="pd-v1__bundle-review-total-row">
              <span>Delivery</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="pd-v1__bundle-review-total-row">
              <span>Grand Total</span>
              <strong>{formatListingPrice(subtotal)}</strong>
            </div>
          </div>

          <div className="pd-v1__bundle-review-actions pd-v1__action-row">
            <button
              type="button"
              className="pd-v1__action-btn pd-v1__action-btn--secondary"
              onClick={() => setOfferOpen(true)}
            >
              Make Offer
            </button>
            <button
              type="button"
              className="pd-v1__action-btn pd-v1__action-btn--buy"
              disabled={buyBusy}
              onClick={() => void handleBuyNow()}
            >
              {buyBusy ? "Loading…" : "Buy Now"}
            </button>
          </div>
        </div>
      )}

      {bundle && primary && offerOpen ? (
        <BundleOfferBridge
          open={offerOpen}
          onClose={() => setOfferOpen(false)}
          bundle={bundle}
          subtotal={subtotal}
          onSent={(href) => {
            // Bundle remains offer_pending on server — clear active mirror cache only.
            discardBundleMirror();
            refresh(null);
            pushToast({ title: "Bundle Offer sent", variant: "success" });
            router.push(href);
          }}
        />
      ) : null}

      <BuyNowPublicErrorDialog
        open={Boolean(buyNowError)}
        message={buyNowError ?? ""}
        onClose={() => setBuyNowError(null)}
      />
    </AccountCanonicalShell>
  );
}

function BundleOfferBridge({
  open,
  onClose,
  bundle,
  subtotal,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  bundle: BundleSnapshotV1;
  subtotal: number;
  onSent: (href: string) => void;
}) {
  const { pushToast } = useToast();
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  return (
    <div className="pd-v1__bundle-sheet-root" role="dialog" aria-modal="true" aria-label="Make Bundle Offer">
      <button type="button" className="pd-v1__bundle-sheet-backdrop" aria-label="Close" onClick={onClose} />
      <div className="pd-v1__bundle-sheet" style={{ height: "auto", minHeight: 320 }}>
        <p className="pd-v1__bundle-sheet-ok" style={{ color: "#111" }}>
          Bundle Offer · {bundle.items.length} items · List {formatListingPrice(subtotal)}
        </p>
        <label className="pd-v1__qty-label" htmlFor="bundle-offer-amount">
          Your offer (£)
        </label>
        <input
          id="bundle-offer-amount"
          className="pd-v1__qty-value-input"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="0.00"
          style={{
            height: 48,
            border: "1px solid #d1d5db",
            borderRadius: 12,
            width: "100%",
            textAlign: "left",
            padding: "0 12px",
          }}
        />
        <div className="pd-v1__bundle-sheet-actions">
          <button type="button" className="pd-v1__bundle-sheet-btn pd-v1__bundle-sheet-btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="pd-v1__bundle-sheet-btn pd-v1__bundle-sheet-btn--primary"
            disabled={submitting}
            onClick={() => {
              void (async () => {
                const parsed = Number(amount);
                if (!Number.isFinite(parsed) || parsed <= 0) {
                  pushToast({ title: "Enter a valid offer amount.", variant: "error" });
                  return;
                }
                if (parsed >= subtotal) {
                  pushToast({ title: "Offer must be below the bundle listing total.", variant: "error" });
                  return;
                }
                setSubmitting(true);
                try {
                  const response = await fetch("/api/offers", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                      amount: parsed,
                      bundle: {
                        bundleId: bundle.id,
                        sellerId: bundle.sellerId,
                        sellerName: bundle.sellerName,
                        currency: bundle.currency,
                        lines: bundle.items,
                      },
                    }),
                  });
                  const payload = (await response.json()) as {
                    success?: boolean;
                    error?: string;
                    href?: string;
                  };
                  if (!response.ok || !payload.success || !payload.href) {
                    pushToast({
                      title: payload.error ?? "Unable to submit bundle offer.",
                      variant: "error",
                    });
                    return;
                  }
                  // Do NOT discard — server transitions to offer_pending.
                  onClose();
                  onSent(payload.href);
                } finally {
                  setSubmitting(false);
                }
              })();
            }}
          >
            {submitting ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
