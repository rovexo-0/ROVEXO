# ROVEXO Balance Page — Master UI Specification

**Document type:** Engineering UI specification (implementation gate)  
**Authority:** `.cursor/rules/master-ui-specification-mode.mdc`  
**Rule:** No production implementation until Product Owner sets status to **Approved**.

---

## Document control

| Field | Value |
|-------|-------|
| **Page / Module** | Balance Page v1.0 (Wallet hub presentation) |
| **Route(s)** | `/wallet` (Balance hub) · `/wallet/withdraw` · `/wallet/pending` · Profile `/account` Balance row |
| **Canonical component** | `features/wallet/components/WalletHubV1.tsx` · `WithdrawPage.tsx` · Profile Balance row via `canonical-menu` + Account menu |
| **Canonical styles** | Existing Account Canonical + wallet presentation CSS only (no Design System / purple theme rewrite) |
| **Visual reference** | `owner-review-screenshots/balance-v1/index.html` |
| **Canvas reference** | 390 × 844 (iPhone reference) |
| **Version** | 1.0 |
| **Status** | `Awaiting approval` |
| **Owner** | ROVEXO Product Owner |
| **Approved by** | — |
| **Approved date** | — |

### Change history

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0 | 2026-07-19 | Cursor | Balance Page v1.0 Master UI Spec + local visual preview for Owner approval |

### Canonical implementation map (post-approval only)

| Layer | Path |
|-------|------|
| Route | `app/(platform)/wallet/page.tsx` · `app/(platform)/wallet/withdraw/page.tsx` (unchanged URLs) |
| Hub | `features/wallet/components/WalletHubV1.tsx` |
| Withdraw | `features/wallet/components/withdraw/WithdrawPage.tsx` |
| Profile row | `lib/account-center/canonical-menu.ts` + Account menu render |
| Transactions labels | Display map only on existing transaction list (no backend type changes) |
| Styles | Existing wallet / account-canonical CSS — UI-only |
| Tests | Lock test for Balance v1.0 labels + structure after approval |

### Explicit non-goals (LOCKED)

- Design System tokens / One Purple token rewrite  
- Bottom Navigation  
- Routing table / new routes (unless Owner unlocks Donate destination)  
- Backend, Stripe, Escrow, Transactions architecture  
- Homepage, Listings, Checkout, Orders, Inbox, Seller/Admin dashboards  

---

## 1. Master UI Specification

### 1.1 Page purpose

Balance is the user’s money hub: show Pending and Available balances, offer Withdraw / Shop / Donate actions, and list dated transaction history. Withdraw remains the existing bank payout flow with clearer copy and bank row.

### 1.2 Canvas

| Token | Value | Notes |
|-------|-------|-------|
| Reference device | iPhone 6.9" class | Visual QA baseline |
| Reference width | 390 px | Preview frame |
| Reference height | 844 px | Preview frame |
| Safe area top | system | Status bar unchanged |
| Safe area bottom | system + existing bottom nav clearance | Bottom nav not modified |
| Content max-width (mobile) | 100% · page inset 16 px | |
| Content max-width (tablet) | 480 px centered | Same design |
| Content max-width (desktop) | 480 px centered | Wider viewport only |
| Page background | `#FFFFFF` | No gradients on Balance surfaces |

### 1.3 Layout order (section tree)

**A. Profile (`/account`) — Balance row only**

1. Existing menu order unchanged  
2. Balance row: title `Balance` · trailing `Available £X,XXX.XX` · chevron `>` · href `/wallet`

**B. Balance hub (`/wallet`)**

1. Header title: `Balance` (route remains `/wallet`)  
2. Pending Balance row → `/wallet/pending`  
3. Available Balance hero (amount + label)  
4. Action buttons: Withdraw · Shop · Donate  
5. Transaction History list (date descending)

**C. Withdraw (`/wallet/withdraw`)**

1. Header: `Withdraw`  
2. Title: `Withdraw to bank account`  
3. Helper: `Funds are usually transferred within 1-5 business days.`  
4. Bank Account row: bank name · `****XXXX` · `EDIT`  
5. Available Balance amount  
6. Withdrawal amount field (default `£0.00`)  
7. CTA: `WITHDRAW TO BANK ACCOUNT`

### 1.4 Grid

