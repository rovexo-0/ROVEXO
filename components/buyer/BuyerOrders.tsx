"use client";

import Image from "next/image";
import Link from "next/link";
import { BuyerEmptyState } from "@/components/buyer/BuyerEmptyState";
import { BuyerSection } from "@/components/buyer/BuyerSection";
import { useBuyerDashboard } from "@/hooks/buyer";

function orderProgress(status: string) {
  const steps = ["placed", "shipped", "delivered"] as const;
  const index =
    status === "awaiting_payment" || status === "awaiting_shipment"
      ? 0
      : status === "shipped"
        ? 1
        : 2;
  return steps.map((step, i) => ({ id: step, done: i <= index }));
}

export function BuyerOrders() {
  const { data } = useBuyerDashboard();
  const order = data.activeOrders[0];

  return (
    <BuyerSection id="buyer-active-orders" title="Active orders" href="/orders">
      {!order ? (
        <BuyerEmptyState title="No active orders" message="Your in-progress purchases will appear here." />
      ) : (
        <article className="buyer-order-active">
          <div className="buyer-order-active__row">
            <Image
              src={order.product.imageUrl}
              alt=""
              width={96}
              height={96}
              className="buyer-order-active__image"
            />
            <div className="min-w-0">
              <p className="buyer-order-active__title">{order.product.title}</p>
              <p className="buyer-order-active__meta">Order {order.orderNumber}</p>
              <span className="buyer-status-badge">{order.status.replaceAll("_", " ")}</span>
            </div>
          </div>
          <div className="buyer-progress" aria-hidden>
            {orderProgress(order.status).map((step) => (
              <div
                key={step.id}
                className={step.done ? "buyer-progress__step buyer-progress__step--done" : "buyer-progress__step"}
              />
            ))}
          </div>
          <Link href={`/orders/${order.id}`} className="buyer-hero__cta">
            Track order
          </Link>
        </article>
      )}
    </BuyerSection>
  );
}
