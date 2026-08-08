# ROVEXO — ORGANIC GROWTH ENGINE v1.0  
## WAVE 0 — CORE SEO GOVERNANCE CERTIFICATION

| Field | Value |
|-------|-------|
| Status | **WAVE 0 COMPLETE** · LOCAL ONLY (no commit / push / deploy) |
| Version | 1.0 |
| Date | 2026-08-08 |
| Scope | Engines 01–04 only |
| Host | `http://127.0.0.1:3000` |
| Performance Program | **UNTOUCHED** |

**Legend:** `PASS` · `FAIL` · `PARTIAL` · `NOT VERIFIED` · `BLOCKED`

---

## 1. Existing implementation reused

| Existing SSOT | Reuse mode |
|---------------|------------|
| `lib/seo/engine/config.ts` (`MIN_INVENTORY_*`, quality thresholds) | **REUSE** |
| `lib/seo/engine/index-control.ts` (private paths, filter/search noindex) | **REUSE** via Protection |
| `lib/seo/engine/faceted-seo.ts` · `quality.ts` · `deduplication.ts` · `zero-results.ts` | **REUSE** (platform pipeline) |
| `lib/seo/metadata.ts` `buildPageMetadata` / `getAppUrl()` | **REUSE** via Canonical |
| `lib/seo/engine/platform.ts` Organic Growth v4 pipeline | **EXTEND** — final Eligibility gate |
| `app/robots.ts` + `AUTH_PROTECTED_PREFIXES` | **REUSE** (not replaced) |
| Multi-shard sitemaps | **REUSE** (not replaced) |
| `JsonLdScript` + `lib/seo/json-ld.ts` | **REUSE** (Eligibility signals SD allow) |
| Product `status` enum (`published`/`sold`/`deleted`/…) | **REUSE** for Lifecycle |
| P0-01 public Homepage middleware | **UNCHANGED** |

**No** `eligibility-v2` / `canonical-v2` / parallel sitemap/robots/JSON-LD systems.

---

## 2. Existing SSOT locations

| Concern | Path |
|---------|------|
| Eligibility orchestrator | `lib/seo/engine/eligibility.ts` |
| Protection / anti-bloat | `lib/seo/engine/protection.ts` |
| Canonical authority | `lib/seo/engine/canonical.ts` |
| Indexation lifecycle | `lib/seo/engine/lifecycle.ts` |
| Barrel exports | `lib/seo/engine/index.ts` |
| Platform wiring | `lib/seo/engine/platform.ts` |
| Tests | `tests/organic-growth-wave0-governance.test.ts` |

---

## 3. Files modified / added

| File | Change |
|------|--------|
| `lib/seo/engine/eligibility.ts` | **Added** — final gate |
| `lib/seo/engine/protection.ts` | **Added** — anti-bloat |
| `lib/seo/engine/canonical.ts` | **Added** — absolute canonical |
| `lib/seo/engine/lifecycle.ts` | **Added** — ACTIVE…NOT_FOUND policies |
| `lib/seo/engine/index.ts` | Export Wave 0 |
| `lib/seo/engine/platform.ts` | Wire Eligibility into `buildOrganicGrowthContext` |
| `tests/organic-growth-wave0-governance.test.ts` | **Added** |
| `docs/audits/ROVEXO_ORGANIC_GROWTH_WAVE0_CERTIFICATION_v1.md` | **Added** (this file) |

Unrelated prior Organic Growth Phase 1 / P0-01 working-tree files remain present but were **not** reworked in Wave 0.

---

## 4. Eligibility architecture

```
DATA → CONTENT STATE → QUALITY → DUPLICATE → INVENTORY
→ INTENT → CANONICAL → PROTECTION → ELIGIBILITY → INDEXATION
```

`evaluateSeoEligibility()` returns: `eligible`, `reason(s)`, `indexation`, `canonical`, `lifecycle`, `protection`, `sitemapEligible`, `structuredDataEligible`.

Fail closed: unknown / EXPIRED unverified / protection fail → **not INDEX**.

Platform: `indexable = pipeline && eligibility.eligible && indexation === "INDEX"`.

---

## 5. Protection architecture

`evaluateSeoProtection()` before eligibility grant:

- API → `BLOCK_EXCLUDE`
- Auth public (login/…) → `BLOCK_NOINDEX`
- `AUTH_PROTECTED_PREFIXES` / private paths → `BLOCK_EXCLUDE`
- Soft unavailable → `BLOCK_NOINDEX`
- Invalid taxonomy → `BLOCK_NOINDEX`
- Search `?q` → `BLOCK_NOINDEX`
- >2 filters / facet explosion → `BLOCK_NOINDEX`
- Empty / thin inventory → `BLOCK_NOINDEX`
- High duplicate risk → `BLOCK_NOINDEX`

---

## 6. Canonical architecture

`resolveSeoCanonical()` / helpers:

- Absolute via `getAppUrl()`
- Homepage → `{origin}/` trailing slash
- Non-root → no trailing slash
- Strip tracking + non-allowed query params
- Never emit `/login` as canonical (`valid: false`)
- One authority — no second generator

