"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import { SellerSection } from "@/components/seller/SellerSection";
import { useSellerDashboard } from "@/hooks/seller";
import { formatCurrency } from "@/lib/wallet/utils";

export function SellerAnalyticsCard() {
  const { data } = useSellerDashboard();
  const { analytics } = data;

  return (
    <SellerSection id="seller-analytics" title="Analytics" href="/seller/analytics">
      <div className="seller-card">
        <p className="seller-stat-card__label">{analytics.rangeLabel}</p>
        <div className="seller-metric-grid">
          <div className="seller-metric"><p className="seller-metric__value">{formatCurrency(analytics.revenue)}</p><p className="seller-metric__label">Revenue</p></div>
          <div className="seller-metric"><p className="seller-metric__value">{analytics.views.toLocaleString()}</p><p className="seller-metric__label">Views</p></div>
          <div className="seller-metric"><p className="seller-metric__value">{analytics.ctr}%</p><p className="seller-metric__label">CTR</p></div>
          <div className="seller-metric"><p className="seller-metric__value">{analytics.conversion}%</p><p className="seller-metric__label">Conversion</p></div>
          <div className="seller-metric"><p className="seller-metric__value">{analytics.visitors.toLocaleString()}</p><p className="seller-metric__label">Visitors</p></div>
          <div className="seller-metric"><p className="seller-metric__value">{analytics.sales.toLocaleString()}</p><p className="seller-metric__label">Sales</p></div>
        </div>
      </div>
      {analytics.topListings.slice(0, 3).map((listing) => (
        <div key={listing.id} className="seller-list-row">
          <SafeImage src={listing.imageUrl} alt="" width={48} height={48} className="rounded-xl object-cover" />
          <div className="min-w-0">
            <p className="seller-list-row__title">{listing.title}</p>
            <p className="seller-list-row__meta">{formatCurrency(listing.revenue)} · {listing.orders} orders</p>
          </div>
        </div>
      ))}
      {analytics.topCategories.slice(0, 3).map((category) => (
        <div key={category.id} className="seller-list-row">
          <div className="min-w-0">
            <p className="seller-list-row__title">{category.label}</p>
            <p className="seller-list-row__meta">{category.value.toLocaleString()} views</p>
          </div>
        </div>
      ))}
    </SellerSection>
  );
}
