/**
 * Addresses v1.0 — canonical labels + storage type map (SSOT).
 * Personal ↔ shipping · Business ↔ billing (no schema rename).
 */

export const ADDRESSES_UI_VERSION = "v1.0-ui-lock" as const;

export type AddressUiScope = "personal" | "business";
export type AddressStorageType = "shipping" | "billing";

export const ADDRESS_SCOPE_TO_STORAGE: Record<AddressUiScope, AddressStorageType> = {
  personal: "shipping",
  business: "billing",
};

export const ADDRESS_STORAGE_TO_SCOPE: Record<AddressStorageType, AddressUiScope> = {
  shipping: "personal",
  billing: "business",
};

export function listTitleForScope(scope: AddressUiScope): string {
  return scope === "personal" ? "Personal Addresses" : "Business Addresses";
}

export function addCtaLabelForScope(scope: AddressUiScope): string {
  return scope === "personal" ? "Add Address" : "Add Business Address";
}

export function defaultBadgeForScope(scope: AddressUiScope): string {
  return scope === "personal" ? "Default" : "Default Business";
}

export function nameFieldLabelForScope(scope: AddressUiScope): string {
  return scope === "personal" ? "Name" : "Company name";
}
