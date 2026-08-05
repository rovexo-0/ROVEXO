# ROVEXO PHASE R — FUNCTIONAL PARITY CERTIFICATION

**BLOOD LAW:** Functional Parity Lock v1.0 — `lib/functional-parity-lock-v1.ts` · `.cursor/rules/functional-parity-lock-v1.mdc`  
**STATUS:** ⛔ ABSOLUTE STOP on all performance / cache / bundle / CSS / ISR / Edge work

**Baseline:** `9ed6f9b3` — ROVEXO v1.0.0 Production Release  
**Host:** `http://localhost:3000` ONLY  
**Date:** 2026-08-04  
**Policy:** NO commit · NO push · NO deploy · Owner approval required  
**Phase 11:** FORBIDDEN to resume until every regression below is PASS + Owner mobile checklist PASS

---

## Executive verdict

| Gate | Result |
|------|--------|
| Tracked source tree vs `9ed6f9b3` | **PASS** — `git diff 9ed6f9b3` empty |
| TypeScript | **PASS** |
| ESLint | **PASS** (0 errors · warnings only, baseline) |
| Production `next build` | **PASS** |
| Vitest functional contracts | **PASS** (67 tests / 12 files in focused set) |
| Playwright listing lifecycle | **PASS** (12/12) |
| Anon/buyer listing + menu (manual Playwright) | **PASS** |
| Owner Edit / Delete / Pause (E2E lifecycle) | **PASS** |
| Full `test:ci` / full e2e certification suite | **NOT RUN** (out of scope of smallest restore; not a code delta) |
| Owner visual phone approval | **WAITING FOR OWNER** |

**Code + automated functional parity with `9ed6f9b3`: RESTORED.**  
**Product Owner visual certification on official Owner URL: still required before Freeze/Commit/Push/Deploy.**

---

## What was wrong (root cause class)

Uncommitted Phase 8–11 performance work diverged from `9ed6f9b3`:

1. **`withPublicDbAccess` / anon Supabase** on listing · profile · store · search · category → RLS `seller_id = auth.uid()` never matched → owners lost draft/paused listing loads and session-aware seller paths.
2. **Search page ISR** stripped server `searchParams` → homepage search / visual redirect behaviour drifted.
3. **ConversationHub lazy** (`loading: null`) risked blank hub paint.
4. **Gallery / SafeImage / image pipeline / CSS / session cache / middleware guest fast-path** — visual and interaction drift vs certified release.

**False alarm during QA:** After `rm -rf .next`, a **stale process kept serving `:3000`** while a new server bound `:3002`. CSS chunks returned 21-byte / 500 errors → chrome `position:static`, More menu unclickable. **Not a code regression** once a clean `:3000` server was running.

---

## Restoration performed (smallest safe)

```text
git checkout 9ed6f9b3 -- <all previously modified tracked files>
rm -rf app/(platform)/loading.tsx components/perf lib/perf \
       lib/media/listing-thumbnail-url.ts lib/supabase/get-server-supabase.ts \
       lib/supabase/public-server.ts features/inbox/components/ConversationHubLazy.tsx \
       tests/listing-thumbnail-url.test.ts scripts/perf-*.mjs scripts/ssr-trace-runner.mjs
```

**Proof of code parity:**

```bash
git diff 9ed6f9b3 --stat
# (empty)
```

Working tree tracked files ≡ `9ed6f9b3`.  
Untracked only: Phase reports (`ROVEXO_*.md`) + unused image masters (not imported by restored code).

---

## Regression board

For every item: Status · Root Cause · Files · Proof · Manual verification

### R1 — Listing owner detection / seller vs buyer menus

| Field | Value |
|-------|--------|
| **Status** | **PASS** |
| **Root Cause** | Anon `withPublicDbAccess` on listing + products repository broke session RLS for non-public statuses; owner/buyer chrome compares `auth.profile.id === sellerId` client-side once product loads. |
| **Files changed** | Restored `app/(platform)/listing/[slug]/page.tsx`, `lib/products/repository.ts` (+ related public-anon helpers removed) |
| **Proof of fix** | `git diff 9ed6f9b3` empty · `tests/listing-menu-owner-auth-v1.test.ts` PASS · live DOM: anon `data-listing-owner=false` `data-listing-actions-menu=buyer` |
| **Manual** | `/listing/slepping-bag-msa9gnrb` — Buy Now + Make Offer · More menu opens Report/Share · **no** Edit/Delete · screenshots `test-results/phase-r-parity/listing-clean.png`, `listing-menu-clean.png` |

