"use client";

import Image from "next/image";
import Link from "next/link";
import { SellerEmptyState } from "@/components/seller/SellerEmptyState";
import { SellerSection } from "@/components/seller/SellerSection";
import { useSellerDashboard } from "@/hooks/seller";
import { formatCurrency } from "@/lib/wallet/utils";

export function SellerRecentActivity() {
  const { data } = useSellerDashboard();

  return (
    <SellerSection id="seller-recent-activity" title="Recent activity" href="/seller/orders">
      {data.recentActivity.length === 0 ? (
        <SellerEmptyState title="No recent activity" message="Orders and store events will show here." />
      ) : (
        data.recentActivity.map((order) => (
          <Link key={order.id} href={order.href} className="seller-list-row">
            <Image src={order.productImageUrl} alt="" width={48} height={48} className="rounded-xl object-cover" />
            <div className="min-w-0">
              <p className="seller-list-row__title">{order.productTitle}</p>
              <p className="seller-list-row__meta">{formatCurrency(order.price)} · {order.status.replaceAll("_", " ")}</p>
            </div>
          </Link>
        ))
      )}
    </SellerSection>
  );
}
