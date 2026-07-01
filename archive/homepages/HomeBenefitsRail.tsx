"use client";

import { memo } from "react";
import { DashboardIcon3D, type DashboardIconType } from "@/components/icons/DashboardIcon3D";
import { cn } from "@/lib/cn";

const PROMO_ITEMS: { label: string; icon: DashboardIconType }[] = [
  { label: "Zero Listing Fees", icon: "plans" },
  { label: "Boost Sales", icon: "analytics" },
  { label: "Secure Payments", icon: "payment" },
  { label: "Sell with Confidence", icon: "trust" },
];

type HomeBenefitsRailProps = {
  className?: string;
};

export const HomeBenefitsRail = memo(function HomeBenefitsRail({ className }: HomeBenefitsRailProps) {
  return (
    <section aria-label="ROVEXO promo benefits" className={cn("rx-promo-row-section px-ds-4", className)}>
      <div className="rx-promo-row" role="list">
        {PROMO_ITEMS.map((item) => (
          <div key={item.label} className="rx-promo-card" role="listitem">
            <span className="rx-promo-card__icon" aria-hidden>
              <DashboardIcon3D type={item.icon} size={32} />
            </span>
            <span className="rx-promo-card__label">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
});
