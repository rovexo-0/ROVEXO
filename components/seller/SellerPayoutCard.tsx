"use client";

import { SellerSection } from "@/components/seller/SellerSection";
import { useSellerDashboard } from "@/hooks/seller";

export function SellerPayoutCard() {
  const { data } = useSellerDashboard();
  const { wallet } = data;

  return (
    <SellerSection id="seller-payout" title="Payouts" href="/seller/wallet">
      <div className="seller-card">
        <div className="seller-metric-grid">
          <div className="seller-metric">
            <p className="seller-metric__value">€{wallet.availableBalance.toLocaleString()}</p>
            <p className="seller-metric__label">Available payout</p>
          </div>
          <div className="seller-metric">
            <p className="seller-metric__value">{wallet.connectStatus.connected ? "Connected" : "Not connected"}</p>
            <p className="seller-metric__label">Stripe status</p>
          </div>
        </div>
      </div>
    </SellerSection>
  );
}