| Token | Value |
|-------|-------|
| Columns (mobile) | 1 |
| Columns (tablet) | 1 |
| Columns (desktop) | 1 |
| Gutter | 12 px (action buttons) |
| Page horizontal inset | 16 px |
| Section vertical gap | 16–24 px |

### 1.5 Global spacing system

| Token | Value (px) |
|-------|------------|
| `--space-xs` | 4 |
| `--space-sm` | 8 |
| `--space-md` | 12 |
| `--space-lg` | 16 |
| `--space-xl` | 24 |
| Section gap | 16–24 |
| Card internal padding | 12–16 |
| Row height (list) | min 56 |

### 1.6 Global radius / shadow / colour pointers

| Token | Value |
|-------|-------|
| Radius card | 16 px |
| Radius button / CTA | 999 px (pill) |
| Radius action glyph | 999 px |
| Shadow card | none (border only) — premium minimal |
| Brand purple | Design System canonical `--ds-color-primary` / `#9333ea` (unchanged) |
| Gold rating | unchanged (`#f5b301` / existing star token) |
| Surface | `#FFFFFF` |
| Text primary | `#0f172a` |
| Text muted | `#64748b` |
| Border | `rgb(15 23 42 / 0.08)` |
| Brand gradient | **Forbidden** on Balance / Withdraw surfaces |

---

## 2. Component Dimension Table

### Component: Profile Balance Row

| Field | Value |
|-------|-------|
| Purpose | Open Balance hub with Available amount preview |
| X position | Full content width |
| Y position | Existing Favourites → Balance → Orders order |
| Width | 100% of menu card |
| Height | min 56 px |
| Padding | 12 × 16 px |
| Margin | 0 |
| Gap | 12 px |
| Border radius | Inherited card |
| Shadow | none |
| Background | transparent (pressed: soft purple 4% opacity max) |
| Border | row divider only |
| Icon | Existing wallet / Balance icon (unchanged colour system) |
| Icon size | 36 × 36 container |
| Icon stroke | N/A (existing glyph) |
| Title font | System UI |
| Body font | System UI |
| Font weight | Title 600 · Value 600 |
| Font size | 15 px |
| Line height | 20 px |
| Letter spacing | 0 |
| Alignment | Title left · value + chevron right |
| Pressed / Hover / Focus | Existing account row interactions |
| Disabled | N/A |
| Loading | Hide amount or show `—` until wallet loaded |
| Empty | `Available £0.00` |
| Animation | Instant page transition to `/wallet` |
| Navigation | `/wallet` |
| Responsive behaviour | Identical; max-width of parent only |

### Component: Pending Balance Row

| Field | Value |
|-------|-------|
| Purpose | Show pending funds; open pending detail |
| Width | 100% |
| Height | min 56 px |
| Padding | 12 × 16 px |
| Gap | 8 px |
| Border radius | 16 px card |
| Shadow | none |
| Background | `#FFFFFF` |
| Border | 1 px `var(--border)` |
| Icon | none |
| Title | `Pending Balance` · 15 / 600 |
| Value | `£XX.XX` · 15 / 600 |
| Chevron | `>` |
| Navigation | `/wallet/pending` |
| Responsive behaviour | Identical |

### Component: Available Balance Hero

| Field | Value |
|-------|-------|
| Purpose | Primary available funds display |
| Width | 100% |
| Height | content · pad 28 top / 20 bottom |
| Padding | 28 × 16 × 20 |
| Amount | 36 px / 700 / −0.03em / `#0f172a` / center |
| Label | `Available Balance` · 14 / 500 / `#64748b` / center |
| Shadow | none |
| Background | transparent |
| Icon | none |
| Animation | soft fade-in ≤ 200 ms; respect reduced motion |
| Responsive behaviour | Identical |

### Component: Action Buttons (Withdraw / Shop / Donate)

| Field | Value |
|-------|-------|
| Purpose | Primary money actions |
| Layout | 3 equal columns · gap 12 px |
| Cell min height | 88 px |
| Padding | 14 × 8 |
| Border radius | 16 px |
| Border | 1 px border token |
| Background | `#FFFFFF` |
| Glyph | 44 × 44 circle · fill `#9333ea` · white icon |
| Label | 12 / 600 · center |
| Pressed | opacity 0.92 · no scale bounce |
| Focus | 2 px ring purple / 35% |
| Disabled | opacity 0.55 (Withdraw when available ≤ 0) |
| Navigation | Withdraw → `/wallet/withdraw` · Shop → **Owner confirm** (proposed `/`) · Donate → **Owner confirm** |
| Responsive behaviour | Identical 3 columns |

