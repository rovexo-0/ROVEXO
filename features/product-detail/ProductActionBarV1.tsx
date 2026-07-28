"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import {
  PRODUCT_ACTION_BAR_COPY,
  PRODUCT_ACTION_BAR_UI_LOCK,
  PRODUCT_ACTION_BAR_VERSION,
  PRODUCT_ACTION_BUTTONS,
} from "@/lib/transaction-hub/product-action-bar";
import type { ProductOfferActionView } from "@/lib/transaction-hub/dynamic-offer-action-engine-v1";
import type { TransactionMode } from "@/lib/transaction-mode/types";
import { isDirectContactMode } from "@/lib/transaction-mode/capabilities";
import { BagLineIcon, TagLineIcon } from "@/components/icons/RvxLineIcons";

type ProductActionBarV1Props = {
  transactionMode: TransactionMode;
  onBuy?: () => void;
  onMakeOffer?: () => void;
  onContact?: () => void;
  buyDisabled?: boolean;
  offerDisabled?: boolean;
  buyState?: "idle" | "loading";
  outOfStock?: boolean;
  /** Canonical SOLD PDP — hide commerce CTAs; show discovery actions only. */
  sold?: boolean;
  similarHref?: string;
  sellerHref?: string | null;
  negotiation?: ProductOfferActionView | null;
  negotiationBusy?: "accept" | "decline" | "cancel" | "counter" | null;
  onAcceptOffer?: () => void;
  onDeclineOffer?: () => void;
  onCancelOffer?: () => void;
  onCounterOffer?: (amount: number) => void;
  className?: string;
};

type ActionButtonProps = {
  label: string;
  icon?: ReactNode;
  variant: "primary" | "secondary" | "danger" | "disabled";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
};

function ActionButton({
  label,
  icon,
  variant,
  disabled,
  loading,
  onClick,
  className,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "pd-v1__action-btn",
        variant === "primary" && "pd-v1__action-btn--buy",
        variant === "secondary" && "pd-v1__action-btn--secondary",
        variant === "danger" && "pd-v1__action-btn--danger",
        variant === "disabled" && "pd-v1__action-btn--oos",
        loading && "pd-v1__action-btn--loading",
        className,
      )}
      disabled={disabled || loading || variant === "disabled"}
      onClick={onClick}
      aria-label={label}
      aria-busy={loading || undefined}
    >
      <span className="pd-v1__action-btn-inner">
        {icon ? (
          <span className="pd-v1__action-icon" aria-hidden>
            {loading ? <span className="pd-v1__action-spinner" aria-hidden /> : icon}
          </span>
        ) : loading ? (
          <span className="pd-v1__action-icon" aria-hidden>
            <span className="pd-v1__action-spinner" aria-hidden />
          </span>
        ) : null}
        <span className="pd-v1__action-label">{label}</span>
      </span>
    </button>
  );
}

function StatusCard({
  title,
  detail,
}: {
  title: string;
  detail?: string | null;
}) {
  return (
    <div className="pd-v1__offer-card" data-offer-status-card>
      <p className="pd-v1__offer-card-title">{title}</p>
      {detail ? <p className="pd-v1__offer-card-amount">{detail}</p> : null}
    </div>
  );
}

/**
 * Product sticky actions — Dynamic Offer Action Engine (UI visibility).
 * Exactly one logical negotiation state at a time.
 */