### R2 — Edit Listing / Delete Listing / Pause Listing

| Field | Value |
|-------|--------|
| **Status** | **PASS** |
| **Root Cause** | Same as R1 + lifecycle depended on session client. |
| **Files changed** | Restored listing/products/listings repositories to `createClient` |
| **Proof of fix** | `e2e/listing-lifecycle-certification.spec.ts` — EDIT · PAUSE · ACTIVATE · DELETE **12/12 PASS** |
| **Manual** | Covered by Playwright lifecycle against localhost |

### R3 — Three-dot menu (`...`) clickable

| Field | Value |
|-------|--------|
| **Status** | **PASS** |
| **Root Cause** | Transient: stale `:3000` after `.next` wipe → CSS missing → chrome not `position:absolute; z-index:30`. |
| **Files changed** | None beyond baseline restore (CSS already correct in `styles/rovexo/product-detail-v1.css`) |
| **Proof of fix** | Clean server: computed `position=absolute` `zIndex=30` `btnW=48px` · menu `aria-expanded=true` |
| **Manual** | Click More options succeeds after clean `npm run dev` on `:3000` |

### R4 — Back button

| Field | Value |
|-------|--------|
| **Status** | **PASS** |
| **Root Cause** | Appeared broken only when listing CSS/chrome collapsed (R3). |
| **Files** | Baseline `ProductPageChrome` / `usePageBack` unchanged vs `9ed6f9b3` |
| **Proof** | Button present · clickable on clean server |
| **Manual** | `test-results/phase-r-parity/listing-clean.png` |

### R5 — Listing gallery

| Field | Value |
|-------|--------|
| **Status** | **PASS** |
| **Root Cause** | Phase 9 progressive/thumb gallery changes reverted. |
| **Files** | Restored `features/product-detail/ProductGalleryV1.tsx` |
| **Proof** | Lifecycle PRODUCT DETAILS PASS · gallery CSS + images render on clean server |
| **Manual** | Listing screenshot |

### R6 — Homepage Search

| Field | Value |
|-------|--------|
| **Status** | **PASS** |
| **Root Cause** | Search landing forced ISR without server `searchParams`. |
| **Files** | Restored `app/(platform)/search/page.tsx`, `SearchResultsView.tsx`, `search-server.ts`, homepage files |
| **Proof** | `/search?q=slepping` → 1 listing link · API search returns products |
| **Manual** | `test-results/phase-r-parity/search-clean.png` |

### R7 — Categories / Browse

| Field | Value |
|-------|--------|
| **Status** | **PASS** |
| **Root Cause** | Category `withPublicDbAccess` + force-static categories drift. |
| **Files** | Restored category/categories pages + `lib/categories/server.ts` |
| **Proof** | `/categories` content PASS · lifecycle CATEGORY PASS |
| **Manual** | Categories smoke PASS |

### R8 — Profile / Store listings · drafts · holiday

| Field | Value |
|-------|--------|
| **Status** | **PASS** (code + store surface) |
| **Root Cause** | Profile/store wrapped in public anon reader. |
| **Files** | Restored `user/[username]/page.tsx`, `store/[slug]/page.tsx`, `lib/profile/public.ts`, `lib/store/store-repository.ts` |
| **Proof** | `/user/mishuu` loads · listing visible · lifecycle SELLER STORE + MY LISTINGS PASS |
| **Manual** | `test-results/phase-r-parity/profile-clean.png` |

### R9 — Inbox / Conversation

| Field | Value |
|-------|--------|
| **Status** | **PASS** (code parity) |
| **Root Cause** | `ConversationHubLazy` deferred hub with null loading. |
| **Files** | Restored conversation page · deleted `ConversationHubLazy.tsx` |
| **Proof** | Direct `ConversationHub` import · route HTTP 200 · `tests/inbox-hub-sprint1.test.ts` PASS |
| **Manual** | Route loads (auth redirect as designed for guests) |

### R10 — Favourite / Share / Report

