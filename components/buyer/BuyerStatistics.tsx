"use client";

import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoIcons } from "@/lib/icons";
import { useBuyerDashboard } from "@/hooks/buyer";

export function BuyerStatistics() {
  const { data } = useBuyerDashboard();
  const { statistics } = data;

  const items = [
    { label: "Orders", value: statistics.orders, icon: RovexoIcons.orders.orders },
    { label: "Saved", value: statistics.saved, icon: RovexoIcons.actions.wishlist },
    { label: "Reviews", value: statistics.reviews, icon: RovexoIcons.actions.star },
    {
      label: "Protection",
      value: statistics.protectionActive ? "On" : "Off",
      icon: RovexoIcons.security.shield,
    },
  ];

  return (
    <div className="buyer-stats-grid">
      {items.map((item) => (
        <article key={item.label} className="buyer-stat-card">
          <RovexoIcon icon={item.icon} variant="category" />
          <p className="buyer-stat-card__value">{item.value}</p>
          <p className="buyer-stat-card__label">{item.label}</p>
        </article>
      ))}
    </div>
  );
}
