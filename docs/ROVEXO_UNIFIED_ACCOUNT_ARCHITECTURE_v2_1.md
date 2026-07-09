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



1. Profile  

2. Selling (expandable workspace)  

3. Orders  

4. Cart  

5. Saved  

6. Messages  

7. Notifications  

8. Wallet  

9. Verification  

10. **ROVEXO Ideas**  

11. Settings (includes Delete Account)  

12. Log Out  



## ROVEXO Ideas



- User route: `/account/ideas` — private suggestion form (subject, idea, optional screenshot)

- Admin route: `/super-admin/rovexo-ideas` — search, filter, status management

- Statuses: New, Under Review, Planned, In Development, Implemented, Closed

- No voting, comments, forum, or public roadmap



## Implementation map



| Area | Location |

|------|----------|

| Capabilities | `lib/profile/unified-account.ts` |

| My Account menu | `lib/account-center/canonical-menu.ts` |

| ROVEXO Ideas | `lib/rovexo-ideas/`, `app/account/ideas/`, `app/super-admin/rovexo-ideas/` |

| DB | `supabase/migrations/20260708160000_rovexo_ideas_v2_1.sql` |

| Verification | `app/account/verification/` |

| Delete account | `features/account-module/components/DeleteAccountFlow.tsx` |

| Cursor rule | `.cursor/rules/account-architecture.mdc` |



## Tests



- `tests/unified-account-architecture.test.ts`

- `tests/account-cart-hub-v1.test.ts`

- `tests/rovexo-ideas-v2_1.test.ts`

