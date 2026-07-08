"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type AddedToCartToastProps = {
  open: boolean;
  onDismiss: () => void;
  autoHideMs?: number;
  cartHref?: string;
};

export function AddedToCartToast({
  open,
  onDismiss,
  autoHideMs = 4500,
  cartHref = "/cart",
}: AddedToCartToastProps) {
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(onDismiss, autoHideMs);
    return () => window.clearTimeout(timer);
  }, [open, autoHideMs, onDismiss]);

  if (!open) return null;

  return (
    <div
      className="pd-v1__cart-toast-layer"
      role="presentation"
      onClick={onDismiss}
    >
      <div
        className="pd-v1__cart-toast"
        role="status"
        aria-live="polite"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="pd-v1__cart-toast-title">
          <span className="pd-v1__cart-toast-check" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M6 12.5 10 16.5 18 8"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Added to your cart
        </p>

        <button
          type="button"
          className="pd-v1__cart-toast-btn"
          onClick={() => {
            onDismiss();
            router.push(cartHref);
          }}
        >
          View Your Cart
        </button>
      </div>
    </div>
  );
}
