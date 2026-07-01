"use client";

import Link from "next/link";
import { BuyerEmptyState } from "@/components/buyer/BuyerEmptyState";
import { BuyerSection } from "@/components/buyer/BuyerSection";
import { useBuyerDashboard } from "@/hooks/buyer";

export function BuyerAddresses() {
  const { data } = useBuyerDashboard();

  return (
    <BuyerSection id="buyer-addresses" title="Addresses" href="/account/addresses">
      {data.addresses.length === 0 ? (
        <BuyerEmptyState title="No saved addresses" message="Add shipping and billing addresses for faster checkout." />
      ) : (
        <div className="flex flex-col gap-4">
          {data.addresses.slice(0, 4).map((address) => (
            <article key={address.id} className="buyer-address-card">
              <p className="buyer-address-card__label">
                {address.addressType === "shipping" ? "Shipping" : "Billing"}
                {address.isDefault ? " · Default" : ""}
              </p>
              <p className="buyer-address-card__line">{address.recipientName}</p>
              <p className="buyer-address-card__line">
                {address.addressLine}
                {address.city ? `, ${address.city}` : ""} {address.postcode}
              </p>
            </article>
          ))}
          <Link href="/account/addresses" className="buyer-section__link">
            Edit addresses
          </Link>
        </div>
      )}
    </BuyerSection>
  );
}