| Field | Value |
|-------|--------|
| **Status** | **PASS** |
| **Root Cause** | Menu/chrome broken only under CSS failure (R3). |
| **Proof** | Anon menu shows Report/Share · lifecycle FAVORITE PASS |
| **Manual** | Menu screenshot |

### R11 — Wallet / Orders / Checkout / Sell / Auth / Bottom nav

| Field | Value |
|-------|--------|
| **Status** | **PASS** (HTTP + code parity) |
| **Root Cause** | No intentional module rewrites retained; all tracked files restored. |
| **Proof** | Routes return 200 · build emits routes · session/middleware restored to baseline |
| **Manual** | Smoke routes PASS on clean `:3000` |

### R12 — Notifications / Offers / Bundles / Followers / Following / Reviews / View counter / Recently viewed / Deep links / Filters

| Field | Value |
|-------|--------|
| **Status** | **PASS** (code parity vs `9ed6f9b3`) · **WAITING FOR OWNER** for full click matrix on phone |
| **Root Cause** | No remaining tracked deltas in those modules. |
| **Proof** | Empty `git diff 9ed6f9b3` · contract tests where present |
| **Manual** | Owner device pass still required for absolute product certification |

---

## Owner / Buyer certification matrix

| Actor | Must see | Evidence |
|-------|----------|----------|
| **Owner** | Edit · Delete · Pause · owner menu · drafts/holiday when applicable | Lifecycle E2E EDIT/PAUSE/DELETE/MY LISTINGS **PASS** |
| **Buyer** | Buy Now · Make Offer · Favourite · Report · buyer menu | Live listing DOM + menu **PASS** |
| **Anonymous** | Public actions only · never owner menu | `owner=false` `menu=buyer` · no Edit/Delete **PASS** |

**Never mix roles:** verified on live listing for anon; owner path verified via lifecycle E2E.

---

## Automated gates (evidence)

| Gate | Command / artifact | Result |
|------|-------------------|--------|
| Typecheck | `npm run typecheck` | PASS |
| ESLint | `npm run lint` | PASS (0 errors) |
| Build | `npx next build` | PASS |
| Vitest focused | listing-menu-owner-auth · canonical-edit · homepage-final-freeze · search-ui · buy-now · auth-startup · full-demo contracts · inbox · social-removal · image-safety | **67 PASS** |
| Playwright | `e2e/listing-lifecycle-certification.spec.ts` | **12/12 PASS** |
| Manual smoke JSON | `test-results/phase-r-parity/clean-smoke.json` | **9/9 PASS** |

Screenshots: `test-results/phase-r-parity/*.png`

---

## Interaction certification (clean `:3000`)

| Control | Result |
|---------|--------|
| Back | PASS (present + clickable) |
| Three-dot menu | PASS (opens · correct role) |
| Buy Now / Make Offer | PASS (visible to non-owner) |
| Cards / Search results | PASS |
| Bottom navigation | PASS (search/landing) |
| Gallery | PASS |

---

## Visual vs certified release

Tracked CSS · components · brand assets · search heroes · wallet hero restored to `9ed6f9b3` bytes.  
Untracked Phase 9 alternate formats (`teddy-shrug.avif`, wallet `.webp`, etc.) are **not referenced** by restored code → no runtime visual fork.

---

## STOP policy

- **No performance / bundle / CSS-splitting / image / cache work resumed.**
- **Phase 11 remains blocked** until Owner signs visual PASS on `https://www.rovexo.co.uk` (or Owner explicitly re-opens Phase 11 after localhost visual PASS).
- Any new functional FAIL → continue Phase R only.

---

## Remaining Owner actions

1. Confirm on phone (`https://www.rovexo.co.uk` when deployed, or local tunnel if Owner uses local): own listing → Edit/Delete/Pause; other listing → Buy/Offer/Report.
2. Explicit approval before any commit / push / deploy.
3. Only then may Phase 11 resume.

---

## Final status

```text
CODE PARITY vs 9ed6f9b3 .................... PASS
AUTOMATED FUNCTIONAL GATES ................. PASS
LISTING LIFECYCLE E2E ...................... PASS
ANON/BUYER LIVE MENU ....................... PASS
OWNER VISUAL / OFFICIAL URL APPROVAL ....... WAITING FOR OWNER
COMMIT / PUSH / DEPLOY ..................... FORBIDDEN
PHASE 11 ................................... BLOCKED
```
