"use client";

import { SellerSection } from "@/components/seller/SellerSection";
import { useSellerDashboard } from "@/hooks/seller";
import { formatCurrency } from "@/lib/wallet/utils";

export function SellerPerformanceCard() {
  const { data } = useSellerDashboard();
  const { performance } = data.analytics;

  return (
    <SellerSection id="seller-performance" title="Performance" href="/seller/analytics">
      <div className="seller-card">
        <div className="seller-metric-grid">
          {performance.metrics.map((metric) => (
            <div key={metric.id} className="seller-metric">
              <p className="seller-metric__value">
                {metric.format === "currency"
                  ? formatCurrency(performance.totals[metric.id] ?? 0)
                  : (performance.totals[metric.id] ?? 0).toLocaleString()}
              </p>
              <p className="seller-metric__label">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>
    </SellerSection>
  );
}
