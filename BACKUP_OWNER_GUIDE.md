# ROVEXO BACKUP OWNER GUIDE v1.0

## Prerequisites (Free Plan)

1. Node.js + npm in this repo  
2. **One** of:
   - Supabase CLI logged in + project **linked**, or  
   - `pg_dump` installed + `DATABASE_URL` in `.env.local`  
3. For storage: `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`  
4. Optional: `BACKUP_RETENTION_COUNT=30`

## One-time setup

```bash
cd /path/to/ROVEXO
npm install
```

Confirm scripts exist:

```bash
npm run backup -- --help 2>/dev/null || true
grep backup package.json
```

## Run backups

| Command | What it does |
|---------|----------------|
| `npm run backup` | Full: DB + storage + env + verify + report |
| `npm run backup:db` | Database dump only |
| `npm run backup:storage` | All storage buckets |
| `npm run backup:verify` | Re-check latest report |
| `npm run backup:restore` | Print restore steps (no auto-restore) |

## Where files go

```text
.rovexo-backups/
  latest.json
  run-<timestamp>/
    backup-<timestamp>.sql.gz
    storage-<timestamp>.tar.gz   (or folder)
    env-names.json
    env.local.copy               (if .env.local exists)
    BACKUP_REPORT.md
    report.json
BACKUP_REPORT.md                 (copy of latest markdown at repo root)
```

## Schedule (pick one)

### Linux

See `scripts/backup-engine/scheduler/crontab.example`.

### Windows

See `scripts/backup-engine/scheduler/windows-task.example.xml`.

### Manual

```bash
npm run backup
```

### Future CI

See `scripts/backup-engine/scheduler/github-action.example.yml` (Owner enables intentionally).

## Recovery Center

Open Super Admin → Recovery Center → Backups / Dashboard.  
After a successful local backup, the latest Backup Engine run appears as:

`Backup Engine v1 · PASS · full`

Widgets show Last Backup, Status, Duration/DB/Storage, Verification.

## Security rules

- Never commit `.rovexo-backups/` or `BACKUP_REPORT.md` if they contain dumps (gitignored).  
- Never paste `DATABASE_URL` / service role into chat logs.  
- Rotate keys if an `env.local.copy` leaves the Owner machine.

## Expected console output

JSON summary only, e.g.:

```json
{"result":"PASS","scope":"full","durationMs":1234,"database":"PASS","storage":"PASS","environment":"PASS","verification":"PASS","runId":"..."}
```

Exit code `0` = PASS (or restore guidance). `1` = FAIL.
