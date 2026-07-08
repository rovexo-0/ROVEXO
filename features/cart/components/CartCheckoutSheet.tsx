"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Truck, Lock } from "lucide-react";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { formatListingPrice } from "@/lib/listing-card/format";
import { getAvailablePaymentMethods } from "@/lib/checkout/payment";

type CartCheckoutSheetProps = {
  open: boolean;
  onClose: () => void;
  subtotal: number;
  delivery: number;
  protectionFee: number;
  total: number;
  checkoutSlug?: string;
};

function detectMobilePlatform() {
  if (typeof navigator === "undefined") {
    return { isIOS: false, isAndroid: false };
  }
  const ua = navigator.userAgent;
  return {
    isIOS: /iPhone|iPad|iPod/i.test(ua),
    isAndroid: /Android/i.test(ua),
  };
}

export function CartCheckoutSheet({
  open,
  onClose,
  subtotal,
  delivery,
  protectionFee,
  total,
  checkoutSlug,
}: CartCheckoutSheetProps) {
  const router = useRouter();
  const [{ isIOS, isAndroid }] = useState(detectMobilePlatform);
  const methods = useMemo(() => getAvailablePaymentMethods({ isIOS, isAndroid }), [isIOS, isAndroid]);

  if (!open) return null;

  const goCheckout = () => {
    if (!checkoutSlug) return;
    onClose();
    router.push(`/checkout/${checkoutSlug}`);
  };

  return (
    <div className="cart-v1__sheet-overlay" role="presentation" onClick={onClose}>
      <div
        className="cart-v1__sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Checkout summary"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="cart-v1__sheet-grabber" aria-hidden />
        <button type="button" className={cn("cart-v1__sheet-close", focusRing)} aria-label="Close" onClick={onClose}>
          ×
        </button>

        <div className="cart-v1__sheet-lines">
          <div className="cart-v1__summary-row">
            <span>Subtotal</span>
            <span>{formatListingPrice(subtotal)}</span>
          </div>
          <div className="cart-v1__summary-row">
            <span>Delivery</span>
            <span>{formatListingPrice(delivery)}</span>
          </div>
          <div className="cart-v1__summary-row">
            <span>Platform Fee</span>
            <span>{formatListingPrice(protectionFee)}</span>
          </div>
        </div>

        <p className="cart-v1__sheet-total">{formatListingPrice(total)}</p>

        <button
          type="button"
          className="cart-v1__sheet-primary"
          disabled={!checkoutSlug}
          onClick={goCheckout}
        >
          <Lock className="h-4 w-4" aria-hidden />
          Checkout Securely
        </button>

        <div className="cart-v1__sheet-or">
          <span />
          <span>or</span>
          <span />
        </div>

        {methods.some((m) => m.id === "apple_pay") ? (
          <button type="button" className="cart-v1__sheet-apple" disabled={!checkoutSlug} onClick={goCheckout}>
            Buy with Apple Pay
          </button>
        ) : null}
        {methods.some((m) => m.id === "google_pay") ? (
          <button type="button" className="cart-v1__sheet-google" disabled={!checkoutSlug} onClick={goCheckout}>
            Buy with Google Pay
          </button>
        ) : null}
        <button type="button" className="cart-v1__sheet-card" disabled={!checkoutSlug} onClick={goCheckout}>
          Pay by Card
        </button>

        <ul className="cart-v1__sheet-trust">
          <li>
            <Truck className="h-4 w-4" aria-hidden />
            Free delivery on orders over £50
          </li>
          <li>
            <Shield className="h-4 w-4" aria-hidden />
            30-day returns. Purchase protection
          </li>
          <li>
            <Lock className="h-4 w-4" aria-hidden />
            Secure payments. 100% safe
          </li>
        </ul>
      </div>
    </div>
  );
}
