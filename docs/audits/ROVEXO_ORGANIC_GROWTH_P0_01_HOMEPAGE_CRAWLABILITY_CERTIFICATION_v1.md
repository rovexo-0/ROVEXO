# ROVEXO — ORGANIC GROWTH ENGINE v1.0  
## P0-01 HOMEPAGE CRAWLABILITY CERTIFICATION

| Field | Value |
|-------|-------|
| Status | **COMPLETE** · WORKING TREE ONLY (no commit / push / deploy) |
| Version | 1.0 |
| Date | 2026-08-08 |
| Scope | **P0-01 only** — public guest access to canonical `/` |
| Host evidence | `http://127.0.0.1:3000` |
| Performance Program | **UNTOUCHED** |

**Legend:** `PASS` · `FAIL` · `PARTIAL` · `NOT VERIFIED` · `BLOCKED`

---

## Previous behaviour

| Request | Result |
|---------|--------|
| Guest `GET /` | **307** → `/login` |
| Cause | `lib/supabase/middleware.ts` → `updateSession()` cold-start block: `if (!user && (pathname === "/" \|\| pathname === ""))` → redirect `/login` |
| Authenticated `GET /` | Homepage 200 (unchanged historically) |

---

## New behaviour

| Request | Result |
|---------|--------|
| Guest `GET /` | **HTTP 200** → canonical Homepage (`app/(platform)/page.tsx` → `CanonicalHomepage`) |
| Authenticated `GET /` | **HTTP 200** → same Homepage (no new route, no guest Homepage) |
| Cloaking / UA branching | **None** |

Localhost smoke (2026-08-08): `GET /` → **200** (no `Location` header).

---

## Exact middleware / auth change

| Item | Detail |
|------|--------|
| File | `lib/supabase/middleware.ts` |
| Function | `updateSession` |
| Removed | Cold-start guest redirect for `pathname === "/"` / `""` |
| Retained | Splash/Welcome → Login; `AUTH_PROTECTED_PREFIXES` guest → `/login?next=…`; MFA; admin/super-admin role gates; session refresh |
| Root `middleware.ts` | Unchanged (staff-host `/` → `/staff` only) |
| Second auth system | **Not created** |

---

## Files modified (this P0-01 delta)

| File | Change |
|------|--------|
| `lib/supabase/middleware.ts` | Remove guest `/` → login redirect; P0-01 comment |
| `tests/organic-growth-p0-01-homepage-crawlability.test.ts` | **Added** focused permanent guards |
| `tests/organic-growth-phase1-seo-foundation.test.ts` | Update P0-01 assertion (blocker → unlock) |
| `docs/audits/ROVEXO_ORGANIC_GROWTH_P0_01_HOMEPAGE_CRAWLABILITY_CERTIFICATION_v1.md` | **Added** (this file) |

**Working-tree note:** Prior Owner-approved Phase 1 SEO foundation files remain modified/untracked in the same tree (robots, JsonLdScript, layout canonical, brand JSON-LD, Phase 1 docs/tests). They were **not** reworked in P0-01. No Performance Program / UI / checkout / wallet files touched.

---

## Public data verification

| Dependency | Class | Notes |
|------------|-------|-------|
| `fetchHomepageFeed` | **PUBLIC** | Marketplace listings feed |
| `fetchShowcaseSellerSections` | **PUBLIC** | Public showcase |
| `listActivePreferredMarketplaceStores` | **PUBLIC** | Preferred stores catalogue |
| `getPlatformVisualConfig({ mode: "live" })` | **PUBLIC** | Default visual config |
| `homePageJsonLd` / `JsonLdScript` | **PUBLIC** | Existing SEO structured data |
| `CanonicalHomepage` / shells | **PUBLIC** UI | Same implementation for all visitors |
| `awaitCheckoutSessionSelfHeal` | **PUBLIC-safe** | Fail-closed; no UI private data |

---

## Private data verification

| Dependency | Class | Guest exposure |
|------------|-------|----------------|
| `getAuthContext` / `getUserRole` | **PRIVATE** (optional) | Only when `?visualPreview=draft` **and** `super_admin` — guests never enter draft mode |
| Wallet / orders / inbox / account APIs | **PRIVATE** | Not called by Homepage SSR path |
| Session cookies | Existing Supabase middleware | Refresh still runs; no private fields rendered on Homepage for guests |

**Verdict:** Guest Homepage = public marketplace data only. **PASS** (source audit). No architectural expansion required.

---

## Protected-route matrix (guest smoke)

