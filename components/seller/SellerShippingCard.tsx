"use client";

import { SellerSection } from "@/components/seller/SellerSection";
import { useSellerDashboard } from "@/hooks/seller";

export function SellerShippingCard() {
  const { data } = useSellerDashboard();
  const { shipping } = data;

  return (
    <SellerSection id="seller-shipping" title="Shipping" href="/account/seller/shipping">
      <div className="seller-card">
        <div className="seller-metric-grid">
          <div className="seller-metric">
            <p className="seller-metric__value">{shipping.defaultCarrier}</p>
            <p className="seller-metric__label">Connected carrier</p>
          </div>
          <div className="seller-metric">
            <p className="seller-metric__value">{shipping.dispatchTimeDays}d</p>
            <p className="seller-metric__label">Processing time</p>
          </div>
          <div className="seller-metric">
            <p className="seller-metric__value">{shipping.shipsTo}</p>
            <p className="seller-metric__label">Ships to</p>
          </div>
          <div className="seller-metric">
            <p className="seller-metric__value">{shipping.localPickupEnabled ? "Yes" : "No"}</p>
            <p className="seller-metric__label">Collection</p>
          </div>
        </div>
      </div>
    </SellerSection>
  );
}
