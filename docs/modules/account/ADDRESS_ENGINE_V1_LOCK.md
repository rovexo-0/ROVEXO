# ROVEXO Address Engine v1.0

**STATUS:** PERMANENTLY LOCKED · PLATFORM-WIDE  
**SSOT:** `lib/addresses/address-engine-v1.ts`

## Golden rule

Postcode = lookup only. Address entity = unique identifier. Unlimited addresses per postcode.

## What changed

- Locked Address Engine SSOT + Cursor rule.
- Duplicate detection uses full entity (line1 + line2 + city + postcode + country + type).
- UK lookup curated `WS2 9RD` returns multiple selectable addresses (83/85/87, Flat 1/2, Warehouse, Office, Unit 1/2).
- Provider APIs (Ideal Postcodes / getAddress.io) already return all addresses for a postcode.

## What was not changed

- Auth · Stripe · Sendcloud · schema (no postcode unique index existed).
- Default rule remains: 1 Default Personal + 1 Default Business.

## Surfaces

Account · Checkout · Seller · Orders · Returns · Sendcloud · Stripe · Business · Admin.
