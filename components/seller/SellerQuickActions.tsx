"use client";

import Link from "next/link";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { useSellerDashboard } from "@/hooks/seller";

export function SellerQuickActions() {
  const { data } = useSellerDashboard();

  return (
    <div className="seller-quick-grid">
      {data.quickActions.map((action) => (
        <Link key={action.id} href={action.href} className="seller-quick-card">
          <span className="seller-icon-slot">
            <RovexoIcon icon={action.icon} variant="category" />
          </span>
          <p className="seller-quick-card__title">{action.title}</p>
          {typeof action.count === "number" ? (
            <p className="seller-quick-card__count">{action.count}</p>
          ) : null}
        </Link>
      ))}
    </div>
  );
}
