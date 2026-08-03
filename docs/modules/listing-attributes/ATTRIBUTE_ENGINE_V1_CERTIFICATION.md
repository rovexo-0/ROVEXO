# ROVEXO Attribute Engine v1.0 — Certification Evidence

**Date:** 2026-08-03  
**Status:** Implemented · UI LOCK · ATTRIBUTE ENGINE LOCK  
**Release:** ❌ NO COMMIT · ❌ NO PUSH · ❌ NO DEPLOY

## P0-1 — ListingAttributeValue

| Gate | Result |
|------|--------|
| Single component `ListingAttributeValue` | PASS |
| SellNavRow uses component (no per-row value CSS) | PASS |
| View Item uses component | PASS |
| Typography Inter 500 / 16 / 24 / #111111 / right | PASS |
| Unit `tests/listing-attribute-value-v1.test.ts` | PASS |

## P0-2 — View Item attribute visibility

| Gate | Result |
|------|--------|
| Schema from Catalog Master leaf | PASS |
| Camping Size hidden (orphan size ignored) | PASS |
| Shoes / Clothing Size visible | PASS |
| Rings → Ring Size label | PASS |
| Helmets → Helmet Size label | PASS |
| Missing Material / Colour → row skipped | PASS |
| Phone Storage visible · Size hidden | PASS |
| Unit `tests/product-information-field-engine-v1.test.ts` | PASS |

## Canonical paths

- `components/listing/ListingAttributeValue.tsx`
- `lib/listing-attributes/listing-attribute-value-v1.ts`
- `lib/product-detail/view-item-attribute-engine-v1.ts`
- `features/product-detail/build-product-information-rows.ts`
- `features/sell/ui/SellPrimitives.tsx`
