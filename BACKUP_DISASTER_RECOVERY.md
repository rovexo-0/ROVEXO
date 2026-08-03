# ROVEXO BACKUP — DISASTER RECOVERY v1.0

**Purpose:** Recover ROVEXO **development / Free Plan** environments using Backup Engine v1.0 artifacts when Supabase Pro PITR is unavailable.

**Related:** `BACKUP_ENGINE_V1_SPEC.md` · `BACKUP_OWNER_GUIDE.md` · `BACKUP_RESTORE_GUIDE.md` · `docs/PRODUCTION_OPERATIONS.md`

## RPO / RTO (development targets)

| Metric | Target (Owner-adjustable) |
|--------|---------------------------|
| RPO | ≤ last successful `npm run backup` (schedule daily → ~24h) |
| RTO | ≤ 4 hours for DB + storage restore on a Free project |

These are **development** targets, not a substitute for Production Pro PITR when Owner upgrades.

## Disaster classes

| Class | Response |
|-------|----------|
| Local machine loss | Restore from off-machine copy of `.rovexo-backups/` (Owner must sync offsite) |
| Free project wiped | Create new Supabase Free project → restore DB dump → restore storage → restore env |
| Bad migration / data corruption | Restore older `run-*` dump epoch → verify schema |
| Accidental env wipe | Restore `env.local.copy` |

## Offsite rule (Owner)

`.rovexo-backups/` is gitignored. For real DR:

1. After each PASS backup, copy `run-<TS>/` to encrypted external disk or private object storage.  
2. Never upload dumps to public buckets.  
3. Encrypt at rest (Owner tooling).

## Recovery order

1. **Stabilize** — stop writes / enable Super Admin Safe Mode if production-like.  
2. **Database** — restore dump (`BACKUP_RESTORE_GUIDE.md` §1).  
3. **Storage** — restore buckets (§2).  
4. **Environment** — restore secrets on Owner machine / Vercel (§3).  
5. **Verify** — schema · health · login · sample listing image.  
6. **Stripe / cron** — re-check webhook + cron secrets if project URL changed (`docs/PRODUCTION_OPERATIONS.md`).  
7. **Record** — date, runId, RTO achieved in Owner ops log.

## What Backup Engine does NOT replace

- Supabase Pro **Point-in-Time Recovery** for Production  
- Cross-region replication  
- Continuous WAL archiving  

When Production requires sub-hour RPO, Owner enables Supabase Pro backups/PITR **in addition** to this Free Plan engine.

## Contacts / ownership

- Engine SSOT: `lib/backup-engine-v1/`  
- Ops runbook: this file + Owner Guide  
- App Recovery Center: displays latest engine report (does not execute restores)
