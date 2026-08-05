"use client";

import {
  CreditCardLineIcon,
  EditLineIcon,
  LocationLineIcon,
  LockLineIcon,
  TruckLineIcon,
  WalletLineIcon,
} from "@/components/icons/RvxLineIcons";
import "@/styles/rovexo/checkout-v1.css";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ScrollContainer } from "@/components/ui/ScrollContainer";
import { CheckoutPageHeader } from "@/features/checkout/components/CheckoutPageHeader";
import { CheckoutPriceSummary } from "@/features/checkout/components/CheckoutPriceSummary";
import { CheckoutProductSummary } from "@/features/checkout/components/CheckoutProductSummary";
import { formatListingPrice } from "@/lib/listing-card/format";
import { isCheckoutCollectionPointEnabled } from "@/lib/checkout/delivery-capabilities-v1";
import type { CheckoutFormController } from "@/features/checkout/hooks/use-checkout-form";
import type { CheckoutStep } from "@/features/checkout/types";
import type { ProductDetail } from "@/lib/products/types";
import type { PaymentMethodId } from "@/lib/checkout/payment";
import type { BundleCheckoutSnapshotV1 } from "@/lib/bundle/bundle-snapshot-v1";
import { fetchAccountSnapshotShared } from "@/lib/account-center/fetch-account-snapshot-shared";

type CheckoutWizardV1Props = {
  product: ProductDetail;
  form: CheckoutFormController;
  buyerPhone?: string | null;
  embedded?: boolean;
  onClose?: () => void;
  initialStep?: CheckoutStep;
  bundleSnapshot?: BundleCheckoutSnapshotV1 | null;
};

type DeliveryMode = "collection_point" | "ship_home";

/** Display-only — UK marketplace hides country on the Address card. */
function isUkMarketplaceCountry(country: string): boolean {
  const normalized = country.trim().toLowerCase();
  return (
    normalized === "uk" ||
    normalized === "gb" ||
    normalized === "united kingdom" ||
    normalized === "great britain"
  );
}

/** Display-only — street / city split from a comma-separated address line. */
function splitDisplayAddress(addressLine: string): { street: string; city: string } {
  const parts = addressLine
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length > 1) {
    return { street: parts.slice(0, -1).join(", "), city: parts[parts.length - 1] ?? "" };
  }
  return { street: addressLine.trim(), city: "" };
}

/**
 * Checkout Absolute Law v1.0 FINAL LOCK — canonical one-page checkout.
 * PRODUCT · ADDRESS · DELIVERY OPTION · DELIVERY DETAILS · CONTACT ·
 * PAYMENT (Card | Rovexo Balance) · PRICE · PAY £ · SECURE CHECKOUT
 * Blood Compact UI — visual density only (mobile spacing).
 */
