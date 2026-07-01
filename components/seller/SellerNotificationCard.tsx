"use client";

import Link from "next/link";
import { SellerSection } from "@/components/seller/SellerSection";
import { useSellerDashboard } from "@/hooks/seller";

export function SellerNotificationCard() {
  const { data } = useSellerDashboard();
  const { notifications } = data;

  return (
    <SellerSection id="seller-notifications" title="Notifications" href="/notifications">
      <div className="seller-card">
        <div className="seller-metric-grid">
          <div className="seller-metric"><p className="seller-metric__value">{notifications.orders}</p><p className="seller-metric__label">Orders</p></div>
          <div className="seller-metric"><p className="seller-metric__value">{notifications.payments}</p><p className="seller-metric__label">Payments</p></div>
          <div className="seller-metric"><p className="seller-metric__value">{notifications.reviews}</p><p className="seller-metric__label">Reviews</p></div>
          <div className="seller-metric"><p className="seller-metric__value">{notifications.platform}</p><p className="seller-metric__label">Platform</p></div>
          <div className="seller-metric"><p className="seller-metric__value">{notifications.security}</p><p className="seller-metric__label">Security</p></div>
        </div>
      </div>
      {notifications.latest.map((notification) => (
        <Link key={notification.id} href={notification.href} className="seller-list-row">
          <div className="min-w-0">
            <p className="seller-list-row__title">{notification.title}</p>
            <p className="seller-list-row__meta">{notification.subtitle}</p>
          </div>
        </Link>
      ))}
    </SellerSection>
  );
}