| Route | HTTP | Location | Result |
|-------|------|----------|--------|
| `/account` | 307 | `/login?next=%2Faccount` | **PASS** |
| `/account/settings` | 307 | `/login?next=%2Faccount%2Fsettings` | **PASS** |
| `/wallet` | 307 | `/login?next=%2Fwallet` | **PASS** |
| `/balance` | 308 | `/wallet` (then auth) | **PASS** |
| `/orders` | 307 | `/login?next=%2Forders` | **PASS** |
| `/inbox` | 307 | `/login?next=%2Finbox` | **PASS** |
| `/messages` | 307 | `/login?next=%2Fmessages` | **PASS** |
| `/notifications` | 307 | `/login?next=%2Fnotifications` | **PASS** |
| `/sell` | 307 | `/login?next=%2Fsell` | **PASS** |
| `/checkout` | 307 | `/login?next=%2Fcheckout` | **PASS** |
| `/business` | 308 | `/business/dashboard` | **PASS** (chain) |
| `/admin` | 307 | `/login?next=%2Fadmin` | **PASS** |
| `/super-admin` | 307 | `/login?next=%2Fsuper-admin` | **PASS** |

---

## Public route regression

| Route | Guest HTTP | Result |
|-------|------------|--------|
| `/` | **200** | **PASS** |
| `/login` | 200 | **PASS** |
| `/search` | 200 | **PASS** |
| `/browse` | 200 | **PASS** |
| `/categories` | 200 | **PASS** |

Listing links present in homepage HTML (examples: `/listing/cabeau-…`, `/listing/professional-2800w-…`).

---

## SEO verification (guest `GET /` HTML)

| Check | Evidence | Result |
|-------|----------|--------|
| HTTP 200 | curl | **PASS** |
| Title | `ROVEXO – Buy & Sell with Confidence \| ROVEXO` | **PASS** |
| Meta description | UK marketplace copy | **PASS** |
| Canonical link | Present (`rel="canonical"`) | **PASS** |
| Canonical absolute production URL | Localhost env → `http://localhost:3000` (no trailing slash in rendered tag) | **PARTIAL** — production uses `NEXT_PUBLIC_APP_URL`; trailing-slash normalisation **NOT VERIFIED** vs `https://www.rovexo.co.uk/` |
| JSON-LD | `#rovexo-organization-jsonld` + `#jsonld-app-(platform)-page-tsx` | **PASS** |
| Crawlable internal links | `/listing/…`, `/browse` in HTML | **PASS** |
| No cloaking | Same route for all UAs | **PASS** |

---

## Security verification

| Check | Result |
|-------|--------|
| Auth middleware still active | **PASS** |
| Only `/` made public | **PASS** |
| Protected prefixes unchanged | **PASS** |
| No global auth bypass | **PASS** |
| No second Homepage / guest Homepage | **PASS** |
| No private wallet/order/message data on `/` | **PASS** (source) |

---

## Gates

| Gate | Result |
|------|--------|
| TypeScript | **PASS** |
| ESLint | **PASS** (0 errors; pre-existing warnings) |
| Focused tests | **PASS** — `organic-growth-p0-01-homepage-crawlability.test.ts` + Phase 1 suite (13 tests) |
| Production build | **PASS** |
| Performance Program modified | **No** · **PASS** |

---

## Performance regression status

No new providers, global CSS, SEO libraries, or Performance Program edits.  
Owner PageSpeed re-measure after deploy: **NOT VERIFIED** (no deploy).

---

## Remaining risks

1. Auth Master / guest-entry docs still describe historical “guest cold start → Login” for app open — narrative drift until Owner updates freezes/docs.  
2. Dev HTML shows a pre-existing `BAILOUT_TO_CLIENT_SIDE_RENDERING` marker for some client subtree; listing links + metadata still in HTML. Full production SSR purity of every Homepage island: **NOT VERIFIED** (pre-existing, not introduced by P0-01).  
3. Localhost canonical host ≠ production host until deploy with production `NEXT_PUBLIC_APP_URL`.

---

## NOT VERIFIED

- Authenticated browser session visual parity (no auto-login)  
- Production `https://www.rovexo.co.uk/` live guest 200 after deploy  
- Exact trailing-slash canonical on production HTML  
- Owner PageSpeed Mobile score after change  
- Full private-data DOM audit beyond Homepage server dependencies  

---

## BLOCKED

**None** for P0-01 success criteria on localhost.

---

## Final certification

Guest `/` → **200** Homepage · protected routes remain gated · TypeScript/ESLint/tests/build **PASS** · Performance Program untouched · no commit/push/deploy.

**WAIT FOR OWNER REVIEW.**
