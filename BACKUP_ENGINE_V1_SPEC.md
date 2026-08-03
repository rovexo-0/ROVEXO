# ROVEXO BACKUP ENGINE v1.0 — SPECIFICATION

**STATUS:** CANONICAL SSOT  
**ID:** `backup-engine-v1`  
**Equation:** ONE BACKUP ENGINE = ONE SSOT = FREE PLAN = NO SUPABASE PRO DEPENDENCY  

## Scope

Development / Owner-machine / CI-capable backups that do **not** require Supabase Pro PITR.

Does **not** modify: marketplace Application UI, Checkout, Wallet, Orders, Realtime, DB schema, migrations, API contracts.

## Singularity

| Concern | Owner |
|---------|--------|
| Engine | `lib/backup-engine-v1/` |
| CLI | `scripts/backup-engine/run-backup.ts` |
| Recovery Center bridge | `lib/backup-engine-v1/recovery-bridge.ts` → `lib/recovery-center-engine/reader.ts` |
| Artifacts | `.rovexo-backups/` (gitignored) |
| Latest report | `.rovexo-backups/latest.json` + root `BACKUP_REPORT.md` |

Forbidden: second backup engines, parallel dump scripts, Pro-only APIs as hard requirement.

## Capabilities

### Database

- Auto-detect: Supabase CLI `db dump --linked` → else `pg_dump` + `DATABASE_URL`
- Output: `backup-<YYYYMMDD-HHMMSS>.sql.gz`
- Checksum: SHA-256

### Storage

- List all buckets via service role
- Download all objects
- Archive: `storage-<stamp>.tar.gz` when `tar` exists

### Environment

- Key names → `env-names.json`
- Copy `.env.local` → `env.local.copy` (never logged)
- Optional `vercel env pull` when CLI + `VERCEL_TOKEN` present

### Retention

- `BACKUP_RETENTION_COUNT` (default **30**)
- Deletes oldest `run-*` directories

### Verification

After each run: dump exists · size &gt; 0 · checksum · storage copied/skipped · PASS/FAIL

### Restore

CLI `--scope=restore` prints Owner steps only (no silent production restore).

### Schedulers

Examples under `scripts/backup-engine/scheduler/`:

- Linux cron
- Windows Task Scheduler
- Future GitHub Action
- Future Vercel Cron note (not enabled under API freeze)

## npm commands

```bash
npm run backup
npm run backup:db
npm run backup:storage
npm run backup:verify
npm run backup:restore
```

## Recovery Center upgrade

Existing Recovery Center is **not replaced**.  
`getRecoveryCenterEngineSnapshot` merges the latest Backup Engine report into `backups[]` and dashboard widgets (Last Backup, Status, Duration/DB/Storage, Verification).

## Security

- Console output is a redacted summary JSON only
- `redactSecretText()` strips URLs passwords, tokens, keys
- Artifact directory gitignored

## Tests

`tests/backup-engine-v1.test.ts` — redact, map, SSOT constants.
