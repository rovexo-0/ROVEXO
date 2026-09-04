"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";

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
            <PlatformEmoji emoji={PLATFORM_EMOJI.check} size={14} />
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
