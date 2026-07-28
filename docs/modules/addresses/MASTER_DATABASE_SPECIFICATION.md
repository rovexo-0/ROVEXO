# ROVEXO Addresses — Master Database Specification

**STATUS:** APPROVED (UI/UX LOCK) · v1.0 · 2026-07-20

## Table

`shipping_addresses` (unchanged)

| Column | Use |
|--------|-----|
| `address_type` | `shipping` = Personal · `billing` = Business |
| `recipient_name` | Personal name or company name |
| `is_default` | Default within that type |

## Display overlay (no new columns)

Business card may show `Company No` from `business_accounts.tax_id` and company name from `business_accounts.business_name`.

## Forbidden for v1.0

Schema renames · new address tables · duplicate address stores.
