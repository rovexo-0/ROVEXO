"use client";

import Link from "next/link";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { BuyerSection } from "@/components/buyer/BuyerSection";
import { useBuyerDashboard } from "@/hooks/buyer";

export function BuyerSettings() {
  const { data } = useBuyerDashboard();

  return (
    <BuyerSection id="buyer-settings" title="Settings" href="/account/settings">
      <div className="flex flex-col gap-3">
        {data.settingsLinks.map((item) => (
          <Link key={item.id} href={item.href} className="buyer-settings-row">
            <RovexoIcon icon={item.icon} variant="settings" />
            <span className="buyer-list-card__title">{item.label}</span>
          </Link>
        ))}
      </div>
    </BuyerSection>
  );
}
