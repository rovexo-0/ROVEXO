"use client";

import Image from "next/image";
import Link from "next/link";
import { SellerEmptyState } from "@/components/seller/SellerEmptyState";
import { SellerSection } from "@/components/seller/SellerSection";
import { useSellerDashboard } from "@/hooks/seller";

export function SellerOrdersCard() {
  const { data } = useSellerDashboard();
  const order = data.orders[0];
  const breakdown = data.orderBreakdown;

  return (
    <SellerSection id="seller-orders" title="Orders" href="/seller/orders">
      <div className="seller-card">
        <div className="seller-metric-grid">
          <div className="seller-metric"><p className="seller-metric__value">{breakdown.new}</p><p className="seller-metric__label">New</p></div>
          <div className="seller-metric"><p className="seller-metric__value">{breakdown.processing}</p><p className="seller-metric__label">Processing</p></div>
          <div className="seller-metric"><p className="seller-metric__value">{breakdown.shipped}</p><p className="seller-metric__label">Shipped</p></div>
          <div className="seller-metric"><p className="seller-metric__value">{breakdown.delivered}</p><p className="seller-metric__label">Delivered</p></div>
          <div className="seller-metric"><p className="seller-metric__value">{breakdown.cancelled}</p><p className="seller-metric__label">Cancelled</p></div>
          <div className="seller-metric"><p className="seller-metric__value">{breakdown.returns}</p><p className="seller-metric__label">Returns</p></div>
        </div>
      </div>
      {!order ? (
        <SellerEmptyState title="No orders yet" message="New seller orders will appear here." />
      ) : (
        <Link href={`/seller/orders/${order.id}`} className="seller-list-row">
          <Image src={order.product.imageUrl} alt="" width={56} height={56} className="rounded-2xl object-cover" />
          <div className="min-w-0">
            <p className="seller-list-row__title">{order.product.title}</p>
            <p className="seller-list-row__meta">Order {order.orderNumber} · {order.status.replaceAll("_", " ")}</p>
          </div>
        </Link>
      )}
    </SellerSection>
  );
}
