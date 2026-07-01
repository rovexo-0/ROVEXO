"use client";

import { useBuyerDashboard } from "@/hooks/buyer";

export function BuyerTrustCard() {
  const { data } = useBuyerDashboard();
  if (!data.trust) return null;

  return (
    <div className="buyer-card">
      <p className="buyer-stat-card__label">Buyer trust</p>
      <p className="buyer-stat-card__value">{data.trust.score.score}</p>
      <p className="buyer-order-active__meta">Tier {data.trust.progress.current}</p>
    </div>
  );
}
