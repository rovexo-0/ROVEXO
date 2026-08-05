# ROVEXO R1.2 — Runtime Stability Lock Report

**Status:** CONDITIONAL FAIL (Owner gate)  
**NO commit · NO push · NO deploy**  
**Certification title `FUNCTIONAL STABILITY CERTIFIED R1.2` = NOT GRANTED**  
**Final smoke report:** `ROVEXO_R12_FINAL_SMOKE_REPORT.md` (Playwright 86/23 FAIL · Image 400 remaining)

---

## Owner decision (accepted)

Code repairs accepted as valid analysis + implementation:

| Item | Status |
|------|--------|
| Chunk one-shot recovery | Accepted |
| Pointer capture rewrite | Accepted |
| Price normalization | Accepted |
| Image existence verification | Accepted |
| Thumbnail cleanup | Accepted |
| Seller queue fallback | Accepted |

Must still be proven by **practical smoke with clean console** before certification.

---

## Causes + fixes (unchanged)

### R2 — `releasePointerCapture` / `NotFoundError`
Removed pointer capture from carousel / avatar crop / VisualCanvas. Window-level drag only.

### R3 — ChunkLoadError
One-shot recovery via sessionStorage + `?rx_chunk=1` (no infinite reload).

### R4 — `products_price_check` POST 500
`normalizeListingPrice` — min £0.01, 2dp — create/update/publish.

### R5 / R6 — Image Object not found / HTTP 400
`createSignedUrl` existence check; final-path verify; `-thumb` collapse.

### R7 — `seller_performance_event_queue` PGRST205
Migration file + sync recalculation fallback on PGRST205/42P01.

### R8 — CEO test listing purge (EXECUTED)

| Field | Value |
|-------|--------|
| Account | `palademihaita88@gmail.com` / `mishuu` |
| Listing 1 | `cbe7f440-138f-4eae-aa03-b022c6268f74` Travel pillow |
| Listing 2 | `79ce6b9d-4193-47d2-bce1-28b4c49ab11c` Travel pillow |
| Purge report | `ROVEXO_R12_CEO_PURGE_REPORT.json` → both `ok: true` |
| Verify | `ROVEXO_R12_R8_VERIFY.json` → **zeroRemnants: true** |

Remnants for those two IDs: **0 products · 0 images · 0 offers · 0 conversations**.

Note: other Owner listings (draft Travel pillow, published pillows, older deleted rows) were **not** in the approved two-ID purge set.

---

## Seller queue (R7)

| Check | Result |
|-------|--------|
| Live `seller_performance_event_queue` select | **OK** |
| PGRST205 | **0** |
| Queue count | 0 |
| Management API apply this session | **Owner skipped** |
| Runtime evidence | `ROVEXO_R12_SELLER_QUEUE_MIGRATION_REPORT.json` |

Table is reachable now. Formal SQL history apply remains optional Owner ops if migration history must match.

---

## Agent gates (this session)

| Gate | Result |
|------|--------|
| TypeScript (`tsc --noEmit`) | **PASS** |
| ESLint | **PASS** (0 errors · warnings pre-existing) |
| Vitest focused (seller-performance / listing-price / chunk) | **PASS** 29/29 |
| Next Build | **PASS** (see build log) |
| Playwright full Owner matrix | **NOT RUN / WAITING OWNER** |
| Homepage…Business smoke | **WAITING OWNER** (localhost:3000 was down this session) |
| Mobile Safari / Chrome Android / Desktop | **WAITING OWNER** |
| Console 100% clean | **WAITING OWNER** |

---

## Final Owner gate (required simultaneously)

Certification only when **all** demonstrated:

TypeScript · ESLint · Vitest · Next Build · Playwright · Homepage · Browse · Categories · Upload · Publish · Delete · Orders · Inbox · Wallet · Profile · Business · Mobile Safari · Chrome Android · Desktop

Console must show **0** of:

ChunkLoadError · releasePointerCapture · NotFoundError · Hydration · PGRST205 · Image 400 · POST 500 · Storage Object not found · CEO test products (the two purged IDs)

---

## STOP

**R1.2 remains CONDITIONAL FAIL.**  
No commit · no push · no deploy · no `FUNCTIONAL STABILITY CERTIFIED R1.2` until Owner practical PASS on all gates above.
