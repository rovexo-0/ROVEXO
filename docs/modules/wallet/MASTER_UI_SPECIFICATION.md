# ROVEXO Wallet — Master UI Specification

**Route:** `/wallet`  
**Canonical component:** `features/wallet/components/WalletHubV1.tsx`  
**Canonical styles:** `styles/rovexo/wallet-hub-v1.css`  
**Visual SSOT:** `docs/modules/wallet/wallet-v1-canonical-mockup.png`  
**Status:** `Awaiting visual QA approval` (implementation aligned to mockup)  
**Freeze:** Only after multi-device visual parity is signed off

---

## Document control

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Canvas reference | Mockup asset 471×1024 → content ~390 CSS px wide |
| Page background | `#FAFAFC` |
| Content max-width mobile | `390px` |
| Content max-width desktop | `720px` (width only) |
| Section gap | `20px` |
| Horizontal pad | `16px` (mobile) / `20px` (≥640px) |
| Hero radius | `20px` |
| Card radius | `16px` |
| Button radius | `12px` |
| Hero gradient | `#8B5CF6 → #784CDF → #6D28D9` |
| Primary purple | `#6D28D9` |
| Shadow soft | `0 2px 10px rgb(15 23 42 / 0.04)` |

### Layout order (locked)

1. Header — Back · Wallet · Help (`?`)
2. Hero — Available Balance · Available pill · amount · Available to withdraw (+ info) · Withdraw · Bank Account
3. Balance cards 2×2 — Pending · Available · Processing · Paid Out
4. Quick Actions — Add Bank · Withdraw · Transactions · Payment Methods
5. Insights — This Month · Next Payout (+ View all)
6. Connected Bank
7. Transactions (+ View all)

**No Statements block on hub.**

### Responsive

Desktop / tablet may change **only** max-width, column count where already multi-column, and horizontal padding. Same component tree. No dark card theme.

---

## Component checklist (mockup copy)

| Component | Exact labels / states |
|-----------|------------------------|
| Status pill | Green dot + **Available** |
| Balance 4 | **Paid Out** (not Lifetime Withdrawn) |
| Quick 1 | **Add Bank** |
| Insights link | **View all** |
| Next payout empty | **—** + “No upcoming payout when you have pending funds.” |
| Bank empty | Title + subtitle + **Connect Bank Account** |
| Txn empty | Icon + **No transactions yet** + subtitle |

---

## QA Checklist

- [ ] Mobile identical to `wallet-v1-canonical-mockup.png`
- [ ] Desktop same structure (wider only)
- [ ] No dark/desktop alternate design
- [ ] All CTAs functional
- [ ] Explicit freeze approval after QA
