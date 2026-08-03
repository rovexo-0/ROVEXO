# ROVEXO BACKUP RESTORE GUIDE v1.0

**Warning:** Restore can overwrite data. Use a **staging** database / empty project first. Never restore blindly onto live Production without Owner approval.

## 0. Pre-checks

```bash
npm run backup:verify
# Confirm .rovexo-backups/latest.json result PASS
```

Identify artifacts:

```bash
ls -la .rovexo-backups/run-*/
```

## 1. Restore Database

### Option A — `psql` + gunzip

```bash
gunzip -c .rovexo-backups/run-<TS>/backup-<TS>.sql.gz | psql "$DATABASE_URL"
```

### Option B — Supabase CLI project

1. Create / select a target Free project.  
2. Link CLI.  
3. Apply dump with Owner-approved method (`psql` to pooler URL or SQL editor for small dumps).  
4. Run:

```bash
psql "$DATABASE_URL" -f scripts/verify-schema.sql
```

### Verification

- Schema verify script PASS  
- `/api/health` database healthy (if app running)  
- Spot-check critical tables (Owner)

### Rollback

- Keep previous dump epochs under `.rovexo-backups/run-*` (retention keeps last N).  
- Re-restore an older `backup-*.sql.gz` if the new restore fails.

## 2. Restore Storage

```bash
mkdir -p /tmp/rovexo-storage-restore
tar -xzf .rovexo-backups/run-<TS>/storage-<TS>.tar.gz -C /tmp/rovexo-storage-restore
```

Upload each bucket folder with Supabase Dashboard or a one-off script using the **service role** (Owner machine only).

### Verification

- Bucket list matches backup report `storage.buckets`  
- Sample image URLs load  

### Rollback

- Re-upload from an older `storage-*.tar.gz` epoch.

## 3. Restore Environment

```bash
# Owner workstation only
cp .rovexo-backups/run-<TS>/env.local.copy .env.local
# Review keys via env-names.json — do not commit
```

If `vercel-env-pull.env` exists, compare names only; paste values via Vercel Dashboard (never commit).

### Verification

```bash
npm run verify:env
npm run typecheck
```

### Rollback

- Restore previous `.env.local` from password manager / prior `env.local.copy`.

## 4. Full verification checklist

| Step | Command / check | ☐ |
|------|-----------------|---|
| Dump integrity | `sha256sum backup-*.sql.gz` matches report | ☐ |
| DB restore | `verify-schema.sql` | ☐ |
| Storage | buckets + sample objects | ☐ |
| Env | `verify:env` | ☐ |
| App smoke | Login + health (local) | ☐ |

## 5. CLI helper

```bash
npm run backup:restore
```

Prints the same high-level steps without executing a restore.
