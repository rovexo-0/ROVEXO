"use client";

import { AddressCard } from "@/features/account/components/addresses/AddressCard";
import type { AddressCardModel } from "@/features/account/components/addresses/types";
import type { UserAddress } from "@/lib/addresses/repository";
import { listTitleForScope } from "@/lib/addresses/canonical";

type PersonalAddressesProps = {
  addresses: UserAddress[];
  loading: boolean;
  onEdit: (address: UserAddress) => void;
};

export function PersonalAddresses({ addresses, loading, onEdit }: PersonalAddressesProps) {
  return (
    <div className="addresses-v1-list" data-addresses-list="personal">
      <p className="addresses-v1-label">{listTitleForScope("personal")}</p>
      {loading ? <p className="addresses-v1-empty">Loading addresses…</p> : null}
      {!loading && !addresses.length ? (
        <p className="addresses-v1-empty">No saved addresses yet.</p>
      ) : null}
      {!loading && addresses.length ? (
        <div className="addresses-v1-list__cards">
          {addresses.map((address) => {
            const model: AddressCardModel = {
              address,
              scope: "personal",
              displayName: address.recipientName,
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
