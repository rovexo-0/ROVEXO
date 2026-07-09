# ROVEXO Unified Account Architecture v1.0



**Status:** Permanent SSOT  

**Effective:** 2026-07-08



## Summary



One ROVEXO account per email. No buyer/seller/business account types. Capabilities unlock by action and verification.



## Identity



| Rule | Detail |

|------|--------|

| Unique identifier | Email only |

| Allowed duplicates across accounts | Name, address, phone, payout bank account |

| Independent per account | Wallet, stores, products, reviews, messages, analytics |



## Registration



1. User provides email + password.

2. `handle_new_user` creates profile, wallet, and settings.

3. User completes profile later (`/account/profile/edit`).



## My Account menu (canonical)



1. Profile

2. Selling (expandable — Dashboard, Listings, Orders, Reviews; + Store tools when store exists; + Business tools when verified)

3. Orders

4. Cart

5. Saved

6. Messages

7. Notifications

8. Wallet (all financial functions)

9. Verification

10. Settings (includes Delete Account)

11. Log Out



## Capabilities



Every ROVEXO account can browse, buy, sell, chat, save products, use wallet, receive payments, and withdraw funds immediately. Business verification unlocks business profile, invoices, and tax settings — not a separate account.



## Implementation map



| Area | Location |

|------|----------|

| Capabilities model | `lib/profile/unified-account.ts` |

| My Account menu | `lib/account-center/canonical-menu.ts` |

| Profile mapping | `lib/profile/repository.ts` |

| Registration | `lib/auth/actions.ts`, `features/auth/components/RegisterFields.tsx` |

| Verification hub | `app/account/verification/page.tsx` |

| Delete account | `features/account-module/components/DeleteAccountFlow.tsx`, `lib/account/deletion-eligibility.ts` |

| DB trigger | `supabase/migrations/20260708143000_unified_account_architecture_v1.sql` |

| Business access | `profile.capabilities.hasBusinessVerification` |

| Cursor rule | `.cursor/rules/account-architecture.mdc` |



## Tests



- `tests/unified-account-architecture.test.ts`

- `tests/account-cart-hub-v1.test.ts`

