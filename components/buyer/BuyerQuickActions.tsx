"use client";

import Link from "next/link";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { useBuyerDashboard } from "@/hooks/buyer";

export function BuyerQuickActions() {
  const { data } = useBuyerDashboard();

  return (
    <div className="buyer-quick-grid">
      {data.quickActions.map((action) => (
        <Link key={action.id} href={action.href} className="buyer-quick-card">
          <RovexoIcon icon={action.icon} variant="category" />
          <p className="buyer-quick-card__title">{action.title}</p>
          {typeof action.count === "number" ? (
            <p className="buyer-quick-card__count">{action.count}</p>
          ) : null}
        </Link>
      ))}
    </div>
  );
}
