"use client";

import { formatListingPrice } from "@/lib/listing-card/format";
import { calculatePlatformFee } from "@/lib/orders/pricing";

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
  onClose: () => void;
};

/** Locked Platform Fee sheet — Transaction Hub v1.0 FINAL. */
export function PlatformFeeSheet({ open, itemPrice, onClose }: PlatformFeeSheetProps) {
  if (!open) return null;

  const platformFee = calculatePlatformFee(itemPrice);
  const total = Math.round((itemPrice + platformFee) * 100) / 100;

  return (
    <div className="conv-hub__fee-sheet" role="dialog" aria-modal="true" aria-labelledby="conv-hub-fee-title">
      <button type="button" className="conv-hub__fee-backdrop" aria-label="Close Platform Fee" onClick={onClose} />
      <div className="conv-hub__fee-panel">
        <h2 id="conv-hub-fee-title" className="conv-hub__fee-title">
          PLATFORM FEE
        </h2>
        <p className="conv-hub__fee-lead">
          The Platform Fee helps us maintain and improve ROVEXO and supports the services that make
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
            <span>Platform fee</span>
            <span>{formatListingPrice(platformFee)}</span>
          </div>
          <div className="conv-hub__fee-row conv-hub__fee-row--total">
            <span>TOTAL</span>
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
