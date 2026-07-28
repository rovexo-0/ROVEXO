"use client";

import { AddressCard } from "@/features/account/components/addresses/AddressCard";
import type {
  AddressCardModel,
  AddressesBusinessProfile,
} from "@/features/account/components/addresses/types";
import type { UserAddress } from "@/lib/addresses/repository";
import { listTitleForScope } from "@/lib/addresses/canonical";

type BusinessAddressesProps = {
  addresses: UserAddress[];
  loading: boolean;
  businessProfile: AddressesBusinessProfile | null;
  onEdit: (address: UserAddress) => void;
};

export function BusinessAddresses({
  addresses,
  loading,
  businessProfile,
  onEdit,
}: BusinessAddressesProps) {
  return (
    <div className="addresses-v1-list" data-addresses-list="business">
      <p className="addresses-v1-label">{listTitleForScope("business")}</p>
      {loading ? <p className="addresses-v1-empty">Loading addresses…</p> : null}
      {!loading && !addresses.length ? (
        <p className="addresses-v1-empty">No saved addresses yet.</p>
      ) : null}
      {!loading && addresses.length ? (
        <div className="addresses-v1-list__cards">
          {addresses.map((address) => {
            const displayName =
              businessProfile?.businessName?.trim() ||
              address.recipientName ||
              "Business address";
            const model: AddressCardModel = {
              address,
              scope: "business",
              displayName,
              vatRegistered: businessProfile?.vatRegistered,
            };
            return (
              <AddressCard key={address.id} model={model} onEdit={() => onEdit(address)} />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