export function ProductActionBarV1({
  transactionMode,
  onBuy,
  onMakeOffer,
  onContact,
  buyDisabled = false,
  offerDisabled = false,
  buyState = "idle",
  outOfStock = false,
  sold = false,
  similarHref = "/search",
  sellerHref = null,
  negotiation = null,
  negotiationBusy = null,
  onAcceptOffer: _onAcceptOffer,
  onDeclineOffer: _onDeclineOffer,
  onCancelOffer,
  onCounterOffer: _onCounterOffer,
  className,
}: ProductActionBarV1Props) {
  void _onAcceptOffer;
  void _onDeclineOffer;
  void _onCounterOffer;

  if (sold) {
    return (
      <div
        className={cn("pd-v1__action-bar pd-v1__action-bar--stack pd-v1__action-bar--offer", className)}
        data-pd-action-bar
        data-offer-action-mode="sold"
        data-product-action-bar-version={PRODUCT_ACTION_BAR_VERSION}
        data-ui-lock={PRODUCT_ACTION_BAR_UI_LOCK ? "production" : undefined}
        role="toolbar"
        aria-label="Sold listing actions"
      >
        <div className="pd-v1__action-row" data-sold-actions>
          <Link
            href={similarHref}
            className="pd-v1__action-btn pd-v1__action-btn--buy"
            aria-label="View Similar"
          >
            <span className="pd-v1__action-btn-inner">
              <span className="pd-v1__action-label">View Similar</span>
            </span>
          </Link>
          {sellerHref ? (
            <Link
              href={sellerHref}
              className="pd-v1__action-btn pd-v1__action-btn--secondary"
              aria-label="More from this Seller"
            >
              <span className="pd-v1__action-btn-inner">
                <span className="pd-v1__action-label">More from this Seller</span>
              </span>
            </Link>
          ) : (
            <ActionButton label="More from this Seller" variant="disabled" />
          )}
        </div>
      </div>
    );
  }

  const directContact = isDirectContactMode(transactionMode);

  if (directContact) {
    return (
      <div
        className={cn("pd-v1__action-bar pd-v1__action-bar--single", className)}
        data-pd-action-bar
        data-product-action-bar-version={PRODUCT_ACTION_BAR_VERSION}
        data-ui-lock={PRODUCT_ACTION_BAR_UI_LOCK ? "production" : undefined}
      >
        <button type="button" className="pd-v1__action-btn pd-v1__action-btn--buy" onClick={onContact}>
          <span className="pd-v1__action-btn-inner">
            <span className="pd-v1__action-label">{PRODUCT_ACTION_BAR_COPY.contactSeller}</span>
          </span>
        </button>
      </div>
    );
  }

  const mode = outOfStock ? "out_of_stock" : (negotiation?.mode ?? "idle");

  if (mode === "out_of_stock") {
    return (
      <div
        className={cn("pd-v1__action-bar pd-v1__action-bar--single pd-v1__action-bar--offer", className)}
        data-pd-action-bar
        data-offer-action-mode="out_of_stock"
        data-product-action-bar-version={PRODUCT_ACTION_BAR_VERSION}
        data-ui-lock={PRODUCT_ACTION_BAR_UI_LOCK ? "production" : undefined}
        role="toolbar"
        aria-label="Product actions"
      >
        <ActionButton label="OUT OF STOCK" variant="disabled" />
      </div>
    );
  }

  if (mode === "buyer_pending" && negotiation) {
    return (
      <div
        className={cn("pd-v1__action-bar pd-v1__action-bar--stack pd-v1__action-bar--offer", className)}
        data-pd-action-bar
        data-offer-action-mode="buyer_pending"
        data-product-action-bar-version={PRODUCT_ACTION_BAR_VERSION}
        role="toolbar"
        aria-label="Offer pending"
      >
        <StatusCard title="Offer Pending" detail={negotiation.amountLabel} />
        <ActionButton
          label={
            negotiationBusy === "cancel" || negotiationBusy === "decline"
              ? "Cancelling…"
              : "Cancel Offer"
          }
          variant="secondary"
          loading={negotiationBusy === "cancel" || negotiationBusy === "decline"}
          disabled={Boolean(negotiationBusy)}
          onClick={onCancelOffer}
        />
      </div>
    );
  }

  /**
   * Product Action Bar freeze (Buy Now + Make Offer ONLY).
   * Accept / Counter Offer / Decline render only in Conversation Hub.
   * seller_counter falls through to the canonical Buy Now + Make Offer row below.
   */
  if (mode === "accepted" && negotiation) {
    return (
      <div
        className={cn("pd-v1__action-bar pd-v1__action-bar--stack pd-v1__action-bar--offer", className)}
        data-pd-action-bar
        data-offer-action-mode="accepted"
        data-product-action-bar-version={PRODUCT_ACTION_BAR_VERSION}
        role="toolbar"
        aria-label="Offer accepted"
      >
        <StatusCard title="Offer Accepted" detail={negotiation.amountLabel} />
        <ActionButton
          label={
            buyState === "loading"
              ? PRODUCT_ACTION_BAR_COPY.buyNowLoading
              : PRODUCT_ACTION_BAR_COPY.buyNow
          }
          icon={<BagLineIcon aria-hidden />}
          variant="primary"
          disabled={buyDisabled || !onBuy}
          loading={buyState === "loading"}
          onClick={onBuy}
        />
      </div>
    );
  }

  const statusBanner =
    mode === "declined"
      ? "Offer Declined"
      : mode === "expired"
        ? "Offer Expired"
        : negotiation?.statusLabel && mode !== "idle" && mode !== "seller_counter"
          ? negotiation.statusLabel
          : null;

  return (
    <div
      className={cn("pd-v1__action-bar pd-v1__action-bar--stack pd-v1__action-bar--offer", className)}
      data-pd-action-bar
      data-offer-action-mode={mode}
      data-product-action-bar-version={PRODUCT_ACTION_BAR_VERSION}
      data-ui-lock={PRODUCT_ACTION_BAR_UI_LOCK ? "production" : undefined}
      data-add-to-cart="removed-forever"
      role="toolbar"
      aria-label="Product actions"
    >
      {statusBanner ? <StatusCard title={statusBanner} /> : null}
      <div className="pd-v1__action-row" data-add-to-cart="removed-forever">
        {PRODUCT_ACTION_BUTTONS.map((button) => {
          if (button.id === "buy_now") {
            return (
              <ActionButton
                key={button.id}
                label={
                  buyState === "loading"
                    ? PRODUCT_ACTION_BAR_COPY.buyNowLoading
                    : PRODUCT_ACTION_BAR_COPY.buyNow
                }
                icon={<BagLineIcon aria-hidden />}
                variant="primary"
                disabled={buyDisabled || !onBuy}
                loading={buyState === "loading"}
                onClick={onBuy}
              />
            );
          }
          return (
            <ActionButton
              key={button.id}
              label={PRODUCT_ACTION_BAR_COPY.makeOffer}
              icon={<TagLineIcon aria-hidden />}
              variant="secondary"
              disabled={offerDisabled || !onMakeOffer}
              onClick={onMakeOffer}
            />
          );
        })}
      </div>
    </div>
  );
}
