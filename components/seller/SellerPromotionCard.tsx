"use client";

import Link from "next/link";
import { SellerSection } from "@/components/seller/SellerSection";
import { useSellerDashboard } from "@/hooks/seller";

export function SellerPromotionCard() {
  const { data } = useSellerDashboard();
  const { promotion } = data;

  return (
    <SellerSection id="seller-promotion" title="Promotion" href="/seller/listings">
      <div className="seller-card">
        <div className="seller-metric-grid">
          <div className="seller-metric"><p className="seller-metric__value">{promotion.featuredCount}</p><p className="seller-metric__label">Featured</p></div>
          <div className="seller-metric"><p className="seller-metric__value">{promotion.bumpCount}</p><p className="seller-metric__label">Boosted</p></div>
          <div className="seller-metric"><p className="seller-metric__value">{promotion.campaignStatus}</p><p className="seller-metric__label">Campaign</p></div>
          <div className="seller-metric"><p className="seller-metric__value">{promotion.activeCount}</p><p className="seller-metric__label">Active promos</p></div>
        </div>
        <p className="seller-promotion__note">
          Promote Engine ready — boost and featured hooks only.
        </p>
      </div>
      {promotion.active.slice(0, 2).map((item) => (
        <Link key={`${item.productId}-${item.type}`} href="/seller/listings" className="seller-list-row">
          <div className="min-w-0">
            <p className="seller-list-row__title">{item.title}</p>
            <p className="seller-list-row__meta">{item.type} · ends {new Date(item.endsAt).toLocaleDateString()}</p>
          </div>
        </Link>
      ))}
    </SellerSection>
  );
}
