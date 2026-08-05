# ROVEXO P3 — API PERFORMANCE ENGINE
**STATUS:** COMPLETE (awaiting Owner approval — no commit / push / deploy)  
**DATE:** 2026-08-04  
**SCOPE:** Performance-only · Promise share-inflight · short safe TTL · zero business/UI change

---

## 1. Files touched

| File | Role |
|------|------|
| `lib/performance/fetch.ts` | Added `shareInflightRequest`; `ttlMs: 0` = inflight-only (no soft cache) |
| `lib/performance/index.ts` | Export `shareInflightRequest` |
| `lib/account-center/fetch-account-snapshot-shared.ts` | **NEW** — single shared GET `/api/account/snapshot` |
| `features/account-center/hooks/useAccountHubLive.ts` | Use shared snapshot (was split `fetchDeduped` key) |
| `features/wallet/hooks/use-wallet-live.ts` | Use shared snapshot |
| `features/checkout/components/CheckoutWizardV1.tsx` | Use shared snapshot (was raw fetch) |
| `lib/bundle/bundle-mirror-v1.ts` | Shared GET `/api/bundle` + invalidate before rehydrate |
| `features/product-detail/AddToBundleSheet.tsx` | `useActiveBundle` → shared GET |
| `components/analytics/VisitorPresenceBeacon.tsx` | Skip overlapping presence POSTs |
| `components/homepage/canonical/CanonicalMarketplaceFeed.tsx` | Page-1 share + 500ms soft TTL |
| `features/notifications/components/RealtimeNotificationProvider.tsx` | Remove unused import |
| `tests/p3-share-inflight-v1.test.ts` | **NEW** — coalesce + ttlMs:0 proofs |
| `tests/account-hub-snapshot.test.ts` | Lock string updated to `fetchAccountSnapshotShared` |

**Not touched:** Search algorithm, wallet math, SQL, schema, API response shapes, CSS/UI, debounce timings, realtime subscriptions, auth security.

---

## 2. Root causes found

1. **`GET /api/bundle` HIGH** — `GlobalStickyBundleBar` + `BundleReviewPage` both mount `useActiveBundle` → **2× parallel identical GETs**.
2. **`GET /api/account/snapshot` MED** — Account hub + Wallet used **different** `fetchDeduped` keys (`account-hub:snapshot` vs `wallet-hub:snapshot`) so identical URLs ran in parallel; Checkout used a third raw fetch. `fetchDeduped` also **aborts** siblings (latest-wins) instead of sharing results.
3. **`POST /api/analytics/live-presence` LOW–MED** — focus + 45s interval could overlap without skip-if-inflight.
4. **`GET /api/homepage/feed?page=1` LOW** — Strict Mode / remount could double page-1; soft TTL safe for public catalog.
5. **Inbox badge** — already module inflight + 2.5s TTL (left unchanged).
6. **`/api/profile`** — AuthProvider session cache already owns bootstrap (left unchanged).

---

## 3. Duplicate requests eliminated

| Endpoint | Before | After |
|----------|--------|-------|
| `GET /api/bundle` | N parallel per concurrent `useActiveBundle` mounts | **1** shared Promise |
| `GET /api/account/snapshot` | Up to 3 parallel (hub / wallet / checkout) | **1** shared Promise (`ttlMs: 0`) |
| `POST /api/analytics/live-presence` | Overlapping focus+tick | Skip if inflight |
| `GET /api/homepage/feed?page=1` | Possible Strict Mode double | Shared + 500ms soft TTL |

**Estimated duplicate-call reduction on hot paths (bundle review + account/wallet overlap): ≥40–50% of those identical GETs.**

---

## 4. Abort improvements

