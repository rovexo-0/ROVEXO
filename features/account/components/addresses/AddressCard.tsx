"use client";

import { defaultBadgeForScope } from "@/lib/addresses/canonical";
import type { AddressCardModel } from "@/features/account/components/addresses/types";

type AddressCardProps = {
  model: AddressCardModel;
  onEdit: () => void;
};

/**
 * Address card — Edit only. Removal is handled by the Edit Address sheet.
 */
export function AddressCard({ model, onEdit }: AddressCardProps) {
  const { address, scope, displayName, vatRegistered } = model;
  const line1 = address.addressLine;
  const city = address.city?.trim() || null;
  const metaLine = [city, address.postcode, address.country].filter(Boolean).join(", ");
  const showDefault = address.isDefault;
  const showVat = scope === "business" && Boolean(vatRegistered);

  return (
    <article className="addresses-v1-card" data-addresses-card={scope}>
      <div className="addresses-v1-card__header">
        <p className="addresses-v1-card__name">{displayName}</p>
        <div className="addresses-v1-card__badges">
          {showDefault ? (
            <span className="addresses-v1-badge">{defaultBadgeForScope(scope)}</span>
          ) : null}
          {showVat ? (
            <span className="addresses-v1-badge addresses-v1-badge--vat">VAT Registered</span>
          ) : null}
        </div>
      </div>

      <div className="addresses-v1-card__body">
        <p className="addresses-v1-card__line">{line1}</p>
        <p className="addresses-v1-card__line">{metaLine}</p>
      </div>

      <div className="addresses-v1-card__actions">
        <button type="button" className="addresses-v1-card__action" onClick={onEdit}>
          Edit
        </button>
      </div>
    </article>
  );
}
