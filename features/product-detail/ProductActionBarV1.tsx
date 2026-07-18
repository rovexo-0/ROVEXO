"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  PRODUCT_ACTION_BAR_COPY,
  PRODUCT_ACTION_BAR_UI_LOCK,
  PRODUCT_ACTION_BAR_VERSION,
  PRODUCT_ACTION_BUTTONS,
  PRODUCT_ACTION_BAR_VISUAL,
  type ProductActionButtonState,
} from "@/lib/transaction-hub/product-action-bar";
import type { TransactionMode } from "@/lib/transaction-mode/types";
import { isDirectContactMode } from "@/lib/transaction-mode/capabilities";
import {
  BagLineIcon,
  CartLineIcon,
  CheckLineIcon,
  TagLineIcon,
} from "@/components/icons/RvxLineIcons";

type ProductActionBarV1Props = {
  transactionMode: TransactionMode;
  onBuy?: () => void;
  onAddToCart?: () => void;
  onMakeOffer?: () => void;
  onContact?: () => void;
  buyDisabled?: boolean;
  cartDisabled?: boolean;
  offerDisabled?: boolean;
  buyState?: "idle" | "loading";
  cartState?: ProductActionButtonState;
  className?: string;
};

type ActionButtonProps = {
  label: string;
  icon: ReactNode;
  variant: "primary" | "secondary" | "offer";
  disabled?: boolean;
  loading?: boolean;
  success?: boolean;
  inCart?: boolean;
  onClick?: () => void;
  className?: string;
};

function ActionButton({
  label,
  icon,
  variant,
  disabled,
  loading,
  success,
  inCart,
  onClick,
  className,
}: ActionButtonProps) {
  const showSpinner = loading;
  const showCheck = success || inCart;

  return (
    <button
      type="button"
      className={cn(
        "pd-v1__action-btn",
        variant === "primary" && "pd-v1__action-btn--buy",
        variant === "secondary" && "pd-v1__action-btn--cart",
        variant === "offer" && "pd-v1__action-btn--offer",
        loading && "pd-v1__action-btn--loading",
        success && "pd-v1__action-btn--success",
        inCart && "pd-v1__action-btn--in-cart",
        className,
      )}
      disabled={disabled || loading || inCart}
      onClick={onClick}
      aria-label={label}
      aria-busy={loading || undefined}
    >
      <span className="pd-v1__action-btn-inner">
        <span className="pd-v1__action-icon" aria-hidden>
          {showSpinner ? (
            <span className="pd-v1__action-spinner" aria-hidden />
          ) : showCheck ? (
            <CheckLineIcon aria-hidden />
          ) : (
            icon
          )}
        </span>
        <span className="pd-v1__action-label">{label}</span>
      </span>
    </button>
  );
}

export function ProductActionBarV1({
  transactionMode,
  onBuy,
  onAddToCart,
  onMakeOffer,
  onContact,
  buyDisabled = false,
  cartDisabled = false,
  offerDisabled = false,
  buyState = "idle",
  cartState = "idle",
  className,
}: ProductActionBarV1Props) {
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

  const cartLabel =
    cartState === "in_cart"
      ? PRODUCT_ACTION_BAR_COPY.inCart
      : cartState === "success"
        ? PRODUCT_ACTION_BAR_COPY.addedToCart
        : PRODUCT_ACTION_BAR_COPY.addToCart;

  return (
    <div
      className={cn("pd-v1__action-bar", className)}
      data-pd-action-bar
      data-product-action-bar-version={PRODUCT_ACTION_BAR_VERSION}
      data-ui-lock={PRODUCT_ACTION_BAR_UI_LOCK ? "production" : undefined}
      role="toolbar"
      aria-label="Product actions"
    >
      {PRODUCT_ACTION_BUTTONS.map((button) => {
        if (button.id === "buy_now") {
          return (
            <ActionButton
              key={button.id}
              label={PRODUCT_ACTION_BAR_COPY.buyNow}
              icon={<BagLineIcon aria-hidden />}
              variant="primary"
              disabled={buyDisabled || !onBuy}
              loading={buyState === "loading"}
              onClick={onBuy}
              className="pd-v1__action-btn--buy"
            />
          );
        }
        if (button.id === "add_to_cart") {
          return (
            <ActionButton
              key={button.id}
              label={cartLabel}
              icon={<CartLineIcon aria-hidden />}
              variant="secondary"
              disabled={cartDisabled || !onAddToCart}
              loading={cartState === "loading"}
              success={cartState === "success"}
              inCart={cartState === "in_cart"}
              onClick={onAddToCart}
              className="pd-v1__action-btn--cart"
            />
          );
        }
        return (
          <ActionButton
            key={button.id}
            label={PRODUCT_ACTION_BAR_COPY.makeOffer}
            icon={<TagLineIcon aria-hidden />}
            variant="offer"
            disabled={offerDisabled || !onMakeOffer}
            onClick={onMakeOffer}
            className="pd-v1__action-btn--offer"
          />
        );
      })}
    </div>
  );
}