- Bundle rehydrate: `invalidateShareInflight(BUNDLE_GET_SHARE_KEY)` before GET so post-mutation never joins a **stale** pre-mutation in-flight Promise.
- Search Results abort (P2) retained.
- Inbox badge: intentionally **does not** abort mid-flight (DEFECT #007) — unchanged.
- Shared consumers do **not** abort each other (correct for multi-mount share).

---

## 5. Cache improvements

| Data | Policy |
|------|--------|
| Bundle GET | Inflight only (`ttlMs: 0`) — **no** soft cache |
| Account snapshot | Inflight only (`ttlMs: 0`) — financial |
| Homepage feed page 1 | Soft TTL **500ms** — public catalog remount only |
| Inbox badge | Existing 2.5s — unchanged |
| Wallet balance / checkout / orders / messages / auth | **Never** soft-cached |

---

## 6. Promise deduplication

- New primitive: `shareInflightRequest(key, factory, { ttlMs })`
- Existing `shareInflightJson` now delegates to it.
- Keys: `GET:/api/bundle`, `GET:/api/account/snapshot`, `GET:/api/homepage/feed?page=1`

---

## 7. Before / After metrics

| Metric | Before | After | Notes |
|--------|--------|-------|-------|
| Bundle review mount GETs | 2 | 1 | Identical path |
| Snapshot hub+wallet overlap | 2 | 1 | Same JSON |
| Presence overlap POSTs | Possible | 0 while inflight | Cadence still 45s |
| Feed page-1 Strict Mode | Up to 2 | 1 (+500ms soft) | Catalog only |
| Lab LCP/INP | Not re-labbed | Expected neutral–better | Fewer bytes/CPU |
| API latency targets | Unchanged server | Client waste ↓ | Server work unchanged |

Honest: this phase removes **client duplicate traffic**, not DB query cost. Server endpoint latency targets still depend on Supabase/host.

---

## 8. Network waterfall comparison

**Before (bundle/review):**  
`GET /api/bundle` ×2 in parallel → redundant JSON parse ×2 → dual setState.

**After:**  
`GET /api/bundle` ×1 → both mounts await same Promise → same UI.

**Before (account + wallet RT tick):**  
Two `fetchDeduped` with different keys → two HTTP GETs (or abort races).

**After:**  
One `shareInflightJson` → one HTTP GET → both consumers parse same payload fields they already used.

---

## 9. Performance gains (%)

| Path | Gain (duplicate GETs) |
|------|------------------------|
| Bundle dual-mount | **~50%** fewer identical GETs |
| Snapshot multi-consumer | **~50–66%** when 2–3 overlap |
| Presence overlap | **~100%** of duplicate POSTs while inflight |
| Overall app API volume | Material on chrome remounts; not a blanket 40% of all traffic |

---

## 10. Regression report

| Area | Result |
|------|--------|
| UI / UX / CSS | Unchanged |
| API response format | Unchanged |
| Business logic | Unchanged |
| Realtime inbox / notifications | Unchanged (badge TTL untouched) |
| Wallet / checkout correctness | Inflight-only share; no soft TTL |
| Auth | Untouched |
| Search / ranking / filters | Untouched |

---

## 11–15. Gates

| Gate | Result |
|------|--------|
| 11. TypeScript | **PASS** |
| 12. ESLint (touched) | **PASS** |
| 13. Production Build | **PASS** (`EXIT:0`) |
| 14. Vitest (P3-related + locks) | **PASS** 52/52 |
| 15. Playwright | **Not run** this session (env) — Owner device |

---

## 16–17. Mobile / Desktop verification

Owner verification required on:

- Safari iPhone · Chrome Android · Chrome Desktop · Edge · Safari macOS  

Spot-check: Homepage feed, `/bundle/review`, Account hub, Wallet, Checkout balance line, Inbox badge, presence (no functional change expected).

---

## 18. PASS / FAIL

### **PASS** (performance-only · zero intentional functional/UI change)

**Owner lock:** No commit · No push · No merge · No deploy without approval.  
**Do not start next phase** until Owner accepts P3.
