"use client";

import Link from "next/link";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoIcons } from "@/lib/icons";
import { BuyerSection } from "@/components/buyer/BuyerSection";
import { useBuyerDashboard } from "@/hooks/buyer";

export function BuyerProtection() {
  const { data } = useBuyerDashboard();
  const { protection } = data;

  return (
    <BuyerSection id="buyer-protection" title="Purchase protection" href={protection.href}>
      <Link href={protection.href} className="buyer-protection">
        <RovexoIcon icon={RovexoIcons.security.shield} variant="category" />
        <h3 className="buyer-protection__title">{protection.coverageLabel}</h3>
        <p className="buyer-protection__copy">
          {protection.status === "claim_in_progress"
            ? `${protection.activeClaims} active claim(s) in progress.`
            : "Coverage, claims, and refunds are active on eligible orders."}
        </p>
      </Link>
    </BuyerSection>
  );
}
