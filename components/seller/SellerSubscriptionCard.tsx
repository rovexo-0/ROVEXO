"use client";

import Link from "next/link";
import { SellerSection } from "@/components/seller/SellerSection";
import { useSellerDashboard } from "@/hooks/seller";

export function SellerSubscriptionCard() {
  const { data } = useSellerDashboard();
  const { subscription } = data;

  return (
    <SellerSection id="seller-subscription" title="Subscription" href={subscription.href}>
      <div className="seller-card">
        <p className="seller-list-row__title">{subscription.planLabel}</p>
        <p className="seller-list-row__meta">Status: {subscription.status}</p>
        <p className="seller-list-row__meta">Premium plans architecture hook — no billing engine yet.</p>
        <Link href={subscription.href} className="seller-section__link seller-section__link--inline">
          View plans
        </Link>
      </div>
    </SellerSection>
  );
}
