"use client";

import { useSellerDashboard } from "@/hooks/seller";

function formatValue(value: number, format?: "currency" | "percent") {
  if (format === "currency") return `€${value.toLocaleString()}`;
  if (format === "percent") return `${value}%`;
  return value.toLocaleString();
}

export function SellerStatsGrid() {
  const { data } = useSellerDashboard();
  const { statistics } = data;

  const items = [
    { label: "Active listings", value: statistics.activeListings },
    { label: "Sold items", value: statistics.soldItems },
    { label: "Orders", value: statistics.orders },
    { label: "Revenue", value: statistics.revenue, format: "currency" as const },
    { label: "Pending payout", value: statistics.pendingPayout, format: "currency" as const },
    { label: "Followers", value: statistics.followers },
    { label: "Views", value: statistics.views },
    { label: "Favorites", value: statistics.favorites },
    { label: "Conversion", value: statistics.conversionRate, format: "percent" as const },
    { label: "Store score", value: statistics.storeScore },
  ];

  return (
    <div className="seller-stats-grid">
      {items.map((item) => (
        <article key={item.label} className="seller-stat-card">
          <p className="seller-stat-card__value">{formatValue(item.value, item.format)}</p>
          <p className="seller-stat-card__label">{item.label}</p>
        </article>
      ))}
    </div>
  );
}
