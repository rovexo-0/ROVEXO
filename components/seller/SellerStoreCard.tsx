"use client";

import Link from "next/link";
import { SellerSection } from "@/components/seller/SellerSection";
import { useSellerDashboard } from "@/hooks/seller";

export function SellerStoreCard() {
  const { data } = useSellerDashboard();
  const { store } = data;

  return (
    <SellerSection id="seller-store" title="Store" href={store.storeHref}>
      <div className="seller-card">
        <p className="seller-list-row__title">{store.storeName}</p>
        <p className="seller-list-row__meta">{store.description}</p>
        <p className="seller-list-row__meta">Return policy: {store.returnPolicyDays} days</p>
        <Link href={store.storeHref} className="seller-section__link seller-section__link--inline">
          View store profile
        </Link>
      </div>
    </SellerSection>
  );
}
