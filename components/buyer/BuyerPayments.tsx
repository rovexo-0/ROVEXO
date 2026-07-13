"use client";

import Link from "next/link";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { BuyerSection } from "@/components/buyer/BuyerSection";
import { useBuyerDashboard } from "@/hooks/buyer";

export function BuyerPayments() {
  const { data } = useBuyerDashboard();

  return (
    <BuyerSection id="buyer-payments" title="Payment methods" href="/wallet/payment-methods">
      <div className="flex flex-col gap-4">
        {data.paymentMethods.map((method) => (
          <article key={method.id} className="buyer-payment-card">
            <RovexoIcon icon={method.icon} variant="category" />
            <div>
              <p className="buyer-list-card__title">{method.label}</p>
              <p className="buyer-list-card__meta">
                {method.connected ? `Connected${method.last4 ? ` · ${method.last4}` : ""}` : "Ready to add"}
              </p>
            </div>
          </article>
        ))}
        <Link href="/wallet/payment-methods" className="buyer-section__link">
          Manage payment methods
        </Link>
      </div>
    </BuyerSection>
  );
}
