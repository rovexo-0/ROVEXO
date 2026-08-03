# ROVEXO Unified Account Architecture v2.1 (FINAL SSOT)



**Status:** LOCKED — permanent architecture  

**Effective:** 2026-07-08  

**Supersedes:** All prior buyer/seller/business account implementations



## Summary



One ROVEXO account per email. Capabilities expand by action and verification. No account types, role switching, or conversions.



## Identity



| Rule | Detail |

|------|--------|

| Unique identifier | Email only |

| Allowed duplicates across accounts | Name, address, phone, payout bank account |

| Independent per account | Wallet, store, orders, listings, messages, ideas, verification |



## My Account menu (final)



1. Profile (Favourites · Balance · My Orders · Holiday Mode · Promote · Settings · **ROVEXO Ideas** · Help Centre · Legal Information · Sign Out)

2. Selling (expandable workspace)

3. Orders

4. Cart

5. Saved

6. Messages

7. Notifications

8. Wallet

9. Verification

10. Settings subpages (includes Delete Account)

11. Log Out



## ROVEXO Ideas



- User route: `/account/ideas` — Profile menu only (icon + title + chevron). Inherits Profile design 100%.

- SSOT: `lib/rovexo-ideas/rovexo-ideas-v1-lock.ts` · **STATUS: PERMANENTLY LOCKED**

- Community-driven: users may submit, vote, comment, follow, search, discuss, share.

- Forbidden: mandatory categories/templates/questionnaires; implementation or release-date promises; cards/banners/dashboards/statistics; duplicate menu entries.

- ROVEXO decides prioritisation, implementation, releases, and future development.

- Admin route: `/super-admin/rovexo-ideas` — search, filter, status management

- Statuses: New, Under Review, Planned, In Development, Implemented, Closed



## Implementation map



| Area | Location |

|------|----------|

| Capabilities | `lib/profile/unified-account.ts` |

| My Account menu | `lib/account-center/canonical-menu.ts` |

| ROVEXO Ideas | `lib/rovexo-ideas/`, `app/(platform)/account/ideas/`, `app/(platform)/super-admin/rovexo-ideas/` |

| DB | `supabase/migrations/20260708160000_rovexo_ideas_v2_1.sql` |

| Verification | `app/(platform)/account/verification/` |

| Delete account | `features/account-module/components/DeleteAccountFlow.tsx` |

| Cursor rule | `.cursor/rules/account-architecture.mdc` |



## Tests



- `tests/unified-account-architecture.test.ts`

- `tests/account-cart-hub-v1.test.ts`

- `tests/rovexo-ideas-v2_1.test.ts`