### Component: Transaction History Row

| Field | Value |
|-------|-------|
| Purpose | Dated money movement |
| Height | min 56 px |
| Padding | 12 × 16 |
| Title | Display label map (see §9) · 15 / 600 |
| Meta | date · 12 / 500 / muted |
| Amount + | green `#059669` · 15 / 700 |
| Amount − | red `#dc2626` · 15 / 700 |
| Order | `createdAt` descending (existing data order) |
| Empty | Minimal empty copy · no clutter |
| Navigation | existing `/wallet/transactions/[id]` if already wired |
| Responsive behaviour | Identical |

### Component: Withdraw intro

| Field | Value |
|-------|-------|
| Title | `Withdraw to bank account` · 17 / 700 |
| Body | `Funds are usually transferred within 1-5 business days.` · 13 / 500 / muted |
| Background note | soft `#f8fafc` · 12 px radius · no gradient |

### Component: Bank Account Row

| Field | Value |
|-------|-------|
| Bank name | Uppercase display of connected bank label e.g. `HSBC BANK` |
| Mask | `****` + last 4 |
| EDIT | purple text link → existing `/wallet/bank-account` |
| Height | min 56 px |

### Component: Withdraw amount + CTA

| Field | Value |
|-------|-------|
| Available display | large amount + `Available Balance` |
| Amount field default | `£0.00` |
| CTA | full width · height 52 · pill · purple fill · white text · `WITHDRAW TO BANK ACCOUNT` |
| Behaviour | Identical to current withdraw submit (no Stripe/architecture change) |

---

## 3. Spacing Table

| Context | Top | Right | Bottom | Left | Gap | Notes |
|---------|-----|-------|--------|------|-----|-------|
| Page content | 16 | 16 | 28 | 16 | — | |
| Pending card | 0 | 0 | 16 | 0 | — | |
| Available hero | 28 | 16 | 20 | 16 | 8 | |
| Action group | 8 | 0 | 24 | 0 | 12 | 3 columns |
| History section | 0 | 0 | 0 | 0 | 10 | title → list |
| List row | 12 | 16 | 12 | 16 | 12 | |
| Withdraw note | 0 | 0 | 20 | 0 | — | |

---

## 4. Typography Table

| Role | Family | Weight | Size | Line height | Letter spacing | Colour | Align |
|------|--------|--------|------|-------------|----------------|--------|-------|
| Page title | System | 700 | 17 | 22 | 0 | `#0f172a` | center |
| Pending / row title | System | 600 | 15 | 20 | 0 | `#0f172a` | left |
| Row value | System | 600 | 15 | 20 | 0 | `#0f172a` | right |
| Available amount | System | 700 | 36 | 40 | −0.03em | `#0f172a` | center |
| Available label | System | 500 | 14 | 18 | 0 | `#64748b` | center |
| Action label | System | 600 | 12 | 16 | 0 | `#0f172a` | center |
| Section title | System | 700 | 13 | 16 | 0.04em | `#64748b` | left · uppercase |
| Tx amount | System | 700 | 15 | 20 | 0 | green/red | right |
| Withdraw CTA | System | 700 | 13 | 16 | 0.04em | `#FFFFFF` | center |

---

## 5. Colour Table

| Token | Hex / value | Usage |
|-------|-------------|-------|
| Page bg | `#FFFFFF` | Balance + Withdraw |
| Text | `#0f172a` | Primary copy |
| Muted | `#64748b` | Labels / helper |
| Border | `rgb(15 23 42 / 0.08)` | Cards / rows |
| Purple | `#9333ea` (`--ds-color-primary`) | Glyphs · EDIT · CTA · focus |
| Purple soft | `rgb(147 51 234 / 0.08)` | Icon wells |
| Gold | existing rating token | Profile stars only — unchanged |
| Credit | `#059669` | + amounts |
| Debit | `#dc2626` | − amounts |
| Gradients | **none** | Balance / Withdraw |

---

## 6. Interaction Specification

