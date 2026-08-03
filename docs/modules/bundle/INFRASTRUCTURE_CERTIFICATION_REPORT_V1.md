# ROVEXO Bundle Engine v1.0 — LIVE Infrastructure Audit

| Field | Value |
|-------|-------|
| **Date** | 2026-08-01 |
| **Host** | `pklotmwxtnnepaitedic.supabase.co` |
| **Method** | Live PostgREST select + OpenAPI (`/rest/v1/` `application/openapi+json`) via service role |
| **Postgres catalog** | **UNAVAILABLE** — `DATABASE_URL` / `SUPABASE_DB_PASSWORD` missing; pooler password empty |
| **Mutations** | None |
| **Code / migrations changed** | None |
| **Commit / push / deploy** | None |
| **Overall LIVE INFRASTRUCTURE** | **FAIL / NOT PASS** |
| **Phase 3 Live Reservation** | **STOPPED** (infra not PASS) |

Evidence probe (existence only): `test-results/bundle-certification-v1/probe-report.json`  
Note: that probe’s “SQL RLS / unique index” lines are **static migration-file checks**, not live catalog. They are **not** treated as LIVE PASS below.

---

## Gate board

| # | Gate | Result | Live evidence |
|---|------|--------|---------------|
| 1 | `checkout_sessions.bundle_lines` exists | **PASS** | Select OK; OpenAPI `jsonb`, not required, comment matches migration |
| 2a | Table `bundles` | **PASS** | Select OK; OpenAPI present |
| 2b | Table `bundle_items` | **PASS** | Select OK; OpenAPI present |
| 2c | Table `bundle_offers` | **PASS** | Select OK; OpenAPI present |
| 2d | Table `bundle_events` | **PASS** | Select OK; OpenAPI present |
| 3a | Columns · types · nullable · defaults · PKs (OpenAPI) | **PASS** | See section Column matrix |
| 3b | Foreign keys (OpenAPI FK annotations) | **PASS** | See FK matrix |
| 3c | Indexes (unique active buyer, seller/status, item/offer/event) | **FAIL** | Not visible via PostgREST/OpenAPI; no `pg_indexes` access |
| 3d | Unique constraints live (`bundle_id,product_id`, one active per buyer) | **FAIL** | Not visible via OpenAPI; no catalog access |
| 3e | Check constraints live | **FAIL** | Not visible via OpenAPI; no catalog access |
| 3f | ON DELETE cascade/restrict/set null live | **FAIL** | OpenAPI names FKs only; delete actions not exposed |
| 4a | Enum `bundle_status` values | **PASS** | OpenAPI: active, offer_pending, checkout, paid, cancelled, expired, discarded |
| 4b | Enum `bundle_offer_status` values | **PASS** | OpenAPI: pending, countered, accepted, declined, expired, cancelled |
| 5a | RLS enabled (catalog) | **FAIL** | Cannot read `pg_class.relrowsecurity`; empty-table anon SELECT is inconclusive |
| 5b | Policies installed (catalog) | **FAIL** | Cannot read `pg_policies` |
| 5c | `service_role` SELECT | **PASS** | Live select succeeded on all four Bundle tables |
| 5d | `service_role` ALL / write grants | **FAIL** | Not verified (would require catalog or write probe; writes forbidden this audit) |
| 5e | `authenticated` SELECT grant | **FAIL** | Only `anon` key probed without JWT; `authenticated` role grants not proven |
| 6 | Indexes (repeat) | **FAIL** | Same as 3c |
| 7 | Grants (full) | **FAIL** | Partial only (5c); revoke/grant matrix not proven |
| 8 | No migration drift (full schema vs files) | **FAIL** | Columns/enums/FK targets match OpenAPI; indexes/checks/RLS/policies/ON DELETE **unverified** → cannot certify zero drift |

### Aggregate

**LIVE INFRASTRUCTURE CERTIFIED: NO**  
**Phase 3: NOT STARTED**

---

## Column matrix (LIVE OpenAPI vs migration)

### `checkout_sessions.bundle_lines`

