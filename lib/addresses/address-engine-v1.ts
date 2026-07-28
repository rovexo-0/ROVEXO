/**
 * ROVEXO ADDRESS ENGINE v1.0 — PERMANENT PLATFORM RULE
 *
 * Postcode = lookup key only.
 * Address entity = unique identifier.
 * Unlimited addresses per user / per postcode / per city / per county.
 * No module may limit or reject by postcode uniqueness.
 */

export const ADDRESS_ENGINE_NAME = "ROVEXO ADDRESS ENGINE" as const;
export const ADDRESS_ENGINE_VERSION = "1.0" as const;
export const ADDRESS_ENGINE_STATUS = "PERMANENTLY LOCKED" as const;
export const ADDRESS_ENGINE_DOM = "v1.0-address-engine-lock" as const;

/** Postcode is never the unique key. */
export const ADDRESS_ENGINE_POSTCODE_ROLE = "LOOKUP_ONLY" as const;

/** Fields that identify one saved address entity (duplicate detection). */
export const ADDRESS_ENGINE_ENTITY_KEYS = [
  "addressLine",
  "addressLine2",
  "city",
  "postcode",
  "country",
  "addressType",
] as const;

export const ADDRESS_ENGINE_DEFAULTS = {
  maxDefaultPersonal: 1,
  maxDefaultBusiness: 1,
  unlimitedAddressesPerUser: true,
  unlimitedAddressesPerPostcode: true,
  samePostcodeMultipleAddressesAllowed: true,
} as const;

export const ADDRESS_ENGINE_SURFACES = [
  "ACCOUNT / Personal Addresses",
  "ACCOUNT / Business Addresses",
  "CHECKOUT / Billing",
  "CHECKOUT / Shipping",
  "CHECKOUT / Delivery",
  "SELLER / Collection",
  "SELLER / Return",
  "SELLER / Warehouse",
  "SELLER / Business",
  "ORDERS / Delivery",
  "ORDERS / Collection",
  "ORDERS / Return",
  "RETURNS / Return",
  "RETURNS / Warehouse",
  "RETURNS / Collection",
  "SENDCLOUD / Sender",
  "SENDCLOUD / Return",
  "SENDCLOUD / Warehouse",
  "SENDCLOUD / Delivery",
  "STRIPE / Business",
  "STRIPE / Individual",
  "STRIPE / Billing",
  "BUSINESS ACCOUNT / Registered",
  "BUSINESS ACCOUNT / Office",
  "BUSINESS ACCOUNT / Warehouse",
  "BUSINESS ACCOUNT / Returns",
  "ADMIN / Seller Addresses",
  "ADMIN / Buyer Addresses",
  "ADMIN / Business Addresses",
] as const;

export const ADDRESS_ENGINE_FORBIDDEN = [
  "limit addresses by postcode",
  "assume one postcode means one address",
  "restrict multiple addresses sharing the same postcode",
  "reject valid UK addresses because another address already uses that postcode",
  "use postcode as unique identifier",
] as const;

export const ADDRESS_ENGINE_LOOKUP_STEPS = [
  "validate postcode",
  "perform UK postcode lookup",
  "retrieve ALL available addresses",
  "display ALL found addresses",
  "allow user address selection",
  "auto populate fields",
  "allow user modifications",
  "save address",
] as const;

export const ADDRESS_ENGINE_LOCKS = {
  permanent: true,
  postcodeIsLookupOnly: true,
  addressIsUniqueEntity: true,
  unlimitedPerPostcode: true,
  platformWide: true,
  noExceptions: true,
} as const;

export function addressEngineSnapshot() {
  return {
    name: ADDRESS_ENGINE_NAME,
    version: ADDRESS_ENGINE_VERSION,
    status: ADDRESS_ENGINE_STATUS,
    dom: ADDRESS_ENGINE_DOM,
    postcodeRole: ADDRESS_ENGINE_POSTCODE_ROLE,
    entityKeys: [...ADDRESS_ENGINE_ENTITY_KEYS],
    defaults: ADDRESS_ENGINE_DEFAULTS,
    surfaces: [...ADDRESS_ENGINE_SURFACES],
    forbidden: [...ADDRESS_ENGINE_FORBIDDEN],
    lookupSteps: [...ADDRESS_ENGINE_LOOKUP_STEPS],
    locks: ADDRESS_ENGINE_LOCKS,
    goldenRule:
      "THE POSTCODE IS NEVER THE UNIQUE IDENTIFIER. THE ADDRESS IS THE UNIQUE IDENTIFIER.",
  } as const;
}
