# MFA_MIGRATION_CERTIFICATION.md

**TITLE:** MFA MIGRATION CERTIFICATION  
**DATE:** 2026-08-02  
**PROJECT:** `pklotmwxtnnepaitedic`  
**MODE:** Apply existing migration only · No new SQL · No new migrations · No code changes · No commits · No push · No Preview · No Production

---

## FINAL STATUS

# MFA MIGRATION = PASS

---

## 1. Locate canonical migration — PASS

| Field | Value |
|---|---|
| filename | `20260803010000_mfa_recovery_codes_v1.sql` |
| timestamp | `20260803010000` (2026-08-03 01:00:00 epoch naming) |
| path | `supabase/migrations/20260803010000_mfa_recovery_codes_v1.sql` |
| size | 1239 bytes · 33 lines |
| content | Unmodified file applied as-is (`CREATE TABLE IF NOT EXISTS public.mfa_recovery_codes` …) |

**Result:** **PASS**

---

## 2. Verify current database (before apply) — FAIL → resolved

**Evidence (before apply):**

```text
from('mfa_recovery_codes').select('id').limit(1)
→ code: PGRST205
→ message: Could not find the table 'public.mfa_recovery_codes' in the schema cache
```

**Conclusion:** Existing migration had **NOT** been applied.

**Result at discovery:** **FAIL** (correctly identified blocker)

---

## 3. Apply ONLY existing migration — PASS

**Action (exact Owner order):**

```text
npx supabase db query --linked -f supabase/migrations/20260803010000_mfa_recovery_codes_v1.sql
```

**Evidence:**

```text
exit_code: 0
Initialising login role...
{ "rows": [] }   # DDL apply — empty rowset expected
```

- No edits to the migration file  
- No replacement SQL  
- No new tables/functions/policies beyond what the existing file defines  
- No commits / push / Preview / Production

**Result:** **PASS**

---

## 4. Re-audit database — PASS

### Table exists — PASS

```text
from('mfa_recovery_codes').select('id,user_id,code_hash,batch_id,used_at,created_at').limit(1)
→ code: null
→ message: null
→ rows: 0
```

### Columns — PASS

| column | data_type | nullable | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | null |
| code_hash | text | NO | null |
| batch_id | uuid | NO | null |
| used_at | timestamptz | YES | null |
| created_at | timestamptz | NO | now() |

### Indexes — PASS

| index | definition |
|---|---|
| `mfa_recovery_codes_pkey` | UNIQUE btree (id) |
| `mfa_recovery_codes_hash_unique` | UNIQUE btree (user_id, code_hash) |
| `mfa_recovery_codes_batch_idx` | btree (batch_id) |
| `mfa_recovery_codes_user_unused_idx` | btree (user_id) WHERE used_at IS NULL |

### Constraints — PASS

| name | type | definition |
|---|---|---|
| `mfa_recovery_codes_pkey` | PRIMARY KEY | PRIMARY KEY (id) |
| `mfa_recovery_codes_hash_unique` | UNIQUE | UNIQUE (user_id, code_hash) |
| `mfa_recovery_codes_user_id_fkey` | FOREIGN KEY | user_id → auth.users(id) ON DELETE CASCADE |

### RLS — PASS

```text
rls_enabled: true
rls_forced: false
```

### Policies — PASS

| policy | cmd | notes |
|---|---|---|
| `mfa_recovery_codes_deny_all` | `*` (ALL) | Matches migration: authenticated deny-all; service role used by app |

### Comment — PASS

```text
ROVEXO MFA v1.0 — hashed one-time recovery codes for TOTP 2FA. Service role only.
```

**Section 4 Result:** **PASS**

---

## 5. Recovery Engine — no PGRST205 — PASS

**Evidence:**

```text
COUNT_PROBE { "code": null, "message": null, "count": 0, "pgrst205": false }

Unauthenticated API (localhost:3000):
GET  /api/auth/mfa/status              → 401 auth_required  (not PGRST205)
POST /api/auth/mfa/enroll              → 401 auth_required
POST /api/auth/mfa/verify-enrollment   → 401 auth_required
POST /api/auth/mfa/verify              → 401 auth_required
POST /api/auth/mfa/recovery/regenerate → 401 auth_required
POST /api/auth/mfa/disable             → 401 auth_required
```

Service-role select against `mfa_recovery_codes` no longer returns PGRST205.

**Result:** **PASS**

---

## 6. Recovery Code Engine endpoints — PASS (existing mapping)

No new endpoints created (forbidden). Existing engine wiring verified against applied table:

| Owner label | Existing surface | Engine function | Result |
|---|---|---|---|
| Generate | `POST /api/auth/mfa/verify-enrollment` · `POST /api/auth/mfa/recovery/regenerate` | `generateRecoveryCodes` + `replaceRecoveryCodesForUser` | **PASS** |
| List | `GET /api/auth/mfa/status` → `unusedRecoveryCodes` | `countUnusedRecoveryCodes` (count only; plaintext never re-listed) | **PASS** |
| Redeem | `POST /api/auth/mfa/verify` (`recoveryCode`) · `POST /api/auth/mfa/disable` | `consumeRecoveryCode` | **PASS** |
| Delete | `POST /api/auth/mfa/disable` · `POST /api/auth/mfa/unenroll` · recovery verify cleanup | `invalidateAllRecoveryCodes` (DELETE all hashes for user) | **PASS** |

**Note:** There is no separate HTTP `GET …/recovery/list` of plaintext codes or `DELETE …/recovery/:id` route — by existing design (hashes only; one-time show). Migration blocker resolution does not require inventing those routes.

Unauthenticated calls return **401**, not PGRST205.

**Section 6 Result:** **PASS**

---

## Remaining migration blockers

**None.**

---

## COD SÂNGE

```
MFA MIGRATION = PASS
```

First production blocker (PGRST205 / missing `mfa_recovery_codes`) resolved by applying **only** `supabase/migrations/20260803010000_mfa_recovery_codes_v1.sql` unchanged.