export function CheckoutWizardV1({
  product,
  form,
  buyerPhone,
  embedded = false,
  onClose,
  bundleSnapshot = null,
}: CheckoutWizardV1Props) {
  const {
    draft,
    updateDraft,
    totals,
    canPay,
    isSubmitting,
    isResolvingAddress,
    resolveDeliveryAddress,
    placeOrder,
    shippingQuotesLoading,
    liveQuotesAttempted,
    selectedQuote,
    shippingQuoteReason,
  } = form;

  const collectionPointEnabled = isCheckoutCollectionPointEnabled();
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("ship_home");
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);

  const hasListingShippingPrice =
    product.shippingPrice != null && product.shippingPrice >= 0;

  const shippingBlocked =
    shippingQuoteReason === "seller_dispatch_not_ready" &&
    !hasListingShippingPrice &&
    !product.freeDelivery;

  const addressComplete = useMemo(
    () =>
      draft.recipientName.trim().length > 0 &&
      draft.addressLine.trim().length > 0 &&
      draft.postcode.trim().length > 0 &&
      draft.country.trim().length > 0,
    [draft.addressLine, draft.country, draft.postcode, draft.recipientName],
  );

  /* Derive — do not sync-setState when collection point is disabled (Gate ESLint). */
  const activeDeliveryMode: DeliveryMode =
    collectionPointEnabled && deliveryMode === "collection_point"
      ? "collection_point"
      : "ship_home";

  const deliveryResolved =
    (collectionPointEnabled && activeDeliveryMode === "collection_point") ||
    product.freeDelivery ||
    selectedQuote != null ||
    hasListingShippingPrice;

  useEffect(() => {
    if (!addressComplete && !isResolvingAddress) {
      void resolveDeliveryAddress();
    }
  }, [addressComplete, isResolvingAddress, resolveDeliveryAddress]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const payload = await fetchAccountSnapshotShared();
        if (!cancelled && payload.wallet?.availableBalance != null) {
          setAvailableBalance(Number(payload.wallet.availableBalance));
        }
      } catch {
        // Balance optional for Card Payment path.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const shippingPrice = product.freeDelivery ? 0 : totals.delivery;
  const shippingMethodLabel = product.freeDelivery
    ? "Free delivery"
    : selectedQuote?.serviceName || selectedQuote?.carrier || "Royal Mail 48";
  const etaLabel = selectedQuote?.eta || "2-4 Business Days";
  const carrierBrand = (
    selectedQuote?.carrier ||
    shippingMethodLabel ||
    "RM"
  )
    .replace(/[^A-Za-z]/g, "")
    .slice(0, 2)
    .toUpperCase() || "RM";

  const paymentMethod: PaymentMethodId =
    draft.paymentMethod === "rovexo_balance" ? "rovexo_balance" : "card";

  const footerDisabled =
    !canPay ||
    isSubmitting ||
    isResolvingAddress ||
    shippingQuotesLoading ||
    shippingBlocked ||
    !addressComplete ||
    !deliveryResolved ||
    (activeDeliveryMode === "ship_home" &&
      !product.freeDelivery &&
      !liveQuotesAttempted &&
      !hasListingShippingPrice);

  const handlePay = () => {
    void (async () => {
      if (!addressComplete) {
        const resolved = await resolveDeliveryAddress();
        if (!resolved) return;
      }
      void placeOrder();
    })();
  };

  const { street: addressStreet, city: addressCity } = splitDisplayAddress(draft.addressLine);
  const addressLinePrimary = addressStreet || draft.addressLine;
  const addressLocality = [draft.postcode, addressCity].filter(Boolean).join(" ");
  const addressLineSecondary = isUkMarketplaceCountry(draft.country)
    ? addressLocality
    : [addressLocality, draft.country].filter(Boolean).join(" ");
  const deliveryPriceLabel =
    !product.freeDelivery && shippingPrice > 0
      ? formatListingPrice(shippingPrice)
      : "£0.00";
  const deliveryMetaLabel = `${deliveryPriceLabel} • ${etaLabel}`;

  return (
    <div
      className="ckt-v1"
      data-checkout-version="v1.0"
      data-checkout-ui="v1.0"
      data-checkout-absolute-law="1.0-final-lock"
      data-checkout-sprint="3-qa"
      data-checkout-freeze="CHECKOUT_UI_v1.0"
      data-blood-code-xxvi="26.0"
      data-blood-checkout-compact="1.0"
      data-checkout-step="confirm"
      data-checkout-embedded={embedded ? "true" : undefined}
    >
      <CheckoutPageHeader
        backHref={embedded ? undefined : `/listing/${product.slug}`}
        backLabel={embedded ? "Back" : "Back"}
        onBack={embedded ? onClose : undefined}
        title="Checkout"
      />

      <ScrollContainer as="main" withBottomNav={false} className="ckt-v1__main">
        <div className="ckt-v1__sections">
          <section className="ckt-v1__section" aria-label="Product">
            <h2 className="ckt-v1__section-title">Product</h2>
            <CheckoutProductSummary product={product} bundleSnapshot={bundleSnapshot} />
          </section>

          <section className="ckt-v1__section" aria-labelledby="ckt-address-title">
            <h2 id="ckt-address-title" className="ckt-v1__section-title">
              Address
            </h2>
            <div className="ckt-v1__card ckt-v1__card--pad ckt-v1__card--editable ckt-v1__card--edit-top">
              <Link
                href="/account/addresses"
                className="ckt-v1__edit-link"
                aria-label="Edit address"
              >
                <EditLineIcon aria-hidden />
              </Link>
              {addressComplete ? (
                <>
                  <p className="ckt-v1__review-value">{draft.recipientName}</p>
                  <p className="ckt-v1__review-subvalue">{addressLinePrimary}</p>
                  {addressLineSecondary ? (
                    <p className="ckt-v1__review-subvalue">{addressLineSecondary}</p>
                  ) : null}
                </>
              ) : (
                <p className="ckt-v1__review-subvalue">
                  Add a delivery address to continue.
                </p>
              )}
            </div>
          </section>

          <section className="ckt-v1__section" aria-labelledby="ckt-delivery-option-title">
            <h2 id="ckt-delivery-option-title" className="ckt-v1__section-title">
              Delivery option
            </h2>
            <div className="ckt-v1__option-list" role="radiogroup" aria-label="Delivery option">
              {collectionPointEnabled ? (
                <button
                  type="button"
                  role="radio"
                  aria-checked={activeDeliveryMode === "collection_point"}
                  className={
                    activeDeliveryMode === "collection_point"
                      ? "ckt-v1__option ckt-v1__option--selected"
                      : "ckt-v1__option"
                  }
                  onClick={() => setDeliveryMode("collection_point")}
                >
                  <span className="ckt-v1__option-icon" aria-hidden>
                    <LocationLineIcon />
                  </span>
                  <span className="ckt-v1__option-copy">
                    <span className="ckt-v1__option-title">Collection Point</span>
                    <span className="ckt-v1__option-detail">From £0.00</span>
                  </span>
                  <span className="ckt-v1__option-radio" aria-hidden />
                </button>
              ) : null}
              <button
                type="button"
                role="radio"
                aria-checked={activeDeliveryMode === "ship_home"}
                className={
                  activeDeliveryMode === "ship_home"
                    ? "ckt-v1__option ckt-v1__option--selected"
                    : "ckt-v1__option"
                }
                onClick={() => setDeliveryMode("ship_home")}
              >
                <span className="ckt-v1__option-icon" aria-hidden>
                  <TruckLineIcon />
                </span>
                <span className="ckt-v1__option-copy">
                  <span className="ckt-v1__option-title">Ship to Home</span>
                  <span className="ckt-v1__option-detail">
                    From{" "}
                    {product.freeDelivery
                      ? "£0.00"
                      : formatListingPrice(shippingPrice > 0 ? shippingPrice : 0)}
                  </span>
                </span>
                <span className="ckt-v1__option-radio" aria-hidden />
              </button>
            </div>
          </section>

          {activeDeliveryMode === "ship_home" ? (
            <section className="ckt-v1__section" aria-labelledby="ckt-delivery-details-title">
              <h2 id="ckt-delivery-details-title" className="ckt-v1__section-title">
                Delivery details
              </h2>
              <div className="ckt-v1__card ckt-v1__card--pad ckt-v1__card--editable ckt-v1__card--edit-top">
                <Link
                  href="/account/addresses"
                  className="ckt-v1__edit-link"
                  aria-label="Edit delivery details"
                >
                  <EditLineIcon aria-hidden />
                </Link>
                {shippingQuotesLoading ? (
                  <p className="ckt-v1__review-subvalue">Loading delivery…</p>
                ) : (
                  <div className="ckt-v1__delivery-details">
                    <div className="ckt-v1__delivery-details-top">
                      <span className="ckt-v1__shipping-brand" aria-hidden>
                        {carrierBrand}
                      </span>
                      <p className="ckt-v1__review-value">{shippingMethodLabel}</p>
                    </div>
                    <p className="ckt-v1__delivery-meta">{deliveryMetaLabel}</p>
                  </div>
                )}
              </div>
            </section>
          ) : null}

          <section className="ckt-v1__section" aria-labelledby="ckt-contact-title">
            <h2 id="ckt-contact-title" className="ckt-v1__section-title">
              Phone
            </h2>
            <div className="ckt-v1__card ckt-v1__card--pad ckt-v1__card--editable">
              <Link
                href="/account/settings"
                className="ckt-v1__edit-link"
                aria-label="Edit phone"
              >
                <EditLineIcon aria-hidden />
              </Link>
              <p className="ckt-v1__review-value">
                {buyerPhone?.trim() ? buyerPhone : "Add a phone number"}
              </p>
            </div>
          </section>

          <section className="ckt-v1__section" aria-labelledby="ckt-payment-title">
            <h2 id="ckt-payment-title" className="ckt-v1__section-title">
              Payment
            </h2>
            <div className="ckt-v1__option-list" role="radiogroup" aria-label="Payment method">
              <button
                type="button"
                role="radio"
                aria-checked={paymentMethod === "card"}
                className={
                  paymentMethod === "card"
                    ? "ckt-v1__option ckt-v1__option--selected"
                    : "ckt-v1__option"
                }
                onClick={() => updateDraft({ paymentMethod: "card" })}
              >
                <span className="ckt-v1__option-icon" aria-hidden>
                  <CreditCardLineIcon />
                </span>
                <span className="ckt-v1__option-copy ckt-v1__option-copy--stacked">
                  <span className="ckt-v1__option-title">Card Payment</span>
                  <span className="ckt-v1__option-detail">Visa • Mastercard</span>
                </span>
                <span className="ckt-v1__option-radio" aria-hidden />
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={paymentMethod === "rovexo_balance"}
                className={
                  paymentMethod === "rovexo_balance"
                    ? "ckt-v1__option ckt-v1__option--selected"
                    : "ckt-v1__option"
                }
                onClick={() => updateDraft({ paymentMethod: "rovexo_balance" })}
              >
                <span className="ckt-v1__option-icon" aria-hidden>
                  <WalletLineIcon />
                </span>
                <span className="ckt-v1__option-copy ckt-v1__option-copy--stacked">
                  <span className="ckt-v1__option-title">Rovexo Balance</span>
                  <span className="ckt-v1__option-detail">
                    Available Balance{" "}
                    {availableBalance != null
                      ? formatListingPrice(availableBalance)
                      : "£0.00"}
                  </span>
                </span>
                <span className="ckt-v1__option-radio" aria-hidden />
              </button>
            </div>
          </section>

          <section className="ckt-v1__section ckt-v1__section--price" aria-label="Price summary">
            <CheckoutPriceSummary totals={totals} freeDelivery={Boolean(product.freeDelivery)} />
          </section>
        </div>
      </ScrollContainer>

      <div className="ckt-v1__footer">
        <button
          type="button"
          className="ckt-v1__cta"
          disabled={footerDisabled}
          onClick={handlePay}
        >
          {isSubmitting || isResolvingAddress
            ? "Processing…"
            : `TOTAL PAY ${formatListingPrice(totals.total)}`}
        </button>
        <p className="ckt-v1__secure">
          <LockLineIcon width={14} height={14} aria-hidden />
          Secure Checkout
          <span className="ckt-v1__secure-sub">Payment protected</span>
        </p>
      </div>
    </div>
  );
}
