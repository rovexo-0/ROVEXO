"use client";

import { useEffect, useRef } from "react";
import { formatListingPrice } from "@/lib/listing-card/format";
import { calculatePlatformFee } from "@/lib/orders/pricing";
import { useFocusTrap } from "@/hooks/use-focus-trap";

const PLATFORM_FEE_POINTS = [
  "Secure payments",
  "Fraud prevention systems",
  "Escrow transaction protection",
  "Shipping integrations",
  "Tracking services",
  "Customer support",
  "Dispute resolution",
  "Platform maintenance",
  "Continuous improvements",
  "New platform features",
] as const;

type PlatformFeeSheetProps = {
  open: boolean;
  itemPrice: number;
  /** Buyer shipping — omit or pending until checkout selects delivery. */
  shippingPrice?: number | null;
  shippingPending?: boolean;
  platformFee?: number | null;
  total?: number | null;
  onClose: () => void;
};

/**
 * Locked Platform Fee sheet — Conversation Hub Sprint 1 FREEZE.
 * Buyer-only: Item + Shipping + Platform Fee = Total.
 * Never mount for seller viewers.
 */
export function PlatformFeeSheet({
  open,
  itemPrice,
  shippingPrice = null,
  shippingPending = true,
  platformFee: platformFeeOverride = null,
  total: totalOverride = null,
  onClose,
}: PlatformFeeSheetProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(open, dialogRef);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const platformFee =
    platformFeeOverride != null && platformFeeOverride >= 0
      ? platformFeeOverride
      : calculatePlatformFee(itemPrice);
  const shipping = shippingPending || shippingPrice == null ? null : shippingPrice;
  const total =
    totalOverride != null && totalOverride > 0
      ? totalOverride
      : Math.round((itemPrice + platformFee + (shipping ?? 0)) * 100) / 100;

  return (
    <div
      ref={dialogRef}
      className="conv-hub__fee-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="conv-hub-fee-title"
    >
      <button type="button" className="conv-hub__fee-backdrop" aria-label="Close Buyer Protection" onClick={onClose} />
      <div className="conv-hub__fee-panel">
        <h2 id="conv-hub-fee-title" className="conv-hub__fee-title">
          BUYER PROTECTION
        </h2>
        <p className="conv-hub__fee-lead">
          Buyer Protection helps us maintain and improve ROVEXO and supports the services that make
          transactions safer, faster and more reliable.
        </p>
        <p className="conv-hub__fee-lead">Your contribution supports</p>
        <ul className="conv-hub__fee-list">
          {PLATFORM_FEE_POINTS.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <div className="conv-hub__fee-rows" aria-label="Price breakdown">
          <div className="conv-hub__fee-row">
            <span>Item price</span>
            <span>{formatListingPrice(itemPrice)}</span>
          </div>
          <div className="conv-hub__fee-row">
            <span>Shipping</span>
            <span>{shipping == null ? "At checkout" : formatListingPrice(shipping)}</span>
          </div>
          <div className="conv-hub__fee-row">
            <span>Buyer Protection</span>
            <span>{formatListingPrice(platformFee)}</span>
          </div>
          <div className="conv-hub__fee-row conv-hub__fee-row--total">
            <span>Total buyer pays</span>
            <span>{formatListingPrice(total)}</span>
          </div>
        </div>
        <button type="button" className="conv-hub__fee-ok" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}
