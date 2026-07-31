"use client";

import { cn } from "@/lib/cn";
import type { AddressUiScope } from "@/lib/addresses/canonical";
import { resolveBusinessAddressesVisibility } from "@/lib/master-engine";

type AddressesTabsProps = {
  activeScope: AddressUiScope;
  onChange: (scope: AddressUiScope) => void;
};

/**
 * Address Type · Personal only in v1.0 (Phase C).
 * BusinessAddresses components remain for v2.0 — tab hidden when Business UX removed.
 */
export function AddressesTabs({ activeScope, onChange }: AddressesTabsProps) {
  const showBusiness = resolveBusinessAddressesVisibility().showBusinessAddressesTab;

  if (!showBusiness) {
    return null;
  }

  return (
    <div className="addresses-v1-tabs-block" data-addresses-tabs="v1">
      <p className="addresses-v1-label">Address Type</p>
      <div className="addresses-v1-tabs" role="tablist" aria-label="Address type">
        <button
          type="button"
          role="tab"
          aria-selected={activeScope === "personal"}
          className={cn(
            "addresses-v1-tabs__option",
            activeScope === "personal" && "addresses-v1-tabs__option--active",
          )}
          onClick={() => onChange("personal")}
        >
          Personal
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeScope === "business"}
          className={cn(
            "addresses-v1-tabs__option",
            activeScope === "business" && "addresses-v1-tabs__option--active",
          )}
          onClick={() => onChange("business")}
        >
          Business
        </button>
      </div>
    </div>
  );
}
