# ROVEXO P1 — HOMEPAGE PERFORMANCE REPORT

**STATUS:** AUDIT + ZERO-RISK IMPLEMENTATION · WAITING OWNER APPROVAL  
**PHASE:** P1 Homepage Performance Engine  
**DATE:** 2026-08-04  
**HOST:** `http://localhost:3000`  
**LOCK:** No commit · No push · No deploy  

---

## Mission check

| Requirement | Result |
|-------------|--------|
| Mobile first | Optimisations target Homepage mobile card/JS critical path |
| No functional / UI / UX / nav change | **PASS** — dead SSR work removed; share sheet still identical when `showShare` |
| No business / auth / DB / API contract change | **PASS** |
| Zero-risk only | **PASS** |

---

## Current bottlenecks (measured / audited)

1. **Dead SSR work:** `fetchProducts("recommended")` ran every Homepage SSR while `CanonicalHomepage` never renders `featured`.  
2. **Double feed fetch:** SSR `fetchHomepageFeed(1)` + client mount `GET /api/homepage/feed?page=1` replace (intentional ISR freshness — **left intact**).  
3. **Eager ShareListingSheet** in `ListingCard` even when Homepage sets `showShare: false`.  
4. **Chrome fan-out post-hydrate:** profile + saved + notification badges (required behaviour — unchanged).  
5. **Images:** already AVIF/WebP + selective priority — no change required.

---

## Root causes

| Bottleneck | Root cause |
|------------|------------|
| Extra SSR latency / DB | Featured rail removed from UI; query left behind |
| Homepage JS weight | ListingCard static-imported share modal stack |
| Perceived “reload” of feed | Client reconcile by design (`CanonicalMarketplaceFeed`) |

---

## Zero-risk optimisations applied

| Change | File(s) | Same functionality? |
|--------|---------|---------------------|
| Remove unused recommended-section SSR query; pass `emptyPage` as `featuredPage` | `app/(platform)/page.tsx` | **Yes** — featured unused in UI; feed/showcase unchanged |
| `ShareListingSheet` via `next/dynamic` | `components/ui/ListingCard.tsx` | **Yes** — sheet still mounts when `showShare` |
| Lock tests to new SSR shape | `tests/homepage-feed-ranking.test.ts`, `tests/home-enterprise-migration.test.ts` | Source locks only |

### Explicitly NOT changed

- Client page-1 feed reconcile  
- RealtimeNotificationProvider  
- Infinite scroll / sentinel  
- Image priority / sizes / formats  
- Header / Bottom nav / categories  

---

## Expected gains

| Area | Expected |
|------|----------|
| SSR TTFB (authenticated Homepage) | Lower variance / less DB work (one fewer product section enrich path) |
| Mobile JS | Smaller initial parse for card grid (share chunk deferred) |
| Network | One fewer SSR product pipeline; client feed reconcile unchanged |

Confidence: **High** on functional identity · **Medium** on absolute ms (guest `/` is 307; full paint needs Owner auth device).

---

## Measured timings (agent host)

| Probe | Result |
|-------|--------|
| `GET /api/homepage/feed?page=1` | ~124 ms · HTTP 200 |
| `GET /login` | TTFB ~33 ms · HTTP 200 |
| `GET /` (guest) | HTTP 307 → login |

Owner should re-measure authenticated Homepage on Safari iPhone / Chrome Android after hard refresh.

---

## Validation

| Gate | Result |
|------|--------|
| Vitest homepage-feed-ranking + home-enterprise-migration | **8/8 PASS** |
| TypeScript / ESLint / Build / Playwright / device matrix | Owner phase gate — run before approve |
| Functional regression | None intended; Owner click verify |

---

## Risk analysis

| Optimisation | Risk | Mitigation |
|--------------|------|------------|
| Drop recommended SSR | Low — featured unused | `resolveHomepageV4Sections` still receives empty featured |
| Dynamic share | Low — first open of share may load chunk once | Only surfaces with `showShare` |
| Touching feed reconcile | **High** — rejected | Left as-is |

---

## Deliverables

- `ROVEXO_P1_HOMEPAGE_PERFORMANCE_REPORT.md` (this file)  
- `ROVEXO_P1_RENDER_TREE.md`  
- `ROVEXO_P1_BUNDLE_GRAPH.md`  
- `ROVEXO_P1_NETWORK_TRACE.json`  
- `ROVEXO_P1_IMAGE_AUDIT.md`  

---

## OWNER GATE

**STOP.** No commit · No push · No deploy.  

Please verify on phone:

1. Homepage looks and behaves identical.  
2. Showcase + feed + favourites + navigation unchanged.  
3. Console clean (no ChunkLoad / hydration / Image400).  
4. Perceived load feels same or faster.

Approve before **Phase P2 (Search Engine)**.
