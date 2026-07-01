"use client";

import { SellerSection } from "@/components/seller/SellerSection";
import { useSellerDashboard } from "@/hooks/seller";

export function SellerListingsCard() {
  const { data } = useSellerDashboard();
  const breakdown = data.listingBreakdown;

  const items = [
    { label: "Active", value: breakdown.active },
    { label: "Draft", value: breakdown.draft },
    { label: "Pending approval", value: breakdown.pendingApproval },
    { label: "Rejected", value: breakdown.rejected },
    { label: "Expired", value: breakdown.expired },
    { label: "Sold", value: breakdown.sold },
    { label: "Boosted", value: breakdown.boosted },
  ];

  return (
    <SellerSection id="seller-listings" title="Listings" href="/seller/listings">
      <div className="seller-card">
        <div className="seller-metric-grid">
          {items.map((item) => (
            <div key={item.label} className="seller-metric">
              <p className="seller-metric__value">{item.value}</p>
              <p className="seller-metric__label">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </SellerSection>
  );
}