---

## 7. Lifecycle architecture

| State | Indexation | HTTP policy | Sitemap | SD | Verified |
|-------|------------|-------------|---------|----|----------|
| ACTIVE | INDEX | 200 | Yes | Yes | **PASS** |
| SOLD | **INDEX** + OutOfStock | 200 | Yes | Yes | **PASS** (Owner) |
| EXPIRED | **NOT_VERIFIED** | null (no 410 invented) | No | No | **NOT VERIFIED** |
| DELETED | NOINDEX | soft 200 | No | No | **PASS** |
| UNAVAILABLE | NOINDEX | soft 200 | No | No | **PASS** |
| NOT_FOUND | NOINDEX | soft 200 | No | No | **PASS** |

`product_status` has **no** `expired` value — EXPIRED→410 remains **NOT VERIFIED**.

---

## 8. Sitemap integration

No second sitemap. Eligibility exposes `sitemapEligible` for future shard consumers. Wave 0 does **not** rewrite generators. Existing multi-shard system remains canonical. **PARTIAL** wiring (signal ready; generators not yet mandatory consumers).

---

## 9. Robots integration

`app/robots.ts` unchanged in Wave 0. Protection aligns with `AUTH_PROTECTED_PREFIXES` + Phase 1 Disallow parity. Page-level noindex remains required for soft-unavailable / search queries. Coherence: **PASS** (no robots rewrite).

---

## 10. JSON-LD integration

No new JSON-LD system. Platform clears structured data graph when `structuredDataEligible` is false. Server `JsonLdScript` unchanged. **PASS**.

---

## 11. Test results

| Suite | Result |
|-------|--------|
| `tests/organic-growth-wave0-governance.test.ts` | **23/23 PASS** |
| `tests/seo-engine-v3.test.ts` · `v4` · Phase 1 · P0-01 | **PASS** (56 total across focused SEO set) |
| TypeScript | **PASS** |
| ESLint (Wave 0 files) | **PASS** |
| Production build | **PASS** |

---

## 12. Route regression (guest localhost)

| Route | HTTP | Result |
|-------|------|--------|
| `/` | 200 | **PASS** (P0-01 preserved) |
| `/login` `/search` `/browse` `/categories` | 200 | **PASS** |
| `/account` `/wallet` `/orders` `/inbox` `/messages` `/notifications` `/sell` `/checkout` `/admin` `/super-admin` | 307 → login | **PASS** |

---

## 13. Performance regression

| Check | Result |
|-------|--------|
| Performance Program files | Not modified · **PASS** |
| New global CSS / providers / client SEO | None · **PASS** |
| New large dependency | None · **PASS** |
| Duplicate Homepage | None · **PASS** |
| Production PageSpeed re-measure | **NOT VERIFIED** (no deploy) |

---

## 14. Security verification

Private routes remain auth-gated + SEO `EXCLUDE`/`NOINDEX`. Public SEO uses public marketplace signals only. Draft/paused/reserved → non-INDEX. **PASS**.

---

## 15. P0 findings

| Item | Wave 0 |
|------|--------|
| Eligibility final gate | **PASS** (orchestrator + platform wire) |
| Soft-200 NOINDEX | **PASS** preserved |
| SOLD KEEP INDEXED | **PASS** preserved |
| Homepage public | **PASS** unchanged |

---

## 16. P1 findings

| Item | Wave 0 |
|------|--------|
| Sitemap generators consuming `sitemapEligible` | **PARTIAL** — signal only |
| Universal route `generateMetadata` using Eligibility | **PARTIAL** — organic platform wired; listing routes still use existing metadata (compatible policies) |
| Production deploy of governance | **NOT VERIFIED** |

---

## 17. NOT VERIFIED

- EXPIRED → 410 (no `expired` in `product_status`)
- Production HTML after deploy
- Full sitemap generator mandatory filter by Eligibility
- Every App Router page calling Eligibility (only Organic Growth context + exported API)
- Owner PageSpeed after Wave 0

---

## 18. BLOCKED

**None** for Wave 0 local gates.

---

## 19. Remaining Owner decisions

1. Authorise sitemap generators to **require** `sitemapEligible`.  
2. Define EXPIRED business state if/when it exists — until then keep NOT_VERIFIED.  
3. Deploy Phase 1 + P0-01 + Wave 0 working tree.  
4. Start Wave 1 only after Owner review of this certification.

---

## 20. Wave 0 final verdict

| Gate | Result |
|------|--------|
| Eligibility / Protection / Canonical / Lifecycle | **PASS** |
| Reuse existing Organic Growth v4 | **PASS** |
| No UI / Perf / Merchant / Programmatic expansion | **PASS** |
| Tests · TS · ESLint (Wave 0) · Build · Route smoke | **PASS** |
| Production certification | **NOT claimed** |
| Overall | **WAVE 0 COMPLETE** (local) |

**DO NOT start Wave 1 without Owner approval.**
