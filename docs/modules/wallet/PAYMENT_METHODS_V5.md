# Payment Methods v5.0 — Absolute Authority

**STATUS:** REVIEW (awaiting Owner visual approval)  
**Route:** `http://localhost:3010/wallet/payment-methods`  
**Fail Closed:** v2.0 — empty-only on this surface (never Retry / Home / technical copy)

## Allowed UI states

1. Loading  
2. Empty  
3. Functional  
4. Success  

## Empty State (API / Stripe / DB / network / no cards)

- “No payment methods added yet.”  
- “Your payment methods are secured by Stripe.”  
- Add Card  
- Apple Pay / Google Pay — only if device supports (else hide)  
- Billing Address · Default Payment Method  

## Success State

- Card rows: brand · `**** **** **** ####` · Expires MM/YYYY · DEFAULT CARD  
- Billing Address · Apple/Google when available · Add New Card  

## Forbidden on this page

FailClosedPanel · Retry · Home · HTTP dumps · API errors · infinite loading · white page  

## Gates (honest)

Scoped Typecheck / ESLint / Build / Vitest: PASS when last run.  
Playwright / Lighthouse / Production Absolute Authority: NOT claimed until executed.  
No commit / push / deploy / freeze until Owner approval + remaining gates green.