| Control | Default | Hover | Pressed | Focus | Disabled | Loading | Notes |
|---------|---------|-------|---------|-------|----------|---------|-------|
| Profile Balance | rest | subtle bg | opacity 0.96 | ring | — | amount placeholder | Instant → `/wallet` |
| Pending row | rest | subtle bg | opacity 0.96 | ring | — | — | → `/wallet/pending` |
| Withdraw action | rest | soft purple well | opacity 0.92 | ring | when available ≤ 0 | — | → `/wallet/withdraw` |
| Shop / Donate | rest | same | same | ring | if no destination | — | Owner must confirm destinations |
| EDIT bank | purple text | underline optional | opacity 0.9 | ring | — | — | → bank account |
| Withdraw CTA | purple fill | brightness −4% | opacity 0.92 | ring | invalid amount / no bank | “Processing…” | existing API |

Transitions: 180–200 ms ease; page transitions instant (existing Next navigation). No bounce / scale flash.

---

## 7. Responsive Specification

| Breakpoint | Max content width | Columns allowed to change | Must stay identical |
|------------|-------------------|---------------------------|---------------------|
| Mobile | 100% · inset 16 | none | Colours, hierarchy, type, radius, section order |
| Tablet | 480 | max-width only | Same |
| Desktop | 480 | max-width only | Same |
| PWA | mobile rules | none | Same |

**Prohibited:** desktop redesign, dark alternate theme, hierarchy changes, Design System purple rewrite.

---

## 8. Accessibility Specification

| Requirement | Spec |
|-------------|------|
| Keyboard | All rows and actions focusable / activatable |
| Focus ring | 2 px purple ring ≥ WCAG visible |
| ARIA labels | Actions labelled Withdraw / Shop / Donate; amounts announced with currency |
| Tap target min | ≥ 44 × 44 on glyphs; rows ≥ 56 height |
| Contrast | AA for text on white; purple CTA white on `#9333ea` |
| Reduced motion | Disable non-essential fade |
| Screen reader order | Pending → Available → Actions → History |

---

## 9. Developer Notes

- Single hub component: `WalletHubV1` (presentation rename to Balance UI; route `/wallet` unchanged).  
- Single withdraw component: `WithdrawPage`.  
- No `BalanceMobile` / `BalanceDesktop` forks.  
- Image safety: N/A for these screens unless avatars appear (then `Avatar` only).  
- Transaction **display labels only** (no schema change):

| Existing type | Display label | Sign |
|---------------|---------------|------|
| `sale` | `SOLD` or `PAYMENT RECEIVED` per existing business meaning (Owner: map `sale` → `SOLD`; if a distinct payment-received type exists use it, else both sales use `SOLD` unless Owner splits) | + |
| `refund` | `REFUND` | − |
| `withdrawal` | `WITHDRAWAL` | − |
| `fee` / `promotion` | keep existing quiet labels or omit from Balance summary if Owner wants only the four listed | per type |

- Data attributes after implement: `data-balance-ui="v1.0"` · `data-balance-freeze="awaiting-visual-qa"`.  
- **Open decisions (blockers):** Shop href · Donate href · confirm hub title `Balance` vs keep `Wallet`.

---

## 10. QA Checklist

- [ ] Spec status is **Approved** before coding  
- [ ] Local preview `owner-review-screenshots/balance-v1/index.html` matches Owner intent  
- [ ] Implementation matches Component Dimension Table 1:1  
- [ ] iPhone / Android / Desktop / PWA — same design; max-width only  
- [ ] Gold rating unchanged on Profile  
- [ ] No Design System / purple / bottom-nav / routing / Stripe / escrow changes  
- [ ] Withdraw behaviour identical to current wallet withdraw  
- [ ] Transactions ordered by date descending  
- [ ] TypeScript / ESLint / Vitest as required  
- [ ] Explicit freeze only after Owner visual parity approval  

---

## Approval

| Role | Name | Date | Signature / note |
|------|------|------|------------------|
| Design | | | |
| Engineering | | | |
| Product / Owner | | | **Required before any production UI code** |

### Owner reply format (copy)

```
BALANCE v1.0 — APPROVED
Shop → <existing route>
Donate → <existing route OR UNLOCK_NEW_ROUTE>
Hub title → Balance | Wallet
Then implement 1:1 to this spec + preview.
```

Or:

```
BALANCE v1.0 — NOT APPROVED
Changes: <list>
```
