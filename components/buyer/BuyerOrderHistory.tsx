"use client";

import Image from "next/image";
import Link from "next/link";
import { BuyerEmptyState } from "@/components/buyer/BuyerEmptyState";
import { BuyerSection } from "@/components/buyer/BuyerSection";
import { useBuyerDashboard } from "@/hooks/buyer";

export function BuyerOrderHistory() {
  const { data } = useBuyerDashboard();

  return (
    <BuyerSection id="buyer-order-history" title="Order history" href="/orders">
      {data.orderHistory.length === 0 ? (
        <BuyerEmptyState title="No order history yet" />
      ) : (
        <div className="buyer-scroll">
          {data.orderHistory.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="buyer-order-history-card">
              <Image
                src={order.product.imageUrl}
                alt=""
                width={170}
                height={120}
                className="buyer-order-history-card__image"
              />
              <div className="buyer-order-history-card__body">
                <p className="buyer-order-history-card__title">{order.product.title}</p>
                <p className="buyer-order-history-card__meta">{order.status.replaceAll("_", " ")}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </BuyerSection>
  );
}
