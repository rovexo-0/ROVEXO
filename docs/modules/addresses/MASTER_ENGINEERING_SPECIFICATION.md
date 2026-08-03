# ROVEXO Addresses — Master Engineering Specification

**STATUS:** APPROVED (UI/UX LOCK) · v1.0 · 2026-07-20

| Layer | Path |
|-------|------|
| Route | `app/(platform)/account/addresses/page.tsx` |
| UI | `features/account/components/addresses/AddressesPage.tsx` |
| Labels / map | `lib/addresses/canonical.ts` |
| UK lookup | `lib/addresses/uk-lookup.ts` · `GET /api/addresses/lookup` |
| CRUD | `lib/addresses/repository.ts` · `/api/addresses` |
| Visibility | `resolveBusinessAddressesVisibility` · feature `business-addresses-tab` |

## Type map

Personal ↔ `shipping` · Business ↔ `billing` (no DB rename).

## What changed (v1.0 lock implementation)

- Exclusive Personal / Business tabs and CTAs  
- Business tab gated by verified Business Seller  
- Edit sheet; Delete not permanent on cards  
- Mandatory UK Address Lookup for add/save  
- Company No display from business profile when Business tab  

## What did not change

Auth · Stripe · Sendcloud · Wallet · Escrow · `shipping_addresses` schema · checkout money paths  

## Impact

| Area | Impact |
|------|--------|
| Performance | Lookup on demand only; no extra list polling |
| Responsive | Max-width only; same hierarchy |
| Security | Auth required on lookup + CRUD; fail-closed lookup errors |
| Database | None |