| Aspect | Spec | Live |
|--------|------|------|
| Present | yes | **PASS** |
| Type | jsonb | **PASS** |
| Nullable | yes | **PASS** (not required; samples null) |
| Comment | Bundle Checkout / Null = single listing | **PASS** |

### `bundles`

| Column | Spec type | Live format | Required | Default | PK/FK |
|--------|-----------|-------------|----------|---------|-------|
| id | uuid PK | uuid | yes | gen_random_uuid() | PK **PASS** |
| buyer_id | uuid → profiles CASCADE | uuid → profiles.id | yes | — | FK **PASS** (action unverified) |
| seller_id | uuid → profiles RESTRICT | uuid → profiles.id | yes | — | FK **PASS** (action unverified) |
| seller_display_name | text | text | yes | `""` | **PASS** |
| status | bundle_status | public.bundle_status + enum | yes | active | **PASS** |
| currency | text | text | yes | GBP | **PASS** (length check unverified) |
| conversation_id | uuid → conversations SET NULL | uuid → conversations.id | no | — | FK **PASS** (action unverified) |
| order_id | uuid → orders SET NULL | uuid → orders.id | no | — | FK **PASS** (action unverified) |
| checkout_session_id | uuid null (no FK) | uuid, no FK note | no | — | **PASS** |
| created_at | timestamptz | timestamptz | yes | now() | **PASS** |
| updated_at | timestamptz | timestamptz | yes | now() | **PASS** |
| closed_at | timestamptz null | timestamptz | no | — | **PASS** |

### `bundle_items`

| Column | Live | Gate |
|--------|------|------|
| All 12 columns present with expected formats | uuid/text/numeric/integer/timestamptz | **PASS** |
| reserved_quantity default 0 | yes | **PASS** |
| image_url default `""` | yes | **PASS** |
| FK bundle_id → bundles · product_id → products | yes | **PASS** (ON DELETE unverified) |
| unique (bundle_id, product_id) | — | **FAIL** unverified |
| checks qty>0, reserved≥0, unit_price≥0, max_stock>0 | — | **FAIL** unverified |

### `bundle_offers` / `bundle_events`

| Aspect | Live columns/enums/FKs | Indexes / checks / RLS |
|--------|------------------------|-------------------------|
| Columns + enums + FK targets | **PASS** | **FAIL** unverified |

---

## Exact blocker (why NOT PASS · why Phase 3 stopped)

**Root cause:** Live Postgres catalog cannot be queried from this environment.

Missing:

- `DATABASE_URL` / `DIRECT_URL` / `SUPABASE_DB_PASSWORD` (pooler URL present, password empty)
- `SUPABASE_ACCESS_TOKEN` (no Management SQL API)

Without catalog SELECT on `pg_indexes`, `pg_constraint`, `pg_policies`, `pg_class.relrowsecurity`, and role privileges, these Owner-required gates remain unproven:

1. Indexes  
2. Unique constraints  
3. Check constraints  
4. FK ON DELETE rules  
5. RLS enabled  
6. Policies  
7. Full grants  

**Fail-closed rule:** incomplete live proof ≠ PASS. Phase 3 Live Reservation **must not** start.

---

## Owner unblock (read-only)

Provide `SUPABASE_DB_PASSWORD` or `DATABASE_URL`, **or** run this in Supabase SQL Editor and return the result sets:

```sql
-- READ ONLY — Bundle infrastructure catalog audit
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('bundles','bundle_items','bundle_offers','bundle_events');

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('bundles','bundle_items','bundle_offers','bundle_events')
ORDER BY tablename, policyname;

SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('bundles','bundle_items','bundle_offers','bundle_events')
ORDER BY tablename, indexname;

SELECT conrelid::regclass AS table_name, conname, pg_get_constraintdef(oid) AS def
FROM pg_constraint
WHERE conrelid::regclass::text IN ('bundles','bundle_items','bundle_offers','bundle_events')
ORDER BY 1, 2;

SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('bundles','bundle_items','bundle_offers','bundle_events')
ORDER BY table_name, grantee, privilege_type;
```

After catalog evidence is available, re-run Infrastructure Certification. Only if **every** gate above is PASS may Phase 3 continue.
